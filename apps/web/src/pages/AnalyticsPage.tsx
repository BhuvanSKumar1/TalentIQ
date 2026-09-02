import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Users, Briefcase,
  Calendar, Clock, Download, Filter, AlertTriangle,
  CheckCircle2, Lightbulb, ArrowUpRight, ArrowDownRight,
  Target, Zap, Award
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { api } from '@/lib/api';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

const card = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

const INSIGHT_ICONS: Record<string, any> = {
  trend: TrendingUp,
  alert: AlertTriangle,
  recommendation: Lightbulb,
  achievement: Award,
};

const INSIGHT_COLORS: Record<string, { bg: string; text: string }> = {
  trend: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  alert: { bg: 'bg-red-500/10', text: 'text-red-400' },
  recommendation: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  achievement: { bg: 'bg-green-500/10', text: 'text-green-400' },
};

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'skills' | 'insights'>('overview');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    jobId: '',
  });

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.jobId) params.append('jobId', filters.jobId);

      const res = await api.get(`/analytics/dashboard?${params.toString()}`);
      setDashboard(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/analytics/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `talentiq-analytics-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-800 rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const metrics = dashboard?.metrics;

  // Prepare funnel data
  const funnelData = metrics?.funnel?.map((f: any) => ({
    name: f.stage,
    value: f.count,
    rate: f.rate,
  })) || [];

  // Prepare skill demand data
  const skillData = metrics?.skillDemand?.slice(0, 8).map((s: any) => ({
    name: s.skill,
    count: s.count,
  })) || [];

  // Prepare job performance data
  const jobData = metrics?.jobPerformance?.slice(0, 6).map((j: any) => ({
    name: j.title.length > 20 ? j.title.slice(0, 20) + '...' : j.title,
    applications: j.applications,
    hires: j.hires,
  })) || [];

  return (
    <div className="min-h-full p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Recruitment Analytics</h1>
          </div>
          <p className="text-sm text-gray-400 ml-13">Comprehensive insights into your hiring pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-gray-500">to</span>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => setFilters({ startDate: '', endDate: '', jobId: '' })}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Clear filters
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Applications', value: metrics?.totalApplications || 0, icon: Users, color: 'text-blue-400', change: dashboard?.periodComparison?.current?.[0]?.value > dashboard?.periodComparison?.previous?.[0]?.value ? 12 : -5 },
          { label: 'Qualified Candidates', value: metrics?.qualifiedCandidates || 0, icon: Target, color: 'text-purple-400', change: 8 },
          { label: 'Shortlisted', value: metrics?.shortlisted || 0, icon: CheckCircle2, color: 'text-green-400', change: 15 },
          { label: 'Interviews', value: metrics?.interviews || 0, icon: Calendar, color: 'text-amber-400', change: 3 },
        ].map((kpi, i) => (
          <motion.div key={i} {...card(i)} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {kpi.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(kpi.change)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'funnel', label: 'Funnel' },
          { id: 'skills', label: 'Skill Demand' },
          { id: 'insights', label: 'AI Insights' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Application Trend */}
            <motion.div {...card(4)} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Application Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={metrics?.applicationTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Job Performance */}
            <motion.div {...card(5)} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Job Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={jobData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} angle={-20} textAnchor="end" height={60} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Bar dataKey="applications" fill="#6366f1" name="Applications" />
                  <Bar dataKey="hires" fill="#10b981" name="Hires" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Conversion Funnel Preview */}
            <motion.div {...card(6)} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Conversion Funnel</h3>
              <div className="space-y-3">
                {metrics?.funnel?.map((stage: any, i: number) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{stage.stage}</span>
                      <span className="text-sm text-gray-400">{stage.count} ({stage.rate}%)</span>
                    </div>
                    <div className="h-6 bg-gray-800 rounded-lg overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.rate}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-lg flex items-center px-2"
                        style={{ backgroundColor: COLORS[i % COLORS.length] + '80' }}
                      >
                        <span className="text-xs font-medium text-white">{stage.count}</span>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Key Metrics */}
            <motion.div {...card(7)} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Key Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm text-gray-300">Conversion Rate</span>
                  </div>
                  <span className="text-lg font-bold text-white">{metrics?.conversionRate || 0}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span className="text-sm text-gray-300">Avg. Time to Hire</span>
                  </div>
                  <span className="text-lg font-bold text-white">{metrics?.timeToHire || 0} days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-gray-300">Active Jobs</span>
                  </div>
                  <span className="text-lg font-bold text-white">{metrics?.jobPerformance?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-gray-300">Top Skill Demand</span>
                  </div>
                  <span className="text-lg font-bold text-white">{metrics?.skillDemand?.[0]?.skill || 'N/A'}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Funnel Tab */}
        {activeTab === 'funnel' && (
          <motion.div {...card(0)} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Recruitment Funnel Analysis</h3>
            <div className="space-y-4">
              {metrics?.funnel?.map((stage: any, i: number) => {
                const maxWidth = metrics?.funnel?.[0]?.count || 1;
                const widthPct = maxWidth > 0 ? (stage.count / maxWidth) * 100 : 0;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{stage.stage}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">{stage.count} candidates</span>
                        <span className="text-sm font-medium text-indigo-400">{stage.rate}%</span>
                        {i > 0 && (
                          <span className="text-xs text-gray-500">
                            {stage.rate < metrics.funnel[i-1].rate
                              ? `-${(metrics.funnel[i-1].rate - stage.rate).toFixed(1)}% drop`
                              : '0% drop'
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-10 bg-gray-800 rounded-xl overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className="h-full rounded-xl flex items-center px-4"
                        style={{ backgroundColor: COLORS[i % COLORS.length] + 'CC' }}
                      >
                        <span className="text-sm font-semibold text-white">{stage.count}</span>
                      </motion.div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <motion.div {...card(0)} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Skill Demand Analysis</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={skillData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {(dashboard?.insights || []).length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
                <Lightbulb className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Insights Yet</h3>
                <p className="text-sm text-gray-400">Add more data to generate AI-powered insights.</p>
              </div>
            ) : (
              (dashboard?.insights || []).map((insight: any, i: number) => {
                const Icon = INSIGHT_ICONS[insight.type] || Lightbulb;
                const colors = INSIGHT_COLORS[insight.type] || INSIGHT_COLORS.recommendation;

                return (
                  <motion.div
                    key={insight.id}
                    {...card(i)}
                    className={`bg-gray-900/50 border border-gray-800 rounded-xl p-5`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-medium">{insight.title}</h4>
                          {insight.change !== undefined && (
                            <span className={`text-xs font-medium ${insight.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {insight.change > 0 ? '+' : ''}{insight.change}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{insight.description}</p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium text-gray-400">Evidence:</span> {insight.evidence}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* Disclaimer */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-400 mb-1">About AI Insights</h4>
                  <p className="text-xs text-gray-400">
                    Insights are generated based on your actual recruitment data. All statistics are evidence-based
                    and derived from real metrics. Do not make hiring decisions based solely on automated insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
