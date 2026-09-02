import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, Users, Search, Brain, BarChart3, Shield,
  Settings, ChevronLeft, ChevronRight, Sparkles, Target, BookOpen,
  Calendar, FileText, Bell, Activity,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  isNew?: boolean;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Jobs', href: '/jobs', icon: Briefcase },
      { label: 'Candidates', href: '/candidates', icon: Users },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { label: 'Semantic Search', href: '/search', icon: Search, isNew: true },
      { label: 'AI Recruiter', href: '/ai', icon: Brain, isNew: true },
      { label: 'Matching', href: '/matching', icon: Target },
      { label: 'Skill Analysis', href: '/skills', icon: BookOpen },
      { label: 'Skill Gap', href: '/skill-gap', icon: Target, isNew: true },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Fairness Audit', href: '/fairness', icon: Shield, isNew: true },
      { label: 'Interviews', href: '/interviews', icon: Calendar },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Audit Logs', href: '/audit', icon: FileText },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'System Health', href: '/observability', icon: Activity, isNew: true },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName[0]}${user.lastName[0]}`;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-0 top-0 z-40 h-screen border-r border-surface-300 bg-surface-0 flex flex-col hidden lg:flex"
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-surface-300/50 px-4">
          <Link to="/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-brand">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-lg font-bold text-gradient whitespace-nowrap overflow-hidden"
                >
                  TalentIQ
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <AnimatePresence>
                {!collapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-2 px-3 text-2xs font-semibold uppercase tracking-wider text-surface-600"
                  >
                    {section.title}
                  </motion.p>
                )}
              </AnimatePresence>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.href);
                  const linkContent = (
                    <Link
                      to={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-brand-500/10 text-brand-300 border border-brand-500/15'
                          : 'text-surface-700 hover:bg-surface-100 hover:text-surface-950 border border-transparent',
                        collapsed && 'justify-center px-0'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5 shrink-0 transition-colors',
                          isActive ? 'text-brand-300' : 'text-surface-600 group-hover:text-surface-800'
                        )}
                      />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 overflow-hidden whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && (
                        <div className="flex items-center gap-1">
                          {item.isNew && (
                            <span className="inline-flex items-center rounded-full bg-brand-500/10 px-1.5 py-0.5 text-2xs font-medium text-brand-300 border border-brand-500/15">
                              NEW
                            </span>
                          )}
                          {item.badge && item.badge > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1 text-2xs font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );

                  return collapsed ? (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <div key={item.href}>{linkContent}</div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-surface-300/50 p-3">
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg p-2 hover:bg-surface-200 transition-colors cursor-pointer',
              collapsed && 'justify-center'
            )}
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {!collapsed && user && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 min-w-0 overflow-hidden"
                >
                  <p className="text-sm font-medium text-surface-950 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-2xs text-surface-600 truncate">{user.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-surface-300 bg-surface-50 text-surface-600 hover:bg-surface-100 hover:text-surface-950 transition-all duration-150 shadow-sm z-50"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </motion.aside>
    </TooltipProvider>
  );
}
