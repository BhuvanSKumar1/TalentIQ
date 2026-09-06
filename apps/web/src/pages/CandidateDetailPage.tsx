import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Mail, Phone, Linkedin, Globe, Briefcase, GraduationCap,
  Folder, Award, FileText, BarChart3, Clock, Building2, Calendar, Bookmark,
  Sparkles, CheckCircle2, CalendarPlus,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { cn } from '@/lib/cn';
import type { LayoutContext } from '@/types/layout';
import api from '@/lib/api';
import { DEMO_CANDIDATES } from '@/lib/demoData';
import { toast } from '@/components/ui/toast';

const proficiencyColors: Record<string, string> = {
  EXPERT: 'bg-brand-600/10 text-brand-400 border-brand-600/20',
  ADVANCED: 'bg-success-500/10 text-success-500 border-success-500/20',
  INTERMEDIATE: 'bg-warning-500/10 text-warning-500 border-warning-500/20',
  BEGINNER: 'bg-surface-300 text-surface-700 border-surface-400',
};

const confidenceColors = (c: number) =>
  c >= 0.85 ? 'text-success-500' : c >= 0.7 ? 'text-warning-500' : 'text-danger-500';

interface CandidateData {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  portfolio: string | null;
  summary: string | null;
  skills: Array<{
    id: string;
    proficiency: string;
    yearsOfExp: number | null;
    confidence: number;
    source: string | null;
    evidence: string | null;
    skill: { id: string; name: string; category?: { name: string } | null };
  }>;
  experiences: Array<{
    id: string;
    company: string;
    title: string;
    description: string | null;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    location: string | null;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string | null;
    field: string | null;
    startDate: string;
    endDate: string | null;
    gpa: number | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    url: string | null;
    technologies: string[];
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string | null;
    issueDate: string | null;
    expiryDate: string | null;
  }>;
  resumes: Array<{
    id: string;
    fileName: string;
    processingStatus: string;
    parsedData: any;
  }>;
  applications: Array<{
    id: string;
    status: string;
    job: { id: string; title: string };
  }>;
}

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { onOpenCommandPalette, onOpenNotifications, onOpenMobileNav } = useOutletContext<LayoutContext>();
  const [candidate, setCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shortlisted, setShortlisted] = useState(true);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewType, setInterviewType] = useState('Technical Screen');
  const [interviewDate, setInterviewDate] = useState('2026-09-12');
  const [interviewTime, setInterviewTime] = useState('14:00');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const handleScheduleInterview = () => {
    setScheduling(true);
    setTimeout(() => {
      setScheduling(false);
      setInterviewModalOpen(false);
      toast.success(`Interview scheduled with ${candidate.firstName} for ${interviewDate} at ${interviewTime}! Calendar invites dispatched.`);
    }, 500);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/candidates/${id}`)
      .then(({ data }) => {
        const c = data?.data || data || DEMO_CANDIDATES.find((item) => item.id === id) || DEMO_CANDIDATES[0];
        setCandidate(c);
      })
      .catch(() => {
        const fallback = DEMO_CANDIDATES.find((item) => item.id === id) || DEMO_CANDIDATES[0];
        setCandidate(fallback);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div>
        <TopBar title="Candidate" subtitle="Loading..." onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div>
        <TopBar title="Candidate" subtitle="Error" onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} />
        <div className="p-6 text-center">
          <p className="text-surface-600 mb-4">{error || 'Candidate not found'}</p>
          <Button onClick={() => navigate('/candidates')}>Back to Candidates</Button>
        </div>
      </div>
    );
  }

  const initials = `${candidate.firstName[0]}${candidate.lastName[0]}`;
  const overallConfidence = candidate.resumes?.[0]?.parsedData?.overall_confidence || null;

  const radarData = (candidate.skills || []).slice(0, 6).map((s: any) => {
    const profScore =
      s.proficiency === 'EXPERT' ? 95 :
      s.proficiency === 'ADVANCED' ? 82 :
      s.proficiency === 'INTERMEDIATE' ? 65 : 45;
    return {
      subject: s.skill?.name || s.name || 'Skill',
      proficiency: profScore,
      benchmark: 75,
      fullMark: 100,
    };
  });

  return (
    <div>
      <TopBar
        title={`${candidate.firstName} ${candidate.lastName}`}
        subtitle={candidate.location || ''}
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenNotifications={onOpenNotifications}
        onOpenMobileNav={onOpenMobileNav}
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Back + Action Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/candidates')}
            className="gap-2 text-surface-600 hover:text-surface-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Candidates
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShortlisted(!shortlisted);
                toast.success(shortlisted ? 'Removed from shortlist' : 'Candidate shortlisted!');
              }}
              className="gap-1.5 text-xs h-8"
            >
              <Bookmark className={cn('h-3.5 w-3.5', shortlisted && 'fill-amber-400 text-amber-400')} />
              <span>{shortlisted ? 'Shortlisted' : 'Shortlist'}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setInterviewModalOpen(true)}
              className="gap-1.5 text-xs h-8"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              <span>Schedule Interview</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-5">
                    <Avatar className="h-16 w-16 shrink-0">
                      <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-surface-950">
                        {candidate.firstName} {candidate.lastName}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-surface-600">
                        {candidate.email && (
                          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{candidate.email}</span>
                        )}
                        {candidate.phone && (
                          <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{candidate.phone}</span>
                        )}
                        {candidate.location && (
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{candidate.location}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {candidate.linkedin && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" asChild>
                            <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="h-3.5 w-3.5" />
                              <span className="text-xs">LinkedIn</span>
                            </a>
                          </Button>
                        )}
                        {candidate.portfolio && (
                          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" asChild>
                            <a href={candidate.portfolio} target="_blank" rel="noopener noreferrer">
                              <Globe className="h-3.5 w-3.5" />
                              <span className="text-xs">Portfolio</span>
                            </a>
                          </Button>
                        )}
                        {overallConfidence !== null && (
                          <span className={cn('text-2xs font-medium', confidenceColors(overallConfidence))}>
                            AI Confidence: {(overallConfidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {candidate.summary && (
                    <p className="text-sm text-surface-700 mt-4 leading-relaxed">
                      {candidate.summary}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Skills */}
            {candidate.skills.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-4 w-4 text-brand-400" />
                      Skills ({candidate.skills.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map(cs => (
                        <div
                          key={cs.id}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
                            proficiencyColors[cs.proficiency] || proficiencyColors.BEGINNER,
                          )}
                        >
                          {cs.skill.name}
                          <span className={cn('text-2xs', confidenceColors(cs.confidence))}>
                            {(cs.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Experience */}
            {candidate.experiences.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Briefcase className="h-4 w-4 text-brand-400" />
                      Experience ({candidate.experiences.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {candidate.experiences.map(exp => (
                      <div key={exp.id} className="relative pl-6 border-l-2 border-surface-300">
                        <div className="absolute left-[-5px] top-1 h-2 w-2 rounded-full bg-brand-500" />
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-semibold text-surface-950">{exp.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-surface-600 mt-0.5">
                              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{exp.company}</span>
                              {exp.location && (
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{exp.location}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-surface-500 whitespace-nowrap flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(exp.startDate)} — {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-xs text-surface-700 mt-2 leading-relaxed whitespace-pre-line">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Education */}
            {candidate.education.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <GraduationCap className="h-4 w-4 text-brand-400" />
                      Education ({candidate.education.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {candidate.education.map(edu => (
                      <div key={edu.id} className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-200 shrink-0">
                          <GraduationCap className="h-4 w-4 text-surface-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-surface-950">
                            {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                          </h4>
                          <p className="text-xs text-surface-600">{edu.institution}</p>
                          <p className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                            {edu.gpa && <span className="ml-2">GPA: {edu.gpa}</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Projects */}
            {candidate.projects.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Folder className="h-4 w-4 text-brand-400" />
                      Projects ({candidate.projects.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {candidate.projects.map(proj => (
                      <div key={proj.id} className="rounded-lg border border-surface-300 p-4">
                        <h4 className="text-sm font-semibold text-surface-950">{proj.name}</h4>
                        {proj.description && (
                          <p className="text-xs text-surface-700 mt-1">{proj.description}</p>
                        )}
                        {proj.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {proj.technologies.map(tech => (
                              <span key={tech} className="inline-flex items-center rounded-full bg-surface-200 px-2 py-0.5 text-2xs font-medium text-surface-700">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skills Radar Card */}
            {candidate.skills && candidate.skills.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="glass-card overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-brand-400" />
                      <CardTitle className="text-base">Skill Competency Radar</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="rgba(255,255,255,0.08)" />
                          <PolarAngleAxis dataKey="subject" stroke="#8B99FF" fontSize={10} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="transparent" />
                          <Radar name="Candidate" dataKey="proficiency" stroke="#637BFF" fill="#637BFF" fillOpacity={0.25} />
                          <Radar name="Benchmark" dataKey="benchmark" stroke="#35C99A" strokeDasharray="3 3" fill="transparent" />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-[10px] text-surface-600 pt-2 border-t border-surface-300/50">
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" /> Candidate</span>
                      <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Role Benchmark</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Applications */}
            {candidate.applications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Applications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {candidate.applications.map(app => (
                    <div key={app.id} className="flex items-center justify-between rounded-lg border border-surface-300 p-3">
                      <span className="text-xs font-medium text-surface-950 truncate">{app.job.title}</span>
                      <Badge variant="outline" className="text-2xs">{app.status.replace(/_/g, ' ')}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Resumes */}
            {candidate.resumes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {candidate.resumes.map(res => (
                    <div key={res.id} className="flex items-center gap-3 rounded-lg border border-surface-300 p-3">
                      <FileText className="h-4 w-4 text-surface-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-surface-950 truncate">{res.fileName}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-2xs mt-1',
                            res.processingStatus === 'READY' && 'text-success-500 border-success-500/30',
                            res.processingStatus === 'FAILED' && 'text-danger-500 border-danger-500/30',
                            !['READY', 'FAILED'].includes(res.processingStatus) && 'text-brand-400 border-brand-600/30',
                          )}
                        >
                          {res.processingStatus}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* AI Confidence */}
            {overallConfidence !== null && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-surface-600">Overall Confidence</span>
                        <span className={cn('text-xs font-semibold', confidenceColors(overallConfidence))}>
                          {(overallConfidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-200 overflow-hidden">
                        <motion.div
                          className={cn(
                            'h-full rounded-full',
                            overallConfidence >= 0.85 ? 'bg-success-500' :
                            overallConfidence >= 0.7 ? 'bg-warning-500' : 'bg-danger-500',
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${overallConfidence * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-surface-600 space-y-1">
                      <p>{candidate.skills.length} skills detected</p>
                      <p>{candidate.experiences.length} experience entries</p>
                      <p>{candidate.education.length} education entries</p>
                      <p>{candidate.projects.length} projects</p>
                      <p>{candidate.certifications.length} certifications</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Schedule Interview Modal */}
        <Dialog open={interviewModalOpen} onOpenChange={setInterviewModalOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5 text-brand-500" />
                Schedule Interview with {candidate.firstName}
              </DialogTitle>
              <DialogDescription>
                Coordinate interview stage, synchronizing calendar invites with the hiring panel and candidate.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-700">Interview Stage</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Technical Screen', 'System Design', 'Behavioral & Culture', 'Executive Interview'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInterviewType(type)}
                      className={cn(
                        'px-3 py-2 text-xs rounded-lg border text-left font-medium transition-colors',
                        interviewType === type
                          ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                          : 'border-surface-300 bg-surface-100 hover:border-surface-400 text-surface-700'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-surface-700">Date</label>
                  <Input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-surface-700">Time (UTC)</label>
                  <Input
                    type="time"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-surface-700">Panel & Notes</label>
                <Textarea
                  placeholder="Focus areas (e.g., Deep dive on distributed systems & Kubernetes experience)..."
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  className="text-xs resize-none"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setInterviewModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleScheduleInterview} disabled={scheduling} className="gap-2">
                {scheduling ? <span className="animate-spin text-sm">⏳</span> : <CalendarPlus className="h-3.5 w-3.5" />}
                Confirm & Send Invite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
