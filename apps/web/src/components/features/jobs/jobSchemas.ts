import { z } from 'zod';

export const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200),
  description: z.string().optional(),
  department: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']).default('FULL_TIME'),
  experienceLevel: z.enum(['ENTRY', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).optional(),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  education: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

export type JobFormData = z.infer<typeof jobSchema>;

export const defaultJobValues: JobFormData = {
  title: '',
  description: '',
  department: '',
  location: '',
  employmentType: 'FULL_TIME',
  experienceLevel: undefined,
  salaryMin: undefined,
  salaryMax: undefined,
  requiredSkills: [],
  preferredSkills: [],
  education: [],
  status: 'DRAFT',
};
