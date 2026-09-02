import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { Prisma } from '@prisma/client';
import { metrics } from '../services/metrics.service';

export class CandidatesController {
  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();
    try {
      const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);
      const { search, sort = 'createdAt', order = 'desc' } = req.query as Record<string, string>;

      const where: Prisma.CandidateWhereInput = {
        organizationId: req.user!.organizationId,
        deletedAt: null,
      };

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [candidates, total] = await Promise.all([
        prisma.candidate.findMany({
          where,
          include: {
            skills: { include: { skill: true } },
            _count: { select: { applications: true } },
          },
          skip,
          take: limit,
          orderBy: { [sort]: order },
        }),
        prisma.candidate.count({ where }),
      ]);

      res.json(buildPaginatedResponse(candidates, total, { page, limit, skip }));
    } catch (error) {
      metrics.recordServiceError('candidates.list', String(error));
      next(error);
    } finally {
      metrics.recordServiceLatency('candidates.list', Date.now() - start);
      metrics.incrementCounter('candidates.queries');
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();
    try {
      const candidate = await prisma.candidate.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
        include: {
          skills: { include: { skill: { include: { category: true } } } },
          experiences: true,
          education: true,
          projects: true,
          certifications: true,
          applications: {
            include: {
              job: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          interviews: {
            include: { job: true },
            orderBy: { scheduledAt: 'desc' },
          },
          resumes: true,
        },
      });

      if (!candidate) throw new NotFoundError('Candidate not found');

      res.json(candidate);
    } catch (error) {
      metrics.recordServiceError('candidates.getById', String(error));
      next(error);
    } finally {
      metrics.recordServiceLatency('candidates.getById', Date.now() - start);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;

      const candidate = await prisma.candidate.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          location: data.location,
          organizationId: req.user!.organizationId,
        },
      });

      res.status(201).json(candidate);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.candidate.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
      });

      if (!existing) throw new NotFoundError('Candidate not found');

      const candidate = await prisma.candidate.update({
        where: { id: req.params.id },
        data: req.body,
      });

      res.json(candidate);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const existing = await prisma.candidate.findFirst({
        where: {
          id: req.params.id,
          organizationId: req.user!.organizationId,
          deletedAt: null,
        },
      });

      if (!existing) throw new NotFoundError('Candidate not found');

      await prisma.candidate.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() },
      });

      res.json({ message: 'Candidate deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();
    try {
      const organizationId = req.user!.organizationId;

      const [total, newThisWeek] = await Promise.all([
        prisma.candidate.count({
          where: { organizationId, deletedAt: null },
        }),
        prisma.candidate.count({
          where: {
            organizationId,
            deletedAt: null,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      res.json({ total, newThisWeek });
    } catch (error) {
      metrics.recordServiceError('candidates.stats', String(error));
      next(error);
    } finally {
      metrics.recordServiceLatency('candidates.stats', Date.now() - start);
    }
  }
}
