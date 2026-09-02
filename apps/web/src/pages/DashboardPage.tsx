import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, Users, Eye, Star, Calendar, TrendingUp, Clock,
  ChevronRight, Sparkles, Brain, AlertTriangle, UserCheck,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TopBar } from '@/components/layout/TopBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/features/dashboard/KpiCard';
import { ChartTooltip } from '@/components/features/dashboard/ChartTooltip';
import { FilterBar, type DashboardFilters } from '@/components/features/dashboard/FilterBar';
import { DashboardSkeleton } from '@/components/features/dashboard/DashboardSkeleton';
import {
  kpiData, applicationTrends, candidateFunnel, topSkills, sourceData,
  jobPerformance, timeToHire, skillDemand, aiInsights, conversionRates,
  filterJobs, filterDepartments,
} from '@/components/features/dashboard/data';
import { cn } from '@/lib/cn';
import { DemoBadge } from '@/components/shared/DemoBadge';
import type { LayoutContext } from '@/types/layout';

// ── Icon resolver ──────────────────────────────────────
const iconMap: Record<string, React.ElementType> = {
  Briefcase, Users, Eye, Star, Calendar, TrendingUp, UserCheck,
};

// ── Insight icon + color map ───────────────────────────
const insightConfig: Record<string, { icon: React.ElementType; border: string; iconColor: string }> = {
  success: { icon: TrendingUp, border: 'border-success-500/20 bg-success-500/5', iconColor: 'text-success-500' },
  info: { icon: AlertTriangle, border: 'border-info-500/20 bg-info-500/5', iconColor: 'text-info-500' },
  warning: { icon: Clock, border: 'border-warning-500/20 bg-warning-500/5', iconColor: 'text-warning-500' },
  brand: { icon: Brain, border: 'border-brand-600/20 bg-brand-600/5', iconColor: 'text-brand-400' },
};

// ── Main Dashboard ─────────────────────────────────────
export default function DashboardPage() {
  const { onOpenCommandPalette, onOpenNotifications, onOpenMobileNav } = useOutletContext<LayoutContext>();
  const [filters, setFilters] = useState<DashboardFilters>({ dateRange: '6m', job: 'all', department: 'all' });

  // In a real app, filters would trigger API calls. For now, we show all data.
  const isLoading = false;
  const hasError = false;

  if (isLoading) {
    return (
      <div>
        <TopBar title="Dashboard" subtitle="Welcome back." onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} />
        <DashboardSkeleton />
      </div>
    );
  }

  if (hasError) {
    return (
      <div>
        <TopBar title="Dashboard" subtitle="Welcome back." onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} />
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-500/10 border border-danger-500/20 mb-4">
            <AlertTriangle className="h-7 w-7 text-danger-500" />
          </div>
          <h2 className="text-lg font-semibold text-surface-950 mb-1">Failed to load dashboard</h2>
          <p className="text-sm text-surface-600 mb-4">Something went wrong while fetching your data.</p>
          <Button variant="secondary" size="sm">Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Dashboard" subtitle="Welcome back. Here's your recruitment overview." onOpenCommandPalette={onOpenCommandPalette} onOpenNotifications={onOpenNotifications} onOpenMobileNav={onOpenMobileNav} />
      <div className="px-4 sm:px-6 pt-2">
        <DemoBadge />
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Filter Bar */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <FilterBar filters={filters} onChange={setFilters} jobs={filterJobs} departments={filterDepartments} />
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {kpiData.map((kpi, i) => {
            const Icon = iconMap[kpi.iconName] || Briefcase;
            return <KpiCard key={kpi.label} {...kpi} icon={Icon} index={i} />;
          })}
        </div>

        {/* Row 1: Trends + AI Insights */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Application Trends */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="xl:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">Application Trends</CardTitle>
                  <CardDescription>Applications, screenings, and shortlists over time</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={applicationTrends} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7185FF" stopOpacity={0.06} />
                        <stop offset="95%" stopColor="#7185FF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gScreened" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#35C99A" stopOpacity={0.06} />
                        <stop offset="95%" stopColor="#35C99A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.035)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="applications" name="Applications" stroke="#7185FF" fill="url(#gApps)" strokeWidth={2} />
                    <Area type="monotone" dataKey="screened" name="Screened" stroke="#35C99A" fill="url(#gScreened)" strokeWidth={2} />
                    <Area type="monotone" dataKey="shortlisted" name="Shortlisted" stroke="#A88CFF" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Insights */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }} className="xl:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600/10 border border-brand-600/20">
                    <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                  </div>
                  <CardTitle className="text-base">AI Insights</CardTitle>
                </div>
                <CardDescription>Intelligence from your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {aiInsights.map((insight, i) => {
                  const cfg = insightConfig[insight.color] || insightConfig.brand;
                  const InsightIcon = cfg.icon;
                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08 }}
                      className={cn('rounded-lg border p-3 transition-colors hover:shadow-sm cursor-pointer', cfg.border)}
                    >
                      <div className="flex items-start gap-2.5">
                        <InsightIcon className={cn('h-4 w-4 mt-0.5 shrink-0', cfg.iconColor)} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-surface-950 leading-snug">{insight.message}</p>
                          <p className="text-xs text-surface-600 mt-0.5">{insight.detail}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Row 2: Funnel + Top Skills + Sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Candidate Funnel */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Candidate Funnel</CardTitle>
                <CardDescription>Pipeline conversion overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {candidateFunnel.map((stage, i) => (
                    <motion.div
                      key={stage.stage}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.06 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-surface-800">{stage.stage}</span>
                        <span className="text-sm font-semibold text-surface-950 tabular-nums">{stage.count}</span>
                      </div>
                      <div className="relative h-7 rounded-md bg-surface-300 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(stage.count / candidateFunnel[0].count) * 100}%` }}
                          transition={{ duration: 0.7, delay: 0.5 + i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                          className="absolute inset-y-0 left-0 rounded-md"
                          style={{ backgroundColor: stage.color }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Skills */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.45 }}>
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Top Skills</CardTitle>
                  <CardDescription>Most in-demand across candidates</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  View all <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {topSkills.map((skill, i) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.04 }}
                    className="flex items-center gap-3"
                  >
                    <span className="text-sm text-surface-800 w-24 shrink-0">{skill.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-300 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.55 + i * 0.04 }}
                        className="h-full rounded-full bg-brand-600"
                      />
                    </div>
                    <span className="text-xs text-surface-600 w-8 text-right tabular-nums">{skill.count}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Candidate Sources */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Candidate Sources</CardTitle>
                <CardDescription>Where candidates are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={3} dataKey="value" stroke="none">
                      {sourceData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
                  {sourceData.map((source) => (
                    <div key={source.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                      <span className="text-xs text-surface-700 truncate">{source.name}</span>
                      <span className="text-xs font-medium text-surface-950 ml-auto tabular-nums">{source.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Row 3: Job Performance + Time to Hire + Skill Demand */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Job Performance */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.55 }} className="xl:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base">Job Performance</CardTitle>
                  <CardDescription>Applications and shortlists by position</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  View all <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={jobPerformance} barGap={6} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222538" />
                    <XAxis dataKey="name" stroke="#6b7194" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6b7194" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="applications" name="Applications" fill="#5c7cfa" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="shortlisted" name="Shortlisted" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Time to Hire */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.6 }}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Time to Hire</CardTitle>
                <CardDescription>Average days per stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={timeToHire} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222538" horizontal={false} />
                    <XAxis type="number" stroke="#6b7194" fontSize={11} tickLine={false} />
                    <YAxis type="category" dataKey="stage" stroke="#6b7194" fontSize={11} tickLine={false} width={80} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="days" name="Days" radius={[0, 4, 4, 0]}>
                      {timeToHire.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 flex items-center justify-between text-xs text-surface-600">
                  <span>Total avg:</span>
                  <span className="font-semibold text-surface-950 tabular-nums">
                    {timeToHire.reduce((s, t) => s + t.days, 0).toFixed(1)} days
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Row 4: Skill Demand + Conversion Rates */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Skill Demand vs Supply */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.65 }} className="xl:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Skill Demand vs Supply</CardTitle>
                <CardDescription>Market demand compared to candidate availability</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={skillDemand} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="#222538" />
                    <PolarAngleAxis dataKey="skill" stroke="#6b7194" fontSize={11} />
                    <PolarRadiusAxis stroke="#222538" fontSize={10} />
                    <Radar name="Demand" dataKey="demand" stroke="#5c7cfa" fill="#5c7cfa" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="Supply" dataKey="supply" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Conversion Rates */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.7 }}>
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Conversion Rates</CardTitle>
                <CardDescription>Pipeline efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {conversionRates.map((rate, i) => (
                  <motion.div
                    key={rate.label}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.75 + i * 0.08 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-surface-800">{rate.label}</span>
                      <span className="text-lg font-bold text-surface-950 tabular-nums">{rate.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-300 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${rate.value}%` }}
                        transition={{ duration: 0.8, delay: 0.8 + i * 0.1, ease: [0.4, 0, 0.2, 1] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: rate.color }}
                      />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
