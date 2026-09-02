import { useState, useEffect, useCallback } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';
import { NotificationsPanel } from './NotificationsPanel';
import { MobileNav } from './MobileNav';
import { DemoBanner } from '@/components/shared/DemoBanner';
import { useAuth } from '@/lib/auth';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Global ⌘K handler
  const handleGlobalKey = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [handleGlobalKey]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-0">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-300 border-t-brand-500" />
          <p className="text-sm text-surface-600">Loading TalentIQ...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-surface-0">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile nav */}
        <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

        {/* Command palette */}
        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

        {/* Notifications */}
        <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="lg:pl-[260px] min-h-screen transition-all duration-300"
        >
          <DemoBanner />
          <Outlet
            context={{
              onOpenCommandPalette: () => setCmdOpen(true),
              onOpenNotifications: () => setNotifOpen(true),
              onOpenMobileNav: () => setMobileNavOpen(true),
            }}
          />
        </motion.main>
      </div>
    </TooltipProvider>
  );
}
