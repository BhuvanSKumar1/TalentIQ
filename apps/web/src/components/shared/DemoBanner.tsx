import { Info, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Persistent banner indicating the application is running with demo data.
 * Clearly marks all data as fictional for demonstration purposes.
 */
export function DemoBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative z-[60] bg-brand-500/5 border-b border-brand-500/10"
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-brand-400 shrink-0" />
            <p className="text-xs text-surface-600">
              <span className="font-semibold text-brand-400">Demo Mode</span>
              {' '}— All data shown is fictional and for demonstration purposes only. No real candidate information is displayed.
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-surface-600 hover:text-surface-700 transition-colors ml-4 shrink-0"
            aria-label="Dismiss demo banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
