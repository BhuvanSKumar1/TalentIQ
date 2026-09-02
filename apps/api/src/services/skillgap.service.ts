import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SkillComparison {
  skillName: string;
  status: 'matched' | 'partial' | 'missing' | 'transferable';
  candidateLevel: number;
  requiredLevel: number;
  confidence: number;
  category: string;
  suggestion?: string;
}

interface SkillGapReport {
  candidateId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  overallMatch: number;
  matchedSkills: SkillComparison[];
  missingSkills: SkillComparison[];
  partialSkills: SkillComparison[];
  transferableSkills: SkillComparison[];
  summary: string;
  recommendations: string[];
}

interface LearningPlanItem {
  skill: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  currentLevel: number;
  targetLevel: number;
  estimatedHours: number;
  learningObjective: string;
  recommendedProjects: string[];
  resources: string[];
  milestones: string[];
}

interface DevelopmentPlan {
  id: string;
  candidateId: string;
  jobId?: string;
  title: string;
  description: string;
  duration: '30-day' | '60-day' | '90-day';
  items: LearningPlanItem[];
  totalEstimatedHours: number;
  createdAt: Date;
}

// Skill proficiency mapping
const PROFICIENCY_LEVELS: Record<string, number> = {
  beginner: 25,
  basic: 25,
  intermediate: 50,
  moderate: 50,
  advanced: 75,
  strong: 80,
  expert: 95,
  mastery: 100,
};

/**
 * Calculate skill gap analysis for a candidate-job pair
 */
export async function calculateSkillGap(
  candidateId: string,
  jobId: string
): Promise<SkillGapReport> {
  // Fetch candidate with skills (simplified - no complex includes)
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      skills: {
        include: {
          skill: {
            include: {
              category: true,
            }
          }
        }
      },
      experiences: true,
      education: true,
      projects: true,
    }
  });

  if (!candidate) throw new Error('Candidate not found');

  // Fetch job with required skills (simplified)
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      skills: {
        include: {
          skill: {
            include: {
              category: true,
            }
          }
        }
      },
      
    }
  });

  if (!job) throw new Error('Job not found');

  // Build candidate skill map
  const candidateSkillMap = new Map<string, {
    level: number;
    confidence: number;
    category: string;
    skillId: string;
  }>();

  for (const cs of candidate.skills) {
    const level = cs.proficiency
      ? PROFICIENCY_LEVELS[cs.proficiency.toLowerCase()] || 50
      : cs.confidence * 100 || 50;

    candidateSkillMap.set(cs.skill.name.toLowerCase(), {
      level,
      confidence: cs.confidence,
      category: cs.skill.category?.name || 'Unknown',
      skillId: cs.skill.id,
    });
  }

  // Build job skill requirements
  const jobSkillRequirements = new Map<string, {
    level: number;
    required: boolean;
    category: string;
    skillId: string;
  }>();

  for (const js of job.skills) {
    const level = js.weight ? Math.round(js.weight * 100) : 50;

    jobSkillRequirements.set(js.skill.name.toLowerCase(), {
      level,
      required: js.required,
      category: js.skill.category?.name || 'Unknown',
      skillId: js.skill.id,
    });
  }

  // Analyze each job skill
  const matchedSkills: SkillComparison[] = [];
  const missingSkills: SkillComparison[] = [];
  const partialSkills: SkillComparison[] = [];
  const transferableSkills: SkillComparison[] = [];

  for (const [skillName, jobReq] of jobSkillRequirements) {
    const candidateSkill = candidateSkillMap.get(skillName);

    if (candidateSkill) {
      const gap = candidateSkill.level - jobReq.level;

      if (gap >= 0) {
        // Fully matched
        matchedSkills.push({
          skillName,
          status: 'matched',
          candidateLevel: candidateSkill.level,
          requiredLevel: jobReq.level,
          confidence: candidateSkill.confidence,
          category: jobReq.category,
        });
      } else if (gap >= -20) {
        // Partially matched
        partialSkills.push({
          skillName,
          status: 'partial',
          candidateLevel: candidateSkill.level,
          requiredLevel: jobReq.level,
          confidence: candidateSkill.confidence,
          category: jobReq.category,
          suggestion: `Needs improvement from ${candidateSkill.level}% to ${jobReq.level}%`,
        });
      } else {
        // Significant gap
        missingSkills.push({
          skillName,
          status: 'missing',
          candidateLevel: candidateSkill.level,
          requiredLevel: jobReq.level,
          confidence: candidateSkill.confidence,
          category: jobReq.category,
          suggestion: `Major gap: ${candidateSkill.level}% vs ${jobReq.level}% required`,
        });
      }
    } else {
      // Skill not present
      missingSkills.push({
        skillName,
        status: 'missing',
        candidateLevel: 0,
        requiredLevel: jobReq.level,
        confidence: 0,
        category: jobReq.category,
        suggestion: 'Skill not found in candidate profile',
      });
    }
  }

  // Find transferable skills (simplified - check related skills via SkillRelation table)
  for (const [skillName] of jobSkillRequirements) {
    if (candidateSkillMap.has(skillName)) continue;

    // Find the skill ID from job requirements
    const jobSkillId = jobSkillRequirements.get(skillName)?.skillId;
    if (!jobSkillId) continue;

    // Find related skills via SkillRelation
    const relatedRelations = await prisma.skillRelation.findMany({
      where: {
        OR: [
          { sourceId: jobSkillId },
          { targetId: jobSkillId },
        ]
      },
      include: {
        source: { select: { id: true, name: true } },
        target: { select: { id: true, name: true } },
      }
    });

    for (const rel of relatedRelations) {
      const relatedSkill = rel.sourceId === jobSkillId ? rel.target : rel.source;
      const candidateHasRelated = candidateSkillMap.get(relatedSkill.name.toLowerCase());
      
      if (candidateHasRelated && candidateHasRelated.level >= 40) {
        transferableSkills.push({
          skillName,
          status: 'transferable',
          candidateLevel: candidateHasRelated.level,
          requiredLevel: jobSkillRequirements.get(skillName)?.level || 50,
          confidence: candidateHasRelated.confidence * 0.8,
          category: jobSkillRequirements.get(skillName)?.category || 'Unknown',
          suggestion: `Has related skill: ${relatedSkill.name} (${candidateHasRelated.level}%)`,
        });
        break;
      }
    }
  }

  // Calculate overall match
  const totalJobSkills = jobSkillRequirements.size;
  const matchedCount = matchedSkills.length;
  const partialCount = partialSkills.length * 0.5;
  const transferableCount = transferableSkills.length * 0.3;
  const overallMatch = totalJobSkills > 0
    ? Math.round(((matchedCount + partialCount + transferableCount) / totalJobSkills) * 100)
    : 0;

  // Generate summary
  const summary = generateGapSummary(
    matchedSkills.length,
    partialSkills.length,
    missingSkills.length,
    transferableSkills.length,
    overallMatch
  );

  // Generate recommendations
  const recommendations = generateRecommendations(
    missingSkills,
    partialSkills,
    transferableSkills
  );

  // Save skill gaps to database
  await saveSkillGaps(candidateId, jobId, [
    ...matchedSkills,
    ...missingSkills,
    ...partialSkills,
    ...transferableSkills,
  ]);

  return {
    candidateId,
    candidateName: `${candidate.firstName} ${candidate.lastName}`,
    jobId,
    jobTitle: job.title,
    overallMatch,
    matchedSkills,
    missingSkills,
    partialSkills,
    transferableSkills,
    summary,
    recommendations,
  };
}

/**
 * Generate a personalized development plan
 */
export async function generateDevelopmentPlan(
  candidateId: string,
  jobId: string,
  duration: '30-day' | '60-day' | '90-day'
): Promise<DevelopmentPlan> {
  const gapReport = await calculateSkillGap(candidateId, jobId);

  const durationDays = duration === '30-day' ? 30 : duration === '60-day' ? 60 : 90;
  const maxHoursPerDay = 2;
  const totalAvailableHours = durationDays * maxHoursPerDay;

  // Prioritize skills to learn
  const skillsToLearn = [
    ...gapReport.missingSkills,
    ...gapReport.partialSkills,
  ].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const aPriority = getSkillPriority(a);
    const bPriority = getSkillPriority(b);
    return priorityOrder[aPriority] - priorityOrder[bPriority];
  });

  const items: LearningPlanItem[] = [];
  let totalHours = 0;

  for (const skill of skillsToLearn) {
    if (totalHours >= totalAvailableHours) break;

    const hoursNeeded = calculateHoursNeeded(
      skill.candidateLevel,
      skill.requiredLevel,
      skill.status
    );

    if (totalHours + hoursNeeded <= totalAvailableHours) {
      items.push({
        skill: skill.skillName,
        priority: getSkillPriority(skill),
        reason: skill.suggestion || `Required for ${gapReport.jobTitle} role`,
        currentLevel: skill.candidateLevel,
        targetLevel: skill.requiredLevel,
        estimatedHours: hoursNeeded,
        learningObjective: generateLearningObjective(skill),
        recommendedProjects: generateProjectIdeas(skill),
        resources: generateResources(skill),
        milestones: generateMilestones(skill, duration),
      });
      totalHours += hoursNeeded;
    }
  }

  const plan: DevelopmentPlan = {
    id: `plan-${candidateId}-${jobId}-${duration}`,
    candidateId,
    jobId,
    title: `${duration} Development Plan for ${gapReport.jobTitle}`,
    description: `Personalized learning plan to close ${items.length} skill gaps for the ${gapReport.jobTitle} position`,
    duration,
    items,
    totalEstimatedHours: totalHours,
    createdAt: new Date(),
  };

  // Save plan to database
  await prisma.learningPlan.create({
    data: {
      candidateId,
      jobId,
      title: plan.title,
      description: plan.description,
      plan: plan as any,
      status: 'draft',
    },
  });

  return plan;
}

/**
 * Get all skill gaps for a candidate
 */
export async function getCandidateSkillGaps(candidateId: string) {
  const gaps = await prisma.skillGap.findMany({
    where: { candidateId },
    include: {
      job: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return gaps;
}

/**
 * Get all learning plans for a candidate
 */
export async function getCandidateLearningPlans(candidateId: string) {
  const plans = await prisma.learningPlan.findMany({
    where: { candidateId },
    orderBy: { createdAt: 'desc' },
  });

  return plans;
}

/**
 * Get skill gap summary across all jobs
 */
export async function getSkillGapSummary(organizationId: string) {
  const candidates = await prisma.candidate.findMany({
    where: { organizationId },
    include: {
      skills: {
        include: { skill: true }
      }
    }
  });

  const jobs = await prisma.job.findMany({
    where: { organizationId, status: 'PUBLISHED' },
    include: {
      skills: {
        include: { skill: true }
      }
    }
  });

  // Aggregate skill demand
  const skillDemand = new Map<string, number>();
  const skillSupply = new Map<string, number>();

  for (const job of jobs) {
    for (const js of job.skills) {
      const count = skillDemand.get(js.skill.name) || 0;
      skillDemand.set(js.skill.name, count + 1);
    }
  }

  for (const candidate of candidates) {
    for (const cs of candidate.skills) {
      const count = skillSupply.get(cs.skill.name) || 0;
      skillSupply.set(cs.skill.name, count + 1);
    }
  }

  // Find gaps (high demand, low supply)
  const gaps: Array<{
    skill: string;
    demand: number;
    supply: number;
    gap: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }> = [];

  for (const [skill, demand] of skillDemand) {
    const supply = skillSupply.get(skill) || 0;
    const gap = demand - supply;

    if (gap > 0) {
      gaps.push({
        skill,
        demand,
        supply,
        gap,
        severity: gap >= 3 ? 'critical' : gap >= 2 ? 'high' : gap >= 1 ? 'medium' : 'low',
      });
    }
  }

  gaps.sort((a, b) => b.gap - a.gap);

  return {
    totalCandidates: candidates.length,
    totalJobs: jobs.length,
    skillGaps: gaps,
    topDemandedSkills: Array.from(skillDemand.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count })),
    topAvailableSkills: Array.from(skillSupply.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count })),
  };
}

// Helper functions

function getSkillPriority(skill: SkillComparison): 'critical' | 'high' | 'medium' | 'low' {
  const gap = skill.requiredLevel - skill.candidateLevel;
  if (gap >= 50) return 'critical';
  if (gap >= 30) return 'high';
  if (gap >= 15) return 'medium';
  return 'low';
}

function calculateHoursNeeded(
  currentLevel: number,
  requiredLevel: number,
  status: string
): number {
  const gap = requiredLevel - currentLevel;
  if (status === 'partial') return Math.ceil(gap / 5); // Faster for partial
  return Math.ceil(gap / 3); // Slower for missing
}

function generateLearningObjective(skill: SkillComparison): string {
  const gap = skill.requiredLevel - skill.candidateLevel;
  if (skill.status === 'partial') {
    return `Improve ${skill.skillName} proficiency from ${skill.candidateLevel}% to ${skill.requiredLevel}% (${gap}% improvement needed)`;
  }
  return `Learn ${skill.skillName} from scratch to ${skill.requiredLevel}% proficiency`;
}

function generateProjectIdeas(skill: SkillComparison): string[] {
  const projects: Record<string, string[]> = {
    java: ['Build a REST API with Spring Boot', 'Create a microservices architecture', 'Develop a real-time chat application'],
    python: ['Build a data pipeline with Pandas', 'Create a web scraper', 'Develop a machine learning model'],
    react: ['Build a task management app', 'Create a real-time dashboard', 'Develop a portfolio website'],
    docker: ['Containerize an existing application', 'Set up a multi-container environment', 'Create a Docker compose stack'],
    kubernetes: ['Deploy a microservices app to K8s', 'Set up auto-scaling', 'Create a CI/CD pipeline with K8s'],
    aws: ['Deploy an app to EC2', 'Set up S3 for file storage', 'Create a Lambda function'],
    sql: ['Design a database schema', 'Write complex queries', 'Optimize database performance'],
    typescript: ['Convert a JS project to TS', 'Build a type-safe API', 'Create a TypeScript library'],
  };

  return projects[skill.skillName.toLowerCase()] || [
    `Build a project using ${skill.skillName}`,
    `Contribute to an open-source ${skill.skillName} project`,
    `Complete a ${skill.skillName} tutorial series`,
  ];
}

function generateResources(skill: SkillComparison): string[] {
  const resources: Record<string, string[]> = {
    java: ['Official Java Documentation', 'Baeldung tutorials', 'Spring Boot guides'],
    python: ['Python.org tutorial', 'Real Python courses', 'Automate the Boring Stuff'],
    react: ['React official docs', 'React Tutorial by Tyler McGinnis', 'Epic React courses'],
    docker: ['Docker getting started', 'Docker documentation', 'Play with Docker labs'],
    kubernetes: ['Kubernetes docs', 'Kubernetes the Hard Way', 'CKAD preparation'],
    aws: ['AWS free tier', 'AWS documentation', 'AWS training courses'],
    sql: ['SQLBolt tutorial', 'Mode Analytics SQL tutorial', 'LeetCode database problems'],
    typescript: ['TypeScript handbook', 'TypeScript playground', 'Total TypeScript course'],
  };

  return resources[skill.skillName.toLowerCase()] || [
    `Official ${skill.skillName} documentation`,
    `Online courses on ${skill.skillName}`,
    `Practice projects with ${skill.skillName}`,
  ];
}

function generateMilestones(skill: SkillComparison, duration: string): string[] {
  const days = duration === '30-day' ? 30 : duration === '60-day' ? 60 : 90;
  const milestones: string[] = [];

  if (days >= 7) milestones.push(`Week 1: Complete basics and setup`);
  if (days >= 14) milestones.push(`Week 2: Build first project`);
  if (days >= 30) milestones.push(`Week 3-4: Intermediate concepts and projects`);
  if (days >= 60) milestones.push(`Week 5-8: Advanced topics and real-world application`);
  if (days >= 90) milestones.push(`Week 9-12: Mastery and portfolio projects`);

  return milestones;
}

function generateGapSummary(
  matched: number,
  partial: number,
  missing: number,
  transferable: number,
  overallMatch: number
): string {
  if (overallMatch >= 80) {
    return `Strong candidate with ${matched} fully matched skills. ${partial} skills need minor improvement. ${transferable} transferable skills identified.`;
  }
  if (overallMatch >= 60) {
    return `Good candidate with ${matched} matched skills. ${partial} skills are partially matched and ${missing} need development. ${transferable} transferable skills can help bridge gaps.`;
  }
  if (overallMatch >= 40) {
    return `Moderate fit with ${matched} matched skills. ${missing} significant skill gaps need addressing. Consider development plan or alternative candidates.`;
  }
  return `Significant skill gaps identified. Only ${matched} skills fully match requirements. Recommend thorough development plan or reassessing role fit.`;
}

function generateRecommendations(
  missing: SkillComparison[],
  partial: SkillComparison[],
  transferable: SkillComparison[]
): string[] {
  const recommendations: string[] = [];

  if (missing.length > 3) {
    recommendations.push('Consider a comprehensive 90-day development plan to address multiple skill gaps');
  }

  if (partial.length > 0) {
    recommendations.push(`${partial.length} skills are close to requirements — targeted practice could quickly improve match`);
  }

  if (transferable.length > 0) {
    recommendations.push(`${transferable.length} transferable skills identified — leverage existing knowledge for faster learning`);
  }

  if (missing.length === 0 && partial.length <= 2) {
    recommendations.push('Candidate is well-suited for the role with minor skill refinements needed');
  }

  const criticalMissing = missing.filter(m => m.requiredLevel >= 75);
  if (criticalMissing.length > 0) {
    recommendations.push(`Critical skills missing: ${criticalMissing.map(m => m.skillName).join(', ')} — prioritize these first`);
  }

  return recommendations;
}

async function saveSkillGaps(
  candidateId: string,
  jobId: string,
  skills: SkillComparison[]
): Promise<void> {
  // Delete existing gaps for this candidate-job pair
  await prisma.skillGap.deleteMany({
    where: { candidateId, jobId },
  });

  // Save new gaps
  for (const skill of skills) {
    await prisma.skillGap.create({
      data: {
        candidateId,
        jobId,
        skillName: skill.skillName,
        status: skill.status,
        currentLevel: `${skill.candidateLevel}`,
        requiredLevel: `${skill.requiredLevel}`,
        confidence: skill.confidence,
        suggestion: skill.suggestion,
      },
    });
  }
}
