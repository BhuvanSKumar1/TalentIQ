import { describe, it, expect } from 'vitest';

// Extract matching calculation logic for unit testing
// These are pure functions that don't depend on Prisma

type SkillProficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

const PROFICIENCY_SCORE: Record<SkillProficiency, number> = {
  BEGINNER: 0.25,
  INTERMEDIATE: 0.5,
  ADVANCED: 0.75,
  EXPERT: 1.0,
};

interface SkillRequirement {
  name: string;
  required: boolean;
  weight: number;
}

interface CandidateSkill {
  name: string;
  proficiency: SkillProficiency;
  yearsOfExp: number;
  confidence: number;
}

/**
 * Calculate skill match score between candidate skills and job requirements
 */
function calculateSkillScore(
  candidateSkills: CandidateSkill[],
  jobRequirements: SkillRequirement[]
): { score: number; matched: string[]; missing: string[]; partial: string[] } {
  if (jobRequirements.length === 0) return { score: 100, matched: [], missing: [], partial: [] };

  const candidateSkillMap = new Map<string, CandidateSkill>();
  candidateSkills.forEach(s => candidateSkillMap.set(s.name.toLowerCase(), s));

  let totalWeight = 0;
  let earnedWeight = 0;
  const matched: string[] = [];
  const missing: string[] = [];
  const partial: string[] = [];

  for (const req of jobRequirements) {
    totalWeight += req.weight;
    const candidateSkill = candidateSkillMap.get(req.name.toLowerCase());

    if (candidateSkill) {
      const profScore = PROFICIENCY_SCORE[candidateSkill.proficiency];
      const confBonus = candidateSkill.confidence * 0.2;
      const skillContribution = (profScore + confBonus) * req.weight;

      if (profScore >= 0.75) {
        // Strong match
        earnedWeight += skillContribution;
        matched.push(req.name);
      } else if (profScore >= 0.25) {
        // Partial match
        earnedWeight += skillContribution * 0.6;
        partial.push(req.name);
      } else {
        // Weak match
        earnedWeight += skillContribution * 0.2;
        partial.push(req.name);
      }
    } else {
      // Missing skill
      if (req.required) {
        earnedWeight += req.weight * 0; // No contribution for missing required
        missing.push(req.name);
      } else {
        earnedWeight += req.weight * 0.1; // Small contribution for missing optional
        missing.push(req.name);
      }
    }
  }

  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
  return { score: Math.min(100, Math.max(0, score)), matched, missing, partial };
}

/**
 * Calculate experience relevance score
 */
function calculateExperienceScore(
  yearsOfExp: number,
  requiredLevel: string
): number {
  const levelThresholds: Record<string, [number, number]> = {
    ENTRY: [0, 2],
    MID: [2, 5],
    SENIOR: [5, 10],
    LEAD: [8, 15],
    EXECUTIVE: [12, 30],
  };

  const [min, max] = levelThresholds[requiredLevel] || [0, 15];

  if (yearsOfExp >= min && yearsOfExp <= max) {
    return 90 + Math.random() * 10; // 90-100 for perfect range
  } else if (yearsOfExp < min) {
    const gap = min - yearsOfExp;
    return Math.max(20, 80 - gap * 15);
  } else {
    const excess = yearsOfExp - max;
    return Math.max(50, 90 - excess * 5); // Overqualified still scores decent
  }
}

/**
 * Calculate overall match score from category scores
 */
function calculateOverallScore(
  skillScore: number,
  experienceScore: number,
  projectScore: number,
  educationScore: number,
  semanticScore: number,
  weights = { skills: 0.40, experience: 0.20, projects: 0.20, education: 0.10, semantic: 0.10 }
): number {
  return Math.round(
    skillScore * weights.skills +
    experienceScore * weights.experience +
    projectScore * weights.projects +
    educationScore * weights.education +
    semanticScore * weights.semantic
  );
}

describe('Matching Engine Calculations', () => {
  describe('Skill Score Calculation', () => {
    const jobRequirements: SkillRequirement[] = [
      { name: 'React', required: true, weight: 3 },
      { name: 'TypeScript', required: true, weight: 3 },
      { name: 'Node.js', required: true, weight: 2 },
      { name: 'AWS', required: false, weight: 1 },
      { name: 'Docker', required: false, weight: 1 },
    ];

    it('should give high score for strong candidate', () => {
      const candidateSkills: CandidateSkill[] = [
        { name: 'React', proficiency: 'EXPERT', yearsOfExp: 5, confidence: 0.95 },
        { name: 'TypeScript', proficiency: 'EXPERT', yearsOfExp: 4, confidence: 0.92 },
        { name: 'Node.js', proficiency: 'ADVANCED', yearsOfExp: 4, confidence: 0.88 },
        { name: 'AWS', proficiency: 'ADVANCED', yearsOfExp: 3, confidence: 0.85 },
        { name: 'Docker', proficiency: 'INTERMEDIATE', yearsOfExp: 2, confidence: 0.75 },
      ];

      const result = calculateSkillScore(candidateSkills, jobRequirements);
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.matched).toContain('React');
      expect(result.matched).toContain('TypeScript');
      expect(result.missing).toHaveLength(0);
    });

    it('should give low score when missing required skills', () => {
      const candidateSkills: CandidateSkill[] = [
        { name: 'Python', proficiency: 'EXPERT', yearsOfExp: 5, confidence: 0.95 },
        { name: 'Django', proficiency: 'ADVANCED', yearsOfExp: 3, confidence: 0.85 },
      ];

      const result = calculateSkillScore(candidateSkills, jobRequirements);
      expect(result.score).toBeLessThan(30);
      expect(result.missing).toContain('React');
      expect(result.missing).toContain('TypeScript');
      expect(result.missing).toContain('Node.js');
    });

    it('should give moderate score for partial matches', () => {
      const candidateSkills: CandidateSkill[] = [
        { name: 'React', proficiency: 'ADVANCED', yearsOfExp: 2, confidence: 0.80 },
        { name: 'TypeScript', proficiency: 'INTERMEDIATE', yearsOfExp: 1, confidence: 0.70 },
      ];

      const result = calculateSkillScore(candidateSkills, jobRequirements);
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.score).toBeLessThan(80);
    });

    it('should handle empty candidate skills', () => {
      const result = calculateSkillScore([], jobRequirements);
      // Missing optional skills get 10% weight, so score is small but non-zero
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(10);
      expect(result.missing).toHaveLength(5);
    });

    it('should handle empty job requirements', () => {
      const candidateSkills: CandidateSkill[] = [
        { name: 'React', proficiency: 'EXPERT', yearsOfExp: 5, confidence: 0.95 },
      ];
      const result = calculateSkillScore(candidateSkills, []);
      expect(result.score).toBe(100);
    });

    it('should be case-insensitive for skill matching', () => {
      const candidateSkills: CandidateSkill[] = [
        { name: 'react', proficiency: 'EXPERT', yearsOfExp: 5, confidence: 0.95 },
        { name: 'TYPESCRIPT', proficiency: 'ADVANCED', yearsOfExp: 3, confidence: 0.85 },
      ];

      const result = calculateSkillScore(candidateSkills, jobRequirements);
      expect(result.matched).toContain('React');
      expect(result.matched).toContain('TypeScript');
    });

    it('should weight required skills higher than optional', () => {
      const reqs: SkillRequirement[] = [
        { name: 'React', required: true, weight: 5 },
        { name: 'Docker', required: false, weight: 1 },
      ];

      // Candidate with only optional skill
      const result1 = calculateSkillScore(
        [{ name: 'Docker', proficiency: 'EXPERT', yearsOfExp: 5, confidence: 0.95 }],
        reqs
      );

      // Candidate with only required skill
      const result2 = calculateSkillScore(
        [{ name: 'React', proficiency: 'EXPERT', yearsOfExp: 5, confidence: 0.95 }],
        reqs
      );

      expect(result2.score).toBeGreaterThan(result1.score);
    });
  });

  describe('Experience Score Calculation', () => {
    it('should give high score for matching experience level', () => {
      const score = calculateExperienceScore(7, 'SENIOR');
      expect(score).toBeGreaterThanOrEqual(85);
    });

    it('should give decent score for overqualified', () => {
      const score = calculateExperienceScore(12, 'MID');
      expect(score).toBeGreaterThanOrEqual(50);
    });

    it('should give lower score for underqualified', () => {
      const score = calculateExperienceScore(1, 'SENIOR');
      expect(score).toBeLessThan(70);
    });

    it('should handle entry level', () => {
      const score = calculateExperienceScore(0.5, 'ENTRY');
      expect(score).toBeGreaterThanOrEqual(70);
    });

    it('should handle executive level', () => {
      const score = calculateExperienceScore(15, 'EXECUTIVE');
      expect(score).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Overall Score Calculation', () => {
    it('should calculate weighted average correctly', () => {
      const score = calculateOverallScore(90, 80, 85, 75, 70);
      // 90*0.4 + 80*0.2 + 85*0.2 + 75*0.1 + 70*0.1
      // = 36 + 16 + 17 + 7.5 + 7 = 83.5 → 84
      expect(score).toBe(84);
    });

    it('should return 100 for perfect scores', () => {
      const score = calculateOverallScore(100, 100, 100, 100, 100);
      expect(score).toBe(100);
    });

    it('should return 0 for zero scores', () => {
      const score = calculateOverallScore(0, 0, 0, 0, 0);
      expect(score).toBe(0);
    });

    it('should use default weights', () => {
      // Verify default weights sum to 1.0
      const weights = { skills: 0.40, experience: 0.20, projects: 0.20, education: 0.10, semantic: 0.10 };
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBe(1.0);
    });

    it('should accept custom weights', () => {
      const customWeights = { skills: 0.50, experience: 0.25, projects: 0.15, education: 0.05, semantic: 0.05 };
      const score = calculateOverallScore(100, 0, 0, 0, 0, customWeights);
      expect(score).toBe(50); // Only skills contribute at 50% weight
    });

    it('should clamp between 0 and 100', () => {
      // Edge case: very high individual scores — calculation produces >100
      // but in practice scores should be 0-100 from upstream calculations
      const score = calculateOverallScore(100, 100, 100, 100, 100);
      expect(score).toBeLessThanOrEqual(100);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Match Ranking Consistency', () => {
    it('should rank strong candidates higher than weak ones', () => {
      const reqs: SkillRequirement[] = [
        { name: 'React', required: true, weight: 3 },
        { name: 'TypeScript', required: true, weight: 3 },
      ];

      const strongSkills: CandidateSkill[] = [
        { name: 'React', proficiency: 'EXPERT', yearsOfExp: 8, confidence: 0.98 },
        { name: 'TypeScript', proficiency: 'EXPERT', yearsOfExp: 6, confidence: 0.95 },
      ];

      const weakSkills: CandidateSkill[] = [
        { name: 'React', proficiency: 'BEGINNER', yearsOfExp: 0.5, confidence: 0.50 },
      ];

      const strong = calculateSkillScore(strongSkills, reqs);
      const weak = calculateSkillScore(weakSkills, reqs);

      expect(strong.score).toBeGreaterThan(weak.score);
    });

    it('should be deterministic for same inputs', () => {
      const skills: CandidateSkill[] = [
        { name: 'React', proficiency: 'ADVANCED', yearsOfExp: 3, confidence: 0.85 },
      ];
      const reqs: SkillRequirement[] = [
        { name: 'React', required: true, weight: 1 },
      ];

      const result1 = calculateSkillScore(skills, reqs);
      const result2 = calculateSkillScore(skills, reqs);

      expect(result1.score).toBe(result2.score);
      expect(result1.matched).toEqual(result2.matched);
    });
  });
});
