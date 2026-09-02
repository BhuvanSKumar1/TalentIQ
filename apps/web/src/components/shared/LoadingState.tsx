import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('flex flex-col items-center justify-center py-16', className)}
    >
      <div className="relative mb-4">
        <div className="h-10 w-10 rounded-full border-4 border-surface-300 border-t-brand-500 animate-spin" />
      </div>
      <p className="text-sm text-surface-600">{message}</p>
    </motion.div>
  );
}
