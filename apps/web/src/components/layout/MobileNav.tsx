import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, LayoutDashboard, Briefcase, Users, Search, Brain, Target, BookOpen,
  BarChart3, Shield, Calendar, FileText, Settings, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Candidates', href: '/candidates', icon: Users },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'AI Recruiter', href: '/ai', icon: Brain },
  { label: 'Matching', href: '/matching', icon: Target },
  { label: 'Skills', href: '/skills', icon: BookOpen },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Fairness', href: '/fairness', icon: Shield },
  { label: 'Interviews', href: '/interviews', icon: Calendar },
  { label: 'Audit', href: '/audit', icon: FileText },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function MobileNav({ open, onClose }: MobileNavProps) {
  const location = useLocation();
  const { user } = useAuth();

  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-surface-50 border-r border-surface-300 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-16 border-b border-surface-300 px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-gradient">TalentIQ</span>
              </div>
              <button onClick={onClose} className="p-1 rounded-md text-surface-600 hover:text-surface-950 hover:bg-surface-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-600/10 text-brand-400 border border-brand-600/20'
                        : 'text-surface-700 hover:bg-surface-200 hover:text-surface-950 border border-transparent'
                    )}
                  >
                    <item.icon className={cn('h-5 w-5', isActive ? 'text-brand-400' : 'text-surface-600')} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User */}
            <div className="border-t border-surface-300 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">
                    {user ? `${user.firstName[0]}${user.lastName[0]}` : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-surface-950">{user?.firstName} {user?.lastName}</p>
                  <p className="text-2xs text-surface-600">{user?.role}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
