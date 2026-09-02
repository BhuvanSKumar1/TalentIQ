import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { CreateJobInput, UpdateJobInput } from '../validators/jobs.validator';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { metrics } from '../services/metrics.service';

export class JobsController {
  // ── List Jobs ──────────────────────────────────────────
  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();
    try {
      const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);
      const { search, status, department, sort = 'createdAt', order = 'desc' } = req.query as Record<string, string>;

      const where: Prisma.JobWhereInput = {
        organizationId: req.user!.organizationId,
        deletedAt: null,
      };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (status) where.status = status as any;
      if (department) where.department = department;

      const allowedSorts: Record<string, string> = {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        title: 'title',
      };
      const sortField = allowedSorts[sort] || 'createdAt';

      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          include: {
            skills: { include: { skill: true } },
            _count: { select: { applications: true } },
          },
          skip,
          take: limit,
          orderBy: { [sortField]: order as 'asc' | 'desc' },
        }),
        prisma.job.count({ where }),
      ]);

      res.json(buildPaginatedResponse(jobs, total, { page, limit, skip }));
    } catch (error) {
      metrics.recordServiceError('jobs.list', String(error));
      next(error);
    } finally {
      metrics.recordServiceLatency('jobs.list', Date.now() - start);
      metrics.incrementCounter('jobs.queries');
    }
  }

  // ── Get Job By ID ──────────────────────────────────────
  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();
    try {
      const job = await prisma.job.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
        include: {
          skills: { include: { skill: true } },
          _count: { select: { applications: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      if (!job) throw new NotFoundError('Job not found');
      res.json(job);
    } catch (error) {
      metrics.recordServiceError('jobs.getById', String(error));
      next(error);
    } finally {
      metrics.recordServiceLatency('jobs.getById', Date.now() - start);
    }
  }

  // ── Create Job ─────────────────────────────────────────
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();
    try {
      const data = req.body as CreateJobInput;

      const job = await prisma.job.create({
        data: {
          title: data.title,
          description: data.description,
          department: data.department,
          location: data.location,
          employmentType: data.employmentType,
          experienceLevel: data.experienceLevel,
          salaryMin: data.salaryMin,
          salaryMax: data.salaryMax,
          status: data.status || 'DRAFT',
          organizationId: req.user!.organizationId,
          createdById: req.user!.userId,
        },
      });

      // Create required skills
      if (data.requiredSkills?.length) {
        for (const skillName of data.requiredSkills) {
          const skill = await prisma.skill.upsert({
            where: { name: skillName },
            update: {},
            create: { name: skillName },
          });
          await prisma.jobSkill.create({
            data: { jobId: job.id, skillId: skill.id, required: true },
          });
        }
      }

      // Create preferred skills
      if (data.preferredSkills?.length) {
        for (const skillName of data.preferredSkills) {
          const skill = await prisma.skill.upsert({
            where: { name: skillName },
            update: {},
            create: { name: skillName },
          });
          await prisma.jobSkill.create({
            data: { jobId: job.id, skillId: skill.id, required: false },
          });
        }
      }

      const result = await prisma.job.findUnique({
        where: { id: job.id },
        include: { skills: { include: { skill: true } } },
      });

      res.status(201).json(result);
    } catch (error) {
      metrics.recordServiceError('jobs.create', String(error));
      next(error);
    } finally {
      metrics.recordServiceLatency('jobs.create', Date.now() - start);
      metrics.incrementCounter('jobs.created');
    }
  }

  // ── Update Job ─────────────────────────────────────────
  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.job.findFirst({
        where: { id: req.params.id, organizationId: req.user!.organizationId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Job not found');

      const data = req.body as UpdateJobInput;

      const job = await prisma.job.update({
        where: { id: req.params.id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.department && { department: data.department }),
          ...(data.location && { location: data.location }),
          ...(data.employmentType && { employmentType: data.employmentType }),
          ...(data.experienceLevel && { experienceLevel: data.experienceLevel }),
          ...(data.salaryMin !== undefined && { salaryMin: data.salaryMin }),
          ...(data.salaryMax !== undefined && { salaryMax: data.salaryMax }),
          ...(data.status && { status: data.status }),
        },
      });

      // Handle skills update if provided
      if (data.requiredSkills || data.preferredSkills) {
        // Remove existing skills
        await prisma.jobSkill.deleteMany({ where: { jobId: job.id } });

        if (data.requiredSkills?.length) {
          for (const skillName of data.requiredSkills) {
            const skill = await prisma.skill.upsert({
              where: { name: skillName },
              update: {},
              create: { name: skillName },
            });
            await prisma.jobSkill.create({
              data: { jobId: job.id, skillId: skill.id, required: true },
            });
          }
        }

        if (data.preferredSkills?.length) {
          for (const skillName of data.preferredSkills) {
            const skill = await prisma.skill.upsert({
              where: { name: skillName },
              update: {},
              create: { name: skillName },
            });
            await prisma.jobSkill.create({
              data: { jobId: job.id, skillId: skill.id, required: false },
            });
          }
        }
      }

      const result = await prisma.job.findUnique({
        where: { id: job.id },
        include: { skills: { include: { skill: true } } },
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // ── Delete Job (soft) ──────────────────────────────────
  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.job.findFirst({
        where: { id: req.params.id, organizationId: req.user!.organizationId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Job not found');

      await prisma.job.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() },
      });

      res.json({ message: 'Job deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ── Publish / Unpublish ────────────────────────────────
  static async publish(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const job = await prisma.job.findFirst({
        where: { id: req.params.id, organizationId: req.user!.organizationId, deletedAt: null },
      });
      if (!job) throw new NotFoundError('Job not found');

      const newStatus = job.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: { status: newStatus },
        include: { skills: { include: { skill: true } } },
      });

      logger.info({ jobId: job.id, action: newStatus }, 'Job status changed');
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  // ── Archive Job ────────────────────────────────────────
  static async archive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.job.findFirst({
        where: { id: req.params.id, organizationId: req.user!.organizationId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Job not found');

      const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: { status: 'ARCHIVED' },
        include: { skills: { include: { skill: true } } },
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  // ── Duplicate Job ──────────────────────────────────────
  static async duplicate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.job.findFirst({
        where: { id: req.params.id, organizationId: req.user!.organizationId, deletedAt: null },
        include: { skills: { include: { skill: true } } },
      });
      if (!existing) throw new NotFoundError('Job not found');

      const newJob = await prisma.job.create({
        data: {
          title: `${existing.title} (Copy)`,
          description: existing.description,
          department: existing.department,
          location: existing.location,
          employmentType: existing.employmentType,
          experienceLevel: existing.experienceLevel,
          salaryMin: existing.salaryMin,
          salaryMax: existing.salaryMax,
          status: 'DRAFT',
          organizationId: req.user!.organizationId,
          createdById: req.user!.userId,
        },
      });

      // Copy skills
      for (const js of existing.skills) {
        await prisma.jobSkill.create({
          data: { jobId: newJob.id, skillId: js.skillId, required: js.required, weight: js.weight },
        });
      }

      const result = await prisma.job.findUnique({
        where: { id: newJob.id },
        include: { skills: { include: { skill: true } } },
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ── Analyze Job Description (AI) ──────────────────────
  static async analyze(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { description } = req.body;
      if (!description || typeof description !== 'string') {
        throw new BadRequestError('Job description is required');
      }

      // Simulated AI analysis — in production, this calls OpenAI
      const analysis = analyzeJobDescription(description);

      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }

  // ── Stats ──────────────────────────────────────────────
  static async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizationId = req.user!.organizationId;
      const [totalJobs, activeJobs, draftJobs, closedJobs] = await Promise.all([
        prisma.job.count({ where: { organizationId, deletedAt: null } }),
        prisma.job.count({ where: { organizationId, status: 'PUBLISHED', deletedAt: null } }),
        prisma.job.count({ where: { organizationId, status: 'DRAFT', deletedAt: null } }),
        prisma.job.count({ where: { organizationId, status: 'CLOSED', deletedAt: null } }),
      ]);
      res.json({ totalJobs, activeJobs, draftJobs, closedJobs });
    } catch (error) {
      next(error);
    }
  }
}

// ── Simulated AI Job Description Analysis ────────────────
function analyzeJobDescription(description: string) {
  const lower = description.toLowerCase();

  // Extract responsibilities (sentences ending with period)
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const responsibilityKeywords = ['responsible', 'manage', 'build', 'develop', 'design', 'lead', 'implement', 'maintain', 'create', 'collaborate', 'coordinate', 'oversee', 'drive', 'own'];
  const responsibilities = sentences
    .filter(s => responsibilityKeywords.some(k => s.toLowerCase().includes(k)))
    .map(s => s.trim())
    .slice(0, 8);

  // Extract skills
  const knownSkills = [
    'React', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
    'Node.js', 'Express', 'Django', 'Spring Boot', 'Ruby on Rails',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
    'GraphQL', 'REST', 'gRPC',
    'Machine Learning', 'Deep Learning', 'NLP', 'TensorFlow', 'PyTorch',
    'Git', 'CI/CD', 'Jenkins', 'GitHub Actions',
    'HTML', 'CSS', 'Tailwind', 'Vue.js', 'Angular', 'Svelte',
    'SQL', 'NoSQL', 'Data Analysis', 'Tableau',
    'Agile', 'Scrum', 'JIRA',
  ];

  const foundSkills = knownSkills.filter(skill =>
    lower.includes(skill.toLowerCase())
  );

  const requiredSkills = foundSkills.slice(0, Math.ceil(foundSkills.length * 0.6));
  const preferredSkills = foundSkills.slice(Math.ceil(foundSkills.length * 0.6));

  // Extract experience level
  let experienceLevel = 'MID';
  if (lower.includes('senior') || lower.includes('lead') || lower.includes('principal')) experienceLevel = 'SENIOR';
  else if (lower.includes('junior') || lower.includes('entry') || lower.includes('graduate')) experienceLevel = 'ENTRY';
  else if (lower.includes('executive') || lower.includes('director') || lower.includes('vp')) experienceLevel = 'EXECUTIVE';

  // Extract education
  const education: string[] = [];
  if (lower.includes('bachelor')) education.push("Bachelor's degree");
  if (lower.includes('master')) education.push("Master's degree");
  if (lower.includes('phd') || lower.includes('doctorate')) education.push('PhD');
  if (education.length === 0) education.push("Bachelor's degree preferred");

  // Technical keywords
  const techKeywords = foundSkills.filter(s => !['Communication', 'Leadership', 'Problem Solving', 'Team', 'Agile', 'Scrum'].includes(s));

  // Soft skills
  const softSkillKeywords = ['communication', 'leadership', 'teamwork', 'problem solving', 'analytical', 'creative', 'adaptable', 'self-motivated', 'detail-oriented', 'collaborative'];
  const softSkills = softSkillKeywords.filter(s => lower.includes(s));
  if (softSkills.length === 0) softSkills.push('Communication', 'Team collaboration');

  return {
    responsibilities,
    requiredSkills,
    preferredSkills,
    experienceLevel,
    experienceYears: experienceLevel === 'ENTRY' ? '0-2' : experienceLevel === 'SENIOR' ? '5+' : '2-5',
    education,
    technicalKeywords: techKeywords.slice(0, 10),
    softSkills,
    confidence: Math.min(0.95, 0.5 + foundSkills.length * 0.05),
  };
}
