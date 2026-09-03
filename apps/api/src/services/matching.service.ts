import { PrismaClient, Prisma, SkillProficiency } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Types
// ============================================================

export interface MatchWeights {
  skills: number;        // default 0.40
  experience: number;    // default 0.20
  projects: number;      // default 0.20
  education: number;     // default 0.10
  semantic: number;      // default 0.10
}

export interface SkillMatch {
  skillId: string;
  skillName: string;
  status: 'matched' | 'partial' | 'missing';
  proficiency?: string;
  confidence?: number;
  evidence?: string;
  required: boolean;
  weight: number;
}

export interface MatchEvidence {
  type: string;
  detail: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface MatchResult {
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  overallScore: number;
  categoryScores: {
    skills: number;
    experience: number;
    projects: number;
    education: number;
    semantic: number;
  };
  matchedSkills: SkillMatch[];
  missingSkills: SkillMatch[];
  partialSkills: SkillMatch[];
  evidence: MatchEvidence[];
  explanation: string;
}

export interface MatchFilters {
  jobId?: string;
  candidateId?: string;
  minScore?: number;
  maxScore?: number;
  sortBy?: 'overallScore' | 'skillScore' | 'experienceScore' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const DEFAULT_WEIGHTS: MatchWeights = {
  skills: 0.40,
  experience: 0.20,
  projects: 0.20,
  education: 0.10,
  semantic: 0.10,
};

// Proficiency to numeric score mapping
const PROFICIENCY_SCORES: Record<string, number> = {
  EXPERT: 1.0,
  ADVANCED: 0.85,
  INTERMEDIATE: 0.65,
  BEGINNER: 0.40,
  UNKNOWN: 0.30,
};

// ============================================================
// Core Matching Engine
// ============================================================

/**
 * Calculate skill match score between a candidate and a job
 */
function calculateSkillScore(
  candidateSkills: Array<{
    skillId: string;
    skillName: string;
    proficiency: string;
    confidence: number;
    evidence?: string | null;
  }>,
  jobSkills: Array<{
    skillId: string;
    skillName: string;
    required: boolean;
    weight: number;
  }>
): { score: number; matched: SkillMatch[]; missing: SkillMatch[]; partial: SkillMatch[] } {
  const candidateSkillMap = new Map(
    candidateSkills.map(cs => [cs.skillId, cs])
  );

  const matched: SkillMatch[] = [];
  const missing: SkillMatch[] = [];
  const partial: SkillMatch[] = [];

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const js of jobSkills) {
    totalWeight += js.weight;
    const cs = candidateSkillMap.get(js.skillId);

    if (cs) {
      const profScore = PROFICIENCY_SCORES[cs.proficiency] || 0.5;
      const confFactor = cs.confidence || 0.8;
      const skillScore = profScore * confFactor;

      if (skillScore >= 0.7) {
        // Strong match
        matched.push({
          skillId: js.skillId,
          skillName: js.skillName,
          status: 'matched',
          proficiency: cs.proficiency,
          confidence: cs.confidence,
          evidence: cs.evidence || undefined,
          required: js.required,
          weight: js.weight,
        });
        earnedWeight += js.weight * skillScore;
      } else if (skillScore >= 0.4) {
        // Partial match
        partial.push({
          skillId: js.skillId,
          skillName: js.skillName,
          status: 'partial',
          proficiency: cs.proficiency,
          confidence: cs.confidence,
          evidence: cs.evidence || undefined,
          required: js.required,
          weight: js.weight,
        });
        earnedWeight += js.weight * skillScore * 0.5;
      } else {
        // Weak match treated as missing
        missing.push({
          skillId: js.skillId,
          skillName: js.skillName,
          status: 'missing',
          proficiency: cs.proficiency,
          confidence: cs.confidence,
          required: js.required,
          weight: js.weight,
        });
      }
    } else {
      missing.push({
        skillId: js.skillId,
        skillName: js.skillName,
        status: 'missing',
        required: js.required,
        weight: js.weight,
      });
    }
  }

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  return { score, matched, missing, partial };
}

/**
 * Calculate experience relevance score
 */
function calculateExperienceScore(
  candidateExperience: Array<{
    title: string;
    company: string;
    description?: string | null;
    startDate: Date;
    endDate?: Date | null;
  }>,
  jobTitle: string,
  jobDescription: string | null,
  requiredYears: number
): { score: number; evidence: MatchEvidence[] } {
  const evidence: MatchEvidence[] = [];

  if (!candidateExperience.length) {
    return { score: 0, evidence: [{ type: 'experience', detail: 'No experience recorded', score: 0 }] };
  }

  // Calculate total years of experience
  const now = new Date();
  let totalMonths = 0;
  for (const exp of candidateExperience) {
    const start = new Date(exp.startDate);
    const end = exp.endDate ? new Date(exp.endDate) : now;
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, months);
  }
  const totalYears = totalMonths / 12;

  // Years of experience score
  const yearsScore = requiredYears > 0
    ? Math.min(1.0, totalYears / requiredYears)
    : Math.min(1.0, totalYears / 3);

  // Title relevance: check if job title keywords appear in experience titles
  const jobKeywords = jobTitle.toLowerCase().split(/\s+/);
  let titleMatches = 0;
  for (const exp of candidateExperience) {
    const expTitle = exp.title.toLowerCase();
    for (const kw of jobKeywords) {
      if (kw.length > 3 && expTitle.includes(kw)) {
        titleMatches++;
      }
    }
  }
  const titleScore = Math.min(1.0, titleMatches / Math.max(1, jobKeywords.length * 0.3));

  // Description relevance: check if job description keywords appear
  let descScore = 0.5; // default neutral
  if (jobDescription) {
    const descWords = jobDescription.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
    const allDescText = candidateExperience
      .map(e => (e.description || '').toLowerCase())
      .join(' ');
    let matchCount = 0;
    for (const word of descWords.slice(0, 50)) {
      if (allDescText.includes(word)) matchCount++;
    }
    descScore = Math.min(1.0, matchCount / Math.max(1, descWords.slice(0, 50).length * 0.3));
  }

  const score = Math.round(
    (yearsScore * 0.4 + titleScore * 0.35 + descScore * 0.25) * 100
  );

  // Generate evidence
  evidence.push({
    type: 'experience',
    detail: `${totalYears.toFixed(1)} years of total experience (required: ${requiredYears || 'not specified'} years)`,
    score: Math.round(yearsScore * 100),
    metadata: { totalYears, requiredYears },
  });

  if (titleMatches > 0) {
    evidence.push({
      type: 'experience',
      detail: `Title relevance: ${titleMatches} keyword matches found`,
      score: Math.round(titleScore * 100),
    });
  }

  const topExp = candidateExperience[0];
  if (topExp) {
    evidence.push({
      type: 'experience',
      detail: `Most recent role: ${topExp.title} at ${topExp.company}`,
      metadata: { company: topExp.company, title: topExp.title },
    });
  }

  return { score, evidence };
}

/**
 * Calculate project relevance score
 */
function calculateProjectScore(
  candidateProjects: Array<{
    title: string;
    description?: string | null;
    technologies?: string | string[] | null;
  }>,
  jobSkills: Array<{ skillName: string }>,
  jobDescription: string | null
): { score: number; evidence: MatchEvidence[] } {
  const evidence: MatchEvidence[] = [];

  if (!candidateProjects.length) {
    return { score: 0, evidence: [{ type: 'project', detail: 'No projects recorded', score: 0 }] };
  }

  // technologies is a String[] in the schema but historically a comma-separated
  // string in some callers — normalize both shapes.
  const projectTechList = (tech: string | string[] | null | undefined): string =>
    Array.isArray(tech) ? tech.join(', ') : String(tech ?? '');

  const jobTechSet = new Set(
    jobSkills.map(js => js.skillName.toLowerCase())
  );

  let matchCount = 0;
  let totalTechMatches = 0;

  for (const proj of candidateProjects) {
    const techs = projectTechList(proj.technologies).toLowerCase().split(/[,\s]+/).filter(Boolean);
    for (const tech of techs) {
      for (const jobTech of jobTechSet) {
        if (tech.includes(jobTech) || jobTech.includes(tech)) {
          totalTechMatches++;
          break;
        }
      }
    }

    // Check description relevance to job description
    if (jobDescription && proj.description) {
      const descWords = jobDescription.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4);
      const projWords = proj.description.toLowerCase();
      let wordMatches = 0;
      for (const w of descWords.slice(0, 30)) {
        if (projWords.includes(w)) wordMatches++;
      }
      if (wordMatches > 2) matchCount++;
    }
  }

  const techScore = Math.min(1.0, totalTechMatches / Math.max(1, jobTechSet.size * 0.5));
  const relevanceScore = Math.min(1.0, matchCount / Math.max(1, candidateProjects.length * 0.5));
  const countScore = Math.min(1.0, candidateProjects.length / 3);

  const score = Math.round((techScore * 0.5 + relevanceScore * 0.3 + countScore * 0.2) * 100);

  evidence.push({
    type: 'project',
    detail: `${candidateProjects.length} projects with ${totalTechMatches} technology matches`,
    score: Math.round(techScore * 100),
    metadata: { projectCount: candidateProjects.length, techMatches: totalTechMatches },
  });

  for (const proj of candidateProjects.slice(0, 3)) {
    evidence.push({
      type: 'project',
      detail: `"${proj.title}" — ${projectTechList(proj.technologies) || 'No technologies listed'}`,
    });
  }

  return { score, evidence };
}

/**
 * Calculate education relevance score
 */
function calculateEducationScore(
  candidateEducation: Array<{
    institution: string;
    degree?: string | null;
    field?: string | null;
  }>,
  jobDescription: string | null
): { score: number; evidence: MatchEvidence[] } {
  const evidence: MatchEvidence[] = [];

  if (!candidateEducation.length) {
    return { score: 50, evidence: [{ type: 'education', detail: 'No education recorded — scored as neutral', score: 50 }] };
  }

  let score = 50; // Base score for having education

  const hasAdvanced = candidateEducation.some(e =>
    (e.degree || '').toLowerCase().includes('master') ||
    (e.degree || '').toLowerCase().includes('phd') ||
    (e.degree || '').toLowerCase().includes('doctorate')
  );
  const hasBachelors = candidateEducation.some(e =>
    (e.degree || '').toLowerCase().includes('bachelor')
  );

  if (hasAdvanced) score = 85;
  else if (hasBachelors) score = 75;
  else score = 60;

  // Field relevance check against job description
  if (jobDescription) {
    const descLower = jobDescription.toLowerCase();
    const fields = candidateEducation.map(e => (e.field || '').toLowerCase()).filter(Boolean);
    for (const field of fields) {
      const fieldWords = field.split(/\s+/);
      for (const w of fieldWords) {
        if (w.length > 4 && descLower.includes(w)) {
          score = Math.min(100, score + 10);
          break;
        }
      }
    }
  }

  const topEdu = candidateEducation[0];
  evidence.push({
    type: 'education',
    detail: `${topEdu.degree || 'Degree'} in ${topEdu.field || 'N/A'} — ${topEdu.institution}`,
    score,
    metadata: { institution: topEdu.institution, degree: topEdu.degree, field: topEdu.field },
  });

  if (hasAdvanced) {
    evidence.push({
      type: 'education',
      detail: 'Advanced degree (Master/PhD) detected',
    });
  }

  return { score: Math.min(100, score), evidence };
}

/**
 * Calculate a simple semantic relevance score based on summary/description overlap
 */
function calculateSemanticScore(
  candidateSummary: string | null,
  jobDescription: string | null
): { score: number; evidence: MatchEvidence[] } {
  const evidence: MatchEvidence[] = [];

  if (!candidateSummary || !jobDescription) {
    return { score: 50, evidence: [{ type: 'semantic', detail: 'Limited text for semantic comparison', score: 50 }] };
  }

  const summaryWords = new Set(
    candidateSummary.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
  );
  const descWords = jobDescription.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);

  let overlap = 0;
  for (const w of descWords) {
    if (summaryWords.has(w)) overlap++;
  }

  const score = Math.min(100, Math.round((overlap / Math.max(1, descWords.length * 0.4)) * 100));

  evidence.push({
    type: 'semantic',
    detail: `${overlap} semantic keyword overlaps between candidate profile and job description`,
    score,
    metadata: { overlap, summaryWords: summaryWords.size, descWords: descWords.length },
  });

  return { score, evidence };
}

// ============================================================
// Main Matching Pipeline
// ============================================================

/**
 * Calculate match between a candidate and a job
 */
export async function calculateMatch(
  candidateId: string,
  jobId: string,
  weights: MatchWeights = DEFAULT_WEIGHTS
): Promise<MatchResult> {
  // Fetch candidate with all related data
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      skills: { include: { skill: true } },
      experiences: { orderBy: { startDate: 'desc' } },
      education: { orderBy: { startDate: 'desc' } },
      projects: true,
    },
  });

  if (!candidate) throw new Error('Candidate not found');

  // Fetch job with skills
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      skills: { include: { skill: true } },
    },
  });

  if (!job) throw new Error('Job not found');

  // Prepare skill data
  const candidateSkills = candidate.skills.map(cs => ({
    skillId: cs.skillId,
    skillName: cs.skill.name,
    proficiency: cs.proficiency,
    confidence: cs.confidence,
    evidence: cs.evidence,
  }));

  const jobSkills = job.skills.map(js => ({
    skillId: js.skillId,
    skillName: js.skill.name,
    required: js.required,
    weight: js.weight,
  }));

  // Calculate all scores
  const skillResult = calculateSkillScore(candidateSkills, jobSkills);
  const experienceResult = calculateExperienceScore(
    candidate.experiences.map((e: any) => ({
      title: e.title,
      company: e.company,
      description: e.description,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
    job.title,
    job.description,
    0 // required years — not stored on job model, inferred
  );

  const projectResult = calculateProjectScore(
    candidate.projects.map((p: any) => ({
      title: p.title,
      description: p.description,
      technologies: p.technologies,
    })),
    jobSkills,
    job.description
  );

  const educationResult = calculateEducationScore(
    candidate.education.map((e: any) => ({
      institution: e.institution,
      degree: e.degree,
      field: e.fieldOfStudy,
    })),
    job.description
  );

  const semanticResult = calculateSemanticScore(candidate.summary, job.description);

  // Calculate weighted overall score
  const categoryScores = {
    skills: skillResult.score,
    experience: experienceResult.score,
    projects: projectResult.score,
    education: educationResult.score,
    semantic: semanticResult.score,
  };

  const overallScore = Math.round(
    categoryScores.skills * weights.skills +
    categoryScores.experience * weights.experience +
    categoryScores.projects * weights.projects +
    categoryScores.education * weights.education +
    categoryScores.semantic * weights.semantic
  );

  // Combine all evidence
  const allEvidence: MatchEvidence[] = [
    ...skillResult.matched.map(s => ({
      type: 'skill_match',
      detail: `✅ ${s.skillName}: ${s.proficiency} (${Math.round((s.confidence || 0) * 100)}% confidence)`,
      score: Math.round((PROFICIENCY_SCORES[s.proficiency || 'INTERMEDIATE'] || 0.5) * 100),
      metadata: { skill: s.skillName, status: 'matched' },
    })),
    ...skillResult.partial.map(s => ({
      type: 'skill_match',
      detail: `⚠️ ${s.skillName}: ${s.proficiency} (partial match)`,
      score: Math.round((PROFICIENCY_SCORES[s.proficiency || 'INTERMEDIATE'] || 0.5) * 50),
      metadata: { skill: s.skillName, status: 'partial' },
    })),
    ...skillResult.missing.map(s => ({
      type: 'skill_match',
      detail: `❌ ${s.skillName}: Missing${s.required ? ' (required)' : ' (preferred)'}`,
      score: 0,
      metadata: { skill: s.skillName, status: 'missing', required: s.required },
    })),
    ...experienceResult.evidence,
    ...projectResult.evidence,
    ...educationResult.evidence,
    ...semanticResult.evidence,
  ];

  // Generate human-readable explanation
  const explanation = generateExplanation(overallScore, categoryScores, skillResult, job.title);

  return {
    candidateId,
    candidateName: `${candidate.firstName} ${candidate.lastName}`,
    jobId,
    jobTitle: job.title,
    overallScore,
    categoryScores,
    matchedSkills: skillResult.matched,
    missingSkills: skillResult.missing,
    partialSkills: skillResult.partial,
    evidence: allEvidence,
    explanation,
  };
}

/**
 * Generate a human-readable explanation of the match
 */
function generateExplanation(
  overallScore: number,
  categoryScores: Record<string, number>,
  skillResult: { matched: SkillMatch[]; missing: SkillMatch[]; partial: SkillMatch[] },
  jobTitle: string
): string {
  const parts: string[] = [];

  if (overallScore >= 80) {
    parts.push(`Strong overall match (${overallScore}%) for ${jobTitle}.`);
  } else if (overallScore >= 60) {
    parts.push(`Good overall match (${overallScore}%) for ${jobTitle} with some gaps.`);
  } else if (overallScore >= 40) {
    parts.push(`Moderate match (${overallScore}%) for ${jobTitle}. Significant skill gaps exist.`);
  } else {
    parts.push(`Low match (${overallScore}%) for ${jobTitle}. Major gaps in required skills.`);
  }

  if (skillResult.matched.length > 0) {
    parts.push(`Strong in: ${skillResult.matched.map(s => s.skillName).slice(0, 5).join(', ')}.`);
  }

  if (skillResult.missing.length > 0) {
    const requiredMissing = skillResult.missing.filter(s => s.required);
    if (requiredMissing.length > 0) {
      parts.push(`Missing required skills: ${requiredMissing.map(s => s.skillName).slice(0, 4).join(', ')}.`);
    }
  }

  if (skillResult.partial.length > 0) {
    parts.push(`Partial matches: ${skillResult.partial.map(s => s.skillName).slice(0, 3).join(', ')}.`);
  }

  if (categoryScores.experience >= 70) {
    parts.push('Experience is well-aligned.');
  } else if (categoryScores.experience < 40) {
    parts.push('Experience may be insufficient.');
  }

  return parts.join(' ');
}

// ============================================================
// Batch Matching & Ranking
// ============================================================

/**
 * Match all candidates against a specific job
 */
export async function matchCandidatesForJob(
  jobId: string,
  weights: MatchWeights = DEFAULT_WEIGHTS
): Promise<MatchResult[]> {
  const candidates = await prisma.candidate.findMany({
    where: { organizationId: { not: '' } }, // all candidates
    include: {
      skills: { include: { skill: true } },
      experiences: true,
      education: true,
      projects: true,
    },
  });

  const results: MatchResult[] = [];

  for (const candidate of candidates) {
    try {
      const result = await calculateMatch(candidate.id, jobId, weights);
      results.push(result);

      // Persist match in database (upsert)
      await prisma.candidateMatch.upsert({
        where: {
          candidateId_jobId: { candidateId: candidate.id, jobId },
        },
        update: {
          overallScore: result.overallScore,
          skillScore: result.categoryScores.skills,
          experienceScore: result.categoryScores.experience,
          projectScore: result.categoryScores.projects,
          educationScore: result.categoryScores.education,
          semanticScore: result.categoryScores.semantic,
          explanation: result.explanation as unknown as Prisma.InputJsonValue,
        },
        create: {
          candidateId: candidate.id,
          jobId,
          overallScore: result.overallScore,
          skillScore: result.categoryScores.skills,
          experienceScore: result.categoryScores.experience,
          projectScore: result.categoryScores.projects,
          educationScore: result.categoryScores.education,
          semanticScore: result.categoryScores.semantic,
          explanation: result.explanation as unknown as Prisma.InputJsonValue,
        },
      });

      // Persist evidence
      const existingMatch = await prisma.candidateMatch.findUnique({
        where: {
          candidateId_jobId: { candidateId: candidate.id, jobId },
        },
      });

      if (existingMatch) {
        // Delete old evidence and re-create
        await prisma.matchEvidence.deleteMany({ where: { matchId: existingMatch.id } });
        await prisma.matchEvidence.createMany({
          data: result.evidence.map(e => ({
            matchId: existingMatch.id,
            type: e.type,
            detail: e.detail,
            score: e.score || null,
            metadata: e.metadata ? (e.metadata as unknown as Prisma.InputJsonValue) : undefined,
          })),
        });
      }
    } catch (err) {
      console.error(`Failed to match candidate ${candidate.id} to job ${jobId}:`, err);
    }
  }

  return results.sort((a, b) => b.overallScore - a.overallScore);
}

/**
 * Get ranked candidates for a job with filters
 */
export async function getRankedCandidates(
  filters: MatchFilters
): Promise<{ matches: Array<CandidateMatch & { evidence: any[]; candidate: any; job: any }>; total: number; page: number; limit: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.CandidateMatchWhereInput = {};

  if (filters.jobId) where.jobId = filters.jobId;
  if (filters.candidateId) where.candidateId = filters.candidateId;
  if (filters.minScore !== undefined) where.overallScore = { gte: filters.minScore };
  if (filters.maxScore !== undefined) {
    where.overallScore = where.overallScore
      ? { ...(where.overallScore as any), lte: filters.maxScore }
      : { lte: filters.maxScore };
  }

  const orderBy: Prisma.CandidateMatchOrderByWithRelationInput = {};
  if (filters.sortBy) {
    orderBy[filters.sortBy] = filters.sortOrder || 'desc';
  } else {
    orderBy.overallScore = 'desc';
  }

  const [matches, total] = await Promise.all([
    prisma.candidateMatch.findMany({
      where,
      include: {
        evidence: true,
        candidate: {
          include: {
            skills: { include: { skill: true } },
            experiences: true,
            education: true,
          },
        },
        job: true,
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.candidateMatch.count({ where }),
  ]);

  return { matches: matches as any, total, page, limit };
}

/**
 * Get match detail for a specific candidate-job pair
 */
export async function getMatchDetail(candidateId: string, jobId: string) {
  const match = await prisma.candidateMatch.findUnique({
    where: {
      candidateId_jobId: { candidateId, jobId },
    },
    include: {
      evidence: true,
      candidate: {
        include: {
          skills: { include: { skill: true } },
          experiences: true,
          education: true,
          projects: true,
        },
      },
      job: {
        include: {
          skills: { include: { skill: true } },
        },
      },
    },
  });

  return match;
}

/**
 * Get match summary stats for a job
 */
export async function getMatchStats(jobId: string) {
  const stats = await prisma.candidateMatch.aggregate({
    where: { jobId },
    _avg: { overallScore: true, skillScore: true, experienceScore: true },
    _max: { overallScore: true },
    _min: { overallScore: true },
    _count: true,
  });

  const distribution = await prisma.$queryRaw`
    SELECT 
      CASE 
        WHEN "overallScore" >= 80 THEN 'excellent'
        WHEN "overallScore" >= 60 THEN 'good'
        WHEN "overallScore" >= 40 THEN 'moderate'
        ELSE 'low'
      END as score_range,
      COUNT(*)::int as count
    FROM "CandidateMatch"
    WHERE "jobId" = ${jobId}::uuid
    GROUP BY score_range
    ORDER BY 
      CASE score_range
        WHEN 'excellent' THEN 1
        WHEN 'good' THEN 2
        WHEN 'moderate' THEN 3
        ELSE 4
      END
  `;

  return {
    averageScore: stats._avg.overallScore || 0,
    highestScore: stats._max.overallScore || 0,
    lowestScore: stats._min.overallScore || 0,
    totalMatches: stats._count,
    distribution,
  };
}

interface CandidateMatch {
  id: string;
  candidateId: string;
  jobId: string;
  overallScore: number;
  skillScore: number | null;
  experienceScore: number | null;
  projectScore: number | null;
  educationScore: number | null;
  semanticScore: number | null;
  explanation: unknown;
  createdAt: Date;
  updatedAt: Date;
}
