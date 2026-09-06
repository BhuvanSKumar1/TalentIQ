import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, MapPin, Upload, X, Sparkles, Users, LayoutGrid,
  List, Bookmark, Eye, ExternalLink, Briefcase, GraduationCap, Check,
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerHeader, DrawerTitle, DrawerContent } from '@/components/ui/drawer';
import { staggerContainer, staggerItem, pageFadeIn, cardHover, buttonHover, buttonTap, float } from '@/lib/animations';
import { ResumeUpload } from '@/components/features/candidates/ResumeUpload';
import { cn } from '@/lib/cn';
import { DemoBadge } from '@/components/shared/DemoBadge';
import type { LayoutContext } from '@/types/layout';
import api from '@/lib/api';
import { DEMO_CANDIDATES } from '@/lib/demoData';

const proficiencyColors: Record<string, string> = {
  EXPERT: 'bg-brand-600/10 text-brand-400 border-brand-600/20',
  ADVANCED: 'bg-success-500/10 text-success-500 border-success-500/20',
  INTERMEDIATE: 'bg-warning-500/10 text-warning-500 border-warning-500/20',
  BEGINNER: 'bg-surface-300 text-surface-700 border-surface-400',
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] || 'U'}${lastName?.[0] || ''}`;
}

const FILTER_TAGS = [
  { id: 'all', label: 'All Candidates' },
  { id: 'python', label: 'Python' },
  { id: 'react', label: 'React' },
  { id: 'cloud', label: 'Cloud & DevOps' },
  { id: 'ai', label: 'AI & Machine Learning' },
  { id: 'remote', label: 'Remote Only' },
];

export function CandidatesPage() {
  const { onOpenCommandPalette, onOpenNotifications, onOpenMobileNav } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeFilter, setActiveFilter] = useState('all');
  const [previewCandidate, setPreviewCandidate] = useState<any | null>(null);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>(['cand-1']);

  const fetchCandidates = async (query?: string) => {
    try {
      const params = new URLSearchParams();
      if (query) params.set('search', query);
      params.set('limit', '50');

      const response = await api.get(`/candidates?${params}`);
      const data = response.data?.data || response.data || [];
      setCandidates(data.length > 0 ? data : DEMO_CANDIDATES);
    } catch {
      setCandidates(DEMO_CANDIDATES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCandidates(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleUploadComplete = () => {
    setShowUpload(false);
    fetchCandidates(search);
  };

  const toggleShortlist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShortlistedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filter candidates based on search & active filter pill
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      const summary = (c.summary || '').toLowerCase();
      const skillsStr = (c.skills || []).map((s: any) => s.skill?.name?.toLowerCase() || '').join(' ');
      const location = (c.location || '').toLowerCase();

      const matchesSearch =
        !search ||
        name.includes(search.toLowerCase()) ||
        summary.includes(search.toLowerCase()) ||
        skillsStr.includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (activeFilter === 'python') return skillsStr.includes('python');
      if (activeFilter === 'react') return skillsStr.includes('react');
      if (activeFilter === 'cloud') return skillsStr.includes('kubernetes') || skillsStr.includes('aws') || skillsStr.includes('terraform');
      if (activeFilter === 'ai') return skillsStr.includes('pytorch') || skillsStr.includes('fastapi') || summary.includes('machine learning');
      if (activeFilter === 'remote') return location.includes('remote');

      return true;
    });
  }, [candidates, search, activeFilter]);

  return (
    <motion.div
      variants={pageFadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <TopBar
        title="Candidates"
        subtitle={`${filteredCandidates.length} candidate${filteredCandidates.length === 1 ? '' : 's'} available`}
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenNotifications={onOpenNotifications}
        onOpenMobileNav={onOpenMobileNav}
      />
      <div className="px-4 sm:px-6 pt-2">
        <DemoBadge />
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-600" />
            <Input
              placeholder="Search by name, skill, or role..."
              className="pl-10 h-10 bg-surface-100 border-surface-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-surface-100 border border-surface-300 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-md text-xs font-medium transition-colors',
                  viewMode === 'grid' ? 'bg-surface-300 text-surface-950 shadow-sm' : 'text-surface-600 hover:text-surface-800'
                )}
                title="Grid View"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-1.5 rounded-md text-xs font-medium transition-colors',
                  viewMode === 'table' ? 'bg-surface-300 text-surface-950 shadow-sm' : 'text-surface-600 hover:text-surface-800'
                )}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowUpload(true)} className="h-9 gap-1.5">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload Resume</span>
            </Button>
            <Button size="sm" onClick={() => setShowUpload(true)} className="h-9 gap-1.5">
              <Plus className="h-4 w-4" />
              <span>Add Candidate</span>
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setActiveFilter(tag.id)}
              className={cn(
                'px-3 py-1.5 rounded-full font-medium transition-all shrink-0 border',
                activeFilter === tag.id
                  ? 'bg-brand-500 text-white border-brand-400 shadow-sm'
                  : 'bg-surface-100 text-surface-600 border-surface-300 hover:border-surface-400 hover:text-surface-900'
              )}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Candidate List Container */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-52 rounded-xl bg-surface-100 animate-pulse border border-surface-300" />
              ))}
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/20 mx-auto mb-3">
                <Users className="h-7 w-7 text-brand-400" />
              </div>
              <h3 className="text-base font-semibold text-surface-950 mb-1">No matching candidates found</h3>
              <p className="text-xs text-surface-600 mb-4">Try adjusting your search terms or filter criteria.</p>
              <Button size="sm" variant="secondary" onClick={() => { setSearch(''); setActiveFilter('all'); }}>
                Reset Filters
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <motion.div
              key="grid"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {filteredCandidates.map((candidate) => {
                const isShortlisted = shortlistedIds.includes(candidate.id);
                return (
                  <motion.div key={candidate.id} variants={staggerItem}>
                    <div
                      className="glass-card rounded-xl p-5 h-full flex flex-col justify-between cursor-pointer hover:border-brand-500/30 group transition-all relative"
                      onClick={() => navigate(`/candidates/${candidate.id}`)}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-11 w-11 border border-surface-300 shrink-0">
                              <AvatarFallback className="text-xs font-semibold bg-surface-200 text-brand-300">
                                {getInitials(candidate.firstName, candidate.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-surface-950 truncate group-hover:text-brand-300 transition-colors">
                                {candidate.firstName} {candidate.lastName}
                              </h3>
                              <p className="text-xs text-surface-600 truncate">
                                {candidate.experiences?.[0]?.title || candidate.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => toggleShortlist(e, candidate.id)}
                              className={cn(
                                'p-1.5 rounded-lg border transition-colors',
                                isShortlisted
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'text-surface-600 hover:text-surface-950 border-surface-300'
                              )}
                              title={isShortlisted ? 'Shortlisted' : 'Bookmark Candidate'}
                            >
                              <Bookmark className={cn('h-3.5 w-3.5', isShortlisted && 'fill-amber-400')} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewCandidate(candidate);
                              }}
                              className="p-1.5 rounded-lg border border-surface-300 text-surface-600 hover:text-surface-950 hover:bg-surface-200 transition-colors"
                              title="Quick Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {candidate.location && (
                          <div className="flex items-center gap-1.5 text-2xs text-surface-600 mb-3">
                            <MapPin className="h-3 w-3 shrink-0 text-surface-500" />
                            <span className="truncate">{candidate.location}</span>
                          </div>
                        )}

                        {candidate.summary && (
                          <p className="text-xs text-surface-600 line-clamp-2 leading-relaxed mb-4">
                            {candidate.summary}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-surface-300/50">
                        {candidate.skills && candidate.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {candidate.skills.slice(0, 4).map((cs: any) => (
                              <span
                                key={cs.id || cs.skillId}
                                className={cn(
                                  'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium border',
                                  proficiencyColors[cs.proficiency] || proficiencyColors.BEGINNER
                                )}
                              >
                                {cs.skill?.name || cs.name}
                              </span>
                            ))}
                            {candidate.skills.length > 4 && (
                              <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-surface-200 text-surface-600">
                                +{candidate.skills.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* Table View */
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-xl overflow-hidden border border-surface-300"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-100 border-b border-surface-300 text-surface-600 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Current / Recent Role</th>
                      <th className="py-3 px-4">Top Skills</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-300/40 text-surface-800">
                    {filteredCandidates.map((candidate) => (
                      <tr
                        key={candidate.id}
                        onClick={() => navigate(`/candidates/${candidate.id}`)}
                        className="hover:bg-surface-100/60 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-xs bg-surface-200 text-brand-300">
                                {getInitials(candidate.firstName, candidate.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-semibold text-surface-950 truncate">
                                {candidate.firstName} {candidate.lastName}
                              </p>
                              <p className="text-[11px] text-surface-600 truncate">{candidate.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-surface-700">
                          {candidate.experiences?.[0]?.title || 'Software Specialist'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {(candidate.skills || []).slice(0, 3).map((cs: any) => (
                              <span
                                key={cs.id || cs.skillId}
                                className="px-1.5 py-0.5 rounded bg-surface-200 text-[10px] text-surface-700 border border-surface-300"
                              >
                                {cs.skill?.name || cs.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-surface-600">{candidate.location || 'Remote'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewCandidate(candidate);
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              Quick View
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/candidates/${candidate.id}`);
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              Profile
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide-out Candidate Quick Preview Drawer */}
      <Drawer open={!!previewCandidate} onClose={() => setPreviewCandidate(null)} side="right">
        {previewCandidate && (
          <>
            <DrawerHeader className="border-b border-surface-300 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-brand-500/30">
                    <AvatarFallback className="text-sm font-semibold text-brand-300 bg-surface-200">
                      {getInitials(previewCandidate.firstName, previewCandidate.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DrawerTitle className="text-base font-bold text-surface-950">
                      {previewCandidate.firstName} {previewCandidate.lastName}
                    </DrawerTitle>
                    <p className="text-xs text-surface-600">
                      {previewCandidate.experiences?.[0]?.title || previewCandidate.email}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setPreviewCandidate(null)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DrawerHeader>

            <DrawerContent className="p-4 sm:p-6 space-y-6 overflow-y-auto">
              {/* Summary */}
              {previewCandidate.summary && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-600">Executive Summary</h4>
                  <p className="text-xs text-surface-700 leading-relaxed p-3 rounded-lg bg-surface-100 border border-surface-300">
                    {previewCandidate.summary}
                  </p>
                </div>
              )}

              {/* Verified Skills */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-600">Verified Skills & Proficiency</h4>
                <div className="flex flex-wrap gap-2">
                  {(previewCandidate.skills || []).map((cs: any) => (
                    <div
                      key={cs.id || cs.skillId}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border',
                        proficiencyColors[cs.proficiency] || proficiencyColors.BEGINNER
                      )}
                    >
                      <span>{cs.skill?.name || cs.name}</span>
                      <span className="text-[10px] opacity-75">({cs.proficiency?.toLowerCase()})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience Highlights */}
              {previewCandidate.experiences && previewCandidate.experiences.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-600">Recent Experience</h4>
                  <div className="space-y-2.5">
                    {previewCandidate.experiences.map((exp: any) => (
                      <div key={exp.id} className="p-3 rounded-lg bg-surface-100 border border-surface-300">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-surface-950">{exp.title}</span>
                          <span className="text-surface-500 text-2xs">{exp.startDate?.split('-')[0]} - {exp.endDate ? exp.endDate.split('-')[0] : 'Present'}</span>
                        </div>
                        <p className="text-xs text-brand-300 font-medium mt-0.5">{exp.company}</p>
                        {exp.description && (
                          <p className="text-2xs text-surface-600 mt-1.5 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-surface-300 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => toggleShortlist(e, previewCandidate.id)}
                  className="flex-1 text-xs gap-1.5"
                >
                  <Bookmark className={cn('h-3.5 w-3.5', shortlistedIds.includes(previewCandidate.id) && 'fill-amber-400 text-amber-400')} />
                  {shortlistedIds.includes(previewCandidate.id) ? 'Shortlisted' : 'Shortlist'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const id = previewCandidate.id;
                    setPreviewCandidate(null);
                    navigate(`/candidates/${id}`);
                  }}
                  className="flex-1 text-xs gap-1.5"
                >
                  <span>Full Profile</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </DrawerContent>
          </>
        )}
      </Drawer>

      {/* Upload dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-brand-400" />
              Upload Resumes
            </DialogTitle>
          </DialogHeader>
          <ResumeUpload onUploadComplete={handleUploadComplete} />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
