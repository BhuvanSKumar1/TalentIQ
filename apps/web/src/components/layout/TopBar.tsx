import { Search, Bell, Menu, Command, Sparkles, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ProfileMenu } from './ProfileMenu';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Breadcrumbs } from './Breadcrumbs';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onOpenCommandPalette: () => void;
  onOpenNotifications: () => void;
  onOpenMobileNav: () => void;
}

export function TopBar({ title, subtitle, onOpenCommandPalette, onOpenNotifications, onOpenMobileNav }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-30">
      <header className="flex h-16 items-center justify-between border-b border-surface-300/50 bg-surface-0/80 backdrop-blur-xl px-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-surface-600 hover:text-surface-950 h-9 w-9 shrink-0"
            onClick={onOpenMobileNav}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <motion.h1
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg sm:text-xl font-semibold text-surface-950 truncate"
              >
                {title}
              </motion.h1>
              <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success-500/10 border border-success-500/20 text-success-500 text-[10px] font-medium shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-success-500 animate-pulse" />
                <span>AI Engine Ready</span>
              </div>
            </div>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xs sm:text-sm text-surface-600 truncate hidden xs:block"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Action Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/jobs/new')}
            className="hidden xl:flex items-center gap-1.5 text-xs font-medium border-brand-500/30 text-brand-300 hover:bg-brand-500/10 h-8 px-2.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Post Job</span>
          </Button>
          {/* Command palette trigger */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenCommandPalette}
                className="text-surface-600 hover:text-surface-950 hidden sm:flex gap-2 px-3"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">Search</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-surface-300 bg-surface-100 px-1.5 font-mono text-2xs font-medium text-surface-600 ml-2">
                  <Command className="h-3 w-3" />K
                </kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent>⌘K to search</TooltipContent>
          </Tooltip>

          {/* Mobile search */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden text-surface-600 hover:text-surface-950 h-9 w-9"
            onClick={onOpenCommandPalette}
          >
            <Search className="h-5 w-5" />
          </Button>

          <ThemeSwitcher />

          {/* Notifications */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-surface-600 hover:text-surface-950 h-9 w-9 relative"
                onClick={onOpenNotifications}
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-2xs font-bold text-white">
                  3
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          <ProfileMenu />
        </div>
      </header>
      <Breadcrumbs />
    </div>
  );
}
