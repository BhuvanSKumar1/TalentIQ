import { Search, Bell, Menu, Command } from 'lucide-react';
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
  return (
    <div className="sticky top-0 z-30">
      <header className="flex h-16 items-center justify-between border-b border-surface-300/50 bg-surface-0/80 backdrop-blur-xl px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-surface-600 hover:text-surface-950 h-9 w-9"
            onClick={onOpenMobileNav}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div>
            <motion.h1
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-semibold text-surface-950"
            >
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-surface-600"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
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
