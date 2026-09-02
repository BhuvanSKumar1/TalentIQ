import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { TopBar } from '@/components/layout/TopBar';
import type { LayoutContext } from '@/types/layout';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const { onOpenCommandPalette, onOpenNotifications, onOpenMobileNav } = useOutletContext<LayoutContext>();

  return (
    <div>
      <TopBar
        title={title}
        onOpenCommandPalette={onOpenCommandPalette}
        onOpenNotifications={onOpenNotifications}
        onOpenMobileNav={onOpenMobileNav}
      />
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-500/10 border border-warning-500/20 mx-auto mb-6">
            <Construction className="h-8 w-8 text-warning-500" />
          </div>
          <h1 className="text-2xl font-bold text-surface-950 mb-2">{title}</h1>
          <p className="text-surface-600 mb-8">
            {description || 'This module is under active development. It will be available in a future release.'}
          </p>
          <Button asChild variant="secondary">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
