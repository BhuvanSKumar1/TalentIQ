// ── Auth Types ──────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organization: {
    id: string;
    name: string;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ── Job Types ───────────────────────────────────────────
export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';

export interface Job {
  id: string;
  title: string;
  description?: string;
  department?: string;
  location?: string;
  employmentType: EmploymentType;
  experienceLevel?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  status: JobStatus;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    applications: number;
  };
  skills?: JobSkill[];
}

export interface JobSkill {
  id: string;
  skillId: string;
  required: boolean;
  weight: number;
  skill: Skill;
}

// ── Candidate Types ─────────────────────────────────────
export type ApplicationStatus =
  | 'APPLIED'
  | 'SCREENING'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEWED'
  | 'OFFERED'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  skills?: CandidateSkill[];
  experiences?: CandidateExperience[];
  education?: CandidateEducation[];
  projects?: CandidateProject[];
  certifications?: Certification[];
  applications?: Application[];
  interviews?: Interview[];
  _count?: {
    applications: number;
  };
}

export interface CandidateSkill {
  id: string;
  skillId: string;
  proficiency: string;
  yearsOfExp?: number;
  confidence: number;
  source?: string;
  evidence?: string;
  skill: Skill;
}

export interface CandidateExperience {
  id: string;
  company: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  location?: string;
}

export interface CandidateEducation {
  id: string;
  institution: string;
  degree?: string;
  field?: string;
  startDate: string;
  endDate?: string;
  gpa?: number;
}

export interface CandidateProject {
  id: string;
  name: string;
  description?: string;
  url?: string;
  technologies: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer?: string;
  issueDate?: string;
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  status: ApplicationStatus;
  job?: Job;
  candidate?: Candidate;
  createdAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  jobId: string;
  type: string;
  status: string;
  scheduledAt: string;
  duration?: number;
  job?: Job;
  candidate?: Candidate;
}

// ── Skill Types ─────────────────────────────────────────
export interface Skill {
  id: string;
  name: string;
  categoryId?: string;
  category?: SkillCategory;
}

export interface SkillCategory {
  id: string;
  name: string;
  icon?: string;
}

// ── Matching Types ──────────────────────────────────────
export interface CandidateMatch {
  id: string;
  candidateId: string;
  jobId: string;
  overallScore: number;
  skillScore?: number;
  experienceScore?: number;
  projectScore?: number;
  educationScore?: number;
  semanticScore?: number;
  explanation?: Record<string, unknown>;
  candidate?: Candidate;
  job?: Job;
  evidence?: MatchEvidence[];
}

export interface MatchEvidence {
  id: string;
  type: string;
  detail: string;
  score?: number;
}

// ── Pagination Types ────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
