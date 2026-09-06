import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';
import { float, buttonHover, buttonTap } from '@/lib/animations';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  variant?: 'default' | 'gradient';
}

export function EmptyState({ icon: Icon, title, description, action, className, variant = 'default' }: EmptyStateProps) {
  const iconBg = variant === 'gradient'
    ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20'
    : 'bg-surface-200 border-surface-300';

  const iconColor = variant === 'gradient' ? 'text-purple-400' : 'text-surface-600';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn('flex flex-col items-center justify-center py-16 text-center', className)}
    >
      {Icon && (
        <motion.div
          animate={float}
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border"
        >
          <div className={cn('h-full w-full rounded-2xl flex items-center justify-center', iconBg)}>
            <Icon className={cn('h-7 w-7', iconColor)} />
          </div>
        </motion.div>
      )}
      <h3 className="text-lg font-semibold text-surface-950 mb-1">{title}</h3>
      <p className="text-sm text-surface-600 max-w-sm mb-6">{description}</p>
      {action && (
        <motion.div whileHover={buttonHover} whileTap={buttonTap}>
          <Button onClick={action.onClick} size="sm">
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
