import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================
// Types
// ============================================================

export interface SearchFilters {
  skills?: string[];
  minExperience?: number;
  maxExperience?: number;
  location?: string;
  educationLevel?: string;
  minMatchScore?: number;
  jobId?: string;
  sortBy?: 'relevance' | 'matchScore' | 'name' | 'recent';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ParsedQuery {
  skills: string[];
  desiredSkills: string[];
  avoidedSkills: string[];
  experienceLevel: 'fresher' | 'junior' | 'mid' | 'senior' | null;
  locationKeywords: string[];
  industryKeywords: string[];
  sentiment: Record<string, 'strong' | 'weak'>;
  rawQuery: string;
}

export interface SearchResult {
  candidateId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  location: string | null;
  summary: string | null;
  overallScore: number;
  skillScore: number;
  matchReasons: MatchReason[];
  matchedSkills: string[];
  missingSkills: string[];
  relatedSkills: string[];
  experienceYears: number;
  skillCount: number;
}

export interface MatchReason {
  type: 'skill_match' | 'skill_related' | 'experience' | 'location' | 'keyword' | 'project' | 'education';
  detail: string;
  matched: boolean;
  weight: number;
}

export interface SearchSuggestion {
  text: string;
  category: 'skill' | 'role' | 'location' | 'experience' | 'industry';
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  resultCount: number;
  createdAt: Date;
}

// ============================================================
// NL Query Parser
// ============================================================

// Common skill aliases and synonyms
const SKILL_SYNONYMS: Record<string, string[]> = {
  'js': ['JavaScript'],
  'ts': ['TypeScript'],
  'python': ['Python'],
  'java': ['Java'],
  'react': ['React'],
  'angular': ['Angular'],
  'vue': ['Vue.js'],
  'node': ['Node.js'],
  'nodejs': ['Node.js'],
  'golang': ['Go'],
  'go': ['Go'],
  'k8s': ['Kubernetes'],
  'kubernetes': ['Kubernetes'],
  'ml': ['Machine Learning'],
  'machine learning': ['Machine Learning'],
  'ai': ['Artificial Intelligence'],
  'dl': ['Deep Learning'],
  'deep learning': ['Deep Learning'],
  'nlp': ['Natural Language Processing'],
  'devops': ['CI/CD', 'Docker', 'Kubernetes'],
  'cloud': ['AWS', 'Azure', 'Google Cloud'],
  'aws': ['AWS'],
  'azure': ['Azure'],
  'gcp': ['Google Cloud'],
  'google cloud': ['Google Cloud'],
  'sql': ['SQL', 'PostgreSQL'],
  'postgres': ['PostgreSQL'],
  'mongodb': ['MongoDB'],
  'mongo': ['MongoDB'],
  'nosql': ['MongoDB', 'Redis'],
  'rest': ['REST API'],
  'graphql': ['GraphQL'],
  'docker': ['Docker'],
  'ci/cd': ['CI/CD'],
  'terraform': ['Terraform'],
  'spring': ['Spring Boot'],
  'springboot': ['Spring Boot'],
  'next': ['Next.js'],
  'nextjs': ['Next.js'],
  'tailwind': ['Tailwind CSS'],
  'rust': ['Rust'],
  'c++': ['C++'],
  'c#': ['C#'],
  'dotnet': ['.NET'],
  '.net': ['.NET'],
  'ruby': ['Ruby'],
  'rails': ['Ruby on Rails'],
  'elixir': ['Elixir'],
  'php': ['PHP'],
  'laravel': ['Laravel'],
  'django': ['Django'],
  'flask': ['Flask'],
  'fastapi': ['FastAPI'],
  'express': ['Express.js'],
  'redis': ['Redis'],
  'elasticsearch': ['Elasticsearch'],
  'kafka': ['Apache Kafka'],
  'spark': ['Apache Spark'],
  'airflow': ['Apache Airflow'],
  'tableau': ['Tableau'],
  'power bi': ['Power BI'],
  'pytorch': ['PyTorch'],
  'tensorflow': ['TensorFlow'],
  'opencv': ['OpenCV'],
  'scikit-learn': ['scikit-learn'],
  'sklearn': ['scikit-learn'],
  'agile': ['Agile'],
  'scrum': ['Scrum'],
  'leadership': ['Leadership'],
  'communication': ['Communication'],
};

// Experience level keywords
const EXPERIENCE_KEYWORDS: Record<string, string[]> = {
  fresher: ['fresher', 'fresh', 'graduate', 'grad', 'new grad', 'entry level', 'entry-level', 'intern', 'internship', 'campus'],
  junior: ['junior', 'jr', 'early career', '1-2 years', '1 year', '2 years'],
  mid: ['mid level', 'mid-level', 'intermediate', '3-5 years', '4 years', '5 years'],
  senior: ['senior', 'sr', 'lead', 'principal', 'staff', 'experienced', '6+ years', '5+ years', '8+ years', '10+ years'],
};

// Industry keywords
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  healthcare: ['healthcare', 'medical', 'clinical', 'hospital', 'patient', 'pharma', 'biotech', 'health'],
  finance: ['fintech', 'banking', 'financial', 'trading', 'payment', 'blockchain', 'crypto', 'insurance'],
  ecommerce: ['ecommerce', 'e-commerce', 'retail', 'shop', 'marketplace', 'commerce'],
  education: ['edtech', 'education', 'learning', 'lms', 'school', 'university'],
  gaming: ['gaming', 'game', 'unity', 'unreal', '3d rendering'],
  saas: ['saas', 'b2b', 'enterprise', 'platform'],
  social: ['social', 'social media', 'community', 'messaging'],
  data: ['data science', 'data engineering', 'analytics', 'business intelligence'],
};

// Location keywords
const LOCATION_KEYWORDS = [
  'san francisco', 'sf', 'new york', 'nyc', 'los angeles', 'la', 'seattle',
  'austin', 'boston', 'chicago', 'denver', 'miami', 'portland', 'remote',
  'washington dc', 'atlanta', 'dallas', 'houston', 'phoenix', 'philadelphia',
  'bay area', 'silicon valley', 'new york city',
];

export function parseNaturalLanguageQuery(query: string): ParsedQuery {
  const lower = query.toLowerCase().trim();

  const skills: string[] = [];
  const desiredSkills: string[] = [];
  const avoidedSkills: string[] = [];
  const sentiment: Record<string, 'strong' | 'weak'> = {};
  const locationKeywords: string[] = [];
  const industryKeywords: string[] = [];
  let experienceLevel: ParsedQuery['experienceLevel'] = null;

  // Extract skills from synonyms
  for (const [alias, canonicalSkills] of Object.entries(SKILL_SYNONYMS)) {
    const regex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) {
      for (const skill of canonicalSkills) {
        if (!skills.includes(skill)) skills.push(skill);
      }
    }
  }

  // Also try to match skills directly from the database (case-insensitive)
  // This is done asynchronously later

  // Detect sentiment: "strong" vs "weak" / "but weak"
  const weakPatterns = [
    /(?:but|however|except)\s+(?:weak|low|poor|lacking|without)\s+(\w[\w\s]*?)(?:\s+experience|\s+skills?|\s*$|\.|,)/gi,
    /(?:weak|low|poor|lacking)\s+in\s+(\w[\w\s]*?)(?:\s+experience|\s+skills?|\s*$|\.|,)/gi,
    /without\s+(\w[\w\s]*?)(?:\s+experience|\s+skills?|\s*$|\.|,)/gi,
  ];

  const strongPatterns = [
    /(?:strong|excellent|expert|advanced|proficient)\s+(?:in\s+)?(\w[\w\s]*?)(?:\s+experience|\s+skills?|\s*$|\.|,)/gi,
    /with\s+(?:strong\s+)?(\w[\w\s]*?)(?:\s+experience|\s+skills?|\s*$|\.|,)/gi,
  ];

  for (const pattern of weakPatterns) {
    let match;
    while ((match = pattern.exec(lower)) !== null) {
      const skillText = match[1].trim();
      for (const [alias, canonical] of Object.entries(SKILL_SYNONYMS)) {
        if (skillText.includes(alias)) {
          for (const s of canonical) {
            avoidedSkills.push(s);
            sentiment[s] = 'weak';
          }
        }
      }
    }
  }

  for (const pattern of strongPatterns) {
    let match;
    while ((match = pattern.exec(lower)) !== null) {
      const skillText = match[1].trim();
      for (const [alias, canonical] of Object.entries(SKILL_SYNONYMS)) {
        if (skillText.includes(alias)) {
          for (const s of canonical) {
            desiredSkills.push(s);
            sentiment[s] = 'strong';
          }
        }
      }
    }
  }

  // If no specific strong/weak detected, all skills are desired
  if (desiredSkills.length === 0 && avoidedSkills.length === 0) {
    for (const s of skills) {
      desiredSkills.push(s);
      sentiment[s] = 'strong';
    }
  }

  // Extract experience level
  for (const [level, keywords] of Object.entries(EXPERIENCE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        experienceLevel = level as ParsedQuery['experienceLevel'];
        break;
      }
    }
    if (experienceLevel) break;
  }

  // Extract locations
  for (const loc of LOCATION_KEYWORDS) {
    if (lower.includes(loc)) {
      locationKeywords.push(loc);
    }
  }

  // Extract industry keywords
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        industryKeywords.push(industry);
        break;
      }
    }
  }

  return {
    skills,
    desiredSkills: [...new Set(desiredSkills)],
    avoidedSkills: [...new Set(avoidedSkills)],
    experienceLevel,
    locationKeywords,
    industryKeywords,
    sentiment,
    rawQuery: query,
  };
}

// ============================================================
// Skill Graph Expansion
// ============================================================

async function expandSkillGraph(skillNames: string[]): Promise<Map<string, string[]>> {
  const relatedMap = new Map<string, string[]>();

  for (const skillName of skillNames) {
    const skill = await prisma.skill.findFirst({
      where: { name: { equals: skillName, mode: 'insensitive' } },
    });

    if (skill) {
      const relations = await prisma.skillRelation.findMany({
        where: {
          OR: [
            { sourceId: skill.id },
            { targetId: skill.id },
          ],
        },
      });

      const related = new Set<string>();
      for (const rel of relations) {
        const otherId = rel.sourceId === skill.id ? rel.targetId : rel.sourceId;
        const other = await prisma.skill.findUnique({ where: { id: otherId } });
        if (other) related.add(other.name);
      }
      relatedMap.set(skillName, [...related]);
    }
  }

  return relatedMap;
}

// ============================================================
// Search Engine
// ============================================================

export async function searchCandidates(
  parsedQuery: ParsedQuery,
  filters: SearchFilters
): Promise<{ results: SearchResult[]; total: number; parsedQuery: ParsedQuery }> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  // Expand skills via graph
  const graphExpansion = await expandSkillGraph(parsedQuery.desiredSkills);
  const allDesiredSkills = new Set(parsedQuery.desiredSkills);
  const relatedSkillsMap = new Map<string, string[]>();

  for (const [skill, related] of graphExpansion) {
    const relatedNames = related.filter(r => !allDesiredSkills.has(r));
    relatedSkillsMap.set(skill, relatedNames);
    for (const r of relatedNames) {
      allDesiredSkills.add(r);
    }
  }

  // Fetch all candidate skills for matching
  const candidateSkills = await prisma.candidateSkill.findMany({
    include: {
      skill: true,
      candidate: true,
    },
  });

  // Group by candidate
  const candidateSkillMap = new Map<string, typeof candidateSkills>();
  for (const cs of candidateSkills) {
    const existing = candidateSkillMap.get(cs.candidateId) || [];
    existing.push(cs);
    candidateSkillMap.set(cs.candidateId, existing);
  }

  // Get all unique candidate IDs from skills, plus filter by structured criteria
  const candidateWhere: Prisma.CandidateWhereInput = {};
  if (filters.location) {
    candidateWhere.location = { contains: filters.location, mode: 'insensitive' };
  }

  // Also fetch candidates that match location/other criteria
  const baseCandidates = await prisma.candidate.findMany({
    where: candidateWhere,
    include: {
      skills: { include: { skill: true } },
      experiences: true,
      education: true,
      applications: { include: { job: true } },
    },
  });

  // Score each candidate
  const results: SearchResult[] = [];

  for (const candidate of baseCandidates) {
    const candidateSkillsList = candidateSkillMap.get(candidate.id) || [];
    const skillNames = new Set(candidateSkillsList.map(cs => cs.skill.name));
    const skillLowerMap = new Map(candidateSkillsList.map(cs => [cs.skill.name.toLowerCase(), cs]));

    let totalScore = 0;
    let skillScoreVal = 0;
    const matchReasons: MatchReason[] = [];
    const matchedSkillsList: string[] = [];
    const missingSkillsList: string[] = [];
    const relatedMatchedList: string[] = [];

    // --- Skill Matching ---
    const desiredArray = [...parsedQuery.desiredSkills];
    let skillMatches = 0;
    let skillAvoided = 0;

    for (const desired of desiredArray) {
      const isDesired = parsedQuery.sentiment[desired] !== 'weak';
      const skillData = skillLowerMap.get(desired.toLowerCase());

      if (skillData) {
        if (isDesired) {
          skillMatches++;
          matchedSkillsList.push(desired);
          const profScore = skillData.proficiency === 'EXPERT' ? 100 :
                          skillData.proficiency === 'ADVANCED' ? 85 :
                          skillData.proficiency === 'INTERMEDIATE' ? 65 :
                          skillData.proficiency === 'BEGINNER' ? 40 : 30;
          skillScoreVal += profScore * (skillData.confidence || 0.8);

          matchReasons.push({
            type: 'skill_match',
            detail: `✓ ${desired} (${skillData.proficiency.toLowerCase()}, ${Math.round((skillData.confidence || 0) * 100)}% confidence)`,
            matched: true,
            weight: 1.0,
          });
        } else {
          // This skill is "avoided" (weak) — candidate has it, which is negative
          skillAvoided++;
          matchReasons.push({
            type: 'skill_match',
            detail: `✗ ${desired} — candidate has this but you wanted weak/no ${desired}`,
            matched: false,
            weight: 0.5,
          });
        }
      } else {
        if (isDesired) {
          missingSkillsList.push(desired);
          matchReasons.push({
            type: 'skill_match',
            detail: `○ ${desired} — not found on candidate`,
            matched: false,
            weight: 1.0,
          });
        } else {
          // Good: candidate doesn't have the avoided skill
          matchReasons.push({
            type: 'skill_match',
            detail: `✓ ${desired} — not present (as requested)`,
            matched: true,
            weight: 0.5,
          });
        }
      }
    }

    // Check related skills
    for (const [desired, related] of relatedSkillsMap) {
      for (const rel of related) {
        if (skillLowerMap.has(rel.toLowerCase())) {
          relatedMatchedList.push(rel);
          matchReasons.push({
            type: 'skill_related',
            detail: `~ ${rel} (related to ${desired})`,
            matched: true,
            weight: 0.3,
          });
        }
      }
    }

    // Calculate skill score
    if (desiredArray.length > 0) {
      const desiredCount = desiredArray.filter(d => parsedQuery.sentiment[d] !== 'weak').length;
      const avoidedCount = desiredArray.filter(d => parsedQuery.sentiment[d] === 'weak').length;
      skillScoreVal = desiredCount > 0 ? (skillScoreVal / (desiredCount * 100)) * 100 : 0;
      // Penalize for having avoided skills
      if (avoidedCount > 0 && skillAvoided > 0) {
        skillScoreVal *= (1 - (skillAvoided / avoidedCount) * 0.3);
      }
      // Bonus for related skills
      if (relatedMatchedList.length > 0) {
        skillScoreVal = Math.min(100, skillScoreVal + relatedMatchedList.length * 3);
      }
    }

    // --- Experience Matching ---
    let totalYears = 0;
    const now = new Date();
    for (const exp of candidate.experiences) {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : now;
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalYears += Math.max(0, months) / 12;
    }

    let experienceScore = 0;
    if (parsedQuery.experienceLevel) {
      const levelRanges: Record<string, [number, number]> = {
        fresher: [0, 1],
        junior: [1, 3],
        mid: [3, 6],
        senior: [6, 20],
      };
      const [min, max] = levelRanges[parsedQuery.experienceLevel] || [0, 20];
      if (totalYears >= min && totalYears <= max) {
        experienceScore = 100;
        matchReasons.push({
          type: 'experience',
          detail: `✓ ${totalYears.toFixed(1)} years experience matches ${parsedQuery.experienceLevel} level`,
          matched: true,
          weight: 0.8,
        });
      } else if (totalYears < min) {
        experienceScore = Math.max(0, 50 - (min - totalYears) * 20);
        matchReasons.push({
          type: 'experience',
          detail: `○ ${totalYears.toFixed(1)} years — less than expected for ${parsedQuery.experienceLevel}`,
          matched: false,
          weight: 0.8,
        });
      } else {
        experienceScore = Math.max(50, 100 - (totalYears - max) * 5);
        matchReasons.push({
          type: 'experience',
          detail: `~ ${totalYears.toFixed(1)} years — more experienced than ${parsedQuery.experienceLevel}`,
          matched: true,
          weight: 0.4,
        });
      }
    } else {
      experienceScore = Math.min(100, totalYears * 15);
    }

    // --- Location Matching ---
    let locationScore = 50; // default neutral
    if (parsedQuery.locationKeywords.length > 0 && candidate.location) {
      const locLower = candidate.location.toLowerCase();
      const matched = parsedQuery.locationKeywords.some(l => locLower.includes(l));
      if (matched) {
        locationScore = 100;
        matchReasons.push({
          type: 'location',
          detail: `✓ Location matches: ${candidate.location}`,
          matched: true,
          weight: 0.5,
        });
      } else {
        locationScore = 30;
        matchReasons.push({
          type: 'location',
          detail: `○ Location: ${candidate.location} (requested: ${parsedQuery.locationKeywords.join(', ')})`,
          matched: false,
          weight: 0.5,
        });
      }
    } else if (parsedQuery.locationKeywords.length === 0) {
      locationScore = 75; // no preference
    }

    // --- Industry/Project Matching ---
    let industryScore = 50;
    if (parsedQuery.industryKeywords.length > 0) {
      const candidateText = [
        candidate.summary || '',
        ...candidate.experiences.map(e => `${e.title} ${e.description || ''}`),
        ...candidate.applications.map(a => a.job?.title || ''),
      ].join(' ').toLowerCase();

      const matches = parsedQuery.industryKeywords.filter(ind => {
        const keywords = INDUSTRY_KEYWORDS[ind] || [];
        return keywords.some(kw => candidateText.includes(kw));
      });

      if (matches.length > 0) {
        industryScore = 80 + matches.length * 10;
        matchReasons.push({
          type: 'keyword',
          detail: `✓ Industry relevance: ${matches.join(', ')}`,
          matched: true,
          weight: 0.4,
        });
      }
    }

    // --- Compute Overall Score ---
    const weights = { skills: 0.45, experience: 0.20, location: 0.15, industry: 0.20 };
    const overallScore = Math.round(
      skillScoreVal * weights.skills +
      experienceScore * weights.experience +
      locationScore * weights.location +
      industryScore * weights.industry
    );

    // Filter by minimum match score
    if (filters.minMatchScore && overallScore < filters.minMatchScore) continue;

    // Filter by job match
    if (filters.jobId) {
      const hasApplication = candidate.applications.some(a => a.jobId === filters.jobId);
      // Still include, but note it
    }

    results.push({
      candidateId: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      location: candidate.location,
      summary: candidate.summary,
      overallScore: Math.max(0, Math.min(100, overallScore)),
      skillScore: Math.round(skillScoreVal),
      matchReasons,
      matchedSkills: matchedSkillsList,
      missingSkills: missingSkillsList,
      relatedSkills: relatedMatchedList,
      experienceYears: totalYears,
      skillCount: candidateSkillsList.length,
    });
  }

  // Sort results
  const sortBy = filters.sortBy || 'relevance';
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

  results.sort((a, b) => {
    switch (sortBy) {
      case 'matchScore':
        return (b.overallScore - a.overallScore) * sortOrder;
      case 'name':
        return (a.firstName.localeCompare(b.firstName)) * sortOrder;
      case 'recent':
        return 0; // keep default order
      case 'relevance':
      default:
        return (b.overallScore - a.overallScore) * sortOrder;
    }
  });

  const total = results.length;
  const paginated = results.slice(skip, skip + limit);

  return { results: paginated, total, parsedQuery };
}

// ============================================================
// Search Suggestions
// ============================================================

export async function getSearchSuggestions(partial: string): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = [];
  const lower = partial.toLowerCase();

  // Skill suggestions
  const skills = await prisma.skill.findMany({
    where: { name: { contains: partial, mode: 'insensitive' } },
    take: 5,
  });

  for (const skill of skills) {
    suggestions.push({ text: skill.name, category: 'skill' });
  }

  // Role-based suggestions
  const roleSuggestions = [
    'Find freshers with Python',
    'Find senior React developers',
    'Find backend engineers with Java and Spring Boot',
    'Find candidates with healthcare projects',
    'Find strong SQL but weak cloud',
    'Find DevOps engineers with Kubernetes',
    'Find machine learning engineers with PyTorch',
    'Find full-stack developers with TypeScript',
    'Find remote candidates with Go experience',
    'Find candidates with strong communication skills',
  ];

  for (const role of roleSuggestions) {
    if (lower && role.toLowerCase().includes(lower)) {
      suggestions.push({ text: role, category: 'role' });
    } else if (!lower) {
      suggestions.push({ text: role, category: 'role' });
    }
  }

  // Location suggestions
  const locations = ['San Francisco', 'New York', 'Remote', 'Austin', 'Seattle', 'Boston'];
  for (const loc of locations) {
    if (lower && loc.toLowerCase().includes(lower)) {
      suggestions.push({ text: loc, category: 'location' });
    }
  }

  return suggestions.slice(0, 8);
}

// ============================================================
// Saved Searches (in-memory for now, would be DB in production)
// ============================================================

const savedSearches: Map<string, SavedSearch & { organizationId: string }> = new Map();

export async function saveSearch(
  name: string,
  query: string,
  filters: SearchFilters,
  resultCount: number,
  organizationId: string
): Promise<SavedSearch> {
  const id = `ss_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const search: SavedSearch = {
    id,
    name,
    query,
    filters,
    resultCount,
    createdAt: new Date(),
  };
  savedSearches.set(id, { ...search, organizationId });
  return search;
}

export async function getSavedSearches(organizationId: string): Promise<SavedSearch[]> {
  return [...savedSearches.values()]
    .filter(s => s.organizationId === organizationId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function deleteSavedSearch(id: string, organizationId: string): Promise<boolean> {
  const search = savedSearches.get(id);
  if (search && search.organizationId === organizationId) {
    savedSearches.delete(id);
    return true;
  }
  return false;
}
