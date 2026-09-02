import { logger } from '../utils/logger';

// ============================================================
// In-Memory Metrics Collector
// ============================================================
// In production, this would feed into Prometheus/OTel.
// For now, we track metrics in-memory and expose via /api/health/detailed.

interface MetricEntry {
  count: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  errors: number;
  lastUpdated: number;
}

interface GaugeMetric {
  value: number;
  lastUpdated: number;
}

interface CounterMetric {
  value: number;
  lastUpdated: number;
}

export interface MetricsSnapshot {
  uptime: {
    startedAt: string;
    uptimeMs: number;
    uptimeFormatted: string;
  };
  requests: {
    total: number;
    errors: number;
    errorRate: string;
    avgLatencyMs: number;
    byRoute: Record<string, any>;
  };
  services: Record<string, any>;
  gauges: Record<string, any>;
  counters: Record<string, any>;
  recentErrors: Array<{
    timestamp: string;
    correlationId?: string;
    service: string;
    message: string;
    statusCode?: number;
  }>;
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
    externalMB: number;
  };
}

class MetricsCollector {
  // Request latency buckets (method + route pattern)
  private requestMetrics = new Map<string, MetricEntry>();

  // Service-level latency (e.g. "ai.chat", "matching.score", "search.query")
  private serviceMetrics = new Map<string, MetricEntry>();

  // Active gauges
  private gauges = new Map<string, GaugeMetric>();

  // Monotonic counters
  private counters = new Map<string, CounterMetric>();

  // Error log (last N)
  private recentErrors: Array<{
    timestamp: string;
    correlationId?: string;
    service: string;
    message: string;
    statusCode?: number;
  }> = [];

  private readonly MAX_RECENT_ERRORS = 100;
  private readonly startTime = Date.now();

  // ---- Request tracking ----

  recordRequest(method: string, route: string, statusCode: number, durationMs: number, correlationId?: string): void {
    const key = `${method} ${route}`;
    this.upsertMetric(this.requestMetrics, key, durationMs, statusCode >= 400);

    // Log slow requests (> 1s)
    if (durationMs > 1000) {
      logger.warn({ method, route, statusCode, durationMs, correlationId }, 'Slow request detected');
    }

    // Log errors
    if (statusCode >= 500) {
      this.addRecentError({
        timestamp: new Date().toISOString(),
        correlationId,
        service: key,
        message: `HTTP ${statusCode}`,
        statusCode,
      });
    }
  }

  // ---- Service-level tracking ----

  recordServiceLatency(service: string, durationMs: number, error: boolean = false): void {
    this.upsertMetric(this.serviceMetrics, service, durationMs, error);
  }

  recordServiceError(service: string, message: string): void {
    this.addRecentError({
      timestamp: new Date().toISOString(),
      service,
      message,
    });
  }

  // ---- Counters ----

  incrementCounter(name: string, amount: number = 1): void {
    const existing = this.counters.get(name);
    if (existing) {
      existing.value += amount;
      existing.lastUpdated = Date.now();
    } else {
      this.counters.set(name, { value: amount, lastUpdated: Date.now() });
    }
  }

  // ---- Gauges ----

  setGauge(name: string, value: number): void {
    this.gauges.set(name, { value, lastUpdated: Date.now() });
  }

  // ---- Snapshot ----

  getSnapshot(): MetricsSnapshot {
    const now = Date.now();
    const uptimeMs = now - this.startTime;

    // Request summary
    const requestSummary: Record<string, any> = {};
    for (const [key, entry] of this.requestMetrics) {
      requestSummary[key] = {
        count: entry.count,
        avgMs: Math.round(entry.totalMs / entry.count),
        minMs: entry.minMs,
        maxMs: entry.maxMs,
        errors: entry.errors,
        errorRate: entry.count > 0 ? `${((entry.errors / entry.count) * 100).toFixed(1)}%` : '0%',
      };
    }

    // Service summary
    const serviceSummary: Record<string, any> = {};
    for (const [key, entry] of this.serviceMetrics) {
      serviceSummary[key] = {
        count: entry.count,
        avgMs: Math.round(entry.totalMs / entry.count),
        minMs: entry.minMs,
        maxMs: entry.maxMs,
        errors: entry.errors,
      };
    }

    // Total request metrics
    let totalRequests = 0;
    let totalErrors = 0;
    let totalLatencyMs = 0;
    for (const entry of this.requestMetrics.values()) {
      totalRequests += entry.count;
      totalErrors += entry.errors;
      totalLatencyMs += entry.totalMs;
    }

    return {
      uptime: {
        startedAt: new Date(this.startTime).toISOString(),
        uptimeMs,
        uptimeFormatted: this.formatUptime(uptimeMs),
      },
      requests: {
        total: totalRequests,
        errors: totalErrors,
        errorRate: totalRequests > 0 ? `${((totalErrors / totalRequests) * 100).toFixed(1)}%` : '0%',
        avgLatencyMs: totalRequests > 0 ? Math.round(totalLatencyMs / totalRequests) : 0,
        byRoute: requestSummary,
      },
      services: serviceSummary,
      gauges: Object.fromEntries(this.gauges),
      counters: Object.fromEntries(this.counters),
      recentErrors: this.recentErrors.slice(-20),
      memory: {
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        externalMB: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    };
  }

  // ---- Helpers ----

  private upsertMetric(map: Map<string, MetricEntry>, key: string, durationMs: number, isError: boolean): void {
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.totalMs += durationMs;
      existing.minMs = Math.min(existing.minMs, durationMs);
      existing.maxMs = Math.max(existing.maxMs, durationMs);
      if (isError) existing.errors += 1;
      existing.lastUpdated = Date.now();
    } else {
      map.set(key, {
        count: 1,
        totalMs: durationMs,
        minMs: durationMs,
        maxMs: durationMs,
        errors: isError ? 1 : 0,
        lastUpdated: Date.now(),
      });
    }
  }

  private addRecentError(entry: {
    timestamp: string;
    correlationId?: string;
    service: string;
    message: string;
    statusCode?: number;
  }): void {
    this.recentErrors.push(entry);
    if (this.recentErrors.length > this.MAX_RECENT_ERRORS) {
      this.recentErrors = this.recentErrors.slice(-this.MAX_RECENT_ERRORS);
    }
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m ${seconds % 60}s`;
  }

  // Reset all metrics (for testing)
  reset(): void {
    this.requestMetrics.clear();
    this.serviceMetrics.clear();
    this.gauges.clear();
    this.counters.clear();
    this.recentErrors = [];
  }
}

export const metrics = new MetricsCollector();
