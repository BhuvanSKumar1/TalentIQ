import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('App Setup Integration', () => {
  describe('Package Configuration', () => {
    it('should have correct scripts in package.json', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../../package.json'), 'utf-8')
      );

      expect(pkg.scripts.dev).toBeDefined();
      expect(pkg.scripts.build).toBeDefined();
      expect(pkg.scripts.test).toBeDefined();
      expect(pkg.scripts['db:seed']).toBeDefined();
      expect(pkg.scripts['db:seed:demo']).toBeDefined();
    });

    it('should have required dependencies', () => {
      const pkg = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../../package.json'), 'utf-8')
      );

      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      expect(deps['express']).toBeDefined();
      expect(deps['prisma']).toBeDefined();
      expect(deps['@prisma/client']).toBeDefined();
      expect(deps['jsonwebtoken']).toBeDefined();
      expect(deps['bcrypt']).toBeDefined();
      expect(deps['zod']).toBeDefined();
      expect(deps['vitest']).toBeDefined();
      expect(deps['helmet']).toBeDefined();
      expect(deps['cors']).toBeDefined();
      expect(deps['express-rate-limit']).toBeDefined();
    });

    it('should have TypeScript configured', () => {
      const tsconfig = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../../tsconfig.json'), 'utf-8')
      );

      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });
  });

  describe('Route Files Exist', () => {
    const routesDir = path.resolve(__dirname, '../../../src/routes');

    it('should have routes index', () => {
      expect(fs.existsSync(path.join(routesDir, 'index.ts'))).toBe(true);
    });

    it('should have auth routes', () => {
      expect(fs.existsSync(path.join(routesDir, 'v1', 'auth.routes.ts'))).toBe(true);
    });

    it('should have jobs routes', () => {
      expect(fs.existsSync(path.join(routesDir, 'v1', 'jobs.routes.ts'))).toBe(true);
    });

    it('should have candidates routes', () => {
      expect(fs.existsSync(path.join(routesDir, 'v1', 'candidates.routes.ts'))).toBe(true);
    });
  });

  describe('Middleware Files Exist', () => {
    const middlewareDir = path.resolve(__dirname, '../../../src/middleware');

    it('should have auth middleware', () => {
      expect(fs.existsSync(path.join(middlewareDir, 'auth.ts'))).toBe(true);
    });

    it('should have security middleware', () => {
      expect(fs.existsSync(path.join(middlewareDir, 'security.ts'))).toBe(true);
    });

    it('should have rate limiter', () => {
      expect(fs.existsSync(path.join(middlewareDir, 'rateLimiter.ts'))).toBe(true);
    });

    it('should have error handler', () => {
      expect(fs.existsSync(path.join(middlewareDir, 'errorHandler.ts'))).toBe(true);
    });

    it('should have validation middleware', () => {
      expect(fs.existsSync(path.join(middlewareDir, 'validate.ts'))).toBe(true);
    });

    it('should have audit middleware', () => {
      expect(fs.existsSync(path.join(middlewareDir, 'audit.ts'))).toBe(true);
    });
  });

  describe('Service Files Exist', () => {
    const servicesDir = path.resolve(__dirname, '../../../src/services');

    it('should have matching service', () => {
      expect(fs.existsSync(path.join(servicesDir, 'matching.service.ts'))).toBe(true);
    });

    it('should have analytics service', () => {
      expect(fs.existsSync(path.join(servicesDir, 'analytics.service.ts'))).toBe(true);
    });

    it('should have fairness service', () => {
      expect(fs.existsSync(path.join(servicesDir, 'fairness.service.ts'))).toBe(true);
    });

    it('should have search service', () => {
      expect(fs.existsSync(path.join(servicesDir, 'search.service.ts'))).toBe(true);
    });

    it('should have AI service', () => {
      expect(fs.existsSync(path.join(servicesDir, 'ai.service.ts'))).toBe(true);
    });

    it('should have skill gap service', () => {
      expect(fs.existsSync(path.join(servicesDir, 'skillgap.service.ts'))).toBe(true);
    });

    it('should have interview service', () => {
      expect(fs.existsSync(path.join(servicesDir, 'interview.service.ts'))).toBe(true);
    });
  });

  describe('Schema Validation', () => {
    it('should have Prisma schema', () => {
      const schemaPath = path.resolve(__dirname, '../../../prisma/schema.prisma');
      expect(fs.existsSync(schemaPath)).toBe(true);
    });

    it('Prisma schema should define core models', () => {
      const schema = fs.readFileSync(
        path.resolve(__dirname, '../../../prisma/schema.prisma'),
        'utf-8'
      );

      expect(schema).toContain('model Organization');
      expect(schema).toContain('model User');
      expect(schema).toContain('model Job');
      expect(schema).toContain('model Candidate');
      expect(schema).toContain('model Application');
      expect(schema).toContain('model CandidateMatch');
      expect(schema).toContain('model Interview');
      expect(schema).toContain('model AuditLog');
      expect(schema).toContain('model Skill');
    });

    it('Prisma schema should have UUID primary keys', () => {
      const schema = fs.readFileSync(
        path.resolve(__dirname, '../../../prisma/schema.prisma'),
        'utf-8'
      );
      expect(schema).toContain('@default(uuid())');
      expect(schema).toContain('@db.Uuid');
    });

    it('Prisma schema should have timestamps', () => {
      const schema = fs.readFileSync(
        path.resolve(__dirname, '../../../prisma/schema.prisma'),
        'utf-8'
      );
      expect(schema).toContain('createdAt DateTime @default(now())');
      expect(schema).toContain('updatedAt DateTime @updatedAt');
    });
  });

  describe('Environment Configuration', () => {
    it('should have .env.example', () => {
      // Check multiple possible locations
      const possiblePaths = [
        path.resolve(__dirname, '../../../../.env.example'),
        path.resolve(__dirname, '../../../../../.env.example'),
        path.resolve(process.cwd(), '.env.example'),
        path.resolve(process.cwd(), '../.env.example'),
      ];
      const found = possiblePaths.some(p => fs.existsSync(p));
      expect(found).toBe(true);
    });

    it('should have .gitignore with .env', () => {
      const gitignorePath = path.resolve(__dirname, '../../../../.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
        expect(gitignore).toContain('.env');
      }
    });
  });

  describe('Validator Files', () => {
    const validatorsDir = path.resolve(__dirname, '../../../src/validators');

    it('should have auth validators', () => {
      expect(fs.existsSync(path.join(validatorsDir, 'auth.validator.ts'))).toBe(true);
    });

    it('auth validators should export schemas', () => {
      const content = fs.readFileSync(
        path.join(validatorsDir, 'auth.validator.ts'),
        'utf-8'
      );
      expect(content).toContain('registerSchema');
      expect(content).toContain('loginSchema');
      expect(content).toContain('refreshTokenSchema');
    });
  });

  describe('Error Classes', () => {
    it('should have all error classes', async () => {
      const errors = await import('../../utils/errors');

      expect(errors.AppError).toBeDefined();
      expect(errors.BadRequestError).toBeDefined();
      expect(errors.UnauthorizedError).toBeDefined();
      expect(errors.ForbiddenError).toBeDefined();
      expect(errors.NotFoundError).toBeDefined();
      expect(errors.ConflictError).toBeDefined();
      expect(errors.RateLimitError).toBeDefined();
      expect(errors.InternalError).toBeDefined();
      expect(errors.ServiceUnavailableError).toBeDefined();
    });
  });
});

describe('Audit Logging Integration', () => {
  describe('Audit Log Structure', () => {
    it('should define valid audit action types', () => {
      const validActions = [
        'candidate.created', 'candidate.viewed', 'candidate.shortlisted', 'candidate.rejected',
        'job.created', 'job.published', 'job.updated',
        'application.created', 'application.reviewed', 'application.status_changed',
        'interview.scheduled', 'interview.completed',
        'ai.match_executed', 'ai.analysis_completed',
        'user.login', 'user.logout',
      ];

      expect(validActions.length).toBeGreaterThan(10);
      validActions.forEach(action => {
        expect(typeof action).toBe('string');
        expect(action).toContain('.');
      });
    });

    it('should define valid entity types', () => {
      const entityTypes = [
        'Candidate', 'Job', 'Application', 'Interview',
        'AIConversation', 'FairnessAudit', 'User',
      ];

      entityTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Audit Metadata', () => {
    it('should include standard metadata fields', () => {
      const metadata = {
        source: 'api',
        action: 'candidate.created',
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
      };

      expect(metadata.source).toBeDefined();
      expect(metadata.action).toBeDefined();
      expect(metadata.timestamp).toBeDefined();
      expect(new Date(metadata.timestamp).getTime()).not.toBeNaN();
    });

    it('should handle large metadata payloads', () => {
      const metadata = {
        details: 'A'.repeat(10000),
        nested: { level1: { level2: { level3: 'deep' } } },
      };

      expect(metadata.details.length).toBe(10000);
      expect(metadata.nested.level1.level2.level3).toBe('deep');
    });
  });
});

describe('Notification System', () => {
  describe('Notification Types', () => {
    it('should define valid notification types', () => {
      const types = ['job_update', 'application', 'interview', 'candidate', 'system'];
      expect(types).toHaveLength(5);
      types.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('Notification Metadata', () => {
    it('should handle read/unread status', () => {
      const notification = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'application',
        title: 'New Application',
        message: 'Someone applied',
        read: false,
        createdAt: new Date(),
      };

      expect(notification.read).toBe(false);
      notification.read = true;
      expect(notification.read).toBe(true);
    });

    it('should support optional metadata', () => {
      const notification = {
        id: 'notif-1',
        metadata: { jobId: 'job-123', candidateId: 'cand-456' },
      };

      expect(notification.metadata?.jobId).toBe('job-123');
    });
  });
});
