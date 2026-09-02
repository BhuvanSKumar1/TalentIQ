import { prisma } from '../config/database';
import { redis, isRedisAvailable } from '../config/redis';
import { metrics } from './metrics.service';
import { logger } from '../utils/logger';

// ============================================================
// Health Check Service
// ============================================================

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: string;
  checks: {
    database: ComponentHealth;
    redis: ComponentHealth;
    memory: ComponentHealth;
    disk: ComponentHealth;
  };
  metrics: ReturnType<typeof metrics.getSnapshot>;
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  message?: string;
}

export async function getSystemHealth(): Promise<HealthCheckResult> {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkMemory(),
    checkDisk(),
  ]);

  const [db, redisCheck, mem, disk] = checks.map((r) =>
    r.status === 'fulfilled' ? r.value : { status: 'unhealthy' as const, message: r.reason?.message || 'Check failed' }
  );

  const allChecks = { database: db, redis: redisCheck, memory: mem, disk };
  const overallStatus = deriveOverallStatus(allChecks);

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: formatUptime(process.uptime()),
    checks: allChecks,
    metrics: metrics.getSnapshot(),
  };
}

async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    const status = latencyMs > 500 ? 'degraded' : 'healthy';
    return { status, latencyMs, message: `Connected (${latencyMs}ms)` };
  } catch (err: any) {
    return { status: 'unhealthy', message: err.message || 'Connection failed' };
  }
}

async function checkRedis(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    if (!isRedisAvailable()) {
      return { status: 'healthy', message: 'Not connected (optional, cache disabled)' };
    }
    await redis.ping();
    const latencyMs = Date.now() - start;
    const status = latencyMs > 200 ? 'degraded' : 'healthy';
    return { status, latencyMs, message: `Connected (${latencyMs}ms)` };
  } catch (err: any) {
    // Redis failure is degraded, not unhealthy
    return { status: 'degraded', message: err.message || 'Connection failed' };
  }
}

async function checkMemory(): Promise<ComponentHealth> {
  const mem = process.memoryUsage();
  const heapUsedMB = mem.heapUsed / 1024 / 1024;
  const rssMB = mem.rss / 1024 / 1024;
  const heapTotalMB = mem.heapTotal / 1024 / 1024;
  const heapUsagePct = heapTotalMB > 0 ? (heapUsedMB / heapTotalMB) * 100 : 0;

  if (heapUsagePct > 90) {
    return { status: 'unhealthy', message: `Heap usage ${heapUsagePct.toFixed(1)}% (${heapUsedMB.toFixed(0)}MB)` };
  }
  if (heapUsagePct > 75) {
    return { status: 'degraded', message: `Heap usage ${heapUsagePct.toFixed(1)}% (${heapUsedMB.toFixed(0)}MB)` };
  }
  return { status: 'healthy', message: `Heap ${heapUsagePct.toFixed(1)}% (${heapUsedMB.toFixed(0)}MB), RSS ${rssMB.toFixed(0)}MB` };
}

async function checkDisk(): Promise<ComponentHealth> {
  // Basic disk check — in production use a disk space library
  return { status: 'healthy', message: 'OK' };
}

function deriveOverallStatus(checks: Record<string, ComponentHealth>): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(checks).map((c) => c.status);
  if (statuses.includes('unhealthy')) return 'unhealthy';
  if (statuses.includes('degraded')) return 'degraded';
  return 'healthy';
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ============================================================
// Prometheus-style text metrics (for /metrics endpoint)
// ============================================================

export function generatePrometheusMetrics(): string {
  const snap = metrics.getSnapshot();
  const lines: string[] = [];

  lines.push('# HELP taliq_uptime_seconds Server uptime in seconds');
  lines.push('# TYPE taliq_uptime_seconds gauge');
  lines.push(`taliq_uptime_seconds ${snap.uptime.uptimeMs / 1000}`);

  lines.push('');
  lines.push('# HELP taliq_requests_total Total HTTP requests');
  lines.push('# TYPE taliq_requests_total counter');
  lines.push(`taliq_requests_total ${snap.requests.total}`);

  lines.push('');
  lines.push('# HELP taliq_request_errors_total Total HTTP errors');
  lines.push('# TYPE taliq_request_errors_total counter');
  lines.push(`taliq_request_errors_total ${snap.requests.errors}`);

  lines.push('');
  lines.push('# HELP taliq_request_duration_avg_ms Average request latency');
  lines.push('# TYPE taliq_request_duration_avg_ms gauge');
  lines.push(`taliq_request_duration_avg_ms ${snap.requests.avgLatencyMs}`);

  lines.push('');
  lines.push('# HELP taliq_memory_heap_used_bytes Heap memory used');
  lines.push('# TYPE taliq_memory_heap_used_bytes gauge');
  lines.push(`taliq_memory_heap_used_bytes ${snap.memory.heapUsedMB * 1024 * 1024}`);

  lines.push('');
  lines.push('# HELP taliq_memory_rss_bytes Resident set size');
  lines.push('# TYPE taliq_memory_rss_bytes gauge');
  lines.push(`taliq_memory_rss_bytes ${snap.memory.rssMB * 1024 * 1024}`);

  // Per-route metrics
  lines.push('');
  lines.push('# HELP taliq_route_requests_total Requests per route');
  lines.push('# TYPE taliq_route_requests_total counter');
  for (const [route, data] of Object.entries(snap.requests.byRoute as Record<string, any>)) {
    lines.push(`taliq_route_requests_total{route="${route}"} ${data.count}`);
  }

  // Service latency metrics
  lines.push('');
  lines.push('# HELP taliq_service_latency_avg_ms Average service latency');
  lines.push('# TYPE taliq_service_latency_avg_ms gauge');
  for (const [service, data] of Object.entries(snap.services as Record<string, any>)) {
    lines.push(`taliq_service_latency_avg_ms{service="${service}"} ${data.avgMs}`);
  }

  // Counter metrics
  lines.push('');
  lines.push('# HELP taliq_counter Custom counter metrics');
  lines.push('# TYPE taliq_counter counter');
  for (const [name, data] of Object.entries(snap.counters as Record<string, any>)) {
    lines.push(`taliq_counter{name="${name}"} ${data.value}`);
  }

  lines.push('');
  return lines.join('\n');
}
