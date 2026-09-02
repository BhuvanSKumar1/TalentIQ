import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, DollarSign, Users, Edit, Copy,
  Archive, Trash2, Eye, EyeOff, ChevronLeft, Loader2,
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import type { LayoutContext } from '@/types/layout';

const statusColors: Record<string, string> = {
  PUBLISHED: 'bg-success-500/10 text-success-500 border-success-500/20',
  DRAFT: 'bg-surface-300 text-surface-700 border-surface-400',
  CLOSED: 'bg-danger-500/10 text-danger-500 border-danger-500/20',
  ARCHIVED: 'bg-surface-200 text-surface-600 border-surface-300',
};

const empTypeLabels: Record<string, string> = {
  FULL_TIME: 'Full-time', PART_TIME: 'Part-time', CONTRACT: 'Contract',
  INTERNSHIP: 'Internship', FREELANCE: 'Freelance',
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { onOpenCommandPalette, onOpenNotifications, onOpenMobileNav } = useOutletContext<LayoutContext>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);

  const fetchJob = () => {
    if (!id) return;
    setLoading(true);
    api.get(`/jobs/${id}`)
      .then(({ data }) => setJob(data))
      .catch(() => setError('Failed to load job'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJob(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (action: string, url: string, method = 'post') => {
    setActionLoading(action);
    try {
      await (method === 'put' ? api.put(url) : api.post(url));
      toast.success(`${action} successful`);
      if (action === 'Delete') { navigate('/jobs'); return; }
      fetchJob();
    } catch { toast.error(`Failed to ${action.toLowerCase()}`); }
    finally { setActionLoading(''); }
  };

  const requiredSkills = job?.skills?.filter((s: any) => s.required) || [];
  const preferredSkills = job?.skills?.filter((s: any) => !s.required) || [];

  if (loading) return <div><TopBar title="Job Details" onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} /><LoadingState /></div>;
  if (error || !job) return <div><TopBar title="Job Details" onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} /><ErrorState message={error || 'Job not found'} /></div>;

  return (
    <div>
      <TopBar title={job.title} subtitle={job.department} onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Back + Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to jobs
          </Button>
          <div className="flex items-center gap-2">
            {job.status === 'PUBLISHED' ? (
              <Button variant="ghost" size="sm" onClick={() => handleAction('Unpublish', `/jobs/${job.id}/publish`)} disabled={!!actionLoading}>
                {actionLoading === 'Unpublish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4 mr-1.5" />}
                Unpublish
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => handleAction('Publish', `/jobs/${job.id}/publish`)} disabled={!!actionLoading}>
                {actionLoading === 'Publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4 mr-1.5" />}
                Publish
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate(`/jobs/${job.id}/edit`)}>
              <Edit className="h-4 w-4 mr-1.5" /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleAction('Duplicate', `/jobs/${job.id}/duplicate`)} disabled={!!actionLoading}>
              {actionLoading === 'Duplicate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4 mr-1.5" />}
              Duplicate
            </Button>
            {job.status !== 'ARCHIVED' && (
              <Button variant="ghost" size="sm" onClick={() => handleAction('Archive', `/jobs/${job.id}/archive`)} disabled={!!actionLoading}>
                <Archive className="h-4 w-4 mr-1.5" /> Archive
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-danger-500 hover:text-danger-600" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-surface-950 mb-2">{job.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-surface-600">
                      {job.department && <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{job.department}</span>}
                      {job.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.location}</span>}
                      {job.experienceLevel && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{job.experienceLevel}</span>}
                      {job.salaryMin && <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" />${(job.salaryMin/1000).toFixed(0)}k - ${(job.salaryMax/1000).toFixed(0)}k</span>}
                    </div>
                  </div>
                  <Badge className={statusColors[job.status] || statusColors.DRAFT}>{job.status}</Badge>
                </div>
                {job.description && (
                  <div className="prose prose-sm max-w-none text-surface-700">
                    <p className="whitespace-pre-wrap">{job.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            {(requiredSkills.length > 0 || preferredSkills.length > 0) && (
              <Card>
                <CardContent className="p-6">
                  {requiredSkills.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-surface-950 mb-2">Required Skills</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {requiredSkills.map((s: any) => (
                          <Badge key={s.id} variant="default">{s.skill.name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {preferredSkills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-surface-950 mb-2">Preferred Skills</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {preferredSkills.map((s: any) => (
                          <Badge key={s.id} variant="success">{s.skill.name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Job Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-600">Applications</span>
                  <span className="text-lg font-bold text-surface-950">{job._count?.applications || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-600">Type</span>
                  <span className="text-sm font-medium text-surface-950">{empTypeLabels[job.employmentType] || job.employmentType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-600">Created</span>
                  <span className="text-sm text-surface-950">{new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-surface-600">Updated</span>
                  <span className="text-sm text-surface-950">{new Date(job.updatedAt).toLocaleDateString()}</span>
                </div>
                {job.createdBy && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-600">Created by</span>
                    <span className="text-sm text-surface-950">{job.createdBy.firstName} {job.createdBy.lastName}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <Button className="w-full" size="lg">
                  View Applications ({job._count?.applications || 0})
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-surface-600">Are you sure you want to delete &quot;{job.title}&quot;? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setDeleteDialog(false); handleAction('Delete', `/jobs/${job.id}`, 'delete'); }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
