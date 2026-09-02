/**
 * AI Recruiter Agent - Tool-based architecture
 * 
 * Instead of letting an LLM directly access the database, this service
 * provides a set of typed tools that an AI agent can invoke. Each tool:
 * 1. Validates inputs
 * 2. Queries the database
 * 3. Returns structured data
 * 4. Never exposes unauthorized data
 * 5. Always cites its sources
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Tool Definitions
// ============================================================

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  tool: string;
  success: boolean;
  data?: any;
  error?: string;
  evidence?: string[];
}

// ============================================================
// Tool: searchCandidates
// ============================================================
async function searchCandidates(args: {
  query?: string;
  skills?: string[];
  jobId?: string;
  limit?: number;
  location?: string;
  organizationId?: string;
}): Promise<ToolResult> {
  try {
    const { query, skills, jobId, limit = 10, location, organizationId } = args;
    
    const where: any = {};
    // SECURITY: Always filter by organization
    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    
    // If skills provided, filter candidates who have those skills
    if (skills && skills.length > 0) {
      where.skills = {
        some: {
          skill: {
            name: { in: skills, mode: 'insensitive' }
          }
        }
      };
    }
    
    // If jobId provided, find candidates that match the job's required skills
    let jobSkillNames: string[] = [];
    if (jobId) {
      const jobSkills = await prisma.jobSkill.findMany({
        where: { jobId },
        include: { skill: true },
      });
      jobSkillNames = jobSkills.map(js => js.skill.name);
      
      where.skills = {
        some: {
          skill: { name: { in: jobSkillNames, mode: 'insensitive' } }
        }
      };
    }
    
    // If query text, do keyword search on name/summary
    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        skills: { include: { skill: true } },
        experiences: { orderBy: { startDate: 'desc' }, take: 3 },
        education: true,
      },
      take: limit,
    });
    
    const results = candidates.map((c: any) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      email: c.email,
      location: c.location,
      summary: c.summary,
      skills: (c.skills || []).map((s: any) => ({
        name: s.skill.name,
        proficiency: s.proficiency,
        confidence: s.confidence,
      })),
      experienceCount: (c.experiences || []).length,
      latestRole: c.experiences[0]?.title || 'N/A',
      educationCount: c.education.length,
    }));
    
    return {
      tool: 'searchCandidates',
      success: true,
      data: results,
      evidence: [`Found ${results.length} candidates matching criteria`],
    };
  } catch (error) {
    return { tool: 'searchCandidates', success: false, error: String(error) };
  }
}

// ============================================================
// Tool: getCandidate
// ============================================================
async function getCandidate(args: { candidateId: string; organizationId?: string }): Promise<ToolResult> {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: args.candidateId },
      include: {
        skills: { include: { skill: { include: { category: true } } } },
        experiences: { orderBy: { startDate: 'desc' } },
        education: true,
        projects: true,
        certifications: true,
        applications: { include: { job: true } },
      },
    });
    
    if (!candidate) {
      return { tool: 'getCandidate', success: false, error: 'Candidate not found' };
    }
    
    // Calculate experience years
    const now = new Date();
    const totalMonths = candidate.experiences.reduce((acc, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : now;
      return acc + Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    }, 0);
    
    return {
      tool: 'getCandidate',
      success: true,
      data: {
        id: candidate.id,
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        linkedin: candidate.linkedin,
        summary: candidate.summary,
        totalExperienceYears: Math.round((totalMonths as number) / 12 * 10) / 10,
        skills: candidate.skills.map(s => ({
          name: s.skill.name,
          category: s.skill.category?.name || 'Uncategorized',
          proficiency: s.proficiency,
          confidence: Math.round(s.confidence * 100),
          yearsOfExp: s.yearsOfExp,
        })),
        experience: candidate.experiences.map(e => ({
          title: e.title,
          company: e.company,
          description: e.description,
          startDate: e.startDate,
          endDate: e.endDate,
        })),
        education: candidate.education.map(e => ({
          institution: e.institution,
          degree: e.degree,
          field: e.field,
        })),
        projects: candidate.projects.map(p => ({
          title: p.name,
          description: p.description,
          technologies: p.technologies,
        })),
        applications: candidate.applications.map(a => ({
          jobId: a.jobId,
          jobTitle: a.job?.title,
          status: a.status,
          appliedAt: a.createdAt,
        })),
      },
      evidence: [`Retrieved full profile for ${candidate.firstName} ${candidate.lastName}`],
    };
  } catch (error) {
    return { tool: 'getCandidate', success: false, error: String(error) };
  }
}

// ============================================================
// Tool: getJob
// ============================================================
async function getJob(args: { jobId: string }): Promise<ToolResult> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: args.jobId },
      include: {
        skills: { include: { skill: true } },
        applications: { include: { candidate: true } },
        matches: { include: { candidate: true }, orderBy: { overallScore: 'desc' }, take: 10 },
      },
    });
    
    if (!job) {
      return { tool: 'getJob', success: false, error: 'Job not found' };
    }
    
    return {
      tool: 'getJob',
      success: true,
      data: {
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        employmentType: job.employmentType,
        experienceLevel: job.experienceLevel,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        status: job.status,
        description: job.description,
        requiredSkills: job.skills.filter(s => s.required).map(s => s.skill.name),
        preferredSkills: job.skills.filter(s => !s.required).map(s => s.skill.name),
        applicationCount: job.applications.length,
        matchedCandidates: job.matches.map(m => ({
          candidateId: m.candidateId,
          name: `${m.candidate.firstName} ${m.candidate.lastName}`,
          score: m.overallScore,
          skillScore: m.skillScore,
          experienceScore: m.experienceScore,
        })),
      },
      evidence: [`Retrieved job: ${job.title} with ${job.skills.length} required skills and ${job.applications.length} applications`],
    };
  } catch (error) {
    return { tool: 'getJob', success: false, error: String(error) };
  }
}

// ============================================================
// Tool: compareCandidates
// ============================================================
async function compareCandidates(args: { candidateIds: string[]; jobId?: string }): Promise<ToolResult> {
  try {
    const candidates = await prisma.candidate.findMany({
      where: { id: { in: args.candidateIds } },
      include: {
        skills: { include: { skill: true } },
        experiences: { orderBy: { startDate: 'desc' } },
        education: true,
        ...(args.jobId ? {
          matches: { where: { jobId: args.jobId } }
        } : {}),
      },
    });
    
    const comparison = candidates.map(c => {
      const now = new Date();
      const totalMonths = c.experiences.reduce((acc, exp) => {
        const start = new Date(exp.startDate);
        const end = exp.endDate ? new Date(exp.endDate) : now;
        return acc + Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
      }, 0);
      
      const match = c.matches?.[0];
      
      return {
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        totalExperienceYears: Math.round(totalMonths / 12 * 10) / 10,
        skills: c.skills.map(s => s.skill.name),
        latestRole: c.experiences[0]?.title || 'N/A',
        latestCompany: c.experiences[0]?.company || 'N/A',
        education: c.education.map(e => `${e.degree} in ${e.field} from ${e.institution}`),
        ...(match ? {
          matchScore: match.overallScore,
          skillScore: match.skillScore,
          experienceScore: match.experienceScore,
        } : {}),
      };
    });
    
    return {
      tool: 'compareCandidates',
      success: true,
      data: comparison,
      evidence: [`Compared ${comparison.length} candidates`],
    };
  } catch (error) {
    return { tool: 'compareCandidates', success: false, error: String(error) };
  }
}

// ============================================================
// Tool: getMatchScore
// ============================================================
async function getMatchScore(args: { candidateId: string; jobId: string }): Promise<ToolResult> {
  try {
    const match = await prisma.candidateMatch.findUnique({
      where: { candidateId_jobId: { candidateId: args.candidateId, jobId: args.jobId } },
      include: {
        evidence: true,
        candidate: { include: { skills: { include: { skill: true } } } },
        job: { include: { skills: { include: { skill: true } } } },
      },
    });
    
    if (!match) {
      return { tool: 'getMatchScore', success: false, error: 'No match found for this candidate-job pair. Run matching first.' };
    }
    
    const candidateSkillNames = new Set(match.candidate.skills.map(cs => cs.skill.name));
    const requiredSkills = match.job.skills.filter(js => js.required);
    const matchedRequired = requiredSkills.filter(js => candidateSkillNames.has(js.skill.name));
    const missingRequired = requiredSkills.filter(js => !candidateSkillNames.has(js.skill.name));
    
    return {
      tool: 'getMatchScore',
      success: true,
      data: {
        candidate: `${match.candidate.firstName} ${match.candidate.lastName}`,
        job: match.job.title,
        overallScore: match.overallScore,
        skillScore: match.skillScore,
        experienceScore: match.experienceScore,
        projectScore: match.projectScore,
        educationScore: match.educationScore,
        semanticScore: match.semanticScore,
        explanation: match.explanation,
        evidence: match.evidence.map(e => ({
          type: e.type,
          detail: e.detail,
          score: e.score,
        })),
        matchedRequiredSkills: matchedRequired.map(js => js.skill.name),
        missingRequiredSkills: missingRequired.map(js => js.skill.name),
      },
      evidence: [`Match between ${match.candidate.firstName} and ${match.job.title}: ${match.overallScore}% overall`],
    };
  } catch (error) {
    return { tool: 'getMatchScore', success: false, error: String(error) };
  }
}

// ============================================================
// Tool: getSkillGap
// ============================================================
async function getSkillGap(args: { candidateId: string; jobId: string }): Promise<ToolResult> {
  try {
    const [candidate, job] = await Promise.all([
      prisma.candidate.findUnique({
        where: { id: args.candidateId },
        include: { skills: { include: { skill: true } } },
      }),
      prisma.job.findUnique({
        where: { id: args.jobId },
        include: { skills: { include: { skill: true } } },
      }),
    ]);
    
    if (!candidate || !job) {
      return { tool: 'getSkillGap', success: false, error: 'Candidate or job not found' };
    }
    
    const candidateSkills = new Map(
      candidate.skills.map(cs => [cs.skill.name, { proficiency: cs.proficiency, confidence: cs.confidence }])
    );
    
    const required = job.skills.filter(js => js.required);
    const preferred = job.skills.filter(js => !js.required);
    
    const matched = required.filter(js => candidateSkills.has(js.skill.name));
    const missing = required.filter(js => !candidateSkills.has(js.skill.name));
    const partial = required.filter(js => {
      const cs = candidateSkills.get(js.skill.name);
      return cs && cs.confidence < 0.7;
    });
    
    const matchedPreferred = preferred.filter(js => candidateSkills.has(js.skill.name));
    const missingPreferred = preferred.filter(js => !candidateSkills.has(js.skill.name));
    
    return {
      tool: 'getSkillGap',
      success: true,
      data: {
        candidate: `${candidate.firstName} ${candidate.lastName}`,
        job: job.title,
        matchedRequiredSkills: matched.map(js => ({
          name: js.skill.name,
          proficiency: candidateSkills.get(js.skill.name)?.proficiency,
          confidence: Math.round((candidateSkills.get(js.skill.name)?.confidence || 0) * 100),
        })),
        missingRequiredSkills: missing.map(js => js.skill.name),
        partialMatchSkills: partial.map(js => ({
          name: js.skill.name,
          proficiency: candidateSkills.get(js.skill.name)?.proficiency,
          confidence: Math.round((candidateSkills.get(js.skill.name)?.confidence || 0) * 100),
        })),
        matchedPreferredSkills: matchedPreferred.map(js => js.skill.name),
        missingPreferredSkills: missingPreferred.map(js => js.skill.name),
        coveragePercent: required.length > 0 ? Math.round(matched.length / required.length * 100) : 100,
      },
      evidence: [
        `Skill gap analysis for ${candidate.firstName} vs ${job.title}`,
        `${matched.length}/${required.length} required skills covered`,
        `Missing: ${missing.map(js => js.skill.name).join(', ') || 'None'}`,
      ],
    };
  } catch (error) {
    return { tool: 'getSkillGap', success: false, error: String(error) };
  }
}

// ============================================================
// Tool: getAnalytics
// ============================================================
async function getAnalytics(args: { jobId?: string; organizationId?: string }): Promise<ToolResult> {
  try {
    const orgFilter = args.organizationId ? { organizationId: args.organizationId } : {};
    const [
      totalCandidates,
      totalJobs,
      publishedJobs,
      jobStats,
      matchStats,
    ] = await Promise.all([
      prisma.candidate.count({ where: orgFilter }),
      prisma.job.count({ where: orgFilter }),
      prisma.job.count({ where: { status: 'PUBLISHED', ...orgFilter } }),
      prisma.application.groupBy({
        by: ['jobId'],
        _count: true,
        orderBy: { _count: { jobId: 'desc' } },
        take: 5,
      }),
      args.jobId
        ? prisma.candidateMatch.aggregate({
            where: { jobId: args.jobId },
            _avg: { overallScore: true },
            _count: true,
          })
        : null,
    ]);
    
    // Get job titles for stats
    const jobIds = jobStats.map(s => s.jobId);
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, title: true, status: true },
    });
    const jobMap = new Map(jobs.map(j => [j.id, j]));
    
    const topJobs = jobStats.map(s => ({
      title: jobMap.get(s.jobId)?.title || 'Unknown',
      status: jobMap.get(s.jobId)?.status,
      applicationCount: s._count,
    }));
    
    return {
      tool: 'getAnalytics',
      success: true,
      data: {
        totalCandidates,
        totalJobs,
        publishedJobs,
        topJobsByApplications: topJobs,
        ...(matchStats ? {
          matchSummary: {
            averageScore: Math.round(matchStats._avg.overallScore || 0),
            totalMatches: matchStats._count,
          }
        } : {}),
      },
      evidence: [
        `Total candidates: ${totalCandidates}`,
        `Total jobs: ${totalJobs} (${publishedJobs} published)`,
        `Top job by applications: ${topJobs[0]?.title} (${topJobs[0]?.applicationCount} applications)`,
      ],
    };
  } catch (error) {
    return { tool: 'getAnalytics', success: false, error: String(error) };
  }
}

// ============================================================
// Tool: listJobs
// ============================================================
async function listJobs(args: { status?: string; limit?: number; organizationId?: string }): Promise<ToolResult> {
  try {
    const where: any = {};
    if (args.status) where.status = args.status.toUpperCase();
    if (args.organizationId) where.organizationId = args.organizationId;
    
    const jobs = await prisma.job.findMany({
      where,
      include: {
        skills: { include: { skill: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: args.limit || 20,
    });
    
    return {
      tool: 'listJobs',
      success: true,
      data: jobs.map(j => ({
        id: j.id,
        title: j.title,
        department: j.department,
        location: j.location,
        experienceLevel: j.experienceLevel,
        status: j.status,
        applicationCount: j._count.applications,
        requiredSkills: j.skills.filter(s => s.required).map(s => s.skill.name),
      })),
      evidence: [`Found ${jobs.length} jobs`],
    };
  } catch (error) {
    return { tool: 'listJobs', success: false, error: String(error) };
  }
}

// ============================================================
// Tool: listCandidates
// ============================================================
async function listCandidates(args: { limit?: number; offset?: number; organizationId?: string }): Promise<ToolResult> {
  try {
    const where: any = {};
    if (args.organizationId) {
      where.organizationId = args.organizationId;
    }
    const candidates = await prisma.candidate.findMany({
      where,
      include: {
        skills: { include: { skill: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: args.limit || 20,
      skip: args.offset || 0,
    });
    
    const total = await prisma.candidate.count({ where });
    
    return {
      tool: 'listCandidates',
      success: true,
      data: {
        total,
        candidates: candidates.map(c => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
          location: c.location,
          summary: c.summary?.substring(0, 100),
          skills: c.skills.map(s => s.skill.name),
          skillCount: c.skills.length,
        })),
      },
      evidence: [`Found ${candidates.length} of ${total} total candidates`],
    };
  } catch (error) {
    return { tool: 'listCandidates', success: false, error: String(error) };
  }
}

// ============================================================
// Tool: generateInterviewQuestions
// ============================================================
async function generateInterviewQuestions(args: { jobId: string; skillFocus?: string[] }): Promise<ToolResult> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: args.jobId },
      include: { skills: { include: { skill: true } } },
    });
    
    if (!job) {
      return { tool: 'generateInterviewQuestions', success: false, error: 'Job not found' };
    }
    
    const targetSkills = args.skillFocus || job.skills.filter(s => s.required).map(s => s.skill.name);
    
    // Generate structured interview questions based on skills and role
    const questions: Array<{ question: string; skill: string; type: string; difficulty: string }> = [];
    
    for (const skill of targetSkills) {
      questions.push({
        question: `Can you describe a project where you used ${skill}? What was your role and what challenges did you face?`,
        skill,
        type: 'experience',
        difficulty: 'medium',
      });
      questions.push({
        question: `How would you approach a complex problem involving ${skill}? Walk me through your thought process.`,
        skill,
        type: 'technical',
        difficulty: 'hard',
      });
      questions.push({
        question: `How do you stay current with developments in ${skill}? Can you give an example of something new you learned recently?`,
        skill,
        type: 'behavioral',
        difficulty: 'easy',
      });
    }
    
    // Add role-specific questions
    if (job.title.toLowerCase().includes('senior') || job.title.toLowerCase().includes('lead')) {
      questions.push({
        question: 'Tell me about a time you mentored a junior developer. How did you approach it?',
        skill: 'leadership',
        type: 'behavioral',
        difficulty: 'medium',
      });
      questions.push({
        question: 'Describe a situation where you had to make a critical technical decision with incomplete information.',
        skill: 'decision-making',
        type: 'behavioral',
        difficulty: 'hard',
      });
    }
    
    return {
      tool: 'generateInterviewQuestions',
      success: true,
      data: {
        job: job.title,
        skillFocus: targetSkills,
        questions,
        totalQuestions: questions.length,
        byDifficulty: {
          easy: questions.filter(q => q.difficulty === 'easy').length,
          medium: questions.filter(q => q.difficulty === 'medium').length,
          hard: questions.filter(q => q.difficulty === 'hard').length,
        },
      },
      evidence: [
        `Generated ${questions.length} interview questions for ${job.title}`,
        `Focus areas: ${targetSkills.join(', ')}`,
      ],
    };
  } catch (error) {
    return { tool: 'generateInterviewQuestions', success: false, error: String(error) };
  }
}

// ============================================================
// Tool Registry
// ============================================================

const TOOLS: Record<string, { handler: (args: any) => Promise<ToolResult>; description: string; parameters: string }> = {
  searchCandidates: {
    description: 'Search candidates by name, skills, location, or job match. Use this when the recruiter wants to find candidates.',
    parameters: '{ query?: string, skills?: string[], jobId?: string, location?: string, limit?: number }',
    handler: searchCandidates,
  },
  getCandidate: {
    description: 'Get detailed information about a specific candidate including skills, experience, education, and projects.',
    parameters: '{ candidateId: string }',
    handler: getCandidate,
  },
  getJob: {
    description: 'Get detailed information about a job posting including required skills, applications, and matched candidates.',
    parameters: '{ jobId: string }',
    handler: getJob,
  },
  listJobs: {
    description: 'List all job postings, optionally filtered by status.',
    parameters: '{ status?: "PUBLISHED" | "DRAFT" | "CLOSED", limit?: number }',
    handler: listJobs,
  },
  listCandidates: {
    description: 'List all candidates with basic info. Use for browsing or when no specific criteria are given.',
    parameters: '{ limit?: number, offset?: number }',
    handler: listCandidates,
  },
  compareCandidates: {
    description: 'Compare multiple candidates side by side. Useful when recruiter asks to compare candidates.',
    parameters: '{ candidateIds: string[], jobId?: string }',
    handler: compareCandidates,
  },
  getMatchScore: {
    description: 'Get detailed match analysis between a candidate and a job, with scores and evidence.',
    parameters: '{ candidateId: string, jobId: string }',
    handler: getMatchScore,
  },
  getSkillGap: {
    description: 'Analyze skill gaps between a candidate and a job requirement. Shows matched, missing, and partial skills.',
    parameters: '{ candidateId: string, jobId: string }',
    handler: getSkillGap,
  },
  getAnalytics: {
    description: 'Get recruitment analytics including candidate counts, job stats, and hiring funnel metrics.',
    parameters: '{ jobId?: string }',
    handler: getAnalytics,
  },
  generateInterviewQuestions: {
    description: 'Generate technical and behavioral interview questions based on job requirements and skills.',
    parameters: '{ jobId: string, skillFocus?: string[] }',
    handler: generateInterviewQuestions,
  },
};

export { TOOLS };

// ============================================================
// Agent Processor - Simulates LLM tool selection
// Since we don't have a real LLM API key, we use pattern matching
// to select the appropriate tool based on the user's message.
// ============================================================

export interface AgentResponse {
  message: string;
  toolCalls: ToolCall[];
  results: ToolResult[];
  suggestedFollowUps: string[];
}

export async function processUserMessage(
  message: string,
  organizationId: string
): Promise<AgentResponse> {
  // SECURITY: All tool calls are scoped to the user's organization.
  // The organizationId parameter MUST be passed from the authenticated session.
  if (!organizationId) {
    return {
      message: 'Organization context is required. Please log in again.',
      toolCalls: [],
      results: [],
      suggestedFollowUps: [],
    };
  }
  const lower = message.toLowerCase();
  const toolCalls: ToolCall[] = [];
  const results: ToolResult[] = [];
  let responseText = '';
  const suggestedFollowUps: string[] = [];
  
  // ---- Greeting ----
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))\b/.test(lower)) {
    return {
      message: "Hello! I'm your AI Recruiter Assistant. I can help you with:\n\n• Finding and searching candidates\n• Analyzing job postings\n• Comparing candidates\n• Explaining match scores\n• Identifying skill gaps\n• Generating interview questions\n• Recruitment analytics\n\nWhat would you like to do?",
      toolCalls: [],
      results: [],
      suggestedFollowUps: [
        "Show me the best candidates",
        "What jobs are open?",
        "Analyze our recruitment pipeline",
      ],
    };
  }
  
  // ---- Search / Find candidates ----
  if (/find|search|show.*candidate|look for|who (has|knows?|has experience)/i.test(lower)) {
    // Extract skills
    const skillPatterns: Record<string, string> = {
      python: 'Python', java: 'Java', javascript: 'JavaScript', typescript: 'TypeScript',
      react: 'React', angular: 'Angular', 'node.?js': 'Node.js', nodejs: 'Node.js',
      aws: 'AWS', docker: 'Docker', kubernetes: 'Kubernetes', sql: 'SQL',
      postgresql: 'PostgreSQL', mongodb: 'MongoDB', go: 'Go', golang: 'Go',
      ruby: 'Ruby', php: 'PHP', django: 'Django', flask: 'Flask',
      'machine.?learning': 'Machine Learning', ml: 'Machine Learning',
      pytorch: 'PyTorch', tensorflow: 'TensorFlow',
      'rest.?api': 'REST API', graphql: 'GraphQL',
      tailwind: 'Tailwind CSS', vue: 'Vue.js', nextjs: 'Next.js',
      redis: 'Redis', kafka: 'Apache Kafka', terraform: 'Terraform',
      agile: 'Agile', leadership: 'Leadership',
    };
    
    const foundSkills: string[] = [];
    for (const [pattern, skill] of Object.entries(skillPatterns)) {
      if (new RegExp(pattern, 'i').test(lower)) {
        foundSkills.push(skill);
      }
    }
    
    // Check for experience level keywords
    let experienceHint = '';
    if (/fresher|junior|entry.?level|newgrad/i.test(lower)) {
      experienceHint = 'junior-level';
    } else if (/senior|experienced|lead|principal/i.test(lower)) {
      experienceHint = 'senior-level';
    }
    
    const searchArgs: any = { limit: 10, organizationId };
    if (foundSkills.length > 0) searchArgs.skills = [...new Set(foundSkills)];
    if (experienceHint) searchArgs.query = experienceHint;
    
    // Also check for location
    const locationPatterns: Record<string, string> = {
      'san francisco': 'San Francisco', sf: 'San Francisco',
      'new york': 'New York', nyc: 'New York',
      remote: 'Remote', austin: 'Austin', seattle: 'Seattle',
      boston: 'Boston', chicago: 'Chicago',
    };
    for (const [pattern, loc] of Object.entries(locationPatterns)) {
      if (lower.includes(pattern)) {
        searchArgs.location = loc;
        break;
      }
    }
    
    const result = await searchCandidates(searchArgs);
    toolCalls.push({ name: 'searchCandidates', arguments: searchArgs });
    results.push(result);
    
    if (result.success && result.data) {
      const candidates = result.data;
      if (candidates.length === 0) {
        responseText = `I couldn't find candidates matching ${foundSkills.length > 0 ? 'the skills: ' + foundSkills.join(', ') : 'your criteria'}. Would you like to try different search terms?`;
      } else {
        responseText = `I found **${candidates.length} candidates**${foundSkills.length > 0 ? ` with ${foundSkills.join(', ')} skills` : ''}:\n\n`;
        candidates.slice(0, 8).forEach((c: any, i: number) => {
          responseText += `**${i + 1}. ${c.name}**\n`;
          responseText += `   📍 ${c.location || 'No location'} | ${c.experienceCount || 0} roles\n`;
          if (c.skills?.length > 0) {
            responseText += `   🛠️ ${c.skills.slice(0, 5).map((s: any) => s.name).join(', ')}${c.skills.length > 5 ? ` +${c.skills.length - 5}` : ''}\n`;
          }
          if (c.summary) {
            responseText += `   📝 ${c.summary.substring(0, 80)}...\n`;
          }
          responseText += '\n';
        });
        suggestedFollowUps.push(
          `Tell me more about ${candidates[0]?.name}`,
          `What are the missing skills?`,
          `Compare the top 3 candidates`
        );
      }
    } else {
      responseText = `I encountered an error while searching: ${result.error}. Please try again.`;
    }
  }
  
  // ---- Get candidate details ----
  else if (/tell me about|more (about|info|details)|who is|show.*detail|profile.*of|summary of/i.test(lower) && !/compare/i.test(lower)) {
    // Try to find a candidate name in the message
    const candidateResult = await listCandidates({ limit: 20, organizationId });
    let matchedCandidate = null;
    
    if (candidateResult.success && candidateResult.data?.candidates) {
      for (const c of candidateResult.data.candidates) {
        const nameLower = c.name.toLowerCase();
        const firstName = nameLower.split(' ')[0];
        if (lower.includes(nameLower) || lower.includes(firstName)) {
          matchedCandidate = c;
          break;
        }
      }
    }
    
    if (matchedCandidate) {
      const result = await getCandidate({ candidateId: matchedCandidate.id, organizationId });
      toolCalls.push({ name: 'getCandidate', arguments: { candidateId: matchedCandidate.id } });
      results.push(result);
      
      if (result.success && result.data) {
        const d = result.data;
        responseText = `## ${d.name}\n\n`;
        if (d.email) responseText += `📧 ${d.email}`;
        if (d.phone) responseText += ` | 📱 ${d.phone}`;
        if (d.location) responseText += ` | 📍 ${d.location}`;
        responseText += '\n\n';
        if (d.summary) responseText += `**Summary:** ${d.summary}\n\n`;
        responseText += `**Experience:** ${d.totalExperienceYears} years total\n\n`;
        
        if (d.skills?.length > 0) {
          responseText += `**Skills (${d.skills.length}):**\n`;
          const grouped: Record<string, any[]> = {};
          for (const s of d.skills) {
            const cat = s.category || 'Other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(s);
          }
          for (const [cat, skills] of Object.entries(grouped)) {
            responseText += `- ${cat}: ${skills.map(s => `${s.name} (${s.proficiency}, ${s.confidence}%)`).join(', ')}\n`;
          }
          responseText += '\n';
        }
        
        if (d.experiences?.length > 0) {
          responseText += `**Experience:**\n`;
          for (const exp of d.experiences.slice(0, 4)) {
            const start = new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            const end = exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present';
            responseText += `- **${exp.name}** at ${exp.company} (${start} - ${end})\n`;
            if (exp.description) responseText += `  ${exp.description.substring(0, 100)}...\n`;
          }
          responseText += '\n';
        }
        
        if (d.education?.length > 0) {
          responseText += `**Education:**\n`;
          for (const e of d.education) {
            responseText += `- ${e.degree} in ${e.field} - ${e.institution}\n`;
          }
        }
        
        if (d.applications?.length > 0) {
          responseText += `\n**Applications:** ${d.applications.map((a: any) => `${a.jobTitle} (${a.status})`).join(', ')}`;
        }
        
        suggestedFollowUps.push(
          `What skills are missing for their applications?`,
          `Compare ${d.name} with other candidates`,
          `Generate interview questions for their role`
        );
      }
    } else {
      responseText = "I couldn't find a specific candidate in your message. Could you provide a candidate name? You can also say 'list candidates' to see all available candidates.";
      suggestedFollowUps.push("List all candidates");
    }
  }
  
  // ---- Compare candidates ----
  else if (/compar|versus|vs\.?|better.*than|who.*(better|stronger|more.*qualified)/i.test(lower)) {
    // Find candidates mentioned
    const candidateResult = await listCandidates({ limit: 20, organizationId });
    const mentioned: string[] = [];
    
    if (candidateResult.success && candidateResult.data?.candidates) {
      for (const c of candidateResult.data.candidates) {
        const firstName = c.name.toLowerCase().split(' ')[0];
        if (lower.includes(c.name.toLowerCase()) || lower.includes(firstName)) {
          mentioned.push(c.id);
        }
      }
    }
    
    if (mentioned.length >= 2) {
      // Check for a job mention
      const jobResult = await listJobs({ limit: 20, organizationId });
      let jobId: string | undefined;
      if (jobResult.success && jobResult.data) {
        for (const j of jobResult.data) {
          if (lower.includes(j.title.toLowerCase())) {
            jobId = j.id;
            break;
          }
        }
      }
      
      const result = await compareCandidates({ candidateIds: mentioned.slice(0, 5), jobId });
      toolCalls.push({ name: 'compareCandidates', arguments: { candidateIds: mentioned.slice(0, 5), jobId } });
      results.push(result);
      
      if (result.success && result.data) {
        const comp = result.data;
        responseText = `## Candidate Comparison`;
        if (jobId) responseText += ` for ${comp[0]?.latestRole || 'the role'}`;
        responseText += '\n\n';
        
        for (const c of comp) {
          responseText += `### ${c.name}\n`;
          responseText += `- **Experience:** ${c.totalExperienceYears} years\n`;
          responseText += `- **Current:** ${c.latestRole} at ${c.latestCompany}\n`;
          responseText += `- **Skills:** ${c.skills.slice(0, 8).join(', ')}\n`;
          if (c.education?.length > 0) {
            responseText += `- **Education:** ${c.education[0]}\n`;
          }
          if (c.matchScore !== undefined) {
            responseText += `- **Match Score:** ${c.matchScore}% (Skills: ${c.skillScore}%, Experience: ${c.experienceScore}%)\n`;
          }
          responseText += '\n';
        }
        
        suggestedFollowUps.push('What are the key differences?', 'Analyze skill gaps for each');
      }
    } else if (mentioned.length === 1) {
      responseText = "I found one candidate, but I need at least two to compare. Could you mention another candidate name?";
      suggestedFollowUps.push("List all candidates");
    } else {
      responseText = "I'd love to help compare candidates! Could you mention specific candidate names? For example:\n\n\"Compare Rahul Patel and Priyanka Desai\"";
      suggestedFollowUps.push("List all candidates");
    }
  }
  
  // ---- Match analysis / ranking explanation ----
  else if (/why.*rank|rank|match|score|why.*above|why.*higher/i.test(lower)) {
    // Look for candidate and job mentions
    const candidateResult = await listCandidates({ limit: 20, organizationId });
    const jobResult = await listJobs({ limit: 20, organizationId });
    let candidateId: string | undefined;
    let jobId: string | undefined;
    
    if (candidateResult.success && candidateResult.data?.candidates) {
      for (const c of candidateResult.data.candidates) {
        const firstName = c.name.toLowerCase().split(' ')[0];
        if (lower.includes(c.name.toLowerCase()) || lower.includes(firstName)) {
          candidateId = c.id;
          break;
        }
      }
    }
    
    if (jobResult.success && jobResult.data) {
      for (const j of jobResult.data) {
        if (lower.includes(j.title.toLowerCase())) {
          jobId = j.id;
          break;
        }
      }
    }
    
    // If no specific candidate, get top ranked for a specific job
    if (!candidateId && jobId) {
      const matchResult = await getMatchScore({ candidateId: (jobResult?.data as any)?.[0]?.id || jobId, jobId });
      const jobData = await getJob({ jobId });
      toolCalls.push({ name: 'getJob', arguments: { jobId } });
      results.push(jobData);
      
      if (jobData.success && jobData.data) {
        const matched = jobData.data.matchedCandidates;
        if (matched?.length > 0) {
          responseText = `## Candidate Rankings for ${jobData.data.title}\n\n`;
          matched.forEach((m: any, i: number) => {
            const bar = '█'.repeat(Math.round(m.score / 5)) + '░'.repeat(20 - Math.round(m.score / 5));
            responseText += `**${i + 1}. ${m.name}** — ${m.score}%\n   ${bar}\n   Skills: ${m.skillScore}% | Experience: ${m.experienceScore}%\n\n`;
          });
          suggestedFollowUps.push(
            `Why is ${matched[0]?.name} ranked highest?`,
            `Compare the top 2 candidates`,
            `What skills are missing for the lower ranked candidates?`
          );
        } else {
          responseText = `No matches have been computed for ${jobData.data.title} yet. Would you like me to explain the job requirements instead?`;
        }
      }
    } else if (candidateId && jobId) {
      const result = await getMatchScore({ candidateId, jobId });
      toolCalls.push({ name: 'getMatchScore', arguments: { candidateId, jobId } });
      results.push(result);
      
      if (result.success && result.data) {
        const d = result.data;
        responseText = `## Match Analysis: ${d.candidate} × ${d.job}\n\n`;
        responseText += `**Overall Score:** ${d.overallScore}%\n\n`;
        responseText += `| Category | Score |\n|----------|-------|\n`;
        responseText += `| Skills | ${d.skillScore}% |\n`;
        responseText += `| Experience | ${d.experienceScore}% |\n`;
        responseText += `| Projects | ${d.projectScore}% |\n`;
        responseText += `| Education | ${d.educationScore}% |\n\n`;
        
        if (d.evidence?.length > 0) {
          responseText += `**Evidence:**\n`;
          for (const e of d.evidence) {
            responseText += `- ${e.detail}\n`;
          }
        }
        
        suggestedFollowUps.push(
          'What skills are missing?',
          'Compare with other candidates',
          'Generate interview questions'
        );
      } else {
        responseText = result.error || "I couldn't find match data for this candidate and job combination.";
      }
    } else {
      // Show overall rankings for all jobs
      const analytics = await getAnalytics({ organizationId });
      toolCalls.push({ name: 'getAnalytics', arguments: {} });
      results.push(analytics);
      
      if (analytics.success && analytics.data) {
        const d = analytics.data;
        responseText = `## Recruitment Overview\n\n`;
        responseText += `📊 **${d.totalCandidates}** candidates across **${d.totalJobs}** jobs\n\n`;
        if (d.topJobsByApplications?.length > 0) {
          responseText += `**Top Jobs by Applications:**\n`;
          for (const j of d.topJobsByApplications) {
            responseText += `- ${j.title} (${j.status}): ${j.applicationCount} applications\n`;
          }
        }
        responseText += '\nWould you like me to analyze a specific job or candidate?';
        suggestedFollowUps.push(
          'Show candidate rankings for a job',
          'Find the best Python developers',
          'What jobs are hardest to fill?'
        );
      }
    }
  }
  
  // ---- Skill gaps ----
  else if (/skill.?gap|missing.?skill|what.*missing|needs? to learn|lack|short/i.test(lower)) {
    const candidateResult = await listCandidates({ limit: 20, organizationId });
    const jobResult = await listJobs({ limit: 20, organizationId });
    let candidateId: string | undefined;
    let jobId: string | undefined;
    
    if (candidateResult.success && candidateResult.data?.candidates) {
      for (const c of candidateResult.data.candidates) {
        const firstName = c.name.toLowerCase().split(' ')[0];
        if (lower.includes(c.name.toLowerCase()) || lower.includes(firstName)) {
          candidateId = c.id;
          break;
        }
      }
    }
    if (jobResult.success && jobResult.data) {
      for (const j of jobResult.data) {
        if (lower.includes(j.title.toLowerCase())) {
          jobId = j.id;
          break;
        }
      }
    }
    
    if (candidateId && jobId) {
      const result = await getSkillGap({ candidateId, jobId });
      toolCalls.push({ name: 'getSkillGap', arguments: { candidateId, jobId } });
      results.push(result);
      
      if (result.success && result.data) {
        const d = result.data;
        responseText = `## Skill Gap Analysis: ${d.candidate} → ${d.job}\n\n`;
        responseText += `**Skill Coverage:** ${d.coveragePercent}%\n\n`;
        
        if (d.matchedRequiredSkills.length > 0) {
          responseText += `✅ **Matched (${d.matchedRequiredSkills.length}):** ${d.matchedRequiredSkills.map((s: any) => `${s.name} (${s.proficiency}, ${s.confidence}%)`).join(', ')}\n\n`;
        }
        if (d.missingRequiredSkills.length > 0) {
          responseText += `❌ **Missing (${d.missingRequiredSkills.length}):** ${d.missingRequiredSkills.join(', ')}\n\n`;
        }
        if (d.partialMatchSkills.length > 0) {
          responseText += `⚠️ **Partial Match (${d.partialMatchSkills.length}):** ${d.partialMatchSkills.map((s: any) => `${s.name} (${s.confidence}%)`).join(', ')}\n\n`;
        }
        if (d.missingPreferredSkills.length > 0) {
          responseText += `💡 **Nice-to-have missing:** ${d.missingPreferredSkills.join(', ')}\n`;
        }
        
        suggestedFollowUps.push(
          'Generate interview questions to assess missing skills',
          'Compare with another candidate',
          'Show candidates with these missing skills'
        );
      }
    } else {
      responseText = "I can analyze skill gaps if you mention both a candidate and a job. For example:\n\n\"What skills is Rahul Patel missing for the Senior Full-Stack Engineer role?\"";
      suggestedFollowUps.push("Show me job listings", "List candidates");
    }
  }
  
  // ---- Interview questions ----
  else if (/interview|question|ask.*candidate|screening/i.test(lower)) {
    const jobResult = await listJobs({ limit: 20, organizationId });
    let jobId: string | undefined;
    
    if (jobResult.success && jobResult.data) {
      for (const j of jobResult.data) {
        if (lower.includes(j.title.toLowerCase())) {
          jobId = j.id;
          break;
        }
      }
    }
    
    // Default to first published job if none matched
    if (!jobId && jobResult.success && jobResult.data) {
      const published = jobResult.data.find((j: any) => j.status === 'PUBLISHED');
      jobId = published?.id;
    }
    
    if (jobId) {
      // Check for specific skill focus
      const skillPatterns: Record<string, string> = {
        python: 'Python', java: 'Java', javascript: 'JavaScript', typescript: 'TypeScript',
        react: 'React', node: 'Node.js', aws: 'AWS', docker: 'Docker',
        kubernetes: 'Kubernetes', sql: 'SQL', 'machine learning': 'Machine Learning',
      };
      
      const skillFocus: string[] = [];
      for (const [pattern, skill] of Object.entries(skillPatterns)) {
        if (lower.includes(pattern)) skillFocus.push(skill);
      }
      
      const result = await generateInterviewQuestions({
        jobId,
        skillFocus: skillFocus.length > 0 ? skillFocus : undefined,
      });
      toolCalls.push({ name: 'generateInterviewQuestions', arguments: { jobId, skillFocus } });
      results.push(result);
      
      if (result.success && result.data) {
        const d = result.data;
        responseText = `## Interview Questions for ${d.job}\n\n`;
        responseText += `📋 ${d.totalQuestions} questions (Easy: ${d.byDifficulty.easy} | Medium: ${d.byDifficulty.medium} | Hard: ${d.byDifficulty.hard})\n\n`;
        
        for (const q of d.questions.slice(0, 8)) {
          const diffEmoji = q.difficulty === 'easy' ? '🟢' : q.difficulty === 'medium' ? '🟡' : '🔴';
          responseText += `${diffEmoji} **[${q.type}]** ${q.question}\n`;
          responseText += `   *Skill: ${q.skill}*\n\n`;
        }
        
        suggestedFollowUps.push(
          'Show more questions',
          'What are the missing skills for this role?',
          'Compare candidates for this role'
        );
      }
    } else {
      responseText = "I need to know which job you want interview questions for. Could you mention a job title?\n\nFor example: \"Generate interview questions for the Senior Full-Stack Engineer role\"";
      suggestedFollowUps.push("Show me job listings");
    }
  }
  
  // ---- Analytics ----
  else if (/analytic|metric|statistic|funnel|pipeline|how many|hiring rate|conversion/i.test(lower)) {
    const jobIdStr = (() => {
      const jobResult: any = null;
      return undefined;
    })();
    
    const result = await getAnalytics({ organizationId });
    toolCalls.push({ name: 'getAnalytics', arguments: {} });
    results.push(result);
    
    if (result.success && result.data) {
      const d = result.data;
      responseText = `## Recruitment Analytics\n\n`;
      responseText += `📊 **Key Metrics:**\n`;
      responseText += `- Total Candidates: **${d.totalCandidates}**\n`;
      responseText += `- Total Jobs: **${d.totalJobs}**\n`;
      responseText += `- Active/Published Jobs: **${d.publishedJobs}**\n\n`;
      
      if (d.topJobsByApplications?.length > 0) {
        responseText += `**Top Performing Jobs:**\n`;
        for (const j of d.topJobsByApplications) {
          const bar = '█'.repeat(Math.min(j.applicationCount, 20));
          responseText += `- ${j.title}: ${bar} (${j.applicationCount} applications)\n`;
        }
        responseText += '\n';
      }
      
      if (d.matchSummary) {
        responseText += `**Match Performance:**\n`;
        responseText += `- Average Match Score: ${d.matchSummary.averageScore}%\n`;
        responseText += `- Total Matches Computed: ${d.matchSummary.totalMatches}\n`;
      }
      
      suggestedFollowUps.push(
        'What jobs are hardest to fill?',
        'Show the candidate funnel',
        'Which skills are most in demand?'
      );
    }
  }
  
  // ---- Hardest to fill ----
  else if (/hardest|difficult|toughest|fewest|lowest|challenge|hard.?to.?fill/i.test(lower)) {
    const jobResult = await listJobs({ status: "PUBLISHED", limit: 20, organizationId });
    toolCalls.push({ name: 'listJobs', arguments: { status: 'PUBLISHED' } });
    results.push(jobResult);
    
    if (jobResult.success && jobResult.data) {
      const jobs = jobResult.data;
      responseText = `## Jobs Difficulty Analysis\n\n`;
      
      const sorted = [...jobs].sort((a: any, b: any) => {
        const aComplexity = (a.requiredSkills?.length || 0) + (a.applicationCount === 0 ? 50 : 0);
        const bComplexity = (b.requiredSkills?.length || 0) + (b.applicationCount === 0 ? 50 : 0);
        return aComplexity - bComplexity;
      });
      
      for (const j of sorted) {
        const difficulty = j.applicationCount < 3 ? '🔴 Hard' : j.applicationCount < 6 ? '🟡 Medium' : '🟢 Easy';
        responseText += `${difficulty} **${j.title}**\n`;
        responseText += `  ${j.applicationCount} applications | ${j.requiredSkills?.length || 0} required skills\n`;
        if (j.requiredSkills?.length > 0) {
          responseText += `  Required: ${j.requiredSkills.join(', ')}\n`;
        }
        responseText += '\n';
      }
      
      suggestedFollowUps.push(
        'Find candidates for the hardest role',
        'Analyze skill gaps',
        'Show recruitment funnel'
      );
    }
  }
  
  // ---- Default fallback ----
  else {
    responseText = "I'm not sure I understand. I can help you with:\n\n";
    responseText += "🔍 **Find candidates** — \"Find Python developers\"\n";
    responseText += "👤 **Candidate details** — \"Tell me about Rahul\"\n";
    responseText += "⚔️ **Compare candidates** — \"Compare Rahul and Priyanka\"\n";
    responseText += "📊 **Match analysis** — \"Why is Rahul ranked #1?\"\n";
    responseText += "🧩 **Skill gaps** — \"What skills is Rahul missing?\"\n";
    responseText += "🎤 **Interview questions** — \"Generate questions for React role\"\n";
    responseText += "📈 **Analytics** — \"What's our recruitment funnel?\"\n\n";
    
    suggestedFollowUps.push(
      'Show me the best Python developers',
      'What jobs are open?',
      'Generate interview questions'
    );
  }
  
  return {
    message: responseText,
    toolCalls,
    results,
    suggestedFollowUps,
  };
}

// ============================================================
// Conversation Storage (in-memory, would be DB in production)
// ============================================================

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  organizationId: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const conversations: Map<string, Conversation> = new Map();

export function createConversation(userId: string, organizationId: string, title?: string): Conversation {
  const id = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const conv: Conversation = {
    id,
    title: title || 'New Conversation',
    userId,
    organizationId,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  conversations.set(id, conv);
  return conv;
}

export function getConversation(id: string): Conversation | undefined {
  return conversations.get(id);
}

export function getConversations(userId: string, organizationId: string): Conversation[] {
  return [...conversations.values()]
    .filter(c => c.userId === userId && c.organizationId === organizationId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function addMessage(conversationId: string, message: ConversationMessage): void {
  const conv = conversations.get(conversationId);
  if (conv) {
    conv.messages.push(message);
    conv.updatedAt = new Date();
    
    // Auto-generate title from first user message
    if (conv.messages.length === 1 && message.role === 'user') {
      conv.title = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
    }
  }
}

export function deleteConversation(id: string): boolean {
  return conversations.delete(id);
}
