import { useOutletContext } from 'react-router-dom';
import { TopBar } from '@/components/layout/TopBar';
import { JobWizard } from '@/components/features/jobs/JobWizard';
import type { LayoutContext } from '@/types/layout';

export default function CreateJobPage() {
  const { onOpenCommandPalette, onOpenNotifications, onOpenMobileNav } = useOutletContext<LayoutContext>();

  return (
    <div>
      <TopBar title="Create Job" subtitle="Post a new job opening for your team." onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} />
      <div className="p-4 sm:p-6">
        <JobWizard />
      </div>
    </div>
  );
}
