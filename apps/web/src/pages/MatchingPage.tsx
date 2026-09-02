import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Trophy,
  Target,
  Zap,
  BookOpen,
  Briefcase,
  GraduationCap,
  Star,
  X,
  RefreshCw,
  Loader2,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ArrowUpDown,
} from 'lucide-react';

// ============================================================
// Types
interface MatchResult {
  rank: number;
  candidateId: string;
  candidateName: string;
  overallScore: number;
  categoryScores: {
    skills: number;
    experience: number;
    projects: number;
    education: number;
    semantic: number;
  };
}

interface MatchDetail {
  id: string;
  candidateId: string;
  jobId: string;
  overallScore: number;
  skillScore: number | null;
  experienceScore: number | null;
  projectScore: number | null;
  educationScore: number | null;
  semanticScore: number | null;
  explanation: string;
  evidence: Array<{
    id: string;
    type: string;
    detail: string;
    score: number | null;
    metadata: Record<string, unknown> | null;
  }>;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    location: string | null;
    summary: string | null;
    skills: Array<{
      skill: { id: string; name: string; category: { name: string } | null };
      proficiency: string;
      confidence: number;
      evidence: string | null;
    }>;
    experience: Array<{
      id: string;
      title: string;
      company: string;
      startDate: string;
      endDate: string | null;
    }>;
    education: Array<{
      id: string;
      institution: string;
      degree: string | null;
      fieldOfStudy: string | null;
    }>;
  };
  job: {
    id: string;
    title: string;
    skills: Array<{
      skill: { id: string; name: string };
      required: boolean;
      weight: number;
    }>;
  };
}

interface MatchStats {
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalMatches: number;
  distribution: Array<{ range: string; count: number }>;
}

interface Job {
  id: string;
  title: string;
  department: string | null;
  status: string;
  _count: { applications: number };
}

// ============================================================
// Helpers
const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-red-400';
};

const getScoreBg = (score: number) => {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 60) return 'bg-blue-500/10 border-blue-500/20';
  if (score >= 40) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  return 'Low';
};

const getSkillStatusIcon = (status: string) => {
  switch (status) {
    case 'matched': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'partial': return <AlertCircle className="w-4 h-4 text-amber-400" />;
    case 'missing': return <XCircle className="w-4 h-4 text-red-400" />;
    default: return <MinusCircle className="w-4 h-4 text-gray-500" />;
  }
};

// ============================================================
// AnimatedScoreBar
const AnimatedScoreBar: React.FC<{ score: number; delay?: number }> = ({ score, delay = 0 }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), delay * 100 + 100);
    return () => clearTimeout(timer);
  }, [score, delay]);

  return (
    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${
          score >= 80 ? 'bg-emerald-500' :
          score >= 60 ? 'bg-blue-500' :
          score >= 40 ? 'bg-amber-500' : 'bg-red-500'
        }`}
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.8, delay: delay * 0.1, ease: 'easeOut' }}
      />
    </div>
  );
};

// ============================================================
// Category Score Card
const CategoryScoreCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  score: number;
  weight: number;
}> = ({ icon, label, score, weight }) => (
  <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
    <div className="flex items-center gap-2 mb-2">
      <div className="text-gray-400">{icon}</div>
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className="text-xs text-gray-600 ml-auto">{Math.round(weight * 100)}%</span>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
      <span className="text-xs text-gray-500">/100</span>
    </div>
    <div className="mt-2">
      <AnimatedScoreBar score={score} />
    </div>
  </div>
);

// ============================================================
// Match Detail Panel
const MatchDetailPanel: React.FC<{ match: MatchDetail; onClose: () => void }> = ({
  match,
  onClose,
}) => {
  const skillGroups = {
    matched: match.evidence.filter(e => e.type === 'skill_match' && e.detail.includes('✅')),
    partial: match.evidence.filter(e => e.type === 'skill_match' && e.detail.includes('⚠️')),
    missing: match.evidence.filter(e => e.type === 'skill_match' && e.detail.includes('❌')),
  };

  const otherEvidence = match.evidence.filter(e => e.type !== 'skill_match');

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-full max-w-xl bg-gray-950 border-l border-gray-800 z-50 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{`${match.candidate.firstName} ${match.candidate.lastName}`}</h2>
            <p className="text-sm text-gray-400">Match for {match.job.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg border ${getScoreBg(match.overallScore)}`}>
              <span className={`text-2xl font-bold ${getScoreColor(match.overallScore)}`}>
                {match.overallScore}%
              </span>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Overall Score */}
        <div className={`rounded-xl p-4 border ${getScoreBg(match.overallScore)}`}>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Overall Match</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-4xl font-bold ${getScoreColor(match.overallScore)}`}>{match.overallScore}%</span>
            <span className="text-sm text-gray-400">{getScoreLabel(match.overallScore)} Match</span>
          </div>
          <AnimatedScoreBar score={match.overallScore} delay={0} />
        </div>

        {/* Category Scores */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Score Breakdown</h3>
          <div className="grid grid-cols-2 gap-2">
            <CategoryScoreCard icon={<Zap className="w-4 h-4" />} label="Skills" score={match.skillScore || 0} weight={0.40} />
            <CategoryScoreCard icon={<Briefcase className="w-4 h-4" />} label="Experience" score={match.experienceScore || 0} weight={0.20} />
            <CategoryScoreCard icon={<Target className="w-4 h-4" />} label="Projects" score={match.projectScore || 0} weight={0.20} />
            <CategoryScoreCard icon={<GraduationCap className="w-4 h-4" />} label="Education" score={match.educationScore || 0} weight={0.10} />
          </div>
        </div>

        {/* Skills Breakdown */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Skills Analysis</h3>

          {/* Matched Skills */}
          {skillGroups.matched.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Matched ({skillGroups.matched.length})</span>
              </div>
              <div className="space-y-1.5">
                {skillGroups.matched.map((e, i) => (
                  <div key={i} className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2 text-sm text-gray-300">
                    {e.detail}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Partial Skills */}
          {skillGroups.partial.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-amber-400">Partial ({skillGroups.partial.length})</span>
              </div>
              <div className="space-y-1.5">
                {skillGroups.partial.map((e, i) => (
                  <div key={i} className="bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2 text-sm text-gray-300">
                    {e.detail}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {skillGroups.missing.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium text-red-400">Missing ({skillGroups.missing.length})</span>
              </div>
              <div className="space-y-1.5">
                {skillGroups.missing.map((e, i) => (
                  <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 text-sm text-gray-300">
                    {e.detail}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Other Evidence */}
        {otherEvidence.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Additional Evidence</h3>
            <div className="space-y-1.5">
              {otherEvidence.map((e, i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300">
                  {e.detail}
                  {e.score !== null && e.score !== undefined && (
                    <span className={`ml-2 text-xs ${getScoreColor(e.score)}`}>({e.score}%)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Explanation */}
        {match.explanation && (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">AI Analysis</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{match.explanation}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================
// Main Matching Page
const MatchingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<MatchDetail | null>(null);
  const [sortBy, setSortBy] = useState<string>('overallScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch jobs
  const { data: jobsData } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs?limit=100');
      return res.data?.data || res.data || [];
    },
  });

  const jobs: Job[] = jobsData || [];

  // Auto-select first job with skills
  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      const jobWithSkills = (jobs || []).find((j: any) => j && Array.isArray(j.skills) && j.skills.length > 0) || (jobs || [])[0];
      setSelectedJobId(jobWithSkills.id);
    }
  }, [jobs, selectedJobId]);

  // Run matching mutation
  const runMatchMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await api.post(`/matching/job/${jobId}/run`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['matchStats'] });
    },
  });

  // Fetch rankings
  const { data: rankingsData, isLoading: rankingsLoading } = useQuery({
    queryKey: ['rankings', selectedJobId, sortBy, sortOrder],
    queryFn: async () => {
      if (!selectedJobId) return null;
      const res = await api.get(`/matching/rankings`, {
        params: { jobId: selectedJobId, sortBy, sortOrder, limit: 50 },
      });
      return res.data;
    },
    enabled: !!selectedJobId,
  });

  // Fetch match stats
  const { data: statsData } = useQuery({
    queryKey: ['matchStats', selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return null;
      const res = await api.get(`/matching/stats/${selectedJobId}`);
      return res.data?.data;
    },
    enabled: !!selectedJobId,
  });

  const rankings: MatchResult[] = (rankingsData?.data || []).map((m: any, i: number) => ({
    rank: i + 1,
    candidateId: m.candidateId,
    candidateName: m.candidate ? `${m.candidate.firstName} ${m.candidate.lastName}` : 'Unknown',
    overallScore: m.overallScore,
    categoryScores: {
      skills: m.skillScore || 0,
      experience: m.experienceScore || 0,
      projects: m.projectScore || 0,
      education: m.educationScore || 0,
      semantic: m.semanticScore || 0,
    },
  }));
  const stats: MatchStats | null = statsData || null;
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  // Fetch match detail
  const fetchMatchDetail = async (candidateId: string) => {
    if (!selectedJobId) return;
    try {
      const res = await api.get(`/matching/detail/${candidateId}/${selectedJobId}`);
      setSelectedMatch(res.data?.data || null);
    } catch (err) {
      console.error('Failed to fetch match detail:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Candidate Matching</h1>
              <p className="text-sm text-gray-400 mt-1">
                AI-powered candidate ranking with explainable scoring
              </p>
            </div>
            <button
              onClick={() => selectedJobId && runMatchMutation.mutate(selectedJobId)}
              disabled={!selectedJobId || runMatchMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {runMatchMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Run Matching
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Job Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">Select Job Position</label>
          <div className="relative">
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a job...</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>
                  {job.title} {job.department ? `(${job.department})` : ''} — {job.status}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Total Matched</span>
              </div>
              <span className="text-2xl font-bold text-white">{stats.totalMatches}</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-gray-400">Average Score</span>
              </div>
              <span className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                {Math.round(stats.averageScore)}%
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-gray-400">Top Score</span>
              </div>
              <span className={`text-2xl font-bold ${getScoreColor(stats.highestScore)}`}>
                {Math.round(stats.highestScore)}%
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-gray-400">Score Range</span>
              </div>
              <span className="text-sm text-gray-300">
                {Math.round(stats.lowestScore)}% — {Math.round(stats.highestScore)}%
              </span>
            </motion.div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="overallScore">Overall Score</option>
            <option value="skillScore">Skill Score</option>
            <option value="experienceScore">Experience Score</option>
            <option value="createdAt">Date Created</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="p-1.5 rounded-lg border border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-white"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* Rankings Table */}
        {rankingsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-400">No matches yet</h3>
            <p className="text-sm text-gray-500 mt-1">Run matching for this job to see ranked candidates</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((match, index) => (
              <motion.div
                key={match.candidateId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => fetchMatchDetail(match.candidateId)}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 hover:bg-gray-900 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    index === 1 ? 'bg-gray-400/10 text-gray-300 border border-gray-400/20' :
                    index === 2 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    'bg-gray-800/50 text-gray-400 border border-gray-700'
                  }`}>
                    #{match.rank}
                  </div>

                  {/* Candidate Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                      {match.candidateName}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-blue-400" />
                        <span className="text-xs text-gray-400">Skills: {match.categoryScores.skills}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs text-gray-400">Exp: {match.categoryScores.experience}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-gray-400">Projects: {match.categoryScores.projects}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block w-32">
                      <AnimatedScoreBar score={match.overallScore} delay={index} />
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg border ${getScoreBg(match.overallScore)}`}>
                      <span className={`text-lg font-bold ${getScoreColor(match.overallScore)}`}>
                        {match.overallScore}%
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Match Detail Slide-over */}
      <AnimatePresence>
        {selectedMatch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setSelectedMatch(null)}
            />
            <MatchDetailPanel match={selectedMatch} onClose={() => setSelectedMatch(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchingPage;
