import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedNumber } from './AnimatedNumber';
import { cn } from '@/lib/cn';
interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  color: 'brand' | 'success' | 'warning' | 'info' | 'danger';
  index?: number;
}

const colorMap: Record<string, { icon: string; bg: string }> = {
  brand: { icon: 'text-brand-400', bg: 'bg-brand-500/8 border-brand-500/15' },
  success: { icon: 'text-success-500', bg: 'bg-success-500/8 border-success-500/15' },
  warning: { icon: 'text-warning-500', bg: 'bg-warning-500/8 border-warning-500/15' },
  info: { icon: 'text-info-500', bg: 'bg-info-500/8 border-info-500/15' },
  danger: { icon: 'text-danger-500', bg: 'bg-danger-500/8 border-danger-500/15' },
};

const trendVariant: Record<string, 'success' | 'danger' | 'secondary'> = {
  up: 'success',
  down: 'danger',
  neutral: 'secondary',
};

export function KpiCard({ label, value, suffix, prefix, change, trend = 'neutral', icon: Icon, color, index = 0 }: KpiCardProps) {
  const colors = colorMap[color] || colorMap.brand;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className="group hover:border-surface-500 hover:shadow-card-hover transition-all duration-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', colors.bg)}>
              <Icon className={cn('h-5 w-5', colors.icon)} />
            </div>
            {change && (
              <Badge variant={trendVariant[trend]} className="text-2xs">
                {trend === 'up' && <ArrowUpRight className="mr-0.5 h-3 w-3" />}
                {trend === 'down' && <ArrowDownRight className="mr-0.5 h-3 w-3" />}
                {trend === 'neutral' && <Minus className="mr-0.5 h-3 w-3" />}
                {change}
              </Badge>
            )}
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-surface-950">
              <AnimatedNumber value={value} suffix={suffix} prefix={prefix} />
            </p>
            <p className="mt-1 text-sm text-surface-600">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
