import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, TrendingUp, AlertTriangle, CheckCircle2,
  BookOpen, Clock, ChevronDown, ChevronRight,
  Zap, ArrowRight, Lightbulb, Award, BarChart3
} from 'lucide-react';
import { api } from '@/lib/api';

interface SkillComparison {
  skillName: string;
  status: 'matched' | 'partial' | 'missing' | 'transferable';
  candidateLevel: number;
  requiredLevel: number;
  confidence: number;
  category: string;
  suggestion?: string;
}

interface SkillGapReport {
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  overallMatch: number;
  matchedSkills: SkillComparison[];
  missingSkills: SkillComparison[];
  partialSkills: SkillComparison[];
  transferableSkills: SkillComparison[];
  summary: string;
  recommendations: string[];
}

interface LearningPlanItem {
  skill: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  currentLevel: number;
  targetLevel: number;
  estimatedHours: number;
  learningObjective: string;
  recommendedProjects: string[];
  resources: string[];
  milestones: string[];
}

interface DevelopmentPlan {
  id: string;
  title: string;
  description: string;
  duration: string;
  items: LearningPlanItem[];
  totalEstimatedHours: number;
}

const STATUS_CONFIG = {
  matched: { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', icon: CheckCircle2, label: 'Matched' },
  partial: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: TrendingUp, label: 'Partial' },
  missing: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', icon: AlertTriangle, label: 'Missing' },
  transferable: { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', icon: Zap, label: 'Transferable' },
};

const PRIORITY_CONFIG = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Critical' },
  high: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'High' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Medium' },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Low' },
};

export default function SkillGapPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [report, setReport] = useState<SkillGapReport | null>(null);
  const [plan, setPlan] = useState<DevelopmentPlan | null>(null);
  const [planDuration, setPlanDuration] = useState<'30-day' | '60-day' | '90-day'>('30-day');
  const [loading, setLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'plan'>('analysis');
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  // Fetch candidates and jobs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, jRes] = await Promise.all([
          api.get('/candidates?limit=100'),
          api.get('/jobs?limit=100'),
        ]);
        setCandidates(cRes.data?.data || []);
        setJobs(jRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    fetchData();
  }, []);

  // Calculate skill gap
  const calculateGap = async () => {
    if (!selectedCandidate || !selectedJob) return;
    setLoading(true);
    try {
      const res = await api.get(`/skill-gap/candidate/${selectedCandidate}/job/${selectedJob}`);
      setReport(res.data?.data || null);
      setActiveTab('analysis');
    } catch (err) {
      console.error('Failed to calculate gap:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate development plan
  const generatePlan = async () => {
    if (!selectedCandidate || !selectedJob) return;
    setPlanLoading(true);
    try {
      const res = await api.post(`/skill-gap/candidate/${selectedCandidate}/job/${selectedJob}/plan`, {
        duration: planDuration,
      });
      setPlan(res.data?.data || null);
      setActiveTab('plan');
    } catch (err) {
      console.error('Failed to generate plan:', err);
    } finally {
      setPlanLoading(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getMatchGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-amber-500';
    if (score >= 40) return 'from-orange-500 to-amber-500';
    return 'from-red-500 to-rose-500';
  };

  return (
    <div className="min-h-full p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Skill Gap Intelligence</h1>
            <p className="text-sm text-gray-400">Analyze skill gaps and generate personalized development plans</p>
          </div>
        </div>
      </div>

      {/* Selection Panel */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Select Candidate & Job</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Candidate</label>
            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select candidate...</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Job Position</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select job...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>
          <button
            onClick={calculateGap}
            disabled={!selectedCandidate || !selectedJob || loading}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Target className="w-4 h-4" />
            )}
            Analyze Gap
          </button>
          <button
            onClick={generatePlan}
            disabled={!selectedCandidate || !selectedJob || planLoading}
            className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2"
          >
            {planLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <BookOpen className="w-4 h-4" />
            )}
            Generate Plan
          </button>
        </div>

        {/* Duration selector */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm text-gray-400">Plan Duration:</span>
          {(['30-day', '60-day', '90-day'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setPlanDuration(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                planDuration === d
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Report */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Overall Match</span>
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <div className={`text-3xl font-bold ${getMatchColor(report.overallMatch)}`}>
                {report.overallMatch}%
              </div>
              <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${report.overallMatch}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`h-full rounded-full bg-gradient-to-r ${getMatchGradient(report.overallMatch)}`}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Matched Skills</span>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400">{report.matchedSkills.length}</div>
              <p className="text-xs text-gray-500 mt-1">Fully qualified</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Partial Skills</span>
                <TrendingUp className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-yellow-400">{report.partialSkills.length}</div>
              <p className="text-xs text-gray-500 mt-1">Close to requirements</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Missing Skills</span>
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-3xl font-bold text-red-400">{report.missingSkills.length}</div>
              <p className="text-xs text-gray-500 mt-1">Need development</p>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analysis'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Skill Analysis
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              disabled={!plan}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'plan'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-50'
              }`}
            >
              Development Plan
            </button>
          </div>

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Visual Skill Comparison */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Visual Skill Comparison</h3>
                <div className="space-y-4">
                  {/* Matched Skills */}
                  {report.matchedSkills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Matched Skills ({report.matchedSkills.length})
                      </h4>
                      {report.matchedSkills.map((skill, i) => (
                        <SkillBar key={i} skill={skill} delay={i * 0.05} />
                      ))}
                    </div>
                  )}

                  {/* Partial Skills */}
                  {report.partialSkills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Partial Skills ({report.partialSkills.length})
                      </h4>
                      {report.partialSkills.map((skill, i) => (
                        <SkillBar key={i} skill={skill} delay={i * 0.05} />
                      ))}
                    </div>
                  )}

                  {/* Missing Skills */}
                  {report.missingSkills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Missing Skills ({report.missingSkills.length})
                      </h4>
                      {report.missingSkills.map((skill, i) => (
                        <SkillBar key={i} skill={skill} delay={i * 0.05} />
                      ))}
                    </div>
                  )}

                  {/* Transferable Skills */}
                  {report.transferableSkills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Transferable Skills ({report.transferableSkills.length})
                      </h4>
                      {report.transferableSkills.map((skill, i) => (
                        <SkillBar key={i} skill={skill} delay={i * 0.05} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    AI Analysis Summary
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{report.summary}</p>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-400" />
                    Recommendations
                  </h3>
                  <ul className="space-y-3">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Plan Tab */}
          {activeTab === 'plan' && plan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Plan Header */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{plan.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-400">{plan.totalEstimatedHours}h</div>
                    <p className="text-xs text-gray-500">Estimated total</p>
                  </div>
                </div>
              </div>

              {/* Learning Items */}
              <div className="space-y-4">
                {plan.items.map((item, i) => {
                  const priorityConfig = PRIORITY_CONFIG[item.priority];
                  const isExpanded = expandedSkill === item.skill;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedSkill(isExpanded ? null : item.skill)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg ${priorityConfig.bg} flex items-center justify-center`}>
                            <span className={`text-sm font-bold ${priorityConfig.color}`}>{i + 1}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-medium">{item.skill}</h4>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityConfig.bg} ${priorityConfig.color}`}>
                                {priorityConfig.label}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-0.5">{item.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-gray-300">{item.currentLevel}% → {item.targetLevel}%</div>
                            <div className="text-xs text-gray-500">{item.estimatedHours}h estimated</div>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
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
                              {/* Progress Bar */}
                              <div>
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span className="text-gray-400">Skill Progress</span>
                                  <span className="text-white">{item.currentLevel}% → {item.targetLevel}%</span>
                                </div>
                                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                  <div className="flex h-full">
                                    <div
                                      className="bg-purple-500/50"
                                      style={{ width: `${item.currentLevel}%` }}
                                    />
                                    <div
                                      className="bg-purple-500"
                                      style={{ width: `${item.targetLevel - item.currentLevel}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Learning Objective */}
                              <div>
                                <h5 className="text-sm font-medium text-gray-300 mb-2">Learning Objective</h5>
                                <p className="text-sm text-gray-400">{item.learningObjective}</p>
                              </div>

                              {/* Recommended Projects */}
                              <div>
                                <h5 className="text-sm font-medium text-gray-300 mb-2">Recommended Projects</h5>
                                <ul className="space-y-2">
                                  {item.recommendedProjects.map((project, j) => (
                                    <li key={j} className="flex items-center gap-2 text-sm text-gray-400">
                                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                      {project}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Resources */}
                              <div>
                                <h5 className="text-sm font-medium text-gray-300 mb-2">Learning Resources</h5>
                                <div className="flex flex-wrap gap-2">
                                  {item.resources.map((resource, j) => (
                                    <span key={j} className="px-3 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                                      {resource}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Milestones */}
                              <div>
                                <h5 className="text-sm font-medium text-gray-300 mb-2">Milestones</h5>
                                <div className="space-y-2">
                                  {item.milestones.map((milestone, j) => (
                                    <div key={j} className="flex items-center gap-2 text-sm text-gray-400">
                                      <Clock className="w-4 h-4 text-gray-500" />
                                      {milestone}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!report && !loading && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Analysis Yet</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Select a candidate and job position above, then click &quot;Analyze Gap&quot; to generate a comprehensive skill gap analysis.
          </p>
        </div>
      )}
    </div>
  );
}

// Skill Bar Component
function SkillBar({ skill, delay }: { skill: SkillComparison; delay: number }) {
  const config = STATUS_CONFIG[skill.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="mb-3"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className="text-sm text-white">{skill.skillName}</span>
          <span className={`px-2 py-0.5 rounded text-xs ${config.bg} ${config.color}`}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">Candidate: {skill.candidateLevel}%</span>
          <span className="text-gray-400">Required: {skill.requiredLevel}%</span>
        </div>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="flex h-full">
          {/* Candidate level */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${skill.candidateLevel}%` }}
            transition={{ duration: 0.8, delay }}
            className="bg-purple-500"
          />
          {/* Required level (if higher) */}
          {skill.requiredLevel > skill.candidateLevel && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${skill.requiredLevel - skill.candidateLevel}%` }}
              transition={{ duration: 0.8, delay: delay + 0.3 }}
              className="bg-gray-600/50"
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
