import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Server,
  Database,
  Wifi,
  HardDrive,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TrendingUp,
  Cpu,
  MemoryStick,
  Timer,
  Eye,
  BarChart3,
  Shield,
} from 'lucide-react';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  message?: string;
}

interface DashboardData {
  health: {
    status: string;
    uptime: string;
    checks: {
      database: HealthCheck;
      redis: HealthCheck;
      memory: HealthCheck;
      disk: HealthCheck;
    };
  };
  performance: {
    totalRequests: number;
    errorRate: string;
    avgLatencyMs: number;
    requestsByRoute: Record<string, any>;
  };
  services: Record<string, any>;
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  counters: Record<string, any>;
  gauges: Record<string, any>;
  recentErrors: Array<{
    timestamp: string;
    correlationId?: string;
    service: string;
    message: string;
    statusCode?: number;
  }>;
  auditActivity: { last24h: number };
}

const API_BASE = 'http://localhost:3001/api';

const statusConfig = {
  healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Healthy' },
  degraded: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Degraded' },
  unhealthy: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle, label: 'Unhealthy' },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.healthy;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} ${config.border} border`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

function MetricCard({ label, value, icon: Icon, color, subtitle }: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </motion.div>
  );
}

function HealthCheckCard({ name, check, icon: Icon }: { name: string; check: HealthCheck; icon: any }) {
  const config = statusConfig[check.status] || statusConfig.healthy;
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">{name}</span>
        </div>
        <StatusBadge status={check.status} />
      </div>
      <div className="text-xs text-gray-500">
        {check.message}
        {check.latencyMs !== undefined && (
          <span className="ml-2 text-gray-400">({check.latencyMs}ms)</span>
        )}
      </div>
    </div>
  );
}

export default function ObservabilityPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE}/v1/observability/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastRefresh(new Date());
      }
    } catch {
      // Silently handle — server might be down
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading observability data...</span>
        </div>
      </div>
    );
  }

  const routeEntries = data?.performance?.requestsByRoute
    ? Object.entries(data.performance.requestsByRoute).sort((a, b) => (b[1].count || 0) - (a[1].count || 0))
    : [];

  const serviceEntries = data?.services
    ? Object.entries(data.services).sort((a, b) => (b[1].count || 0) - (a[1].count || 0))
    : [];

  const counterEntries = data?.counters ? Object.entries(data.counters) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-400" />
            </div>
            System Health
          </h1>
          <p className="text-gray-400 mt-1">Real-time observability and performance monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl border ${
          data?.health?.status === 'healthy'
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : data?.health?.status === 'degraded'
            ? 'bg-amber-500/5 border-amber-500/20'
            : 'bg-red-500/5 border-red-500/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Server className="w-5 h-5 text-gray-400" />
            <span className="font-semibold text-white">System Status</span>
            <StatusBadge status={data?.health?.status || 'healthy'} />
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-gray-400">
              Uptime: <span className="text-white font-medium">{data?.health?.uptime || '0m'}</span>
            </div>
            <div className="text-gray-400">
              Server: <span className="text-white font-mono">Running</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Requests"
          value={data?.performance?.totalRequests ?? 0}
          icon={BarChart3}
          color="bg-blue-600/20"
        />
        <MetricCard
          label="Avg Latency"
          value={`${data?.performance?.avgLatencyMs ?? 0}ms`}
          icon={Timer}
          color="bg-violet-600/20"
        />
        <MetricCard
          label="Error Rate"
          value={data?.performance?.errorRate ?? '0%'}
          icon={AlertTriangle}
          color={parseFloat(data?.performance?.errorRate ?? '0') > 5 ? 'bg-red-600/20' : 'bg-emerald-600/20'}
        />
        <MetricCard
          label="Audit Events (24h)"
          value={data?.auditActivity?.last24h ?? 0}
          icon={Shield}
          color="bg-amber-600/20"
        />
      </div>

      {/* Health Checks */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-400" />
          Component Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <HealthCheckCard name="Database" check={data?.health?.checks?.database || { status: 'healthy' }} icon={Database} />
          <HealthCheckCard name="Redis" check={data?.health?.checks?.redis || { status: 'healthy' }} icon={Wifi} />
          <HealthCheckCard name="Memory" check={data?.health?.checks?.memory || { status: 'healthy' }} icon={MemoryStick} />
          <HealthCheckCard name="Disk" check={data?.health?.checks?.disk || { status: 'healthy' }} icon={HardDrive} />
        </div>
      </div>

      {/* Memory & Counters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Memory Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-gray-400" />
            Memory Usage
          </h3>
          <div className="space-y-3">
            {data?.memory && (
              <>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Heap Used</span>
                    <span className="text-gray-300">{data.memory.heapUsedMB}MB / {data.memory.heapTotalMB}MB</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((data.memory.heapUsedMB / data.memory.heapTotalMB) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">RSS</span>
                    <span className="text-gray-300">{data.memory.rssMB}MB</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-violet-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((data.memory.rssMB / 512) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Counters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            Service Counters
          </h3>
          {counterEntries.length > 0 ? (
            <div className="space-y-2">
              {counterEntries.map(([name, data]) => (
                <div key={name} className="flex items-center justify-between py-1.5 border-b border-gray-700/50 last:border-0">
                  <span className="text-sm text-gray-400 font-mono">{name}</span>
                  <span className="text-sm text-white font-semibold">{(data as any).value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-6">No counters recorded yet</div>
          )}
        </motion.div>
      </div>

      {/* Request Routes Table */}
      {routeEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden"
        >
          <div className="p-5 border-b border-gray-700/50">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Request Routes (Top 20)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Route</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-5 py-3">Requests</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-5 py-3">Avg (ms)</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-5 py-3">Min</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-5 py-3">Max</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-5 py-3">Errors</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-5 py-3">Error Rate</th>
                </tr>
              </thead>
              <tbody>
                {routeEntries.slice(0, 20).map(([route, data]) => (
                  <tr key={route} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                    <td className="px-5 py-3 text-sm text-gray-300 font-mono">{route}</td>
                    <td className="px-5 py-3 text-sm text-white text-right">{data.count}</td>
                    <td className="px-5 py-3 text-sm text-gray-300 text-right">{data.avgMs}</td>
                    <td className="px-5 py-3 text-sm text-gray-400 text-right">{data.minMs}</td>
                    <td className="px-5 py-3 text-sm text-gray-400 text-right">{data.maxMs}</td>
                    <td className="px-5 py-3 text-sm text-right">
                      {data.errors > 0 ? (
                        <span className="text-red-400">{data.errors}</span>
                      ) : (
                        <span className="text-gray-500">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-right">
                      <span className={parseFloat(data.errorRate) > 5 ? 'text-red-400' : 'text-gray-400'}>
                        {data.errorRate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Service Latency */}
      {serviceEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden"
        >
          <div className="p-5 border-b border-gray-700/50">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-400" />
              Service Latency
            </h3>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {serviceEntries.map(([service, data]) => (
                <div key={service}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300 font-mono">{service}</span>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{data.count} calls</span>
                      <span className="text-white">{data.avgMs}ms avg</span>
                      {data.errors > 0 && <span className="text-red-400">{data.errors} errors</span>}
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        data.avgMs > 500 ? 'bg-red-500' : data.avgMs > 200 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min((data.avgMs / 1000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Errors */}
      {data?.recentErrors && data.recentErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden"
        >
          <div className="p-5 border-b border-gray-700/50">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Recent Errors ({data.recentErrors.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-700/30 max-h-80 overflow-y-auto">
            {data.recentErrors.map((err, i) => (
              <div key={i} className="px-5 py-3 hover:bg-gray-700/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300 font-mono">{err.service}</span>
                  <span className="text-xs text-gray-500">{new Date(err.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {err.message}
                  {err.statusCode && <span className="ml-2 text-red-400">HTTP {err.statusCode}</span>}
                  {err.correlationId && (
                    <span className="ml-2 text-gray-500">ID: {err.correlationId.slice(0, 8)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* OpenTelemetry Integration Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-5"
      >
        <h3 className="text-sm font-semibold text-gray-300 mb-2">OpenTelemetry & Prometheus</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          This system exposes Prometheus-compatible metrics at <code className="text-blue-400">/api/metrics</code> and
          structured health checks at <code className="text-blue-400">/api/health/detailed</code>. For production
          deployment, configure OpenTelemetry exporters to forward traces to Jaeger or Zipkin, and point Prometheus
          scrape configs at the <code className="text-blue-400">/api/metrics</code> endpoint. Grafana dashboards can
          be built on top of the <code className="text-blue-400">taliq_*</code> metric names exposed here.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">OpenTelemetry</span>
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-400">Prometheus</span>
          <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-xs text-violet-400">Grafana</span>
          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400">Pino Logger</span>
        </div>
      </motion.div>
    </div>
  );
}
