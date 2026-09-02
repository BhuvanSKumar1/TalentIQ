import { Calendar, Briefcase, Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export interface DashboardFilters {
  dateRange: string;
  job: string;
  department: string;
}

interface FilterBarProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  jobs: string[];
  departments: string[];
}

const dateRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '6m', label: 'Last 6 months' },
  { value: '1y', label: 'Last year' },
];

export function FilterBar({ filters, onChange, jobs, departments }: FilterBarProps) {
  const hasFilters = filters.dateRange !== '6m' || filters.job !== 'all' || filters.department !== 'all';

  const clearFilters = () => {
    onChange({ dateRange: '6m', job: 'all', department: 'all' });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date Range */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-surface-600" />
        <Select value={filters.dateRange} onValueChange={(v) => onChange({ ...filters, dateRange: v })}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateRanges.map((dr) => (
              <SelectItem key={dr.value} value={dr.value}>{dr.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Job Filter */}
      <div className="flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-surface-600" />
        <Select value={filters.job} onValueChange={(v) => onChange({ ...filters, job: v })}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="All jobs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All jobs</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job} value={job}>{job}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Department Filter */}
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-surface-600" />
        <Select value={filters.department} onValueChange={(v) => onChange({ ...filters, department: v })}>
          <SelectTrigger className="w-[180px] h-9 text-sm">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-surface-600 hover:text-surface-950">
          <X className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
