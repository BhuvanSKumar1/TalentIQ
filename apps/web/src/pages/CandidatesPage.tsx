import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, MapPin, Upload, X } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { ResumeUpload } from '@/components/features/candidates/ResumeUpload';
import { cn } from '@/lib/cn';
import { DemoBadge } from '@/components/shared/DemoBadge';
import type { LayoutContext } from '@/types/layout';

const API_BASE = '/api/v1';

const proficiencyColors: Record<string, string> = {
  EXPERT: 'bg-brand-600/10 text-brand-400 border-brand-600/20',
  ADVANCED: 'bg-success-500/10 text-success-500 border-success-500/20',
  INTERMEDIATE: 'bg-warning-500/10 text-warning-500 border-warning-500/20',
  BEGINNER: 'bg-surface-300 text-surface-700 border-surface-400',
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`;
}

interface CandidateData {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  location: string | null;
  summary: string | null;
  skills: Array<{
    id: string;
    proficiency: string;
    confidence: number;
    skill: { id: string; name: string };
  }>;
  _count: { applications: number };
}

export function CandidatesPage() {
  const { onOpenCommandPalette, onOpenNotifications, onOpenMobileNav } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const fetchCandidates = async (query?: string) => {
    try {
      const params = new URLSearchParams();
      if (query) params.set('search', query);
      params.set('limit', '50');

      const response = await fetch(`${API_BASE}/candidates?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCandidates(data.data || []);
      }
    } catch {
      // Keep existing candidates on error
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

  return (
    <div>
      <TopBar
        title="Candidates"
        subtitle={`${candidates.length} candidates total`}
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenNotifications={onOpenNotifications}
        onOpenMobileNav={onOpenMobileNav}
      />
      <div className="px-6 pt-2">
        <DemoBadge />
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-600" />
            <Input
              placeholder="Search candidates..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Resume
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Candidate
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 rounded-xl bg-surface-100 animate-pulse" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-200 mx-auto mb-4">
              <Upload className="h-8 w-8 text-surface-500" />
            </div>
            <h3 className="text-lg font-semibold text-surface-950 mb-1">No candidates yet</h3>
            <p className="text-sm text-surface-600 mb-4">Upload resumes to start building your candidate pipeline</p>
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Resume
            </Button>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {candidates.map((candidate) => (
              <motion.div key={candidate.id} variants={staggerItem}>
                <Card
                  className="card-hover cursor-pointer h-full"
                  onClick={() => navigate(`/candidates/${candidate.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback className="text-sm">
                          {getInitials(candidate.firstName, candidate.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-surface-950 truncate">
                          {candidate.firstName} {candidate.lastName}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-surface-600 mt-0.5">
                          {candidate.email && <span>{candidate.email}</span>}
                          {candidate.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {candidate.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {candidate._count?.applications > 0 && (
                        <Badge variant="outline" className="text-2xs shrink-0">
                          {candidate._count.applications} apps
                        </Badge>
                      )}
                    </div>

                    {candidate.summary && (
                      <p className="text-sm text-surface-600 line-clamp-2 mb-4">{candidate.summary}</p>
                    )}

                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.skills.slice(0, 5).map((cs) => (
                          <span
                            key={cs.id}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium border ${proficiencyColors[cs.proficiency] || proficiencyColors.BEGINNER}`}
                          >
                            {cs.skill.name}
                          </span>
                        ))}
                        {candidate.skills.length > 5 && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium bg-surface-200 text-surface-600">
                            +{candidate.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

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
    </div>
  );
}
