import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Proficiency to numeric score mapping
const PROFICIENCY_SCORES: Record<string, number> = {
  EXPERT: 1.0,
  ADVANCED: 0.85,
  INTERMEDIATE: 0.65,
  BEGINNER: 0.40,
  UNKNOWN: 0.30,
};

interface SkillMatch {
  skillId: string;
  skillName: string;
  status: 'matched' | 'partial' | 'missing';
  proficiency?: string;
  confidence?: number;
  required: boolean;
  weight: number;
}

function calculateSkillScore(
  candidateSkills: Array<{ skillId: string; skillName: string; proficiency: string; confidence: number; evidence?: string | null }>,
  jobSkills: Array<{ skillId: string; skillName: string; required: boolean; weight: number }>
): { score: number; matched: SkillMatch[]; missing: SkillMatch[]; partial: SkillMatch[] } {
  const candidateSkillMap = new Map(candidateSkills.map(cs => [cs.skillId, cs]));
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
        matched.push({ skillId: js.skillId, skillName: js.skillName, status: 'matched', proficiency: cs.proficiency, confidence: cs.confidence, required: js.required, weight: js.weight });
        earnedWeight += js.weight * skillScore;
      } else if (skillScore >= 0.4) {
        partial.push({ skillId: js.skillId, skillName: js.skillName, status: 'partial', proficiency: cs.proficiency, confidence: cs.confidence, required: js.required, weight: js.weight });
        earnedWeight += js.weight * skillScore * 0.5;
      } else {
        missing.push({ skillId: js.skillId, skillName: js.skillName, status: 'missing', required: js.required, weight: js.weight });
      }
    } else {
      missing.push({ skillId: js.skillId, skillName: js.skillName, status: 'missing', required: js.required, weight: js.weight });
    }
  }
  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  return { score, matched, missing, partial };
}

function calculateExperienceScore(
  experience: Array<{ title: string; description?: string | null }>,
  jobTitle: string
): number {
  if (!experience.length) return 20;
  const jobKeywords = jobTitle.toLowerCase().split(/\s+/);
  let titleMatches = 0;
  for (const exp of experience) {
    const expTitle = exp.title.toLowerCase();
    for (const kw of jobKeywords) {
      if (kw.length > 3 && expTitle.includes(kw)) titleMatches++;
    }
  }
  const titleScore = Math.min(1.0, titleMatches / Math.max(1, jobKeywords.length * 0.3));
  const yearsScore = Math.min(1.0, experience.length / 3);
  return Math.round((yearsScore * 0.5 + titleScore * 0.5) * 100);
}

function calculateProjectScore(
  projects: Array<{ title: string; technologies?: string | null }>,
  jobSkills: Array<{ skillName: string }>
): number {
  if (!projects.length) return 20;
  const jobTechSet = new Set(jobSkills.map(js => js.skillName.toLowerCase()));
  let techMatches = 0;
  for (const proj of projects) {
    const techs = (proj.technologies || '').toLowerCase().split(/[,\s]+/).filter(Boolean);
    for (const tech of techs) {
      for (const jobTech of jobTechSet) {
        if (tech.includes(jobTech) || jobTech.includes(tech)) { techMatches++; break; }
      }
    }
  }
  return Math.min(100, Math.round((techMatches / Math.max(1, jobTechSet.size * 0.5)) * 100));
}

function calculateEducationScore(education: Array<{ degree?: string | null }>): number {
  if (!education.length) return 50;
  const hasAdvanced = education.some(e => (e.degree || '').toLowerCase().match(/master|phd|doctorate/));
  const hasBachelors = education.some(e => (e.degree || '').toLowerCase().includes('bachelor'));
  if (hasAdvanced) return 85;
  if (hasBachelors) return 75;
  return 60;
}

function generateExplanation(overall: number, cats: Record<string, number>, matched: SkillMatch[], missing: SkillMatch[], jobTitle: string): string {
  const parts: string[] = [];
  if (overall >= 80) parts.push(`Strong overall match (${overall}%) for ${jobTitle}.`);
  else if (overall >= 60) parts.push(`Good overall match (${overall}%) for ${jobTitle} with some gaps.`);
  else if (overall >= 40) parts.push(`Moderate match (${overall}%) for ${jobTitle}. Significant skill gaps exist.`);
  else parts.push(`Low match (${overall}%) for ${jobTitle}. Major gaps in required skills.`);
  if (matched.length > 0) parts.push(`Strong in: ${matched.map(s => s.skillName).slice(0, 5).join(', ')}.`);
  const reqMissing = missing.filter(s => s.required);
  if (reqMissing.length > 0) parts.push(`Missing required: ${reqMissing.map(s => s.skillName).slice(0, 4).join(', ')}.`);
  return parts.join(' ');
}

async function main() {
  console.log('🔄 Running candidate matching for all jobs...\n');

  const jobs = await prisma.job.findMany({
    include: { skills: { include: { skill: true } } },
  });

  const candidates = await prisma.candidate.findMany({
    include: {
      skills: { include: { skill: true } },
      experiences: true,
      education: true,
      projects: true,
    },
  });

  console.log(`Found ${jobs.length} jobs and ${candidates.length} candidates\n`);

  let totalMatches = 0;

  for (const job of jobs) {
    console.log(`📊 Matching for: ${job.title}`);

    const jobSkills = job.skills.map(js => ({
      skillId: js.skillId,
      skillName: js.skill.name,
      required: js.required,
      weight: js.weight,
    }));

    for (const candidate of candidates) {
      const candidateSkills = candidate.skills.map(cs => ({
        skillId: cs.skillId,
        skillName: cs.skill.name,
        proficiency: cs.proficiency,
        confidence: cs.confidence,
        evidence: cs.evidence,
      }));

      const skillResult = calculateSkillScore(candidateSkills, jobSkills);
      const expScore = calculateExperienceScore(
        candidate.experiences.map((e: any) => ({ title: e.title, description: e.description })),
        job.title
      );
      const projScore = calculateProjectScore(
        candidate.projects.map(p => ({ title: p.title, technologies: p.technologies })),
        jobSkills
      );
      const eduScore = calculateEducationScore(
        candidate.education.map(e => ({ degree: e.degree }))
      );

      const categoryScores = {
        skills: skillResult.score,
        experience: expScore,
        projects: projScore,
        education: eduScore,
        semantic: 50,
      };

      const overallScore = Math.round(
        categoryScores.skills * 0.4 +
        categoryScores.experience * 0.2 +
        categoryScores.projects * 0.2 +
        categoryScores.education * 0.1 +
        categoryScores.semantic * 0.1
      );

      const explanation = generateExplanation(overallScore, categoryScores, skillResult.matched, skillResult.missing, job.title);

      // Build evidence array
      const evidenceData: Array<{ type: string; detail: string; score: number | null; metadata: any }> = [];

      for (const s of skillResult.matched) {
        evidenceData.push({ type: 'skill_match', detail: `✅ ${s.skillName}: ${s.proficiency} (${Math.round((s.confidence || 0) * 100)}% confidence)`, score: Math.round((PROFICIENCY_SCORES[s.proficiency || 'INTERMEDIATE'] || 0.5) * 100), metadata: { skill: s.skillName, status: 'matched' } });
      }
      for (const s of skillResult.partial) {
        evidenceData.push({ type: 'skill_match', detail: `⚠️ ${s.skillName}: ${s.proficiency} (partial match)`, score: Math.round((PROFICIENCY_SCORES[s.proficiency || 'INTERMEDIATE'] || 0.5) * 50), metadata: { skill: s.skillName, status: 'partial' } });
      }
      for (const s of skillResult.missing) {
        evidenceData.push({ type: 'skill_match', detail: `❌ ${s.skillName}: Missing${s.required ? ' (required)' : ' (preferred)'}`, score: 0, metadata: { skill: s.skillName, status: 'missing', required: s.required } });
      }
      evidenceData.push({ type: 'experience', detail: `${candidate.experiences.length} experience entries (title relevance: ${expScore}%)`, score: expScore, metadata: {} });
      evidenceData.push({ type: 'project', detail: `${candidate.projects.length} projects (project relevance: ${projScore}%)`, score: projScore, metadata: {} });
      evidenceData.push({ type: 'education', detail: `${candidate.education.length} education entries (education score: ${eduScore}%)`, score: eduScore, metadata: {} });

      // Upsert match
      const match = await prisma.candidateMatch.upsert({
        where: { candidateId_jobId: { candidateId: candidate.id, jobId: job.id } },
        update: {
          overallScore,
          skillScore: categoryScores.skills,
          experienceScore: categoryScores.experience,
          projectScore: categoryScores.projects,
          educationScore: categoryScores.education,
          semanticScore: categoryScores.semantic,
          explanation,
        },
        create: {
          candidateId: candidate.id,
          jobId: job.id,
          overallScore,
          skillScore: categoryScores.skills,
          experienceScore: categoryScores.experience,
          projectScore: categoryScores.projects,
          educationScore: categoryScores.education,
          semanticScore: categoryScores.semantic,
          explanation,
        },
      });

      // Upsert evidence
      await prisma.matchEvidence.deleteMany({ where: { matchId: match.id } });
      await prisma.matchEvidence.createMany({
        data: evidenceData.map(e => ({
          matchId: match.id,
          type: e.type,
          detail: e.detail,
          score: e.score,
          metadata: e.metadata,
        })),
      });

      totalMatches++;
    }

    const topMatch = await prisma.candidateMatch.findFirst({
      where: { jobId: job.id },
      orderBy: { overallScore: 'desc' },
      include: { candidate: true },
    });

    if (topMatch) {
      console.log(`   🏆 Top match: ${topMatch.candidate.firstName} ${topMatch.candidate.lastName} (${topMatch.overallScore}%)`);
    }
  }

  console.log(`\n✅ Created ${totalMatches} candidate-job matches`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
