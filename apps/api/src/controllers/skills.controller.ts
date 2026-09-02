import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { Prisma } from '@prisma/client';
import { metrics } from '../services/metrics.service';

export class SkillsController {
  /**
   * List all skills with optional search and category filter
   */
  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();
    try {
      const { search, categoryId, limit = '100' } = req.query as Record<string, string>;
      const take = Math.min(parseInt(limit) || 100, 200);

      const where: Prisma.SkillWhereInput = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { aliases: { some: { alias: { contains: search, mode: 'insensitive' } } } },
        ];
      }
      if (categoryId) {
        where.categoryId = categoryId;
      }

      const skills = await prisma.skill.findMany({
        where,
        include: {
          category: true,
          aliases: true,
          _count: {
            select: {
              candidateSkills: true,
              jobSkills: true,
              children: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take,
      });

      res.json(skills);
    } catch (error) {
      metrics.recordServiceError('skills.list', String(error));
      next(error);
    } finally {
      metrics.recordServiceLatency('skills.list', Date.now() - start);
      metrics.incrementCounter('skills.queries');
    }
  }

  /**
   * Get a single skill with full detail
   */
  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const skill = await prisma.skill.findFirst({
        where: { id: req.params.id },
        include: {
          category: true,
          aliases: true,
          parent: { select: { id: true, name: true } },
          children: { select: { id: true, name: true, _count: { select: { candidateSkills: true, jobSkills: true } } } },
          relatedFrom: {
            include: { target: { select: { id: true, name: true, category: { select: { name: true } } } } },
          },
          relatedTo: {
            include: { source: { select: { id: true, name: true, category: { select: { name: true } } } } },
          },
          _count: {
            select: {
              candidateSkills: true,
              jobSkills: true,
            },
          },
        },
      });

      if (!skill) throw new NotFoundError('Skill not found');

      // Get top candidates with this skill
      const topCandidates = await prisma.candidateSkill.findMany({
        where: { skillId: skill.id },
        include: {
          candidate: { select: { id: true, firstName: true, lastName: true, email: true, location: true } },
        },
        orderBy: { confidence: 'desc' },
        take: 5,
      });

      // Get jobs requiring this skill
      const topJobs = await prisma.jobSkill.findMany({
        where: { skillId: skill.id },
        include: {
          job: { select: { id: true, title: true, department: true, location: true, status: true } },
        },
        orderBy: { job: { createdAt: 'desc' } },
        take: 5,
      });

      res.json({
        ...skill,
        topCandidates,
        topJobs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get skill graph data — nodes and edges for visualization
   */
  static async graph(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();
    try {
      const { categoryId } = req.query as Record<string, string>;

      const where: Prisma.SkillWhereInput = {};
      if (categoryId) where.categoryId = categoryId;

      // Get skills with relationships
      const skills = await prisma.skill.findMany({
        where,
        include: {
          category: true,
          relatedFrom: { include: { target: { select: { id: true, name: true } } } },
          relatedTo: { include: { source: { select: { id: true, name: true } } } },
          _count: { select: { candidateSkills: true, jobSkills: true } },
        },
        take: 200,
      });

      // Build graph nodes
      const nodes = skills.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category?.name || 'Uncategorized',
        categoryId: s.categoryId,
        candidateCount: s._count.candidateSkills,
        jobCount: s._count.jobSkills,
        size: Math.min(50, 15 + Math.max(s._count.candidateSkills, s._count.jobSkills) * 3),
      }));

      // Build graph edges
      const edgeSet = new Set<string>();
      const edges: { source: string; target: string; relation: string; weight: number }[] = [];

      for (const skill of skills) {
        // Parent-child edges
        if (skill.parentId) {
          const key = `${skill.parentId}->${skill.id}`;
          if (!edgeSet.has(key)) {
            edges.push({ source: skill.parentId, target: skill.id, relation: 'parent_of', weight: 1.0 });
            edgeSet.add(key);
          }
        }

        // Skill relationship edges
        for (const rel of skill.relatedFrom) {
          const key = `${rel.sourceId}->${rel.targetId}:${rel.relation}`;
          if (!edgeSet.has(key)) {
            edges.push({ source: rel.sourceId, target: rel.targetId, relation: rel.relation, weight: rel.weight });
            edgeSet.add(key);
          }
        }
        for (const rel of skill.relatedTo) {
          const key = `${rel.sourceId}->${rel.targetId}:${rel.relation}`;
          if (!edgeSet.has(key)) {
            edges.push({ source: rel.sourceId, target: rel.targetId, relation: rel.relation, weight: rel.weight });
            edgeSet.add(key);
          }
        }
      }

      res.json({ nodes, edges });
    } catch (error) {
      metrics.recordServiceError('skills.graph', String(error));
      next(error);
    } finally {
      metrics.recordServiceLatency('skills.graph', Date.now() - start);
    }
  }

  /**
   * Get skill categories
   */
  static async categories(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await prisma.skillCategory.findMany({
        include: {
          _count: { select: { skills: true } },
        },
        orderBy: { name: 'asc' },
      });
      res.json(categories);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get skill analytics — demand vs supply, trends, gaps
   */
  static async analytics(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const start = Date.now();
    try {
      // Top skills by candidate count
      const candidateDemand = await prisma.skill.findMany({
        include: {
          _count: { select: { candidateSkills: true, jobSkills: true } },
          category: { select: { name: true } },
        },
        orderBy: { candidateSkills: { _count: 'desc' } },
        take: 20,
      });

      // Top skills by job demand
      const jobDemand = await prisma.skill.findMany({
        include: {
          _count: { select: { candidateSkills: true, jobSkills: true } },
          category: { select: { name: true } },
        },
        orderBy: { jobSkills: { _count: 'desc' } },
        take: 20,
      });

      // Skills with high job demand but low candidate supply (gaps)
      const allSkillsWithCounts = await prisma.skill.findMany({
        include: {
          _count: { select: { candidateSkills: true, jobSkills: true } },
          category: { select: { name: true } },
        },
      });

      const gaps = allSkillsWithCounts
        .filter(s => s._count.jobSkills > 0)
        .map(s => ({
          name: s.name,
          category: s.category?.name || 'Uncategorized',
          jobDemand: s._count.jobSkills,
          candidateSupply: s._count.candidateSkills,
          gapScore: s._count.jobSkills > 0
            ? Math.max(0, s._count.jobSkills - s._count.candidateSkills)
            : 0,
          ratio: s._count.candidateSkills > 0
            ? s._count.jobSkills / s._count.candidateSkills
            : s._count.jobSkills * 10,
        }))
        .sort((a, b) => b.gapScore - a.gapScore)
        .slice(0, 15);

      // Category distribution
      const categoryDistribution = await prisma.skillCategory.findMany({
        include: {
          skills: {
            include: {
              _count: { select: { candidateSkills: true, jobSkills: true } },
            },
          },
        },
      });

      const categories = categoryDistribution.map(cat => ({
        name: cat.name,
        icon: cat.icon,
        skillCount: cat.skills.length,
        totalCandidates: cat.skills.reduce((sum, s) => sum + s._count.candidateSkills, 0),
        totalJobs: cat.skills.reduce((sum, s) => sum + s._count.jobSkills, 0),
      }));

      // Confidence distribution across all candidate skills
      const confidenceDistribution = await prisma.candidateSkill.groupBy({
        by: ['proficiency'],
        _count: { id: true },
        _avg: { confidence: true },
      });

      res.json({
        topByCandidates: candidateDemand.map(s => ({
          name: s.name,
          category: s.category?.name,
          candidateCount: s._count.candidateSkills,
          jobCount: s._count.jobSkills,
        })),
        topByJobDemand: jobDemand.map(s => ({
          name: s.name,
          category: s.category?.name,
          candidateCount: s._count.candidateSkills,
          jobCount: s._count.jobSkills,
        })),
        gaps,
        categories,
        confidenceDistribution,
      });
    } catch (error) {
      metrics.recordServiceError('skills.analytics', String(error));
      next(error);
    } finally {
      metrics.recordServiceLatency('skills.analytics', Date.now() - start);
    }
  }

  /**
   * Resolve skill from alias
   */
  static async resolveAlias(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { alias } = req.query as Record<string, string>;
      if (!alias) throw new BadRequestError('Alias parameter required');

      const skillAlias = await prisma.skillAlias.findFirst({
        where: { alias: { equals: alias, mode: 'insensitive' } },
        include: {
          skill: {
            include: {
              category: true,
              _count: { select: { candidateSkills: true, jobSkills: true } },
            },
          },
        },
      });

      if (skillAlias) {
        res.json({ resolved: true, skill: skillAlias.skill, aliasType: skillAlias.type });
      } else {
        // Try direct name match
        const skill = await prisma.skill.findFirst({
          where: { name: { equals: alias, mode: 'insensitive' } },
          include: {
            category: true,
            _count: { select: { candidateSkills: true, jobSkills: true } },
          },
        });
        if (skill) {
          res.json({ resolved: true, skill, aliasType: 'direct' });
        } else {
          res.json({ resolved: false, skill: null });
        }
      }
    } catch (error) {
      next(error);
    }
  }
}
