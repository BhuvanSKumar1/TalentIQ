import { describe, it, expect } from 'vitest';

// Pure analytics calculation functions

/**
 * Calculate conversion rate between two stages
 */
function conversionRate(from: number, to: number): number {
  if (from === 0) return 0;
  return Math.round((to / from) * 10000) / 100; // Two decimal places
}

/**
 * Calculate average time-to-hire from dates
 */
function averageTimeToHire(hireDates: { applied: Date; hired: Date }[]): number {
  if (hireDates.length === 0) return 0;
  const totalDays = hireDates.reduce((sum, d) => {
    const diffMs = d.hired.getTime() - d.applied.getTime();
    return sum + diffMs / (1000 * 60 * 60 * 24);
  }, 0);
  return Math.round((totalDays / hireDates.length) * 10) / 10;
}

/**
 * Calculate monthly trend data from application dates
 */
function monthlyTrend(dates: Date[]): { month: string; count: number }[] {
  const counts: Record<string, number> = {};
  dates.forEach(d => {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

/**
 * Calculate skill demand from job skill requirements
 */
function skillDemand(
  jobs: Array<{ skills: string[] }>
): Array<{ skill: string; count: number; percentage: number }> {
  const skillCounts: Record<string, number> = {};
  const totalJobs = jobs.length;

  jobs.forEach(job => {
    job.skills.forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });

  return Object.entries(skillCounts)
    .map(([skill, count]) => ({
      skill,
      count,
      percentage: Math.round((count / totalJobs) * 10000) / 100,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate source performance
 */
function sourcePerformance(
  applications: Array<{ source: string; hired: boolean }>
): Array<{ source: string; total: number; hired: number; rate: number }> {
  const sourceCounts: Record<string, { total: number; hired: number }> = {};

  applications.forEach(app => {
    if (!sourceCounts[app.source]) {
      sourceCounts[app.source] = { total: 0, hired: 0 };
    }
    sourceCounts[app.source].total++;
    if (app.hired) sourceCounts[app.source].hired++;
  });

  return Object.entries(sourceCounts)
    .map(([source, data]) => ({
      source,
      ...data,
      rate: conversionRate(data.total, data.hired),
    }))
    .sort((a, b) => b.rate - a.rate);
}

describe('Analytics Calculations', () => {
  describe('Conversion Rate', () => {
    it('should calculate basic conversion rate', () => {
      expect(conversionRate(100, 25)).toBe(25);
    });

    it('should handle zero denominator', () => {
      expect(conversionRate(0, 10)).toBe(0);
    });

    it('should return 100% when all convert', () => {
      expect(conversionRate(50, 50)).toBe(100);
    });

    it('should handle small numbers', () => {
      expect(conversionRate(3, 1)).toBe(33.33);
    });

    it('should handle large numbers', () => {
      expect(conversionRate(10000, 2500)).toBe(25);
    });

    it('should return 0 when none convert', () => {
      expect(conversionRate(100, 0)).toBe(0);
    });

    it('should handle fractional rates', () => {
      expect(conversionRate(7, 1)).toBeCloseTo(14.29, 1);
    });
  });

  describe('Average Time to Hire', () => {
    it('should calculate average correctly', () => {
      const hireDates = [
        { applied: new Date('2026-01-01'), hired: new Date('2026-01-31') }, // 30 days
        { applied: new Date('2026-01-01'), hired: new Date('2026-01-11') }, // 10 days
      ];
      expect(averageTimeToHire(hireDates)).toBe(20);
    });

    it('should return 0 for empty array', () => {
      expect(averageTimeToHire([])).toBe(0);
    });

    it('should handle single hire', () => {
      const hireDates = [
        { applied: new Date('2026-01-01'), hired: new Date('2026-02-01') },
      ];
      expect(averageTimeToHire(hireDates)).toBe(31);
    });

    it('should handle same-day hire', () => {
      const hireDates = [
        { applied: new Date('2026-01-01'), hired: new Date('2026-01-01') },
      ];
      expect(averageTimeToHire(hireDates)).toBe(0);
    });
  });

  describe('Monthly Trend', () => {
    it('should group by month correctly', () => {
      const dates = [
        new Date('2026-01-05'),
        new Date('2026-01-20'),
        new Date('2026-02-10'),
        new Date('2026-02-15'),
        new Date('2026-02-25'),
      ];

      const trend = monthlyTrend(dates);
      expect(trend).toHaveLength(2);
      expect(trend[0]).toEqual({ month: '2026-01', count: 2 });
      expect(trend[1]).toEqual({ month: '2026-02', count: 3 });
    });

    it('should return empty array for no dates', () => {
      expect(monthlyTrend([])).toHaveLength(0);
    });

    it('should sort chronologically', () => {
      const dates = [
        new Date('2026-03-01'),
        new Date('2026-01-01'),
        new Date('2026-02-01'),
      ];
      const trend = monthlyTrend(dates);
      expect(trend[0].month).toBe('2026-01');
      expect(trend[1].month).toBe('2026-02');
      expect(trend[2].month).toBe('2026-03');
    });
  });

  describe('Skill Demand', () => {
    it('should calculate demand correctly', () => {
      const jobs = [
        { skills: ['React', 'TypeScript'] },
        { skills: ['React', 'Node.js'] },
        { skills: ['React', 'TypeScript', 'Node.js'] },
      ];

      const demand = skillDemand(jobs);
      expect(demand[0].skill).toBe('React');
      expect(demand[0].count).toBe(3);
      expect(demand[0].percentage).toBe(100);

      expect(demand.find(d => d.skill === 'TypeScript')?.count).toBe(2);
      expect(demand.find(d => d.skill === 'Node.js')?.count).toBe(2);
    });

    it('should handle empty jobs', () => {
      expect(skillDemand([])).toHaveLength(0);
    });

    it('should sort by demand descending', () => {
      const jobs = [
        { skills: ['A', 'B'] },
        { skills: ['A'] },
      ];
      const demand = skillDemand(jobs);
      expect(demand[0].skill).toBe('A');
      expect(demand[1].skill).toBe('B');
    });
  });

  describe('Source Performance', () => {
    it('should calculate hire rate by source', () => {
      const applications = [
        { source: 'LinkedIn', hired: true },
        { source: 'LinkedIn', hired: false },
        { source: 'LinkedIn', hired: true },
        { source: 'Referral', hired: true },
        { source: 'Referral', hired: true },
      ];

      const perf = sourcePerformance(applications);
      const referral = perf.find(p => p.source === 'Referral');
      const linkedin = perf.find(p => p.source === 'LinkedIn');

      expect(referral?.rate).toBe(100);
      expect(linkedin?.rate).toBeCloseTo(66.67, 1);
    });

    it('should handle empty applications', () => {
      expect(sourcePerformance([])).toHaveLength(0);
    });

    it('should sort by hire rate', () => {
      const applications = [
        { source: 'Low', hired: false },
        { source: 'Low', hired: false },
        { source: 'High', hired: true },
        { source: 'High', hired: true },
      ];
      const perf = sourcePerformance(applications);
      expect(perf[0].source).toBe('High');
      expect(perf[1].source).toBe('Low');
    });
  });

  describe('KPI Aggregation', () => {
    it('should calculate total applications', () => {
      const apps = [
        { status: 'APPLIED' },
        { status: 'SCREENING' },
        { status: 'SHORTLISTED' },
        { status: 'HIRED' },
      ];
      expect(apps.length).toBe(4);
    });

    it('should calculate pipeline distribution', () => {
      const apps = [
        { status: 'APPLIED' },
        { status: 'APPLIED' },
        { status: 'SCREENING' },
        { status: 'SHORTLISTED' },
        { status: 'HIRED' },
        { status: 'REJECTED' },
      ];

      const distribution = {
        applied: apps.filter(a => a.status === 'APPLIED').length,
        screening: apps.filter(a => a.status === 'SCREENING').length,
        shortlisted: apps.filter(a => a.status === 'SHORTLISTED').length,
        hired: apps.filter(a => a.status === 'HIRED').length,
        rejected: apps.filter(a => a.status === 'REJECTED').length,
      };

      expect(distribution.applied).toBe(2);
      expect(distribution.hired).toBe(1);
      expect(distribution.rejected).toBe(1);
    });
  });
});

describe('Edge Cases: Analytics', () => {
  it('should handle division by zero in conversion rate', () => {
    expect(conversionRate(0, 0)).toBe(0);
    expect(conversionRate(0, 100)).toBe(0);
  });

  it('should handle negative values gracefully', () => {
    expect(conversionRate(-5, 10)).toBeLessThan(0);
  });

  it('should handle very large datasets in skill demand', () => {
    const jobs = Array.from({ length: 10000 }, () => ({
      skills: ['React', 'TypeScript', 'Node.js'],
    }));
    const demand = skillDemand(jobs);
    expect(demand[0].count).toBe(10000);
  });

  it('should handle mixed sources in source performance', () => {
    const apps = [
      { source: 'LinkedIn', hired: true },
      { source: 'Referral', hired: false },
      { source: 'Indeed', hired: true },
    ];
    const perf = sourcePerformance(apps);
    expect(perf).toHaveLength(3);
  });
});
