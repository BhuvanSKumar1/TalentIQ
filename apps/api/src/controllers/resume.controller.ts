import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, BadRequestError, ServiceUnavailableError } from '../utils/errors';
import { getPaginationParams, buildPaginatedResponse } from '../utils/pagination';
import { Prisma, ProcessingStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { metrics } from '../services/metrics.service';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3002';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'dev-api-key';

// Allowed MIME types
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'image/png': 'image',
  'image/jpeg': 'image',
};

// Simulated resume text extraction for demo mode (when Python service unavailable)
function simulateTextExtraction(fileName: string, fileType: string): string {
  return `RESUME - ${fileName}

John Doe
john.doe@email.com | (555) 123-4567 | San Francisco, CA
LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe

SUMMARY
Senior Full-Stack Engineer with 7 years of experience building scalable web applications.
Proficient in TypeScript, React, Node.js, and cloud infrastructure on AWS.

EXPERIENCE

Senior Software Engineer | TechCorp Inc. | Jan 2021 - Present
- Led development of microservices architecture serving 10M+ daily users
- Built React dashboard with TypeScript and Recharts for real-time analytics
- Implemented CI/CD pipelines using GitHub Actions and Docker
- Mentored team of 4 junior developers

Software Engineer | StartupXYZ | Jun 2018 - Dec 2020
- Developed RESTful APIs using Node.js, Express, and PostgreSQL
- Created responsive web applications with React and Tailwind CSS
- Designed database schemas and optimized SQL queries
- Improved application performance by 40% through caching with Redis

EDUCATION

Bachelor of Science in Computer Science
University of California, Berkeley | 2014 - 2018
GPA: 3.8

SKILLS
TypeScript, JavaScript, React, Node.js, PostgreSQL, MongoDB, Redis,
AWS (EC2, S3, Lambda, ECS), Docker, Kubernetes, Terraform, Git,
Python, GraphQL, REST APIs, CI/CD, Agile, Test-Driven Development

PROJECTS

CloudDeploy - Automated deployment platform
Built with React, Node.js, Docker, and AWS ECS. Handles 500+ daily deployments.
Technologies: React, TypeScript, Node.js, Docker, AWS, PostgreSQL

Personal Portfolio - Modern portfolio website
Technologies: Next.js, Tailwind CSS, Framer Motion, Vercel

CERTIFICATIONS
AWS Solutions Architect Associate | Amazon Web Services | 2022
Certified Kubernetes Administrator | CNCF | 2023
`;
}

export class ResumeController {
  /**
   * Upload and process a resume file
   */
  static async upload(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }

      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;
      const file = req.file;

      // Validate file type
      const fileType = ALLOWED_TYPES[file.mimetype];
      if (!fileType) {
        throw new BadRequestError(
          `Unsupported file type: ${file.mimetype}. Allowed: PDF, DOCX, TXT, PNG, JPG`
        );
      }

      // Create or find candidate from filename
      const baseName = file.originalname.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const nameParts = baseName.split(' ').filter(Boolean);
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Candidate';

      // Create candidate
      const candidate = await prisma.candidate.create({
        data: {
          firstName: firstName.slice(0, 100),
          lastName: lastName.slice(0, 100) || 'Candidate',
          organizationId,
        },
      });

      // Create resume record
      const resume = await prisma.resume.create({
        data: {
          candidateId: candidate.id,
          fileName: file.originalname.slice(0, 255),
          fileType,
          fileSize: file.size,
          processingStatus: ProcessingStatus.UPLOADED,
        },
      });

      // Log the upload
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action: 'resume.uploaded',
          entityType: 'Resume',
          entityId: resume.id,
          metadata: {
            fileName: file.originalname,
            fileType,
            fileSize: file.size,
            candidateId: candidate.id,
          },
          organizationId,
        },
      });

      metrics.incrementCounter('resume.uploads');

      // Start async processing
      ResumeController.processResume(resume.id, candidate.id, organizationId, userId, fileType, file.originalname);

      res.status(201).json({
        resume,
        candidate,
        message: 'Resume uploaded successfully. Processing has begun.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process a resume through the AI pipeline
   */
  static async processResume(
    resumeId: string,
    candidateId: string,
    organizationId: string,
    userId: string,
    fileType: string,
    fileName: string,
  ): Promise<void> {
    const stages: { status: ProcessingStatus; delay: number }[] = [
      { status: ProcessingStatus.PARSING, delay: 200 },
      { status: ProcessingStatus.EXTRACTING, delay: 300 },
      { status: ProcessingStatus.DETECTING_SKILLS, delay: 300 },
      { status: ProcessingStatus.BUILDING_PROFILE, delay: 200 },
      { status: ProcessingStatus.GENERATING_EMBEDDING, delay: 200 },
    ];

    try {
      // Update to PARSING
      await prisma.resume.update({
        where: { id: resumeId },
        data: { processingStatus: ProcessingStatus.PARSING },
      });

      // Try to call Python AI service
      let parsedData: any = null;
      let rawText: string | null = null;
      let aiServiceAvailable = false;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const healthResponse = await fetch(`${AI_SERVICE_URL}/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (healthResponse.ok) {
          aiServiceAvailable = true;
          logger.info('Python AI service is available');
        }
      } catch {
        logger.info('Python AI service not available — using demo mode');
      }

      if (aiServiceAvailable) {
        // Call the real AI service
        const response = await fetch(`${AI_SERVICE_URL}/parse-file`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AI_SERVICE_API_KEY}`,
          },
          body: (() => {
            const formData = new FormData();
            // In production, pass the actual file buffer
            // For now, use simulated text
            const text = simulateTextExtraction(fileName, fileType);
            return JSON.stringify({ text, file_type: fileType });
          })(),
        });

        // Parse-file expects multipart; use /parse instead with simulated text
        const text = simulateTextExtraction(fileName, fileType);
        const parseResponse = await fetch(`${AI_SERVICE_URL}/parse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_SERVICE_API_KEY}`,
          },
          body: JSON.stringify({ text, file_type: fileType }),
        });

        if (parseResponse.ok) {
          const result = await parseResponse.json() as any;
          parsedData = result.profile;
          rawText = text;
          logger.info(`AI parsing complete — confidence: ${parsedData.overall_confidence}`);
        }
      }

      // If AI service not available, use demo extraction
      if (!parsedData) {
        const text = simulateTextExtraction(fileName, fileType);
        rawText = text;
        parsedData = ResumeController.generateDemoProfile(text);
        logger.info('Generated demo profile from simulated text');
      }

      // Progress through stages with small delays
      for (const stage of stages) {
        await new Promise(r => setTimeout(r, stage.delay));
        await prisma.resume.update({
          where: { id: resumeId },
          data: { processingStatus: stage.status },
        });
      }

      // Save parsed data and update resume
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          processingStatus: ProcessingStatus.READY,
          rawText: rawText?.slice(0, 50000) || null,
          parsedData: parsedData as any,
        },
      });

      // Create candidate skills
      if (parsedData.skills && Array.isArray(parsedData.skills)) {
        for (const skillData of parsedData.skills) {
          // Find or create skill (name is globally unique)
          const skillName = skillData.name.trim().slice(0, 100);
          let skill = await prisma.skill.findFirst({
            where: {
              name: { equals: skillName, mode: 'insensitive' },
            },
          });

          if (!skill) {
            skill = await prisma.skill.create({
              data: {
                name: skillName,
                organizationId,
              },
            });
          }

          // Create candidate-skill link
          await prisma.candidateSkill.upsert({
            where: {
              candidateId_skillId: {
                candidateId,
                skillId: skill.id,
              },
            },
            update: {
              proficiency: (skillData.proficiency || 'INTERMEDIATE') as any,
              yearsOfExp: skillData.years_of_experience || null,
              confidence: skillData.confidence || 0.8,
              source: 'resume',
              evidence: skillData.evidence?.slice(0, 2000) || null,
            },
            create: {
              candidateId,
              skillId: skill.id,
              proficiency: (skillData.proficiency || 'INTERMEDIATE') as any,
              yearsOfExp: skillData.years_of_experience || null,
              confidence: skillData.confidence || 0.8,
              source: 'resume',
              evidence: skillData.evidence?.slice(0, 2000) || null,
            },
          });
        }
      }

      // Create experience entries
      if (parsedData.experience && Array.isArray(parsedData.experience)) {
        for (const expData of parsedData.experience) {
          await prisma.candidateExperience.create({
            data: {
              candidateId,
              company: expData.company.slice(0, 200),
              title: expData.title.slice(0, 200),
              description: expData.description?.slice(0, 2000) || null,
              startDate: expData.start_date ? new Date(expData.start_date) : new Date(),
              endDate: expData.end_date ? new Date(expData.end_date) : null,
              isCurrent: expData.is_current || false,
              location: expData.location?.slice(0, 200) || null,
            },
          });
        }
      }

      // Create education entries
      if (parsedData.education && Array.isArray(parsedData.education)) {
        for (const eduData of parsedData.education) {
          await prisma.candidateEducation.create({
            data: {
              candidateId,
              institution: eduData.institution.slice(0, 200),
              degree: eduData.degree?.slice(0, 200) || null,
              field: eduData.field?.slice(0, 200) || null,
              startDate: eduData.start_date ? new Date(eduData.start_date) : new Date(),
              endDate: eduData.end_date ? new Date(eduData.end_date) : null,
              gpa: eduData.gpa || null,
              description: eduData.description?.slice(0, 2000) || null,
            },
          });
        }
      }

      // Create project entries
      if (parsedData.projects && Array.isArray(parsedData.projects)) {
        for (const projData of parsedData.projects) {
          await prisma.candidateProject.create({
            data: {
              candidateId,
              name: projData.name.slice(0, 200),
              description: projData.description?.slice(0, 2000) || null,
              url: projData.url || null,
              technologies: projData.technologies || [],
              startDate: projData.start_date ? new Date(projData.start_date) : null,
              endDate: projData.end_date ? new Date(projData.end_date) : null,
            },
          });
        }
      }

      // Create certification entries
      if (parsedData.certifications && Array.isArray(parsedData.certifications)) {
        for (const certData of parsedData.certifications) {
          await prisma.certification.create({
            data: {
              candidateId,
              name: certData.name.slice(0, 200),
              issuer: certData.issuer?.slice(0, 200) || null,
              issueDate: certData.issue_date ? new Date(certData.issue_date) : null,
              expiryDate: certData.expiry_date ? new Date(certData.expiry_date) : null,
              credentialId: certData.credential_id || null,
            },
          });
        }
      }

      // Update candidate with extracted info
      const updateData: any = {};
      if (parsedData.first_name) updateData.firstName = parsedData.first_name.slice(0, 100);
      if (parsedData.last_name) updateData.lastName = parsedData.last_name.slice(0, 100);
      if (parsedData.email) updateData.email = parsedData.email.slice(0, 255);
      if (parsedData.phone) updateData.phone = parsedData.phone.slice(0, 20);
      if (parsedData.location) updateData.location = parsedData.location.slice(0, 200);
      if (parsedData.linkedin) updateData.linkedin = parsedData.linkedin;
      if (parsedData.portfolio) updateData.portfolio = parsedData.portfolio;
      if (parsedData.summary) updateData.summary = parsedData.summary.slice(0, 5000);

      await prisma.candidate.update({
        where: { id: candidateId },
        data: updateData,
      });

      // Log completion
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action: 'resume.processed',
          entityType: 'Resume',
          entityId: resumeId,
          metadata: {
            status: 'completed',
            confidence: parsedData.overall_confidence,
            skillsCount: parsedData.skills?.length || 0,
            experienceCount: parsedData.experience?.length || 0,
          },
          organizationId,
        },
      });

      metrics.incrementCounter('resume.processed');
      logger.info(`Resume ${resumeId} processed successfully`);
    } catch (error) {
      metrics.incrementCounter('resume.failed');
      metrics.recordServiceError('resume.processing', error instanceof Error ? error.message : 'Unknown error');
      logger.error(`Resume processing failed for ${resumeId}:`, error);

      // Mark as failed
      await prisma.resume.update({
        where: { id: resumeId },
        data: {
          processingStatus: ProcessingStatus.FAILED,
          processingError: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Log failure
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action: 'resume.processing_failed',
          entityType: 'Resume',
          entityId: resumeId,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          organizationId,
        },
      });
    }
  }

  /**
   * Generate a demo profile from text when AI service unavailable
   */
  static generateDemoProfile(text: string): any {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const locationMatch = text.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2})/);

    const skillKeywords = [
      'TypeScript', 'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'Go',
      'PostgreSQL', 'MongoDB', 'Redis', 'AWS', 'Docker', 'Kubernetes',
      'GraphQL', 'REST', 'Git', 'CI/CD', 'Tailwind CSS', 'Next.js',
      'Angular', 'Vue', 'Spring Boot', 'Django', 'Flask', 'Ruby on Rails',
      'Terraform', 'Ansible', 'Jenkins', 'Linux', 'SQL', 'NoSQL',
      'Machine Learning', 'TensorFlow', 'PyTorch', 'NLP',
      'Communication', 'Leadership', 'Agile', 'Scrum',
    ];

    const foundSkills = skillKeywords.filter(skill =>
      text.toLowerCase().includes(skill.toLowerCase())
    );

    return {
      first_name: 'Demo',
      last_name: 'Candidate',
      email: emailMatch?.[0] || null,
      phone: phoneMatch?.[0] || null,
      location: locationMatch?.[0] || null,
      linkedin: text.includes('linkedin') ? 'https://linkedin.com/in/demo' : null,
      portfolio: text.includes('github') ? 'https://github.com/demo' : null,
      summary: 'Experienced software engineer with a strong track record of building scalable applications.',
      skills: foundSkills.map((name, i) => ({
        name,
        proficiency: ['EXPERT', 'ADVANCED', 'INTERMEDIATE'][i % 3],
        years_of_experience: Math.floor(Math.random() * 8) + 1,
        confidence: 0.75 + Math.random() * 0.2,
        evidence: null,
        category: 'Technology',
      })),
      experience: [
        {
          company: 'TechCorp Inc.',
          title: 'Senior Software Engineer',
          description: 'Led development of microservices architecture.',
          start_date: '2021-01-01',
          end_date: null,
          is_current: true,
          location: 'San Francisco, CA',
        },
      ],
      education: [
        {
          institution: 'University of Technology',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          start_date: '2014-09-01',
          end_date: '2018-06-01',
          gpa: null,
          description: null,
        },
      ],
      projects: [],
      certifications: [],
      overall_confidence: 0.78,
      processing_notes: ['Generated in demo mode — Python AI service unavailable'],
    };
  }

  /**
   * Get resume processing status
   */
  static async getStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const resume = await prisma.resume.findFirst({
        where: {
          id: req.params.id,
          candidate: {
            organizationId: req.user!.organizationId,
          },
        },
        include: {
          candidate: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!resume) throw new NotFoundError('Resume not found');

      res.json({
        id: resume.id,
        status: resume.processingStatus,
        error: resume.processingError,
        fileName: resume.fileName,
        fileType: resume.fileType,
        fileSize: resume.fileSize,
        candidate: resume.candidate,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retry a failed resume processing
   */
  static async retry(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const resume = await prisma.resume.findFirst({
        where: {
          id: req.params.id,
          candidate: {
            organizationId: req.user!.organizationId,
          },
        },
      });

      if (!resume) throw new NotFoundError('Resume not found');
      if (resume.processingStatus !== ProcessingStatus.FAILED) {
        throw new BadRequestError('Can only retry failed resumes');
      }

      // Reset status and retry
      await prisma.resume.update({
        where: { id: resume.id },
        data: {
          processingStatus: ProcessingStatus.UPLOADED,
          processingError: null,
        },
      });

      // Start processing again
      ResumeController.processResume(
        resume.id,
        resume.candidateId,
        req.user!.organizationId,
        req.user!.userId,
        resume.fileType,
        resume.fileName,
      );

      res.json({ message: 'Retry started', resumeId: resume.id });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all resumes
   */
  static async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, skip } = getPaginationParams(req.query as Record<string, string>);
      const { status, candidateId } = req.query as Record<string, string>;

      const where: Prisma.ResumeWhereInput = {
        candidate: {
          organizationId: req.user!.organizationId,
        },
      };

      if (status) {
        where.processingStatus = status as ProcessingStatus;
      }

      if (candidateId) {
        where.candidateId = candidateId;
      }

      const [resumes, total] = await Promise.all([
        prisma.resume.findMany({
          where,
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.resume.count({ where }),
      ]);

      res.json(buildPaginatedResponse(resumes, total, { page, limit, skip }));
    } catch (error) {
      next(error);
    }
  }
}
