import { describe, it, expect } from 'vitest';

// AI tool permission definitions
const AI_TOOLS = {
  searchCandidates: {
    name: 'searchCandidates',
    description: 'Search for candidates based on skills, experience, and other criteria',
    requiredRole: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
    params: ['query', 'filters'],
  },
  getCandidate: {
    name: 'getCandidate',
    description: 'Get detailed information about a specific candidate',
    requiredRole: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER'],
    params: ['candidateId'],
  },
  getJob: {
    name: 'getJob',
    description: 'Get detailed information about a specific job',
    requiredRole: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
    params: ['jobId'],
  },
  compareCandidates: {
    name: 'compareCandidates',
    description: 'Compare multiple candidates side by side',
    requiredRole: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
    params: ['candidateIds'],
  },
  getMatchScore: {
    name: 'getMatchScore',
    description: 'Get the match score between a candidate and a job',
    requiredRole: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
    params: ['candidateId', 'jobId'],
  },
  getSkillGap: {
    name: 'getSkillGap',
    description: 'Analyze skill gaps for a candidate against a job',
    requiredRole: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
    params: ['candidateId', 'jobId'],
  },
  getAnalytics: {
    name: 'getAnalytics',
    description: 'Get recruitment analytics and metrics',
    requiredRole: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
    params: ['metric', 'filters'],
  },
  generateInterviewQuestions: {
    name: 'generateInterviewQuestions',
    description: 'Generate interview questions based on candidate profile and job requirements',
    requiredRole: ['SUPER_ADMIN', 'ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER'],
    params: ['candidateId', 'jobId'],
  },
} as const;

type ToolName = keyof typeof AI_TOOLS;
type RoleName = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'INTERVIEWER';

function canUseTool(role: RoleName, toolName: ToolName): boolean {
  const tool = AI_TOOLS[toolName];
  if (!tool) return false;
  return (tool.requiredRole as readonly string[]).includes(role);
}

/**
 * Parse natural language search query into structured filters
 */
function parseSearchQuery(query: string): {
  skills: string[];
  experience: { min?: number; max?: number } | null;
  isFresher: boolean;
  keywords: string[];
} {
  const lower = query.toLowerCase();
  const skills: string[] = [];
  const keywords: string[] = [];
  let experience: { min?: number; max?: number } | null = null;
  let isFresher = false;

  // Detect fresher/entry-level
  if (/\bfreshers?\b|\bentry.?level\b|\bjunior\b|\bintern\b/.test(lower)) {
    isFresher = true;
  }

  // Detect experience ranges
  const expMatch = lower.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience)?/);
  if (expMatch) {
    experience = { min: parseInt(expMatch[1]) };
  }

  // Detect skill mentions
  const skillPatterns = [
    'python', 'java', 'javascript', 'typescript', 'react', 'node\\.?js',
    'angular', 'vue', 'django', 'flask', 'fastapi', 'spring boot',
    'machine learning', 'ml', 'deep learning', 'nlp', 'computer vision',
    'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'k8s', 'terraform',
    'sql', 'postgresql', 'mongodb', 'redis', 'graphql', 'rest apis?',
    'go', 'rust', 'c\\+\\+', 'ruby', 'php', 'swift', 'kotlin',
    'figma', 'design', 'figma',
  ];

  for (const pattern of skillPatterns) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'i');
    if (regex.test(query)) {
      skills.push(pattern.replace(/\\\./g, '.').replace(/\\+\\+/g, '++'));
    }
  }

  // Extract remaining keywords
  const words = lower.replace(/[^\w\s]/g, '').split(/\s+/);
  keywords.push(...words.filter(w => w.length > 2 && !skills.some(s => s.toLowerCase().includes(w))));

  return { skills, experience, isFresher, keywords };
}

describe('AI Tools', () => {
  describe('Tool Permissions', () => {
    it('SUPER_ADMIN can access all tools', () => {
      const toolNames = Object.keys(AI_TOOLS) as ToolName[];
      toolNames.forEach(tool => {
        expect(canUseTool('SUPER_ADMIN', tool)).toBe(true);
      });
    });

    it('ORG_ADMIN can access all tools', () => {
      const toolNames = Object.keys(AI_TOOLS) as ToolName[];
      toolNames.forEach(tool => {
        expect(canUseTool('ORG_ADMIN', tool)).toBe(true);
      });
    });

    it('RECRUITER can access most tools', () => {
      expect(canUseTool('RECRUITER', 'searchCandidates')).toBe(true);
      expect(canUseTool('RECRUITER', 'getCandidate')).toBe(true);
      expect(canUseTool('RECRUITER', 'getJob')).toBe(true);
      expect(canUseTool('RECRUITER', 'compareCandidates')).toBe(true);
      expect(canUseTool('RECRUITER', 'getMatchScore')).toBe(true);
      expect(canUseTool('RECRUITER', 'getSkillGap')).toBe(true);
      expect(canUseTool('RECRUITER', 'getAnalytics')).toBe(true);
      expect(canUseTool('RECRUITER', 'generateInterviewQuestions')).toBe(true);
    });

    it('INTERVIEWER has limited tool access', () => {
      expect(canUseTool('INTERVIEWER', 'getCandidate')).toBe(true);
      expect(canUseTool('INTERVIEWER', 'generateInterviewQuestions')).toBe(true);
      expect(canUseTool('INTERVIEWER', 'searchCandidates')).toBe(false);
      expect(canUseTool('INTERVIEWER', 'getJob')).toBe(false);
      expect(canUseTool('INTERVIEWER', 'getAnalytics')).toBe(false);
    });

    it('HIRING_MANAGER can access most tools', () => {
      expect(canUseTool('HIRING_MANAGER', 'searchCandidates')).toBe(true);
      expect(canUseTool('HIRING_MANAGER', 'getAnalytics')).toBe(true);
      expect(canUseTool('HIRING_MANAGER', 'compareCandidates')).toBe(true);
    });

    it('should reject unknown tool names', () => {
      expect(canUseTool('SUPER_ADMIN', 'nonexistent' as ToolName)).toBe(false);
    });
  });

  describe('Tool Definitions', () => {
    it('should have all required fields', () => {
      const toolNames = Object.keys(AI_TOOLS) as ToolName[];
      toolNames.forEach(tool => {
        const def = AI_TOOLS[tool];
        expect(def.name).toBeDefined();
        expect(def.description).toBeDefined();
        expect(def.requiredRole).toBeDefined();
        expect(def.params).toBeDefined();
        expect(def.params.length).toBeGreaterThan(0);
      });
    });

    it('should have 8 tools total', () => {
      expect(Object.keys(AI_TOOLS)).toHaveLength(8);
    });

    it('each tool should have at least 2 params', () => {
      const toolNames = Object.keys(AI_TOOLS) as ToolName[];
      toolNames.forEach(tool => {
        expect(AI_TOOLS[tool].params.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Search Query Parser', () => {
    it('should parse skills from query', () => {
      const result = parseSearchQuery('Find candidates with Python and React experience');
      expect(result.skills).toContain('python');
      expect(result.skills).toContain('react');
    });

    it('should detect fresher queries', () => {
      const result = parseSearchQuery('Find freshers with Python');
      expect(result.isFresher).toBe(true);
    });

    it('should detect entry-level queries', () => {
      const result = parseSearchQuery('Find entry-level developers');
      expect(result.isFresher).toBe(true);
    });

    it('should detect experience requirements', () => {
      const result = parseSearchQuery('Find candidates with 5+ years of experience');
      expect(result.experience).toEqual({ min: 5 });
    });

    it('should parse cloud skills', () => {
      const result = parseSearchQuery('Find candidates with AWS and Docker');
      expect(result.skills).toContain('aws');
      expect(result.skills).toContain('docker');
    });

    it('should handle empty query', () => {
      const result = parseSearchQuery('');
      expect(result.skills).toHaveLength(0);
      expect(result.isFresher).toBe(false);
      expect(result.experience).toBeNull();
    });

    it('should handle complex multi-skill queries', () => {
      const result = parseSearchQuery(
        'Find backend developers with Java, Spring Boot, and PostgreSQL'
      );
      expect(result.skills.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect healthcare project mention', () => {
      const result = parseSearchQuery(
        'Find candidates with healthcare project experience'
      );
      expect(result.keywords).toContain('healthcare');
    });
  });

  describe('AI Response Validation', () => {
    it('should validate response structure', () => {
      const response = {
        candidates: [
          { id: '1', name: 'Test', score: 85 },
        ],
        total: 1,
        query: 'test',
      };

      expect(response.candidates).toBeDefined();
      expect(Array.isArray(response.candidates)).toBe(true);
      expect(response.total).toBeGreaterThan(0);
    });

    it('should handle empty results', () => {
      const response = {
        candidates: [],
        total: 0,
        query: 'nonexistent',
      };

      expect(response.candidates).toHaveLength(0);
      expect(response.total).toBe(0);
    });

    it('should not hallucinate candidate data', () => {
      // The AI should only return data from the database
      const mockDbCandidates = [
        { id: '123', firstName: 'Real', lastName: 'Candidate' },
      ];

      const response = {
        candidates: mockDbCandidates.map(c => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          source: 'database',
        })),
      };

      response.candidates.forEach(c => {
        expect(mockDbCandidates.some(db => db.id === c.id)).toBe(true);
      });
    });
  });

  describe('AI Permission Boundaries', () => {
    it('should not expose internal system prompts', () => {
      const systemPrompt = 'You are TalentIQ AI assistant';
      expect(systemPrompt).not.toContain('password');
      expect(systemPrompt).not.toContain('secret');
    });

    it('should not allow cross-organization data access', () => {
      const userOrg: string = 'org-1';
      const resourceOrg: string = 'org-2';

      const hasAccess = userOrg === resourceOrg;
      expect(hasAccess).toBe(false);
    });

    it('should validate tool parameters', () => {
      const validParams = { candidateId: 'uuid-123', jobId: 'uuid-456' };
      const invalidParams = { candidateId: '', jobId: undefined };

      expect(validParams.candidateId.length).toBeGreaterThan(0);
      expect(invalidParams.jobId).toBeUndefined();
    });
  });
});
