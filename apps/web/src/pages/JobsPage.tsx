import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Search, MapPin, Clock, DollarSign, Users, ChevronRight,
  ArrowUpDown, Loader2, MoreHorizontal, Eye, Edit, Copy, Archive, Trash2, EyeOff, Briefcase,
} from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import { DemoBadge } from '@/components/shared/DemoBadge';
import type { LayoutContext } from '@/types/layout';

const statusColors: Record<string, string> = {
  PUBLISHED: 'bg-success-500/10 text-success-500 border-success-500/20',
  DRAFT: 'bg-surface-300 text-surface-700 border-surface-400',
  CLOSED: 'bg-danger-500/10 text-danger-500 border-danger-500/20',
  ARCHIVED: 'bg-surface-200 text-surface-600 border-surface-300',
};

function formatSalary(min?: number, max?: number) {
  if (!min && !max) return null;
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default function JobsPage() {
  const navigate = useNavigate();
  const { onOpenCommandPalette, onOpenNotifications, onOpenMobileNav } = useOutletContext<LayoutContext>();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; title: string } | null>(null);

  const fetchJobs = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
      sort: sortBy,
      order: sortOrder,
    });
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    api.get(`/jobs?${params}`)
      .then(({ data }) => {
        setJobs(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      })
      .catch(() => setError('Failed to load jobs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, [page, statusFilter, sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchJobs(); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleAction = async (action: string, url: string, method = 'post') => {
    setActionLoading(action + url);
    try {
      await (method === 'delete' ? api.delete(url) : method === 'put' ? api.put(url) : api.post(url));
      toast.success(`${action} successful`);
      fetchJobs();
    } catch { toast.error(`Failed to ${action.toLowerCase()}`); }
    finally { setActionLoading(''); }
  };

  return (
    <div>
      <TopBar title="Jobs" subtitle={`${total} job${total !== 1 ? 's' : ''} total`} onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} />
      <div className="px-4 sm:px-6 pt-2">
        <DemoBadge />
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-600" />
              <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
              <ArrowUpDown className="h-4 w-4 mr-1" /> {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
            </Button>
          </div>
          <Button onClick={() => navigate('/jobs/new')}>
            <Plus className="h-4 w-4 mr-2" /> Create Job
          </Button>
        </div>

        {/* Loading */}
        {loading && <LoadingState message="Loading jobs..." />}

        {/* Error */}
        {error && !loading && <ErrorState message={error} onRetry={() => { setError(''); fetchJobs(); }} />}

        {/* Empty */}
        {!loading && !error && jobs.length === 0 && (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first job to start hiring.'}
            action={!search && statusFilter === 'all' ? { label: 'Create Job', onClick: () => navigate('/jobs/new') } : undefined}
          />
        )}

        {/* Job list */}
        {!loading && !error && jobs.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="group hover:border-surface-500 transition-colors cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="text-base font-semibold text-surface-950 truncate group-hover:text-brand-400 transition-colors">{job.title}</h3>
                            <Badge className={cn('text-2xs shrink-0', statusColors[job.status])}>{job.status}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-surface-600">
                            {job.department && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.department}</span>}
                            {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                            {job.experienceLevel && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.experienceLevel}</span>}
                            {job.salaryMin && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatSalary(job.salaryMin, job.salaryMax)}</span>}
                          </div>
                          {job.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {job.skills.slice(0, 5).map((s: any) => (
                                <span key={s.id} className="inline-flex items-center rounded-full bg-surface-200 px-2 py-0.5 text-2xs text-surface-700">{s.skill.name}</span>
                              ))}
                              {job.skills.length > 5 && <span className="text-2xs text-surface-500">+{job.skills.length - 5}</span>}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-xl font-bold text-surface-950">{job._count?.applications || 0}</p>
                            <p className="text-2xs text-surface-600">applications</p>
                          </div>

                          {/* Actions menu */}
                          <div className="relative" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMenuOpen(menuOpen === job.id ? null : job.id)}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            {menuOpen === job.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-surface-400 bg-surface-100 shadow-elevated z-10 py-1">
                                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-800 hover:bg-surface-200" onClick={() => { setMenuOpen(null); navigate(`/jobs/${job.id}`); }}>
                                  <Eye className="h-4 w-4" /> View
                                </button>
                                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-800 hover:bg-surface-200" onClick={() => { setMenuOpen(null); navigate(`/jobs/${job.id}/edit`); }}>
                                  <Edit className="h-4 w-4" /> Edit
                                </button>
                                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-800 hover:bg-surface-200" onClick={() => { setMenuOpen(null); handleAction('Duplicate', `/jobs/${job.id}/duplicate`); }}>
                                  <Copy className="h-4 w-4" /> Duplicate
                                </button>
                                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-800 hover:bg-surface-200" onClick={() => { setMenuOpen(null); handleAction(job.status === 'PUBLISHED' ? 'Unpublish' : 'Publish', `/jobs/${job.id}/publish`); }}>
                                  {job.status === 'PUBLISHED' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  {job.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                                </button>
                                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-surface-800 hover:bg-surface-200" onClick={() => { setMenuOpen(null); handleAction('Archive', `/jobs/${job.id}/archive`); }}>
                                  <Archive className="h-4 w-4" /> Archive
                                </button>
                                <div className="my-1 border-t border-surface-300" />
                                <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger-500 hover:bg-danger-500/5" onClick={() => { setMenuOpen(null); setDeleteDialog({ id: job.id, title: job.title }); }}>
                                  <Trash2 className="h-4 w-4" /> Delete
                                </button>
                              </div>
                            )}
                          </div>

                          <ChevronRight className="h-5 w-5 text-surface-400 hidden sm:block" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-surface-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Job</DialogTitle></DialogHeader>
          <p className="text-sm text-surface-600">Are you sure you want to delete &quot;{deleteDialog?.title}&quot;? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (deleteDialog) { handleAction('Delete', `/jobs/${deleteDialog.id}`, 'delete'); setDeleteDialog(null); } }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

