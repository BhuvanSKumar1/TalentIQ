import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TopBar } from '@/components/layout/TopBar';
import { JobWizard } from '@/components/features/jobs/JobWizard';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import api from '@/lib/api';
import type { LayoutContext } from '@/types/layout';
import { useOutletContext } from 'react-router-dom';

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const { onOpenCommandPalette, onOpenNotifications, onOpenMobileNav } = useOutletContext<LayoutContext>();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/jobs/${id}`)
      .then(({ data }) => setJob(data))
      .catch(() => setError('Failed to load job'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div><TopBar title="Edit Job" onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} /><LoadingState /></div>;
  if (error || !job) return <div><TopBar title="Edit Job" onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} /><ErrorState message={error || 'Job not found'} /></div>;

  return (
    <div>
      <TopBar title={`Edit: ${job.title}`} subtitle="Update job details." onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} />
      <div className="p-4 sm:p-6">
        <JobWizard
          jobId={job.id}
          isEditing
          initialData={{
            title: job.title,
            description: job.description || '',
            department: job.department || '',
            location: job.location || '',
            employmentType: job.employmentType,
            experienceLevel: job.experienceLevel,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            requiredSkills: job.skills?.filter((s: any) => s.required).map((s: any) => s.skill.name) || [],
            preferredSkills: job.skills?.filter((s: any) => !s.required).map((s: any) => s.skill.name) || [],
            status: job.status,
          }}
        />
      </div>
    </div>
  );
}
