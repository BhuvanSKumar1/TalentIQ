import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  jobs: 'Jobs',
  candidates: 'Candidates',
  search: 'Semantic Search',
  ai: 'AI Recruiter',
  matching: 'Matching',
  skills: 'Skill Analysis',
  analytics: 'Analytics',
  fairness: 'Fairness Audit',
  interviews: 'Interviews',
  audit: 'Audit Logs',
  notifications: 'Notifications',
  settings: 'Settings',
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) return null;

  const crumbs = segments.map((seg, i) => ({
    label: routeLabels[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav className="flex items-center gap-1.5 px-6 py-2 text-sm" aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="flex items-center text-surface-600 hover:text-surface-950 transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-surface-500" />
          {crumb.isLast ? (
            <span className="font-medium text-surface-950">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.href}
              className="text-surface-600 hover:text-surface-950 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
