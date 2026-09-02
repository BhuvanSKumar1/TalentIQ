import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle2, Info, Users, BarChart3,
  TrendingDown, Eye, Play, ChevronDown, ChevronRight, Scale,
  Activity, Zap, BookOpen
} from 'lucide-react';
import { api } from '@/lib/api';

const card = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

const SEVERITY_CONFIG = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', icon: AlertTriangle },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', icon: AlertTriangle },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: Info },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: Info },
  info: { color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30', icon: Info },
};

interface FeatureContribution {
  feature: string;
  weight: number;
  avgContribution: number;
  stdDev: number;
  flagged: boolean;
  reason?: string;
}

interface FairnessFinding {
  id: string;
  severity: string;
  category: string;
  finding: string;
  evidence: string;
  potentialExplanation: string;
  recommendation: string;
}

interface ScreeningFunnel {
  stage: string;
  count: number;
  rate: number;
  dropoff: number;
}

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  severity: string;
}

export default function FairnessPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'funnel' | 'tests'>('overview');
  const [testResults, setTestResults] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/fairness/dashboard');
      setDashboard(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load fairness dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const runTests = async () => {
    setTestLoading(true);
    try {
      const res = await api.post('/fairness/tests');
      setTestResults(res.data?.data || null);
      setActiveTab('tests');
    } catch (err) {
      console.error('Failed to run tests:', err);
    } finally {
      setTestLoading(false);
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

  const healthColor = dashboard?.overallHealth === 'healthy' ? 'text-green-400' :
    dashboard?.overallHealth === 'warning' ? 'text-yellow-400' : 'text-red-400';
  const healthBg = dashboard?.overallHealth === 'healthy' ? 'bg-green-500/20' :
    dashboard?.overallHealth === 'warning' ? 'bg-yellow-500/20' : 'bg-red-500/20';

  return (
    <div className="min-h-full p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Fairness & Explainability</h1>
          </div>
          <p className="text-sm text-gray-400 ml-13">Monitor recruitment fairness and understand candidate rankings</p>
        </div>
        <button
          onClick={runTests}
          disabled={testLoading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {testLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Run Fairness Tests
        </button>
      </div>

      {/* Health Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-6 p-4 rounded-xl border ${healthBg} border-opacity-30`}
        style={{ borderColor: dashboard?.overallHealth === 'healthy' ? 'rgba(34,197,94,0.3)' : dashboard?.overallHealth === 'warning' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)' }}
      >
        <div className="flex items-center gap-3">
          <Shield className={`w-5 h-5 ${healthColor}`} />
          <div>
            <span className={`font-semibold ${healthColor}`}>
              System Status: {dashboard?.overallHealth?.toUpperCase()}
            </span>
            <span className="text-gray-400 text-sm ml-3">
              {dashboard?.findings?.length || 0} findings • {dashboard?.featureContributions?.filter((f: FeatureContribution) => f.flagged).length || 0} flagged features
            </span>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div {...card(0)} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-gray-400">Diversity Index</span>
          </div>
          <p className="text-2xl font-bold text-white">{dashboard?.diversityIndex || 0}</p>
          <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
            (dashboard?.diversityIndex || 0) >= 0.6 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {(dashboard?.diversityIndex || 0) >= 0.6 ? 'Healthy' : 'Review'}
          </span>
        </motion.div>

        <motion.div {...card(1)} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-gray-400">Bias Score</span>
          </div>
          <p className="text-2xl font-bold text-white">{dashboard?.biasScore || 0}%</p>
          <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
            (dashboard?.biasScore || 0) >= 80 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {(dashboard?.biasScore || 0) >= 80 ? 'Healthy' : 'Needs Review'}
          </span>
        </motion.div>

        <motion.div {...card(2)} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs text-gray-400">Audit Coverage</span>
          </div>
          <p className="text-2xl font-bold text-white">{Math.round(dashboard?.auditCoverage || 0)}%</p>
          <span className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
            Complete
          </span>
        </motion.div>

        <motion.div {...card(3)} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-gray-400">Findings</span>
          </div>
          <p className="text-2xl font-bold text-white">{dashboard?.findings?.length || 0}</p>
          <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
            (dashboard?.findings?.length || 0) === 0 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {(dashboard?.findings?.length || 0) === 0 ? 'All Clear' : 'Review Needed'}
          </span>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'overview', label: 'Audit Findings', icon: Shield },
          { id: 'features', label: 'Feature Analysis', icon: Zap },
          { id: 'funnel', label: 'Screening Funnel', icon: BarChart3 },
          { id: 'tests', label: 'Protected Feature Tests', icon: Eye },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overview / Findings Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Findings */}
              <h3 className="text-lg font-semibold text-white">Audit Findings</h3>
              {(dashboard?.findings || []).length === 0 ? (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-white mb-1">No Issues Found</h4>
                  <p className="text-sm text-gray-400">The fairness audit has not detected any significant issues.</p>
                </div>
              ) : (
                (dashboard?.findings || []).map((finding: FairnessFinding, i: number) => {
                  const config = SEVERITY_CONFIG[finding.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info;
                  const Icon = config.icon;
                  const isExpanded = expandedFinding === finding.id;

                  return (
                    <motion.div
                      key={finding.id}
                      {...card(i)}
                      className={`bg-gray-900/50 border ${config.border} rounded-xl overflow-hidden`}
                    >
                      <button
                        onClick={() => setExpandedFinding(isExpanded ? null : finding.id)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{finding.finding}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">{finding.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                            {finding.severity.toUpperCase()}
                          </span>
                          {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-gray-800"
                          >
                            <div className="p-5 space-y-4">
                              <div>
                                <h5 className="text-sm font-medium text-gray-300 mb-1">Evidence</h5>
                                <p className="text-sm text-gray-400">{finding.evidence}</p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-gray-300 mb-1">Potential Explanation</h5>
                                <p className="text-sm text-gray-400">{finding.potentialExplanation}</p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-gray-300 mb-1">Recommendation</h5>
                                <p className="text-sm text-emerald-400">{finding.recommendation}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              )}

              {/* Recommendations */}
              {(dashboard?.recommendations || []).length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                    <ul className="space-y-3">
                      {dashboard.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-1">Important Disclaimer</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      This fairness audit is provided as a monitoring tool and does not constitute legal compliance verification.
                      The system does not use protected characteristics (race, gender, religion, disability, age, etc.) for candidate ranking.
                      Regular audits are recommended to maintain fairness standards. Consult legal counsel for compliance requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feature Analysis Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Feature Contribution Analysis</h3>
                <p className="text-sm text-gray-400 mb-6">
                  This analysis shows how each feature contributes to candidate rankings. Flagged features may need recalibration.
                </p>

                <div className="space-y-4">
                  {(dashboard?.featureContributions || []).map((feat: FeatureContribution, i: number) => {
                    const isExpanded = expandedFeature === feat.feature;
                    return (
                      <motion.div key={feat.feature} {...card(i)}>
                        <button
                          onClick={() => setExpandedFeature(isExpanded ? null : feat.feature)}
                          className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 text-left hover:bg-gray-800/80 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-white font-medium">{feat.feature}</span>
                              {feat.flagged && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
                                  FLAGGED
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-400">
                              Weight: {(feat.weight * 100).toFixed(0)}%
                            </span>
                          </div>

                          {/* Contribution bar */}
                          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(feat.avgContribution, 100)}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className={`h-full rounded-full ${feat.flagged ? 'bg-orange-500' : 'bg-emerald-500'}`}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span>Avg contribution: {feat.avgContribution.toFixed(1)}</span>
                            <span>Std dev: {feat.stdDev.toFixed(1)}</span>
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && feat.flagged && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-4 pb-4"
                            >
                              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mt-2">
                                <p className="text-sm text-orange-400">{feat.reason}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Scoring Model Transparency */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  Scoring Model Transparency
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: 'Skills', weight: 40, color: 'bg-blue-500' },
                    { label: 'Experience', weight: 20, color: 'bg-purple-500' },
                    { label: 'Projects', weight: 20, color: 'bg-emerald-500' },
                    { label: 'Education', weight: 10, color: 'bg-amber-500' },
                    { label: 'Semantic', weight: 10, color: 'bg-pink-500' },
                  ].map((w, i) => (
                    <div key={i} className="text-center">
                      <div className="relative h-20 w-20 mx-auto mb-2">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#374151"
                            strokeWidth="3"
                          />
                          <motion.path
                            initial={{ strokeDasharray: '0 100' }}
                            animate={{ strokeDasharray: `${w.weight} 100` }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            className={w.color.replace('bg-', 'text-')}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">{w.weight}%</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{w.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  All scoring weights are documented and auditable. Weights can be adjusted by organization admins.
                </p>
              </div>
            </div>
          )}

          {/* Screening Funnel Tab */}
          {activeTab === 'funnel' && (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Screening Funnel Analysis</h3>
              <div className="space-y-3">
                {(dashboard?.screeningFunnel || []).map((stage: ScreeningFunnel, i: number) => {
                  const maxWidth = dashboard?.screeningFunnel?.[0]?.count || 1;
                  const widthPct = maxWidth > 0 ? (stage.count / maxWidth) * 100 : 0;

                  return (
                    <motion.div
                      key={stage.stage}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-medium">{stage.stage}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-400">{stage.count} candidates</span>
                          <span className="text-sm text-gray-400">{stage.rate}%</span>
                          {i > 0 && stage.dropoff > 0 && (
                            <span className="text-xs text-red-400">-{stage.dropoff}% dropoff</span>
                          )}
                        </div>
                      </div>
                      <div className="h-8 bg-gray-800 rounded-lg overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className={`h-full rounded-lg flex items-center px-3 ${
                            i === 0 ? 'bg-blue-500/40' :
                            i === 1 ? 'bg-purple-500/40' :
                            i === 2 ? 'bg-emerald-500/40' :
                            i === 3 ? 'bg-amber-500/40' : 'bg-green-500/40'
                          }`}
                        >
                          <span className="text-xs font-medium text-white">{stage.count}</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Protected Feature Tests Tab */}
          {activeTab === 'tests' && (
            <div className="space-y-6">
              {testResults ? (
                <>
                  <div className={`p-4 rounded-xl border ${
                    testResults.overallResult === 'PASSED' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      {testResults.overallResult === 'PASSED' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                      )}
                      <div>
                        <h3 className={`font-semibold ${testResults.overallResult === 'PASSED' ? 'text-green-400' : 'text-red-400'}`}>
                          {testResults.overallResult}
                        </h3>
                        <p className="text-sm text-gray-400">{testResults.summary}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {testResults.results.map((result: TestResult, i: number) => (
                      <motion.div
                        key={i}
                        {...card(i)}
                        className={`bg-gray-900/50 border rounded-xl p-5 ${
                          result.passed ? 'border-green-500/30' : 'border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {result.passed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                            )}
                            <div>
                              <h4 className="text-white font-medium">{result.testName}</h4>
                              <p className="text-sm text-gray-400 mt-0.5">{result.details}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            result.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {result.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
                  <Eye className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Tests Run Yet</h3>
                  <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
                    Click "Run Fairness Tests" to check for protected feature leakage and scoring biases.
                  </p>
                  <button
                    onClick={runTests}
                    disabled={testLoading}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {testLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Run Tests
                  </button>
                </div>
              )}

              {/* Explanation */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3">About Protected Feature Tests</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>These tests verify that the scoring system does not inadvertently use protected characteristics for ranking.</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong className="text-gray-300">Name-based scoring bias:</strong> Checks for correlation between name patterns and scores</li>
                    <li><strong className="text-gray-300">Geographic scoring disparity:</strong> Detects if location significantly impacts scores</li>
                    <li><strong className="text-gray-300">Education institution bias:</strong> Identifies over-reliance on specific institutions</li>
                    <li><strong className="text-gray-300">Experience length over-weighting:</strong> Ensures years of experience don't dominate</li>
                    <li><strong className="text-gray-300">Protected attributes exclusion:</strong> Confirms no protected data is collected</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
