import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Search, LayoutDashboard, Briefcase, Users, Brain, BarChart3, Settings, Shield, FileText } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const commands = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Navigation' },
  { label: 'Jobs', href: '/jobs', icon: Briefcase, group: 'Navigation' },
  { label: 'Candidates', href: '/candidates', icon: Users, group: 'Navigation' },
  { label: 'Semantic Search', href: '/search', icon: Search, group: 'Intelligence' },
  { label: 'AI Recruiter', href: '/ai', icon: Brain, group: 'Intelligence' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, group: 'Analytics' },
  { label: 'Fairness Audit', href: '/fairness', icon: Shield, group: 'Analytics' },
  { label: 'Audit Logs', href: '/audit', icon: FileText, group: 'System' },
  { label: 'Settings', href: '/settings', icon: Settings, group: 'System' },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else onClose(); // parent toggles
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const runCommand = (href: string) => {
    navigate(href);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="p-0 max-w-md overflow-hidden">
        <Command className="rounded-lg border border-surface-400 bg-surface-100">
          <div className="flex items-center border-b border-surface-300 px-3">
            <Search className="h-4 w-4 text-surface-600 shrink-0" />
            <Command.Input
              placeholder="Search or jump to..."
              className="flex h-11 w-full rounded-md bg-transparent py-3 px-2 text-sm text-surface-950 placeholder:text-surface-600 focus:outline-none"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-surface-600">
              No results found.
            </Command.Empty>
            {['Navigation', 'Intelligence', 'Analytics', 'System'].map((group) => (
              <Command.Group key={group} heading={group} className="text-xs font-semibold text-surface-600 mb-1">
                {commands
                  .filter((c) => c.group === group)
                  .map((cmd) => (
                    <Command.Item
                      key={cmd.href}
                      value={cmd.label}
                      onSelect={() => runCommand(cmd.href)}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-pointer select-none data-[selected=true]:bg-surface-200 data-[selected=true]:text-surface-950"
                    >
                      <cmd.icon className="h-4 w-4 text-surface-600" />
                      {cmd.label}
                    </Command.Item>
                  ))}
              </Command.Group>
            ))}
          </Command.List>
          <div className="border-t border-surface-300 px-3 py-2 flex items-center justify-between">
            <span className="text-2xs text-surface-600">Navigate</span>
            <div className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-surface-400 bg-surface-200 px-1.5 font-mono text-2xs font-medium text-surface-600">
                ↵
              </kbd>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
