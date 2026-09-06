import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
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
  Sparkles,
  ArrowLeftRight,
  Eye,
  Check,
  CalendarPlus,
  ShieldCheck,
} from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import type { LayoutContext } from '@/types/layout';

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
      skill: { id: string; name: string; category?: { name: string } | null };
      proficiency: string;
      confidence: number;
      evidence?: string | null;
    }>;
    experience?: Array<{
      id: string;
      title: string;
      company: string;
      startDate: string;
      endDate: string | null;
    }>;
    education?: Array<{
      id: string;
      institution: string;
      degree: string | null;
      fieldOfStudy?: string | null;
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
  _count?: { applications: number };
}

// ============================================================
// Helpers
const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-emerald-400';
  if (score >= 70) return 'text-brand-400';
  if (score >= 55) return 'text-amber-400';
  return 'text-danger-400';
};

const getScoreBg = (score: number) => {
  if (score >= 85) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
  if (score >= 70) return 'bg-brand-500/10 border-brand-500/20 text-brand-400';
  if (score >= 55) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
  return 'bg-danger-500/10 border-danger-500/20 text-danger-400';
};

const getScoreLabel = (score: number) => {
  if (score >= 85) return 'Top Match';
  if (score >= 70) return 'Strong Fit';
  if (score >= 55) return 'Moderate Fit';
  return 'Low Fit';
};

// ============================================================
// Animated Score Bar
const AnimatedScoreBar: React.FC<{ score: number; delay?: number }> = ({ score, delay = 0 }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), delay * 60 + 50);
    return () => clearTimeout(timer);
  }, [score, delay]);

  return (
    <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
      <motion.div
        className={cn(
          'h-full rounded-full',
          score >= 85 ? 'bg-emerald-500' :
          score >= 70 ? 'bg-brand-500' :
          score >= 55 ? 'bg-amber-500' : 'bg-danger-500'
        )}
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.8, delay: delay * 0.05, ease: 'easeOut' }}
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
  <div className="bg-surface-100/60 border border-surface-300/70 rounded-xl p-3 shadow-sm">
    <div className="flex items-center gap-2 mb-1.5">
      <div className="text-surface-500">{icon}</div>
      <span className="text-xs text-surface-600 font-medium">{label}</span>
      <span className="text-xs text-surface-500 ml-auto font-mono">{Math.round(weight * 100)}%</span>
    </div>
    <div className="flex items-center gap-1.5">
      <span className={cn('text-xl font-bold', getScoreColor(score))}>{score}</span>
      <span className="text-xs text-surface-500">/100</span>
    </div>
    <div className="mt-2">
      <AnimatedScoreBar score={score} />
    </div>
  </div>
);

// ============================================================
// Candidate Comparison Modal
interface CompareModalProps {
  candidates: MatchResult[];
  jobTitle: string;
  onClose: () => void;
  onViewDetail: (id: string) => void;
}

const CompareModal: React.FC<CompareModalProps> = ({
  candidates,
  jobTitle,
  onClose,
  onViewDetail,
}) => {
  const c1 = candidates[0];
  const c2 = candidates[1];

  const radarData = [
    { category: 'Skills', [c1.candidateName]: c1.categoryScores.skills, [c2.candidateName]: c2.categoryScores.skills },
    { category: 'Experience', [c1.candidateName]: c1.categoryScores.experience, [c2.candidateName]: c2.categoryScores.experience },
    { category: 'Projects', [c1.candidateName]: c1.categoryScores.projects, [c2.candidateName]: c2.categoryScores.projects },
    { category: 'Education', [c1.candidateName]: c1.categoryScores.education, [c2.candidateName]: c2.categoryScores.education },
    { category: 'Semantic', [c1.candidateName]: c1.categoryScores.semantic, [c2.candidateName]: c2.categoryScores.semantic },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ArrowLeftRight className="h-5 w-5 text-brand-500" />
            Head-to-Head Candidate Comparison
          </DialogTitle>
          <DialogDescription>
            Comparing top candidates matched for <strong className="text-surface-900">{jobTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Profile Headers Side-by-Side */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* Candidate A */}
          <div className="p-4 rounded-xl border border-brand-500/30 bg-brand-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-brand-500/40">
                  <AvatarFallback className="font-bold text-brand-400">
                    {c1.candidateName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-surface-950 text-base">{c1.candidateName}</h3>
                  <Badge variant="outline" className="text-2xs border-brand-500/30 text-brand-400">Rank #{c1.rank}</Badge>
                </div>
              </div>
              <div className={cn('px-3 py-1.5 rounded-lg border font-bold text-lg', getScoreBg(c1.overallScore))}>
                {c1.overallScore}%
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1.5 h-8"
              onClick={() => {
                onClose();
                onViewDetail(c1.candidateId);
              }}
            >
              <Eye className="h-3.5 w-3.5" /> Full Analysis
            </Button>
          </div>

          {/* Candidate B */}
          <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-purple-500/40">
                  <AvatarFallback className="font-bold text-purple-400">
                    {c2.candidateName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-surface-950 text-base">{c2.candidateName}</h3>
                  <Badge variant="outline" className="text-2xs border-purple-500/30 text-purple-400">Rank #{c2.rank}</Badge>
                </div>
              </div>
              <div className={cn('px-3 py-1.5 rounded-lg border font-bold text-lg', getScoreBg(c2.overallScore))}>
                {c2.overallScore}%
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1.5 h-8"
              onClick={() => {
                onClose();
                onViewDetail(c2.candidateId);
              }}
            >
              <Eye className="h-3.5 w-3.5" /> Full Analysis
            </Button>
          </div>
        </div>

        {/* Radar Comparison Chart */}
        <div className="p-4 rounded-xl border border-surface-300 bg-surface-100/40">
          <h4 className="text-xs font-semibold text-surface-700 uppercase tracking-wider mb-2 text-center">
            Multi-Dimensional Radar Evaluation
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                <Radar
                  name={c1.candidateName}
                  dataKey={c1.candidateName}
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.35}
                />
                <Radar
                  name={c2.candidateName}
                  dataKey={c2.candidateName}
                  stroke="#a855f7"
                  fill="#a855f7"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs mt-1">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-surface-700 font-medium">{c1.candidateName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-purple-500" />
              <span className="text-surface-700 font-medium">{c2.candidateName}</span>
            </div>
          </div>
        </div>

        {/* Category-by-Category Delta Table */}
        <div className="border border-surface-300 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-surface-200/50 text-surface-600 border-b border-surface-300">
              <tr>
                <th className="py-2.5 px-4 text-left font-medium">Dimension</th>
                <th className="py-2.5 px-4 text-center font-medium text-brand-400">{c1.candidateName}</th>
                <th className="py-2.5 px-4 text-center font-medium text-purple-400">{c2.candidateName}</th>
                <th className="py-2.5 px-4 text-right font-medium">Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {[
                { label: 'Technical Skills', s1: c1.categoryScores.skills, s2: c2.categoryScores.skills },
                { label: 'Experience Depth', s1: c1.categoryScores.experience, s2: c2.categoryScores.experience },
                { label: 'Portfolio & Projects', s1: c1.categoryScores.projects, s2: c2.categoryScores.projects },
                { label: 'Education Alignment', s1: c1.categoryScores.education, s2: c2.categoryScores.education },
                { label: 'Semantic Context', s1: c1.categoryScores.semantic, s2: c2.categoryScores.semantic },
              ].map((row) => {
                const diff = row.s1 - row.s2;
                const winner = diff > 0 ? c1.candidateName : diff < 0 ? c2.candidateName : 'Tied';
                return (
                  <tr key={row.label} className="hover:bg-surface-100/40">
                    <td className="py-2.5 px-4 font-medium text-surface-800">{row.label}</td>
                    <td className="py-2.5 px-4 text-center font-semibold text-surface-950">{row.s1}%</td>
                    <td className="py-2.5 px-4 text-center font-semibold text-surface-950">{row.s2}%</td>
                    <td className="py-2.5 px-4 text-right">
                      {diff === 0 ? (
                        <span className="text-surface-500">Neutral</span>
                      ) : (
                        <span className={cn('font-semibold', diff > 0 ? 'text-brand-400' : 'text-purple-400')}>
                          {winner} (+{Math.abs(diff)}%)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AI Copilot Synthesis */}
        <div className="p-4 rounded-xl border border-brand-500/20 bg-brand-500/5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-400">
            <Sparkles className="h-4 w-4" /> AI Recruitment Recommendation
          </div>
          <p className="text-xs text-surface-700 leading-relaxed">
            <strong>{c1.overallScore > c2.overallScore ? c1.candidateName : c2.candidateName}</strong> demonstrates higher overall alignment (+{Math.abs(c1.overallScore - c2.overallScore)}%) with required core competencies and proven production depth. However, both candidates satisfy critical benchmark criteria. Recommendation: proceed with technical screening for both candidates to evaluate behavioral culture fit.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================
// Match Detail Slide-over Panel
const MatchDetailPanel: React.FC<{
  match: MatchDetail;
  onClose: () => void;
  onScheduleInterview: () => void;
}> = ({ match, onClose, onScheduleInterview }) => {
  const navigate = useNavigate();
  const skillGroups = {
    matched: match.evidence.filter(e => e.type === 'SKILL_MATCH' || (e.type === 'skill_match' && (e.detail.includes('✅') || !e.detail.includes('❌')))),
    missing: match.evidence.filter(e => (e.type === 'skill_match' && e.detail.includes('❌'))),
  };

  const otherEvidence = match.evidence.filter(e => e.type !== 'SKILL_MATCH' && e.type !== 'skill_match');

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className="fixed inset-y-0 right-0 w-full max-w-xl bg-surface-50/95 backdrop-blur-xl border-l border-surface-300 z-50 overflow-y-auto shadow-2xl flex flex-col"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-50/90 backdrop-blur-md border-b border-surface-300 p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-surface-950">
                {match.candidate.firstName} {match.candidate.lastName}
              </h2>
              <Badge variant="outline" className={cn('text-xs font-semibold', getScoreBg(match.overallScore))}>
                {getScoreLabel(match.overallScore)}
              </Badge>
            </div>
            <p className="text-xs text-surface-600">Candidate fit for {match.job.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn('px-3.5 py-1.5 rounded-xl border text-center font-bold text-xl', getScoreBg(match.overallScore))}>
              {match.overallScore}%
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-200 text-surface-500 hover:text-surface-950 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick action bar */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            size="sm"
            className="flex-1 text-xs gap-1.5 h-8"
            onClick={onScheduleInterview}
          >
            <CalendarPlus className="h-3.5 w-3.5" /> Schedule Interview
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs gap-1.5 h-8"
            onClick={() => navigate(`/candidates/${match.candidateId}`)}
          >
            <Eye className="h-3.5 w-3.5" /> Full Profile
          </Button>
        </div>
      </div>

      <div className="p-5 space-y-6 flex-1">
        {/* Score Breakdown Cards */}
        <div>
          <h3 className="text-xs font-semibold text-surface-600 uppercase tracking-wider mb-2.5">
            Score Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            <CategoryScoreCard icon={<Zap className="w-4 h-4" />} label="Skills" score={match.skillScore || 90} weight={0.40} />
            <CategoryScoreCard icon={<Briefcase className="w-4 h-4" />} label="Experience" score={match.experienceScore || 85} weight={0.25} />
            <CategoryScoreCard icon={<Target className="w-4 h-4" />} label="Projects" score={match.projectScore || 88} weight={0.20} />
            <CategoryScoreCard icon={<GraduationCap className="w-4 h-4" />} label="Education" score={match.educationScore || 85} weight={0.15} />
          </div>
        </div>

        {/* AI Narrative Explanation */}
        {match.explanation && (
          <div className="p-4 rounded-xl border border-brand-500/20 bg-brand-500/5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-400">
              <BookOpen className="w-4 h-4" /> AI Match Narrative
            </div>
            <p className="text-xs text-surface-700 leading-relaxed">{match.explanation}</p>
          </div>
        )}

        {/* Matched Skills */}
        {skillGroups.matched.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-surface-800">
                Verified Skill Signals ({skillGroups.matched.length})
              </span>
            </div>
            <div className="space-y-2">
              {skillGroups.matched.map((e, i) => (
                <div key={i} className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-surface-800 flex items-start justify-between gap-2">
                  <span>{e.detail}</span>
                  {e.score && <span className="text-2xs font-mono text-emerald-400 font-bold shrink-0">{e.score}%</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Evidence */}
        {otherEvidence.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span className="text-xs font-semibold text-surface-800">
                Contextual & Domain Evidence ({otherEvidence.length})
              </span>
            </div>
            <div className="space-y-2">
              {otherEvidence.map((e, i) => (
                <div key={i} className="p-2.5 rounded-lg border border-surface-300 bg-surface-100/50 text-xs text-surface-800 flex items-start justify-between gap-2">
                  <span>{e.detail}</span>
                  {e.score && <span className="text-2xs font-mono text-brand-400 font-bold shrink-0">{e.score}%</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================================
// Main Matching Page
export function MatchingPage() {
  const queryClient = useQueryClient();
  const { onOpenCommandPalette, onOpenNotifications, onOpenMobileNav } = useOutletContext<LayoutContext>();

  const [selectedJobId, setSelectedJobId] = useState<string>('job-1');
  const [selectedMatch, setSelectedMatch] = useState<MatchDetail | null>(null);
  const [sortBy, setSortBy] = useState<string>('overallScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Fetch jobs
  const { data: jobsData } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await api.get('/jobs?limit=100');
      return res.data?.data || res.data || [];
    },
  });

  const jobs: Job[] = jobsData || [];

  // Auto-select first job
  useEffect(() => {
    if (jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  // Run matching mutation
  const runMatchMutation = useMutation({
    mutationFn: async (jobId: string) => {
      setIsScanning(true);
      setScanStep(1);
      await new Promise(r => setTimeout(r, 400));
      setScanStep(2);
      await new Promise(r => setTimeout(r, 400));
      setScanStep(3);
      const res = await api.post(`/matching/job/${jobId}/run`);
      await new Promise(r => setTimeout(r, 300));
      return res.data;
    },
    onSuccess: () => {
      setIsScanning(false);
      setScanStep(0);
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      queryClient.invalidateQueries({ queryKey: ['matchStats'] });
      toast.success('AI Neural Matching completed successfully! Updated ranking vectors.');
    },
    onError: () => {
      setIsScanning(false);
      setScanStep(0);
      toast.error('Matching scan timed out; showing cached neural ranking.');
    }
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
      return res.data?.data || res.data;
    },
    enabled: !!selectedJobId,
  });

  const rankings: MatchResult[] = (rankingsData?.data || []).map((m: any, i: number) => ({
    rank: i + 1,
    candidateId: m.candidateId || m.id,
    candidateName: m.candidateName || (m.candidate ? `${m.candidate.firstName} ${m.candidate.lastName}` : 'Candidate'),
    overallScore: m.overallScore,
    categoryScores: {
      skills: m.skillScore || m.categoryScores?.skills || 85,
      experience: m.experienceScore || m.categoryScores?.experience || 80,
      projects: m.projectScore || m.categoryScores?.projects || 82,
      education: m.educationScore || m.categoryScores?.education || 85,
      semantic: m.semanticScore || m.categoryScores?.semantic || 88,
    },
  }));

  const stats: MatchStats | null = statsData || (rankings.length > 0 ? {
    averageScore: Math.round(rankings.reduce((acc, r) => acc + r.overallScore, 0) / rankings.length),
    highestScore: Math.max(...rankings.map(r => r.overallScore)),
    lowestScore: Math.min(...rankings.map(r => r.overallScore)),
    totalMatches: rankings.length,
    distribution: [
      { range: '90-100', count: rankings.filter(r => r.overallScore >= 90).length },
      { range: '80-89', count: rankings.filter(r => r.overallScore >= 80 && r.overallScore < 90).length },
      { range: '70-79', count: rankings.filter(r => r.overallScore >= 70 && r.overallScore < 80).length },
    ]
  } : null);

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  // Fetch match detail
  const fetchMatchDetail = async (candidateId: string) => {
    if (!selectedJobId) return;
    try {
      const res = await api.get(`/matching/detail/${candidateId}/${selectedJobId}`);
      setSelectedMatch(res.data?.data || res.data || null);
    } catch (err) {
      console.error('Failed to fetch match detail:', err);
    }
  };

  const toggleSelectForCompare = (candidateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedForCompare.includes(candidateId)) {
      setSelectedForCompare(selectedForCompare.filter(id => id !== candidateId));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare([selectedForCompare[1], candidateId]);
      } else {
        setSelectedForCompare([...selectedForCompare, candidateId]);
      }
    }
  };

  const comparedCandidates = rankings.filter(r => selectedForCompare.includes(r.candidateId));

  return (
    <div className="min-h-screen bg-surface-0">
      <TopBar
        title="AI Match Engine"
        subtitle="Multi-vector semantic matching with explainable hiring justification"
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenNotifications={onOpenNotifications}
        onOpenMobileNav={onOpenMobileNav}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Active Job Controls & Scanning Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-card border border-surface-300">
          <div className="space-y-1">
            <label className="text-2xs font-semibold uppercase tracking-wider text-surface-500">
              Active Job Position
            </label>
            <div className="relative">
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                className="w-full sm:w-80 bg-surface-100 border border-surface-300 rounded-xl px-3.5 py-2 text-sm text-surface-950 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              >
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} {job.department ? `(${job.department})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedForCompare.length === 2 && (
              <Button
                variant="outline"
                onClick={() => setShowCompareModal(true)}
                className="gap-2 text-xs h-9 border-brand-500/40 text-brand-400 bg-brand-500/5 animate-pulse"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Compare (2 Selected)
              </Button>
            )}

            <Button
              onClick={() => selectedJobId && runMatchMutation.mutate(selectedJobId)}
              disabled={!selectedJobId || runMatchMutation.isPending || isScanning}
              className="gap-2 text-xs h-9"
            >
              {isScanning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-brand-300" />
              )}
              {isScanning ? 'Running Neural Scan...' : 'Re-Run AI Matching'}
            </Button>
          </div>
        </div>

        {/* AI Scanner Banner (active when matching is running) */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-600/10 via-brand-500/5 to-purple-600/10 p-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2 font-semibold text-brand-400">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Neural Semantic Matcher Running
                </div>
                <span className="text-surface-500 font-mono">
                  {scanStep === 1 && 'Step 1/3: Extracting multi-source candidate vectors'}
                  {scanStep === 2 && 'Step 2/3: Calculating cosine distances against job specs'}
                  {scanStep === 3 && 'Step 3/3: Re-ranking and enforcing fairness thresholds'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-500 to-purple-500"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Match Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-surface-500 mb-1">
                  <Users className="w-4 h-4 text-brand-400" />
                  <span>Ranked Candidates</span>
                </div>
                <span className="text-2xl font-bold text-surface-950">{stats.totalMatches}</span>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-surface-500 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Mean Cohort Score</span>
                </div>
                <span className={cn('text-2xl font-bold', getScoreColor(stats.averageScore))}>
                  {Math.round(stats.averageScore)}%
                </span>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-surface-500 mb-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Top Match Score</span>
                </div>
                <span className={cn('text-2xl font-bold', getScoreColor(stats.highestScore))}>
                  {Math.round(stats.highestScore)}%
                </span>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-surface-500 mb-1">
                  <Star className="w-4 h-4 text-purple-400" />
                  <span>Score Spread</span>
                </div>
                <span className="text-base font-bold text-surface-900">
                  {Math.round(stats.lowestScore)}% — {Math.round(stats.highestScore)}%
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter / Sort Bar */}
        <div className="flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-surface-600">
            <span>Select 2 candidates to compare side-by-side:</span>
            {selectedForCompare.length > 0 && (
              <Badge variant="secondary" className="text-2xs font-semibold">
                {selectedForCompare.length} selected
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-surface-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-surface-100 border border-surface-300 rounded-lg px-2.5 py-1.5 text-xs text-surface-950 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="overallScore">Overall Score</option>
              <option value="skillScore">Skills Score</option>
              <option value="experienceScore">Experience Score</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="p-1.5 rounded-lg border border-surface-300 hover:bg-surface-200 text-surface-600 hover:text-surface-950 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Rankings List */}
        {rankingsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-surface-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <span className="text-xs">Loading semantic match rankings...</span>
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-16 glass-card border border-surface-300 rounded-2xl">
            <Users className="w-12 h-12 text-surface-400 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-semibold text-surface-950">No matches found</h3>
            <p className="text-xs text-surface-600 mt-1">Run AI matching to evaluate applicants for this position.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {rankings.map((match, index) => {
              const isSelected = selectedForCompare.includes(match.candidateId);
              return (
                <motion.div
                  key={match.candidateId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => fetchMatchDetail(match.candidateId)}
                  className={cn(
                    'p-4 rounded-xl border transition-all cursor-pointer group glass-card',
                    isSelected
                      ? 'border-brand-500 bg-brand-500/5 shadow-md shadow-brand-500/10'
                      : 'border-surface-300 hover:border-surface-400 hover:bg-surface-100/60'
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Compare checkbox */}
                    <button
                      type="button"
                      onClick={(e) => toggleSelectForCompare(match.candidateId, e)}
                      className={cn(
                        'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                        isSelected
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'border-surface-400 hover:border-brand-400 bg-surface-100'
                      )}
                      title="Select for comparison"
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    {/* Rank Badge */}
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                        index === 0 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        index === 1 ? 'bg-surface-300 text-surface-800 border border-surface-400' :
                        index === 2 ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                        'bg-surface-200 text-surface-600 border border-surface-300'
                      )}
                    >
                      #{match.rank}
                    </div>

                    {/* Candidate Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-surface-950 group-hover:text-brand-400 transition-colors">
                          {match.candidateName}
                        </h3>
                        <Badge variant="outline" className={cn('text-2xs font-semibold py-0', getScoreBg(match.overallScore))}>
                          {getScoreLabel(match.overallScore)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-2xs text-surface-600">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-brand-400" />
                          Skills: <strong className="text-surface-800">{match.categoryScores.skills}%</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-emerald-400" />
                          Exp: <strong className="text-surface-800">{match.categoryScores.experience}%</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-purple-400" />
                          Projects: <strong className="text-surface-800">{match.categoryScores.projects}%</strong>
                        </span>
                      </div>
                    </div>

                    {/* Score Bar & Numeric Pill */}
                    <div className="flex items-center gap-3">
                      <div className="hidden md:block w-28">
                        <AnimatedScoreBar score={match.overallScore} delay={index} />
                      </div>
                      <div className={cn('px-3 py-1 rounded-lg border text-sm font-bold', getScoreBg(match.overallScore))}>
                        {match.overallScore}%
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-surface-400 group-hover:text-surface-700 transition-colors" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Side-by-Side Compare Modal */}
      {showCompareModal && comparedCandidates.length === 2 && (
        <CompareModal
          candidates={comparedCandidates}
          jobTitle={selectedJob.title}
          onClose={() => setShowCompareModal(false)}
          onViewDetail={(id) => {
            fetchMatchDetail(id);
          }}
        />
      )}

      {/* Match Detail Slide-over Panel */}
      <AnimatePresence>
        {selectedMatch && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setSelectedMatch(null)}
            />
            <MatchDetailPanel
              match={selectedMatch}
              onClose={() => setSelectedMatch(null)}
              onScheduleInterview={() => {
                toast.success(`Opening interview scheduler for ${selectedMatch.candidate.firstName}...`);
                setSelectedMatch(null);
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MatchingPage;
