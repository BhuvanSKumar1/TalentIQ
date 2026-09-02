// Role hierarchy and permissions
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
  RECRUITER: 'RECRUITER',
  HIRING_MANAGER: 'HIRING_MANAGER',
  INTERVIEWER: 'INTERVIEWER',
} as const;

export type RoleName = keyof typeof ROLES;

// Permission definitions by resource and action
export const PERMISSIONS = {
  jobs: {
    create: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER'],
    read: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
    update: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER'],
    delete: ['SUPER_ADMIN', 'ORG_ADMIN'],
  },
  candidates: {
    create: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER'],
    read: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER'],
    update: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER'],
    delete: ['SUPER_ADMIN', 'ORG_ADMIN'],
  },
  applications: {
    create: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER'],
    read: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
    update: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER'],
    delete: ['SUPER_ADMIN', 'ORG_ADMIN'],
  },
  users: {
    create: ['SUPER_ADMIN', 'ORG_ADMIN'],
    read: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER'],
    update: ['SUPER_ADMIN', 'ORG_ADMIN'],
    delete: ['SUPER_ADMIN', 'ORG_ADMIN'],
  },
  settings: {
    read: ['SUPER_ADMIN', 'ORG_ADMIN'],
    update: ['SUPER_ADMIN', 'ORG_ADMIN'],
  },
  audit: {
    read: ['SUPER_ADMIN', 'ORG_ADMIN'],
  },
  analytics: {
    read: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
  },
} as const;

export function hasPermission(role: string, resource: string, action: string): boolean {
  const resourcePerms = PERMISSIONS[resource as keyof typeof PERMISSIONS];
  if (!resourcePerms) return false;
  const actionRoles = resourcePerms[action as keyof typeof resourcePerms];
  if (!actionRoles) return false;
  return (actionRoles as readonly string[]).includes(role);
}
