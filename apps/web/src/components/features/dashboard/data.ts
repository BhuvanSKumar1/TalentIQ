// ── KPI Data ───────────────────────────────────────────
export const kpiData = [
  { label: 'Active Jobs', value: 6, change: '+2', trend: 'up' as const, iconName: 'Briefcase', color: 'brand' as const },
  { label: 'Total Candidates', value: 147, change: '+18%', trend: 'up' as const, iconName: 'Users', color: 'brand' as const },
  { label: 'Screened', value: 89, change: '+12%', trend: 'up' as const, iconName: 'Eye', color: 'success' as const },
  { label: 'Shortlisted', value: 34, change: '+8%', trend: 'up' as const, iconName: 'Star', color: 'warning' as const },
  { label: 'Interviews', value: 12, change: '+3', trend: 'up' as const, iconName: 'Calendar', color: 'info' as const },
  { label: 'Hires', value: 4, change: '+1', trend: 'up' as const, iconName: 'UserCheck', color: 'success' as const },
];

// ── Application Trends ─────────────────────────────────
export const applicationTrends = [
  { month: 'Jul', applications: 45, screened: 30, shortlisted: 12, interviewed: 5, hired: 1 },
  { month: 'Aug', applications: 62, screened: 48, shortlisted: 18, interviewed: 8, hired: 2 },
  { month: 'Sep', applications: 78, screened: 56, shortlisted: 22, interviewed: 10, hired: 3 },
  { month: 'Oct', applications: 95, screened: 72, shortlisted: 30, interviewed: 14, hired: 4 },
  { month: 'Nov', applications: 110, screened: 84, shortlisted: 35, interviewed: 16, hired: 5 },
  { month: 'Dec', applications: 127, screened: 96, shortlisted: 42, interviewed: 18, hired: 6 },
];

// ── Candidate Funnel ───────────────────────────────────
export const candidateFunnel = [
  { stage: 'Applied', count: 147, color: '#5c7cfa' },
  { stage: 'Screened', count: 89, color: '#748ffc' },
  { stage: 'Shortlisted', count: 34, color: '#91a7ff' },
  { stage: 'Interviewed', count: 12, color: '#bac8ff' },
  { stage: 'Offered', count: 6, color: '#dbe4ff' },
  { stage: 'Hired', count: 4, color: '#10b981' },
];

// ── Top Skills ─────────────────────────────────────────
export const topSkills = [
  { name: 'React', count: 42, percentage: 85 },
  { name: 'TypeScript', count: 38, percentage: 77 },
  { name: 'Python', count: 35, percentage: 71 },
  { name: 'Node.js', count: 31, percentage: 63 },
  { name: 'AWS', count: 28, percentage: 57 },
  { name: 'Docker', count: 25, percentage: 51 },
  { name: 'PostgreSQL', count: 23, percentage: 47 },
  { name: 'Kubernetes', count: 18, percentage: 37 },
];

// ── Candidate Sources ──────────────────────────────────
export const sourceData = [
  { name: 'LinkedIn', value: 45, color: '#5c7cfa' },
  { name: 'Direct', value: 28, color: '#10b981' },
  { name: 'Referral', value: 18, color: '#f59e0b' },
  { name: 'Job Board', value: 35, color: '#ef4444' },
  { name: 'Campus', value: 21, color: '#8b5cf6' },
];

// ── Job Performance ────────────────────────────────────
export const jobPerformance = [
  { name: 'Sr. Full-Stack', applications: 42, shortlisted: 12, hired: 2, timeToHire: 18 },
  { name: 'ML Engineer', applications: 28, shortlisted: 8, hired: 1, timeToHire: 24 },
  { name: 'DevOps', applications: 22, shortlisted: 6, hired: 1, timeToHire: 15 },
  { name: 'Jr. React', applications: 35, shortlisted: 4, hired: 0, timeToHire: 0 },
  { name: 'Backend Go', applications: 20, shortlisted: 4, hired: 0, timeToHire: 0 },
];

// ── Time to Hire ───────────────────────────────────────
export const timeToHire = [
  { stage: 'Screening', days: 2.3, color: '#5c7cfa' },
  { stage: 'Shortlist', days: 1.5, color: '#748ffc' },
  { stage: 'Interview', days: 5.2, color: '#91a7ff' },
  { stage: 'Offer', days: 3.1, color: '#bac8ff' },
  { stage: 'Decision', days: 1.8, color: '#10b981' },
];

// ── Skill Demand ───────────────────────────────────────
export const skillDemand = [
  { skill: 'React', demand: 85, supply: 72 },
  { skill: 'Python', demand: 78, supply: 65 },
  { skill: 'TypeScript', demand: 72, supply: 68 },
  { skill: 'AWS', demand: 65, supply: 42 },
  { skill: 'Kubernetes', demand: 58, supply: 28 },
  { skill: 'Go', demand: 45, supply: 22 },
];

// ── AI Insights ────────────────────────────────────────
export const aiInsights = [
  {
    id: 1,
    type: 'trend',
    message: 'Candidate volume increased 18% this week',
    detail: 'Most growth in full-stack and ML roles',
    color: 'success' as const,
  },
  {
    id: 2,
    type: 'alert',
    message: 'Python candidates are 24% above last month',
    detail: 'Consider promoting Python-heavy positions',
    color: 'info' as const,
  },
  {
    id: 3,
    type: 'bottleneck',
    message: 'Sr. Full-Stack role has highest screening bottleneck',
    detail: 'Average 5.2 days in screening stage',
    color: 'warning' as const,
  },
  {
    id: 4,
    type: 'insight',
    message: 'Rahul Patel is the top match across 2 active jobs',
    detail: '91% match for Full-Stack, 78% for ML Engineer',
    color: 'brand' as const,
  },
];

// ── Conversion Rates ───────────────────────────────────
export const conversionRates = [
  { label: 'Screening Rate', value: 60.5, color: '#10b981' },
  { label: 'Interview Rate', value: 13.5, color: '#f59e0b' },
  { label: 'Hiring Rate', value: 2.7, color: '#5c7cfa' },
];

// ── Filter Options ─────────────────────────────────────
export const filterJobs = [
  'Senior Full-Stack Engineer',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Junior React Developer',
  'Backend Engineer (Go)',
];

export const filterDepartments = [
  'Engineering',
  'AI/ML',
  'Infrastructure',
  'Design',
];
