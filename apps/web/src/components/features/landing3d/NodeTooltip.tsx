import { motion, AnimatePresence } from 'framer-motion';
import { Users, Briefcase, Lightbulb } from 'lucide-react';
import type { TooltipData, NodeType } from './types';

interface NodeTooltipProps {
  data: TooltipData;
}

const ICONS: Record<NodeType, typeof Users> = {
  candidate: Users,
  job: Briefcase,
  skill: Lightbulb,
};

const TYPE_LABELS: Record<NodeType, string> = {
  candidate: 'Candidate',
  job: 'Open Position',
  skill: 'Skill',
};

/**
 * HTML overlay tooltip showing node info when hovering.
 * Follows cursor position, animated with Framer Motion.
 */
export function NodeTooltip({ data }: NodeTooltipProps) {
  return (
    <AnimatePresence>
      {data.visible && data.node && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="pointer-events-none fixed z-[9999]"
          style={{
            left: data.x + 16,
            top: data.y - 12,
            maxWidth: 220,
          }}
        >
          <div className="rounded-lg border border-[#2c3046] bg-[#0f1117]/95 backdrop-blur-md px-4 py-3 shadow-xl">
            {/* Type badge */}
            <div className="flex items-center gap-1.5 mb-1.5">
              {(() => {
                const Icon = ICONS[data.node.type];
                return <Icon className="h-3 w-3" style={{ color: data.node.color }} />;
              })()}
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: data.node.color }}
              >
                {TYPE_LABELS[data.node.type]}
              </span>
            </div>

            {/* Label */}
            <p className="text-sm font-semibold text-[#e2e4ed] leading-tight mb-0.5">
              {data.node.label}
            </p>

            {/* Subtitle */}
            <p className="text-xs text-[#b4b8cc] mb-1">
              {data.node.subtitle}
            </p>

            {/* Detail */}
            {data.node.detail && (
              <p className="text-[11px] text-[#6b7194] font-mono">
                {data.node.detail}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
