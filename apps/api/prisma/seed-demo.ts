/**
 * TalentIQ Comprehensive Demo Seed
 * 
 * Generates realistic demo data:
 * - 3 organizations
 * - 10 users across roles
 * - 15 jobs with skill requirements
 * - 500 candidates with full profiles
 * - 1000+ applications
 * - Candidate matches with evidence
 * - Interviews and feedback
 * - Audit logs
 * - Notifications
 * 
 * ⚠️  THIS IS DEMO DATA — NOT real-world information.
 *     All names, companies, emails, and scenarios are fictional.
 */

import { PrismaClient, Role, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { calculateMatch } from '../src/services/matching.service';

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════════
// Realistic Data Pools (all fictional)
// ══════════════════════════════════════════════════════════════

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Sai', 'Rohan', 'Vihaan', 'Krishna',
  'Diya', 'Ananya', 'Isha', 'Priya', 'Neha', 'Kavya', 'Meera', 'Shreya',
  'Rahul', 'Amit', 'Vikram', 'Sanjay', 'Deepak', 'Rajesh', 'Suresh', 'Manoj',
  'Pooja', 'Divya', 'Nisha', 'Sneha', 'Pallavi', 'Rekha', 'Sunita', 'Usha',
  'Chen', 'Wei', 'Li', 'Zhang', 'Liu', 'Yang', 'Huang', 'Zhao',
  'Yuki', 'Takashi', 'Haruto', 'Sakura', 'Rina', 'Aoi', 'Ren', 'Sora',
  'Fatima', 'Omar', 'Youssef', 'Layla', 'Noor', 'Zara', 'Hassan', 'Ali',
  'Carlos', 'Maria', 'Sofia', 'Diego', 'Elena', 'Pablo', 'Valentina', 'Mateo',
  'Oliver', 'Emma', 'Liam', 'Charlotte', 'Noah', 'Amelia', 'William', 'Sophia',
  'James', 'Sarah', 'Michael', 'Jessica', 'David', 'Emily', 'Robert', 'Ashley',
  'Daniel', 'Jennifer', 'Ahmed', 'Mohammed', 'Fatou', 'Amara', 'Kofi', 'Aisha',
  'Jin', 'Min', 'Seo-yeon', 'Ji-hoon', 'Eun-bi', 'Tae-hyun', 'So-yeon', 'Ha-neul',
  'Marco', 'Giulia', 'Luca', 'Francesca', 'Alessandro', 'Chiara', 'Matteo', 'Valentina',
  'Lars', 'Ingrid', 'Erik', 'Astrid', 'Olaf', 'Sigrid', 'Henrik', 'Freya',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Verma', 'Reddy', 'Nair',
  'Desai', 'Joshi', 'Iyer', 'Mukherjee', 'Chatterjee', 'Banerjee', 'Das', 'Bose',
  'Krishnan', 'Menon', 'Pillai', 'Rao', 'Setty', 'Hegde', 'Kamath', 'Prabhu',
  'Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Yang', 'Huang', 'Zhao',
  'Wu', 'Zhou', 'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Lin',
  'Tanaka', 'Sato', 'Suzuki', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi',
  'Kim', 'Park', 'Lee', 'Jung', 'Cho', 'Kang', 'Yoon', 'Jang',
  'Ali', 'Hassan', 'Mahmoud', 'Ibrahim', 'Omar', 'Khalil', 'Nasser', 'Farid',
  'Garcia', 'Martinez', 'Rodriguez', 'Lopez', 'Hernandez', 'Gonzalez', 'Perez', 'Sanchez',
  'Müller', 'Schmidt', 'Weber', 'Fischer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
  'Andersson', 'Johansson', 'Larsson', 'Eriksson', 'Olsson', 'Nilsson', 'Persson', 'Svensson',
  'Rossi', 'Russo', 'Ferrari', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino',
  'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefevre', 'Leroy', 'Roux',
];

const LOCATIONS = [
  'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Chicago, IL',
  'Boston, MA', 'Los Angeles, CA', 'Denver, CO', 'Portland, OR', 'Atlanta, GA',
  'Miami, FL', 'Dallas, TX', 'Phoenix, AZ', 'Minneapolis, MN', 'Detroit, MI',
  'London, UK', 'Berlin, Germany', 'Toronto, Canada', 'Amsterdam, Netherlands', 'Dublin, Ireland',
  'Singapore', 'Tokyo, Japan', 'Sydney, Australia', 'Remote', 'Remote (US)',
  'Remote (EU)', 'Hybrid - NYC', 'Hybrid - SF', 'Hybrid - London', 'Bangalore, India',
  'Hyderabad, India', 'Pune, India', 'Mumbai, India', 'Zurich, Switzerland', 'Stockholm, Sweden',
  'Paris, France', 'Barcelona, Spain', 'Seoul, South Korea', 'Tel Aviv, Israel', 'São Paulo, Brazil',
];

const COMPANIES = [
  'Apex Dynamics', 'NovaTech Solutions', 'Horizon Software', 'Meridian Systems',
  'Catalyst Labs', 'Synapse Digital', 'Pinnacle Tech', 'Vertex Innovations',
  'Quantum Leap', 'Nexus Technologies', 'Terraforge Labs', 'Zenith Computing',
  'Vanguard Analytics', 'Prism Technologies', 'Arcadia Systems', 'Forgepoint Solutions',
  'Spectra Networks', 'Crucible Technologies', 'Orbit Data Labs', 'Bastion Security',
  'Atlas Cloud Services', 'Ivy Digital Partners', 'Redwood Analytics', 'Lighthouse AI',
  'Steelbridge Consulting', 'Cobalt Systems', 'Windmill Tech', 'Granite Labs',
  'Summit Platforms', 'Clearpath Engineering', 'Bridgewater Tech', 'Oakmont Solutions',
  'Polaris Data Co.', 'Evergreen Software', 'Ironclad Security', 'Crestline AI',
  'Maple Computing', 'Aspen Analytics', 'Juniper Systems', 'Cedar Technologies',
];

const UNIVERSITIES = [
  'MIT', 'Stanford University', 'UC Berkeley', 'Carnegie Mellon University',
  'Georgia Tech', 'University of Washington', 'University of Michigan', 'Columbia University',
  'Princeton University', 'Caltech', 'Cornell University', 'University of Illinois',
  'Purdue University', 'University of Texas at Austin', 'University of Wisconsin',
  'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IIT Kanpur', 'BITS Pilani',
  'National University of Singapore', 'Tsinghua University', 'Peking University',
  'University of Tokyo', 'Seoul National University', 'ETH Zurich', 'TU Munich',
  'University of Edinburgh', 'Imperial College London', 'University of Cambridge',
  'University of Oxford', 'University of Waterloo', 'McGill University',
  'University of Melbourne', 'University of Sydney', 'KAIST', 'Technion',
];

// Full degree words ("Bachelor of …") because the product's education scorer
// matches on the literal words bachelor/master/doctorate.
const DEGREES = [
  'Bachelor of Science in Computer Science', 'Bachelor of Science in Software Engineering', 'Bachelor of Science in Information Technology',
  'Bachelor of Technology in Computer Science', 'Bachelor of Science in Mathematics', 'Bachelor of Science in Physics',
  'Bachelor of Science in Electrical Engineering', 'Bachelor of Science in Data Science',
  'Master of Science in Computer Science', 'Master of Science in Data Science', 'Master of Science in Artificial Intelligence',
  'Master of Science in Software Engineering', 'Master of Science in Information Systems', 'Master of Business Administration',
  'Doctor of Philosophy in Computer Science', 'Doctor of Philosophy in Machine Learning', 'Master of Engineering in Computer Science',
];

const DEPARTMENTS = [
  'Engineering', 'AI/ML', 'Infrastructure', 'Data Science', 'Product',
  'Security', 'Design', 'Platform', 'Mobile', 'Cloud Services',
  'DevOps', 'Backend Systems', 'Frontend', 'Research', 'Analytics',
];

// ══════════════════════════════════════════════════════════════
// Skill Data
// ══════════════════════════════════════════════════════════════

const SKILL_CATEGORIES = [
  { name: 'Programming Languages', icon: 'code' },
  { name: 'Frontend', icon: 'layout' },
  { name: 'Backend', icon: 'server' },
  { name: 'Cloud & DevOps', icon: 'cloud' },
  { name: 'Data & AI', icon: 'database' },
  { name: 'Soft Skills', icon: 'users' },
  { name: 'Security', icon: 'shield' },
  { name: 'Mobile', icon: 'smartphone' },
];

interface SkillDef { name: string; category: string; }
const ALL_SKILLS: SkillDef[] = [
  // Programming
  { name: 'JavaScript', category: 'Programming Languages' },
  { name: 'TypeScript', category: 'Programming Languages' },
  { name: 'Python', category: 'Programming Languages' },
  { name: 'Java', category: 'Programming Languages' },
  { name: 'Go', category: 'Programming Languages' },
  { name: 'Rust', category: 'Programming Languages' },
  { name: 'C++', category: 'Programming Languages' },
  { name: 'C#', category: 'Programming Languages' },
  { name: 'Ruby', category: 'Programming Languages' },
  { name: 'Kotlin', category: 'Programming Languages' },
  { name: 'Swift', category: 'Programming Languages' },
  { name: 'Scala', category: 'Programming Languages' },
  { name: 'PHP', category: 'Programming Languages' },
  { name: 'Elixir', category: 'Programming Languages' },
  // Frontend
  { name: 'React', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'Vue.js', category: 'Frontend' },
  { name: 'Angular', category: 'Frontend' },
  { name: 'Svelte', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'HTML/CSS', category: 'Frontend' },
  { name: 'Redux', category: 'Frontend' },
  { name: 'WebAssembly', category: 'Frontend' },
  // Backend
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express.js', category: 'Backend' },
  { name: 'Spring Boot', category: 'Backend' },
  { name: 'Django', category: 'Backend' },
  { name: 'Flask', category: 'Backend' },
  { name: 'FastAPI', category: 'Backend' },
  { name: 'PostgreSQL', category: 'Backend' },
  { name: 'MongoDB', category: 'Backend' },
  { name: 'Redis', category: 'Backend' },
  { name: 'GraphQL', category: 'Backend' },
  { name: 'REST APIs', category: 'Backend' },
  { name: 'Microservices', category: 'Backend' },
  { name: 'Kafka', category: 'Backend' },
  { name: 'RabbitMQ', category: 'Backend' },
  // Cloud & DevOps
  { name: 'AWS', category: 'Cloud & DevOps' },
  { name: 'GCP', category: 'Cloud & DevOps' },
  { name: 'Azure', category: 'Cloud & DevOps' },
  { name: 'Docker', category: 'Cloud & DevOps' },
  { name: 'Kubernetes', category: 'Cloud & DevOps' },
  { name: 'CI/CD', category: 'Cloud & DevOps' },
  { name: 'Terraform', category: 'Cloud & DevOps' },
  { name: 'Ansible', category: 'Cloud & DevOps' },
  { name: 'Jenkins', category: 'Cloud & DevOps' },
  { name: 'GitHub Actions', category: 'Cloud & DevOps' },
  // Data & AI
  { name: 'Machine Learning', category: 'Data & AI' },
  { name: 'TensorFlow', category: 'Data & AI' },
  { name: 'PyTorch', category: 'Data & AI' },
  { name: 'Data Analysis', category: 'Data & AI' },
  { name: 'SQL', category: 'Data & AI' },
  { name: 'Pandas', category: 'Data & AI' },
  { name: 'NLP', category: 'Data & AI' },
  { name: 'Computer Vision', category: 'Data & AI' },
  { name: 'Spark', category: 'Data & AI' },
  { name: 'Airflow', category: 'Data & AI' },
  // Soft Skills
  { name: 'Communication', category: 'Soft Skills' },
  { name: 'Team Leadership', category: 'Soft Skills' },
  { name: 'Problem Solving', category: 'Soft Skills' },
  { name: 'Project Management', category: 'Soft Skills' },
  { name: 'Agile/Scrum', category: 'Soft Skills' },
  { name: 'Technical Writing', category: 'Soft Skills' },
  { name: 'Mentoring', category: 'Soft Skills' },
  // Security
  { name: 'OAuth/JWT', category: 'Security' },
  { name: 'Penetration Testing', category: 'Security' },
  { name: 'OWASP', category: 'Security' },
  { name: 'Network Security', category: 'Security' },
  { name: 'Cryptography', category: 'Security' },
  // Mobile
  { name: 'React Native', category: 'Mobile' },
  { name: 'Flutter', category: 'Mobile' },
  { name: 'iOS (Swift)', category: 'Mobile' },
  { name: 'Android (Kotlin)', category: 'Mobile' },
];

const JOB_TEMPLATES = [
  {
    title: 'Senior Full-Stack Engineer',
    desc: 'Join our core platform team to build scalable web applications. You will design and implement RESTful APIs, build responsive front-end interfaces using React and TypeScript, work with PostgreSQL and Redis, and deploy to AWS using Docker and Kubernetes. Strong collaboration skills required.',
    dept: 'Engineering', location: 'San Francisco, CA (Hybrid)',
    expLevel: 'SENIOR', salaryMin: 150000, salaryMax: 200000,
    requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
    preferredSkills: ['AWS', 'Docker', 'GraphQL', 'Kubernetes'],
  },
  {
    title: 'Machine Learning Engineer',
    desc: 'Build and deploy machine learning models at scale. Work on natural language processing, recommendation systems, and predictive analytics using Python, PyTorch, and TensorFlow. Experience with large-scale data processing and model deployment on cloud platforms is essential.',
    dept: 'AI/ML', location: 'Remote',
    expLevel: 'SENIOR', salaryMin: 160000, salaryMax: 220000,
    requiredSkills: ['Python', 'Machine Learning', 'PyTorch', 'SQL'],
    preferredSkills: ['TensorFlow', 'AWS', 'NLP', 'Kubernetes'],
  },
  {
    title: 'DevOps Engineer',
    desc: 'Manage cloud infrastructure and CI/CD pipelines. Work with AWS, Kubernetes, and Terraform to ensure reliability, scalability, and security of production systems. Implement monitoring, alerting, and incident response procedures.',
    dept: 'Infrastructure', location: 'Austin, TX',
    expLevel: 'MID', salaryMin: 120000, salaryMax: 160000,
    requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'],
    preferredSkills: ['CI/CD', 'Ansible', 'Python', 'GitHub Actions'],
  },
  {
    title: 'Junior React Developer',
    desc: 'Entry-level position for a React developer. Great opportunity to learn and grow. You will assist in building user interfaces, learn best practices, and contribute to our design system. Mentorship provided.',
    dept: 'Engineering', location: 'New York, NY',
    expLevel: 'ENTRY', salaryMin: 70000, salaryMax: 95000,
    requiredSkills: ['JavaScript', 'React', 'HTML/CSS'],
    preferredSkills: ['TypeScript', 'Tailwind CSS', 'Git'],
  },
  {
    title: 'Backend Engineer (Go)',
    desc: 'Build high-performance backend services using Go. Design and implement distributed systems, RESTful APIs, and microservices architecture. Strong understanding of concurrency and performance optimization required.',
    dept: 'Engineering', location: 'Remote',
    expLevel: 'MID', salaryMin: 130000, salaryMax: 170000,
    requiredSkills: ['Go', 'REST APIs', 'PostgreSQL', 'Docker'],
    preferredSkills: ['Kafka', 'Redis', 'Kubernetes', 'gRPC'],
  },
  {
    title: 'Data Scientist',
    desc: 'Analyze large datasets and build predictive models to drive business decisions. Work with cross-functional teams to identify opportunities for data-driven improvements. Experience with statistical analysis, ML, and data visualization required.',
    dept: 'Data Science', location: 'Boston, MA',
    expLevel: 'MID', salaryMin: 120000, salaryMax: 165000,
    requiredSkills: ['Python', 'SQL', 'Data Analysis', 'Machine Learning'],
    preferredSkills: ['Spark', 'Airflow', 'TensorFlow', 'Pandas'],
  },
  {
    title: 'Security Engineer',
    desc: 'Protect our systems and data from threats. Conduct penetration testing, implement security controls, and ensure compliance with security standards. Work with development teams to embed security practices.',
    dept: 'Security', location: 'Remote',
    expLevel: 'SENIOR', salaryMin: 140000, salaryMax: 190000,
    requiredSkills: ['OWASP', 'Network Security', 'OAuth/JWT', 'Cryptography'],
    preferredSkills: ['Python', 'Penetration Testing', 'AWS', 'Kubernetes'],
  },
  {
    title: 'Product Designer',
    desc: 'Create beautiful, intuitive interfaces and comprehensive design systems. Conduct user research, prototype interactions, and collaborate closely with engineering teams to ship polished products.',
    dept: 'Design', location: 'San Francisco, CA',
    expLevel: 'MID', salaryMin: 110000, salaryMax: 155000,
    requiredSkills: ['HTML/CSS', 'Communication', 'Problem Solving'],
    preferredSkills: ['React', 'Figma', 'Tailwind CSS'],
  },
  {
    title: 'iOS Developer',
    desc: 'Build and maintain iOS applications using Swift and SwiftUI. Collaborate with design and backend teams to deliver seamless mobile experiences. Experience with UIKit, Core Data, and CI/CD for mobile is valued.',
    dept: 'Mobile', location: 'Seattle, WA',
    expLevel: 'MID', salaryMin: 125000, salaryMax: 165000,
    requiredSkills: ['Swift', 'iOS (Swift)', 'REST APIs'],
    preferredSkills: ['Kotlin', 'Docker', 'CI/CD', 'PostgreSQL'],
  },
  {
    title: 'Senior Data Engineer',
    desc: 'Design and build data pipelines that process terabytes of data daily. Work with Spark, Kafka, and Airflow to create reliable data infrastructure. Ensure data quality and optimize performance.',
    dept: 'Data Science', location: 'Chicago, IL',
    expLevel: 'SENIOR', salaryMin: 145000, salaryMax: 195000,
    requiredSkills: ['Python', 'SQL', 'Spark', 'Kafka'],
    preferredSkills: ['Airflow', 'AWS', 'Terraform', 'Docker'],
  },
  {
    title: 'Frontend Architect',
    desc: 'Define frontend architecture and best practices for a large-scale web platform. Lead technical decisions on state management, performance optimization, and build tooling. Mentor junior developers.',
    dept: 'Engineering', location: 'New York, NY (Hybrid)',
    expLevel: 'LEAD', salaryMin: 170000, salaryMax: 225000,
    requiredSkills: ['TypeScript', 'React', 'Next.js', 'Redux'],
    preferredSkills: ['GraphQL', 'WebAssembly', 'Tailwind CSS', 'Node.js'],
  },
  {
    title: 'Site Reliability Engineer',
    desc: 'Ensure high availability and reliability of production systems. Build monitoring, alerting, and automated remediation. Participate in on-call rotations and incident response.',
    dept: 'Infrastructure', location: 'Remote',
    expLevel: 'SENIOR', salaryMin: 150000, salaryMax: 200000,
    requiredSkills: ['AWS', 'Kubernetes', 'Docker', 'Terraform'],
    preferredSkills: ['Python', 'Go', 'CI/CD', 'Ansible'],
  },
  {
    title: 'Android Developer',
    desc: 'Build modern Android applications using Kotlin and Jetpack Compose. Collaborate with cross-functional teams to deliver high-quality mobile experiences to millions of users.',
    dept: 'Mobile', location: 'Austin, TX',
    expLevel: 'MID', salaryMin: 120000, salaryMax: 160000,
    requiredSkills: ['Kotlin', 'Android (Kotlin)', 'REST APIs'],
    preferredSkills: ['Java', 'Docker', 'CI/CD', 'PostgreSQL'],
  },
  {
    title: 'Platform Engineer',
    desc: 'Build internal developer platforms and tooling. Design APIs, SDKs, and infrastructure abstractions that accelerate product development. Strong focus on developer experience and reliability.',
    dept: 'Platform', location: 'Denver, CO',
    expLevel: 'SENIOR', salaryMin: 155000, salaryMax: 210000,
    requiredSkills: ['Go', 'Kubernetes', 'Docker', 'REST APIs'],
    preferredSkills: ['Terraform', 'AWS', 'Python', 'GraphQL'],
  },
  {
    title: 'Junior Data Analyst',
    desc: 'Support business teams with data analysis and reporting. Write SQL queries, build dashboards, and present insights to stakeholders. Great entry-level opportunity for aspiring data professionals.',
    dept: 'Analytics', location: 'Boston, MA',
    expLevel: 'ENTRY', salaryMin: 65000, salaryMax: 85000,
    requiredSkills: ['SQL', 'Data Analysis', 'Communication'],
    preferredSkills: ['Python', 'Pandas', 'Machine Learning'],
  },
];

// ══════════════════════════════════════════════════════════════
// Candidate generation helpers
// ══════════════════════════════════════════════════════════════

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function dateBetween(start: Date, end: Date): Date {
  const time = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(time);
}

function generateEmail(first: string, last: string): string {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com', 'icloud.com'];
  const separators = ['.', '_', ''];
  return `${first.toLowerCase()}${pick(separators)}${last.toLowerCase().replace(/[^a-z]/g, '')}@${pick(domains)}`;
}

const PROFICIENCIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;
const STATUSES = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN'] as const;
const APP_STATUSES_WEIGHTED: Array<{ status: string; weight: number }> = [
  { status: 'APPLIED', weight: 30 },
  { status: 'SCREENING', weight: 20 },
  { status: 'SHORTLISTED', weight: 15 },
  { status: 'INTERVIEW_SCHEDULED', weight: 8 },
  { status: 'INTERVIEWED', weight: 7 },
  { status: 'OFFERED', weight: 3 },
  { status: 'HIRED', weight: 2 },
  { status: 'REJECTED', weight: 12 },
  { status: 'WITHDRAWN', weight: 3 },
];

function weightedStatus(): string {
  const total = APP_STATUSES_WEIGHTED.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const item of APP_STATUSES_WEIGHTED) {
    r -= item.weight;
    if (r <= 0) return item.status;
  }
  return 'APPLIED';
}

const INTERVIEW_TYPES = ['PHONE_SCREEN', 'TECHNICAL', 'BEHAVIORAL', 'CULTURE_FIT', 'PANEL', 'FINAL'] as const;
const INTERVIEW_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;

const STRENGTHS = [
  'Strong technical fundamentals and problem-solving ability',
  'Excellent communication and teamwork skills',
  'Deep domain knowledge and practical experience',
  'Quick learner who adapts well to new technologies',
  'Strong system design and architecture skills',
  'Great attention to code quality and testing',
  'Proven leadership and mentoring abilities',
  'Creative approach to complex problems',
  'Solid understanding of best practices and design patterns',
  'Demonstrated ability to deliver under tight deadlines',
];

const WEAKNESSES = [
  'Could improve on system design documentation',
  'Tends to focus too much on technical perfection',
  'Needs more experience with large-scale distributed systems',
  'Could benefit from stronger presentation skills',
  'Sometimes over-engineers solutions for simpler problems',
  'Limited experience with cross-functional collaboration',
  'Could improve time estimation accuracy',
  'Needs more exposure to production incident management',
];

const RECOMMENDATIONS = ['advance', 'reject', 'maybe'] as const;

const NOTIFICATION_TYPES = ['job_update', 'application', 'interview', 'candidate', 'system'] as const;

const NOTIFICATION_TITLES: Record<string, string[]> = {
  job_update: ['Job Published', 'Job Updated', 'Job Closed', 'New Position Opened'],
  application: ['New Application', 'Application Update', 'Application Reviewed', 'Candidate Withdrawn'],
  interview: ['Interview Scheduled', 'Interview Completed', 'Feedback Received', 'Interview Rescheduled'],
  candidate: ['Candidate Shortlisted', 'Candidate Matched', 'Resume Processed', 'New Candidate Added'],
  system: ['System Update', 'Security Alert', 'Weekly Report', 'AI Analysis Complete'],
};

// ══════════════════════════════════════════════════════════════
// Role-aware candidate profiles
// ══════════════════════════════════════════════════════════════
//
// Demo candidates are aligned with real job requirements so matching,
// rankings, and skill-gap analysis surface meaningful results instead of
// random low-overlap skill sets.

// Only the first 12 job templates are PUBLISHED and receive applications —
// align candidate profiles against those so the whole pipeline is coherent.
const PUBLISHED_TEMPLATES = JOB_TEMPLATES.slice(0, 12);
const CATALOG_SKILL_NAMES = new Set(ALL_SKILLS.map((s) => s.name));

// Core (required) proficiency pool per role seniority. JobSkill weights below
// are chosen so that a candidate at this level actually clears the bar.
const CORE_PROFICIENCY: Record<string, string[]> = {
  ENTRY: ['ADVANCED', 'ADVANCED', 'EXPERT', 'ADVANCED'],
  MID: ['EXPERT', 'EXPERT', 'ADVANCED', 'EXPERT'],
  SENIOR: ['EXPERT', 'EXPERT', 'EXPERT', 'EXPERT', 'ADVANCED'],
  LEAD: ['EXPERT', 'EXPERT', 'EXPERT', 'EXPERT', 'ADVANCED'],
};

function pickRoleForExperience(years: number) {
  const levels =
    years <= 1 ? ['ENTRY']
    : years <= 3 ? ['ENTRY', 'MID']
    : years <= 5 ? ['MID']
    : years <= 8 ? ['MID', 'SENIOR']
    : ['SENIOR', 'LEAD'];
  const pool = PUBLISHED_TEMPLATES.filter((t) => levels.includes(t.expLevel as string));
  return pick(pool.length > 0 ? pool : PUBLISHED_TEMPLATES);
}

/**
 * Build a skill set for a candidate aligned to a target role: required skills
 * at core proficiency, a couple of preferred skills, plus extra skills for
 * realistic breadth. ~15% of profiles are intentionally missing one or two
 * required skills so match scores span a realistic range.
 */
function buildRoleSkills(tmpl: (typeof JOB_TEMPLATES)[number], years: number): {
  skillNames: string[];
  proficiency: Record<string, string>;
  confidence: Record<string, number>;
} {
  const required = tmpl.requiredSkills.filter((s) => CATALOG_SKILL_NAMES.has(s));
  const preferred = tmpl.preferredSkills.filter((s) => CATALOG_SKILL_NAMES.has(s));
  const aligned = Math.random() < 0.85;

  // Required skills the candidate actually has (aligned profiles keep all of
  // them; the rest drop 1-2 so scores span a realistic range).
  let core = required;
  if (!aligned && required.length > 1) {
    core = pickN(required, required.length - randInt(1, Math.min(2, required.length - 1)));
  }

  const names: string[] = [];
  const proficiency: Record<string, string> = {};
  const confidence: Record<string, number> = {};

  const corePool = CORE_PROFICIENCY[tmpl.expLevel as string] || CORE_PROFICIENCY.MID;
  for (const name of core) {
    if (!names.includes(name)) names.push(name);
    proficiency[name] = pick(corePool);
    confidence[name] = randFloat(0.95, 0.99);
  }

  // Most preferred skills, at solid strength. Preferred skills still count in
  // the product's skill-score denominator, so covering them lifts top matches.
  const prefCount = aligned
    ? Math.min(preferred.length, randInt(2, 3))
    : Math.min(preferred.length, randInt(0, 2));
  for (const name of pickN(preferred, prefCount)) {
    if (!names.includes(name)) names.push(name);
    proficiency[name] = pick(['ADVANCED', 'EXPERT', 'ADVANCED', 'INTERMEDIATE']);
    confidence[name] = randFloat(0.8, 0.95);
  }

  // Extra skills for realistic breadth (target 6-9 skills total).
  const extraPool =
    years > 8 ? ['ADVANCED', 'EXPERT'] : years > 4 ? ['INTERMEDIATE', 'ADVANCED'] : ['BEGINNER', 'INTERMEDIATE'];
  let guard = 0;
  while (names.length < 6 && guard++ < 20) {
    const name = pick(ALL_SKILLS).name;
    if (!names.includes(name)) {
      names.push(name);
      proficiency[name] = pick(extraPool);
      confidence[name] = randFloat(0.55, 0.9);
    }
  }
  while (names.length > 9) names.splice(randInt(0, names.length - 1), 1);

  return { skillNames: names, proficiency, confidence };
}

// ══════════════════════════════════════════════════════════════
// Main Seed Function
// ══════════════════════════════════════════════════════════════

async function main() {
  console.log('🌱 TalentIQ Comprehensive Demo Seed');
  console.log('⚠️  This is demo data — all names and scenarios are fictional.\n');

  // ── Clean ──────────────────────────────────────────────
  console.log('🗑  Cleaning existing data...');
  const tables = [
    'AuditLog', 'Notification', 'FairnessAudit', 'AIMessage', 'AIConversation',
    'LearningPlan', 'SkillGap', 'MatchEvidence', 'CandidateMatch',
    'InterviewFeedback', 'Interview', 'RecruitmentEvent', 'RecruitmentStage',
    'Application', 'Certification', 'CandidateProject', 'CandidateEducation',
    'CandidateExperience', 'CandidateSkill', 'JobSkill', 'Resume',
    'Candidate', 'Job', 'SkillRelation', 'Skill', 'SkillCategory',
    'RefreshToken', 'Permission', 'User', 'roles', 'Organization',
  ];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
  console.log('  ✓ Clean\n');

  // ── Roles ──────────────────────────────────────────────
  console.log('👤 Creating roles...');
  const roleDefs: { id: string; name: Role; description: string }[] = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'SUPER_ADMIN', description: 'Super administrator with full access' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'ORG_ADMIN', description: 'Organization administrator' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'RECRUITER', description: 'Recruiter with candidate management access' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'HIRING_MANAGER', description: 'Hiring manager with job and candidate access' },
    { id: '55555555-5555-5555-5555-555555555555', name: 'INTERVIEWER', description: 'Interviewer with interview access' },
  ];
  for (const role of roleDefs) {
    await prisma.roleModel.upsert({ where: { name: role.name }, update: {}, create: role });
  }
  console.log('  ✓ 5 roles created\n');

  // ── Organizations ──────────────────────────────────────
  console.log('🏢 Creating organizations...');
  const orgs = await Promise.all([
    prisma.organization.create({
      data: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'TechVista Solutions', domain: 'techvista.io' },
    }),
    prisma.organization.create({
      data: { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Meridian Labs', domain: 'meridianlabs.io' },
    }),
    prisma.organization.create({
      data: { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'Pinnacle Tech Group', domain: 'pinnacletech.com' },
    }),
  ]);
  console.log(`  ✓ ${orgs.length} organizations created\n`);

  // ── Users ──────────────────────────────────────────────
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 12);
  const org1 = orgs[0].id;
  const users = await Promise.all([
    prisma.user.create({ data: { id: 'a1111111-1111-1111-1111-111111111111', email: 'admin@techvista.io', firstName: 'Sarah', lastName: 'Chen', password: hashedPassword, organizationId: org1, roleId: roleDefs[1].id, emailVerified: true } }),
    prisma.user.create({ data: { id: 'a2222222-2222-2222-2222-222222222222', email: 'recruiter@techvista.io', firstName: 'James', lastName: 'Mitchell', password: hashedPassword, organizationId: org1, roleId: roleDefs[2].id, emailVerified: true } }),
    prisma.user.create({ data: { id: 'a3333333-3333-3333-3333-333333333333', email: 'hiring@techvista.io', firstName: 'Priya', lastName: 'Sharma', password: hashedPassword, organizationId: org1, roleId: roleDefs[3].id, emailVerified: true } }),
    prisma.user.create({ data: { id: 'a4444444-4444-4444-4444-444444444444', email: 'sarah@meridianlabs.io', firstName: 'Wei', lastName: 'Zhang', password: hashedPassword, organizationId: orgs[1].id, roleId: roleDefs[1].id, emailVerified: true } }),
    prisma.user.create({ data: { id: 'a5555555-5555-5555-5555-555555555555', email: 'recruiter@meridianlabs.io', firstName: 'Fatima', lastName: 'Ali', password: hashedPassword, organizationId: orgs[1].id, roleId: roleDefs[2].id, emailVerified: true } }),
    prisma.user.create({ data: { id: 'a6666666-6666-6666-6666-666666666666', email: 'hiring@meridianlabs.io', firstName: 'Erik', lastName: 'Andersson', password: hashedPassword, organizationId: orgs[1].id, roleId: roleDefs[3].id, emailVerified: true } }),
    prisma.user.create({ data: { id: 'a7777777-7777-7777-7777-777777777777', email: 'admin@pinnacletech.com', firstName: 'Carlos', lastName: 'Garcia', password: hashedPassword, organizationId: orgs[2].id, roleId: roleDefs[1].id, emailVerified: true } }),
    prisma.user.create({ data: { id: 'a8888888-8888-8888-8888-888888888888', email: 'recruiter@pinnacletech.com', firstName: 'Yuki', lastName: 'Tanaka', password: hashedPassword, organizationId: orgs[2].id, roleId: roleDefs[2].id, emailVerified: true } }),
    prisma.user.create({ data: { id: 'a9999999-9999-9999-9999-999999999999', email: 'interviewer@techvista.io', firstName: 'Marcus', lastName: 'Johnson', password: hashedPassword, organizationId: org1, roleId: roleDefs[4].id, emailVerified: true } }),
    prisma.user.create({ data: { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', email: 'sven@pinnacletech.com', firstName: 'Sven', lastName: 'Larsson', password: hashedPassword, organizationId: orgs[2].id, roleId: roleDefs[4].id, emailVerified: true } }),
  ]);
  console.log(`  ✓ ${users.length} users created\n`);

  // ── Skill Categories ───────────────────────────────────
  console.log('🏷  Creating skill categories...');
  const catMap: Record<string, string> = {};
  for (const cat of SKILL_CATEGORIES) {
    const created = await prisma.skillCategory.create({ data: cat });
    catMap[cat.name] = created.id;
  }
  console.log(`  ✓ ${SKILL_CATEGORIES.length} categories created\n`);

  // ── Skills ─────────────────────────────────────────────
  console.log('🛠  Creating skills...');
  const skillMap: Record<string, string> = {};
  for (const skill of ALL_SKILLS) {
    const created = await prisma.skill.create({
      data: { name: skill.name, categoryId: catMap[skill.category] },
    });
    skillMap[skill.name] = created.id;
  }
  console.log(`  ✓ ${ALL_SKILLS.length} skills created\n`);

  // ── Skill Relations ────────────────────────────────────
  console.log('🔗 Creating skill relations...');
  const skillRelations = [
    { src: 'Node.js', tgt: 'Express.js', rel: 'related_to', w: 0.9 },
    { src: 'Node.js', tgt: 'JavaScript', rel: 'related_to', w: 0.8 },
    { src: 'Node.js', tgt: 'Redis', rel: 'uses', w: 0.7 },
    { src: 'React', tgt: 'TypeScript', rel: 'requires', w: 0.8 },
    { src: 'React', tgt: 'JavaScript', rel: 'requires', w: 0.9 },
    { src: 'React', tgt: 'Tailwind CSS', rel: 'related_to', w: 0.6 },
    { src: 'Next.js', tgt: 'React', rel: 'requires', w: 0.95 },
    { src: 'Next.js', tgt: 'TypeScript', rel: 'requires', w: 0.85 },
    { src: 'AWS', tgt: 'Docker', rel: 'related_to', w: 0.7 },
    { src: 'Docker', tgt: 'Kubernetes', rel: 'related_to', w: 0.8 },
    { src: 'Kubernetes', tgt: 'Terraform', rel: 'related_to', w: 0.6 },
    { src: 'Machine Learning', tgt: 'TensorFlow', rel: 'related_to', w: 0.8 },
    { src: 'Machine Learning', tgt: 'PyTorch', rel: 'related_to', w: 0.85 },
    { src: 'Python', tgt: 'Machine Learning', rel: 'related_to', w: 0.7 },
    { src: 'Java', tgt: 'Spring Boot', rel: 'requires', w: 0.9 },
    { src: 'Python', tgt: 'Django', rel: 'requires', w: 0.8 },
    { src: 'Python', tgt: 'FastAPI', rel: 'related_to', w: 0.75 },
    { src: 'Go', tgt: 'Kubernetes', rel: 'related_to', w: 0.6 },
    { src: 'PostgreSQL', tgt: 'SQL', rel: 'requires', w: 0.9 },
    { src: 'Kafka', tgt: 'Microservices', rel: 'related_to', w: 0.8 },
    { src: 'React Native', tgt: 'React', rel: 'requires', w: 0.85 },
    { src: 'React Native', tgt: 'TypeScript', rel: 'requires', w: 0.7 },
    { src: 'Flutter', tgt: 'Dart', rel: 'requires', w: 0.95 },
    { src: 'PyTorch', tgt: 'Python', rel: 'requires', w: 0.9 },
    { src: 'TensorFlow', tgt: 'Python', rel: 'requires', w: 0.9 },
    { src: 'Spark', tgt: 'Python', rel: 'related_to', w: 0.7 },
    { src: 'Airflow', tgt: 'Python', rel: 'related_to', w: 0.75 },
    { src: 'GraphQL', tgt: 'REST APIs', rel: 'related_to', w: 0.6 },
    { src: 'Spring Boot', tgt: 'Java', rel: 'requires', w: 0.95 },
    { src: 'Angular', tgt: 'TypeScript', rel: 'requires', w: 0.9 },
    { src: 'Vue.js', tgt: 'JavaScript', rel: 'requires', w: 0.85 },
  ];
  for (const rel of skillRelations) {
    const srcId = skillMap[rel.src];
    const tgtId = skillMap[rel.tgt];
    if (srcId && tgtId) {
      await prisma.skillRelation.upsert({
        where: { sourceId_targetId_relation: { sourceId: srcId, targetId: tgtId, relation: rel.rel } },
        update: {},
        create: { sourceId: srcId, targetId: tgtId, relation: rel.rel, weight: rel.w },
      });
    }
  }
  console.log(`  ✓ ${skillRelations.length} skill relations created\n`);

  // ── Jobs (15) ──────────────────────────────────────────
  console.log('💼 Creating 15 jobs...');
  const jobIds: string[] = [];
  for (let i = 0; i < JOB_TEMPLATES.length; i++) {
    const tmpl = JOB_TEMPLATES[i];
    const jobStatus = i < 12 ? 'PUBLISHED' : i < 14 ? 'DRAFT' : 'CLOSED';
    const created = await prisma.job.create({
      data: {
        title: tmpl.title,
        description: tmpl.desc,
        department: tmpl.dept,
        location: tmpl.location,
        employmentType: 'FULL_TIME',
        experienceLevel: tmpl.expLevel as any,
        salaryMin: tmpl.salaryMin,
        salaryMax: tmpl.salaryMax,
        status: jobStatus as any,
        organizationId: org1,
        createdById: users[0].id,
      },
    });
    // Add skills to job. Weights are per seniority so required levels are
    // achievable by real profiles (weight 1.0 would demand mastery for
    // everything and make every match look like a miss).
    const reqWeight =
      tmpl.expLevel === 'ENTRY' ? randFloat(0.55, 0.7)
      : tmpl.expLevel === 'MID' ? randFloat(0.7, 0.85)
      : randFloat(0.85, 0.95);
    for (const sk of tmpl.requiredSkills) {
      if (skillMap[sk]) {
        await prisma.jobSkill.create({
          data: { jobId: created.id, skillId: skillMap[sk], required: true, weight: reqWeight },
        });
      }
    }
    for (const sk of tmpl.preferredSkills) {
      if (skillMap[sk]) {
        await prisma.jobSkill.create({
          data: { jobId: created.id, skillId: skillMap[sk], required: false, weight: randFloat(0.3, 0.55) },
        });
      }
    }
    jobIds.push(created.id);
  }
  console.log(`  ✓ ${jobIds.length} jobs created with skill requirements\n`);

  // ── Candidates (500) ──────────────────────────────────
  console.log('🧑‍💻 Generating 500 candidates...');
  const candidateIds: string[] = [];
  const alignedIdsByJob: Record<string, string[]> = {};
  const candidateDataList: Array<{
    id: string; firstName: string; lastName: string; email: string;
    phone: string; location: string; summary: string;
    skillNames: string[]; yearsOfExp: number;
  }> = [];

  // Create unique email set
  const usedEmails = new Set<string>();

  for (let i = 0; i < 500; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    let email = generateEmail(firstName, lastName);
    let attempt = 0;
    while (usedEmails.has(email)) {
      attempt++;
      email = generateEmail(firstName, lastName).replace('@', `${attempt}@`);
    }
    usedEmails.add(email);

    const yearsOfExp = randInt(0, 15);

    // Role-aligned profile: skills mirror a real published job's requirements.
    const targetRole = pickRoleForExperience(yearsOfExp);
    const { skillNames, proficiency: roleProficiency, confidence: roleConfidence } =
      buildRoleSkills(targetRole, yearsOfExp);
    const alignedJobTitle = targetRole.title;

    // Summary echoes the role and its technology so the product's semantic
    // matching scores real profiles realistically instead of near zero.
    const roleNoun = alignedJobTitle
      .toLowerCase()
      .replace(/^(senior|lead|junior|staff|principal|mid|entry)\s+/, '')
      .trim();
    const skillPhrase = skillNames.slice(0, 8).join(', ');
    let summary = '';
    if (yearsOfExp <= 2) {
      summary = `Aspiring ${roleNoun} with ${yearsOfExp === 0 ? 'recent academic' : `${yearsOfExp} years of`} experience. Skilled in ${skillPhrase}. Eager to contribute to real-world ${targetRole.dept.toLowerCase()} work.`;
    } else {
      const tone = yearsOfExp <= 6 ? 'Solid' : yearsOfExp <= 10 ? 'Experienced' : 'Distinguished';
      summary = `${tone} ${roleNoun} with ${yearsOfExp}+ years of experience at ${pick(COMPANIES)}. Skilled in ${skillPhrase}. Track record of shipping production software, ${pick(['collaborating with cross-functional teams', 'mentoring engineers', 'designing scalable systems', 'leading technical initiatives'])}.`;
    }

    const candidateId = uuidv4();

    await prisma.candidate.create({
      data: {
        id: candidateId,
        firstName,
        lastName,
        email,
        phone: `+1-555-${String(randInt(1000, 9999))}`,
        location: pick(LOCATIONS),
        summary,
        organizationId: org1,
      },
    });

    candidateIds.push(candidateId);
    (alignedIdsByJob[alignedJobTitle] = alignedIdsByJob[alignedJobTitle] || []).push(candidateId);
    candidateDataList.push({ id: candidateId, firstName, lastName, email, phone: `+1-555-${String(randInt(1000, 9999))}`, location: '', summary, skillNames, yearsOfExp });

    // Create candidate skills (proficiency/confidence come from the role profile)
    for (const skName of skillNames) {
      if (skillMap[skName]) {
        await prisma.candidateSkill.create({
          data: {
            candidateId,
            skillId: skillMap[skName],
            proficiency: (roleProficiency[skName] || 'INTERMEDIATE') as any,
            yearsOfExp: randFloat(0.5, Math.max(1, yearsOfExp)),
            confidence: roleConfidence[skName] || randFloat(0.6, 0.9),
            source: pick(['resume', 'resume', 'resume', 'self_reported']),
            evidence: `Demonstrated through ${pick(['project work', 'professional experience', 'open source contributions', 'academic projects', 'certifications'])}`,
          },
        });
      }
    }

    // Create experience (1-4 entries per candidate)
    const expCount = Math.min(randInt(1, Math.min(4, Math.max(1, Math.floor(yearsOfExp / 2)))), 4);
    let expStart = new Date();
    expStart.setFullYear(expStart.getFullYear() - yearsOfExp);
    for (let e = 0; e < expCount; e++) {
      const duration = Math.max(1, Math.floor(yearsOfExp / expCount));
      const start = new Date(expStart);
      const end = e === expCount - 1 ? null : new Date(expStart);
      if (end) end.setFullYear(end.getFullYear() + duration);
      expStart.setFullYear(expStart.getFullYear() + duration);
      const isCurrent = e === expCount - 1 && Math.random() > 0.3;

      await prisma.candidateExperience.create({
        data: {
          candidateId,
          company: pick(COMPANIES),
          title: pick(['Software Engineer', 'Senior Software Engineer', 'Full-Stack Developer', 'Backend Developer', 'Frontend Developer', 'Lead Engineer', 'ML Engineer', 'DevOps Engineer', 'Data Engineer', 'Platform Engineer', 'Junior Developer', 'Staff Engineer', 'Principal Engineer']),
          description: `Worked on ${pick(['building scalable APIs', 'developing microservices', 'leading frontend architecture', 'managing cloud infrastructure', 'building ML pipelines', 'designing distributed systems', 'implementing CI/CD pipelines', 'leading team of 5-8 engineers'])}.`,
          startDate: start,
          endDate: isCurrent ? null : end,
          isCurrent,
          location: pick(LOCATIONS),
        },
      });
    }

    // Create education (1-2 entries)
    const eduCount = randInt(1, 2);
    for (let ed = 0; ed < eduCount; ed++) {
      const startYear = 2005 + randInt(0, 15);
      await prisma.candidateEducation.create({
        data: {
          candidateId,
          institution: pick(UNIVERSITIES),
          degree: pick(DEGREES),
          field: pick(['Computer Science', 'Software Engineering', 'Information Technology', 'Mathematics', 'Physics', 'Data Science', 'Electrical Engineering']),
          startDate: new Date(startYear, randInt(0, 8), 1),
          endDate: new Date(startYear + (ed === 0 ? 4 : 2), randInt(0, 5), 1),
          gpa: randFloat(2.8, 4.0),
        },
      });
    }

    // Create 1-3 projects
    const projCount = randInt(1, 3);
    // Aligned candidates build projects with their own stack, so project
    // relevance scores and skill evidence stay coherent.
    const projTechPool = [...new Set([...skillNames, ...pickN(ALL_SKILLS.map(s => s.name), 4)])];
    for (let p = 0; p < projCount; p++) {
      await prisma.candidateProject.create({
        data: {
          candidateId,
          name: pick([
            'E-Commerce Platform', 'Real-Time Chat Application', 'ML Recommendation Engine',
            'Cloud Infrastructure Dashboard', 'REST API Gateway', 'Mobile Banking App',
            'Data Pipeline Orchestrator', 'Authentication Service', 'Event Management System',
            'Analytics Dashboard', 'IoT Device Manager', 'Task Automation Platform',
            'Content Management System', 'Social Media Aggregator', 'CI/CD Pipeline Manager',
            'Video Streaming Platform', 'Natural Language Processing Tool', 'Monitoring Stack',
          ]),
          description: `Built ${pick(['a scalable', 'an efficient', 'a production-grade', 'an enterprise-level'])} ${pick(['web application', 'backend service', 'data pipeline', 'mobile app', 'ML model', 'infrastructure platform'])} handling ${pick(['thousands', 'millions', 'hundreds of thousands'])} of ${pick(['requests', 'users', 'transactions', 'events'])} per ${pick(['day', 'hour', 'month'])}.`,
          technologies: pickN(projTechPool, randInt(3, 6)),
          startDate: new Date(2020 + randInt(0, 4), randInt(0, 11), 1),
          endDate: Math.random() > 0.3 ? new Date(2022 + randInt(0, 3), randInt(0, 11), 1) : null,
        },
      });
    }

    // Create 0-2 certifications for senior candidates
    if (yearsOfExp > 3 && Math.random() > 0.4) {
      const certs = [
        'AWS Solutions Architect', 'AWS DevOps Engineer', 'Google Cloud Professional',
        'Kubernetes Administrator (CKA)', 'Terraform Associate', 'Certified ScrumMaster',
        'Azure Solutions Architect', 'HashiCorp Vault Associate', 'Docker Certified Associate',
      ];
      const certCount = randInt(1, 2);
      for (let c = 0; c < certCount; c++) {
        await prisma.certification.create({
          data: {
            candidateId,
            name: pick(certs),
            issuer: pick(['AWS', 'Google Cloud', 'Microsoft', 'CNCF', 'HashiCorp', 'Scrum Alliance', 'Docker']),
            issueDate: new Date(2020 + randInt(0, 4), randInt(0, 11), 1),
            expiryDate: new Date(2023 + randInt(2, 4), randInt(0, 11), 1),
          },
        });
      }
    }

    // Create resume record
    await prisma.resume.create({
      data: {
        candidateId,
        fileName: `${firstName.toLowerCase()}_${lastName.toLowerCase()}_resume.pdf`,
        fileType: 'application/pdf',
        fileSize: randInt(50000, 500000),
        rawText: `Resume of ${firstName} ${lastName}\n${summary}\n\nSkills: ${skillNames.join(', ')}\n\nExperience: ${yearsOfExp} years`,
        processingStatus: 'READY',
      },
    });

    if ((i + 1) % 50 === 0) console.log(`  ... ${i + 1}/500 candidates created`);
  }
  console.log(`  ✓ ${candidateIds.length} candidates created with full profiles\n`);

  // ── Applications (1000+) ──────────────────────────────
  console.log('📋 Creating 1000+ applications...');
  let appCount = 0;
  const applicationIds: string[] = [];
  const usedJobCandidate = new Set<string>();

  // Each published job gets many applications. Candidates aligned to a job
  // apply first, then a shuffled remainder fills the rest — this guarantees
  // every published job has genuinely strong applicants.
  const publishedJobIds = jobIds.slice(0, 12);
  const appsPerJob = Math.ceil(1000 / publishedJobIds.length);

  for (let j = 0; j < publishedJobIds.length; j++) {
    const jobId = publishedJobIds[j];
    const jobTitle = JOB_TEMPLATES[j].title;
    const aligned = alignedIdsByJob[jobTitle] || [];
    const alignedSet = new Set(aligned);
    const rest = candidateIds.filter((id) => !alignedSet.has(id)).sort(() => Math.random() - 0.5);
    const ordered = [...aligned, ...rest];
    const numApps = Math.min(appsPerJob + randInt(-5, 10), ordered.length);

    for (let i = 0; i < numApps && appCount < 1100; i++) {
      const candidateId = ordered[i];
      const key = `${candidateId}-${jobId}`;
      if (usedJobCandidate.has(key)) continue;
      usedJobCandidate.add(key);

      const status = weightedStatus();
      const appliedAt = dateBetween(new Date('2025-01-01'), new Date('2026-08-01'));

      const app = await prisma.application.create({
        data: {
          candidateId,
          jobId,
          status: status as any,
          appliedById: pick(users.slice(0, 3)).id,
          createdAt: appliedAt,
          updatedAt: appliedAt,
        },
      });
      applicationIds.push(app.id);
      appCount++;
    }
  }
  console.log(`  ✓ ${appCount} applications created\n`);

  // ── Candidate Matches ──────────────────────────────────
  // Use the product's real matching engine (calculateMatch) so stored scores,
  // explanations, and evidence are coherent with what live "Run matching"
  // produces and with what the skill-gap page shows.
  console.log('🎯 Creating candidate matches...');
  let matchCount = 0;
  let skippedMatches = 0;
  for (const jobId of publishedJobIds) {
    const relatedApps = await prisma.application.findMany({ where: { jobId } });
    for (const app of relatedApps) {
      try {
        const result = await calculateMatch(app.candidateId, app.jobId);
        const match = await prisma.candidateMatch.upsert({
          where: { candidateId_jobId: { candidateId: app.candidateId, jobId: app.jobId } },
          update: {
            overallScore: result.overallScore,
            skillScore: result.categoryScores.skills,
            experienceScore: result.categoryScores.experience,
            projectScore: result.categoryScores.projects,
            educationScore: result.categoryScores.education,
            semanticScore: result.categoryScores.semantic,
            explanation: result.explanation as any,
          },
          create: {
            candidateId: app.candidateId,
            jobId: app.jobId,
            overallScore: result.overallScore,
            skillScore: result.categoryScores.skills,
            experienceScore: result.categoryScores.experience,
            projectScore: result.categoryScores.projects,
            educationScore: result.categoryScores.education,
            semanticScore: result.categoryScores.semantic,
            explanation: result.explanation as any,
          },
        });
        await prisma.matchEvidence.deleteMany({ where: { matchId: match.id } });
        if (result.evidence.length > 0) {
          await prisma.matchEvidence.createMany({
            data: result.evidence.map((ev) => ({
              matchId: match.id,
              type: ev.type,
              detail: ev.detail,
              score: typeof ev.score === 'number' ? ev.score : null,
              metadata: (ev.metadata ?? {}) as Prisma.InputJsonValue,
            })),
          });
        }
        matchCount++;
      } catch (err) {
        skippedMatches++;
        console.error(`    ⚠ match failed for ${app.candidateId} × ${app.jobId}: ${(err as Error).message}`);
      }
    }
  }
  console.log(`  ✓ ${matchCount} candidate matches created${skippedMatches ? ` (${skippedMatches} skipped)` : ''}\n`);

  // ── Interviews ─────────────────────────────────────────
  console.log('🎙  Creating interviews...');
  const interviewedApps = await prisma.application.findMany({
    where: { status: { in: ['INTERVIEW_SCHEDULED', 'INTERVIEWED', 'HIRED'] } },
    take: 80,
  });
  let interviewCount = 0;
  for (const app of interviewedApps) {
    const interview = await prisma.interview.create({
      data: {
        candidateId: app.candidateId,
        jobId: app.jobId,
        type: pick(INTERVIEW_TYPES as any),
        status: pick(['SCHEDULED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'CANCELLED'] as any),
        scheduledAt: dateBetween(new Date('2026-01-01'), new Date('2026-08-28')),
        duration: pick([30, 45, 60, 90]),
        location: pick(['Google Meet', 'Zoom', 'In-person - Office', 'Phone', 'Microsoft Teams']),
        interviewerId: pick(users.slice(3, 10)).id,
      },
    });
    interviewCount++;

    // Add feedback for completed interviews
    if (interview.status === 'COMPLETED') {
      await prisma.interviewFeedback.create({
        data: {
          interviewId: interview.id,
          applicationId: app.id,
          rating: randInt(2, 5),
          strengths: pick(STRENGTHS),
          weaknesses: pick(WEAKNESSES),
          notes: `Overall impression: ${pick(['Strong candidate', 'Good potential', 'Needs more time', 'Excellent fit', 'Borderline', 'Strong technical skills'])}`,
          recommendation: pick(RECOMMENDATIONS as any),
        },
      });
    }
  }
  console.log(`  ✓ ${interviewCount} interviews created\n`);

  // ── Recruitment Stages ─────────────────────────────────
  console.log('📊 Creating recruitment stages...');
  const stages = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Offer', 'Hired'];
  for (const [idx, name] of stages.entries()) {
    await prisma.recruitmentStage.create({
      data: { name, order: idx + 1, organizationId: org1 },
    });
  }
  console.log('  ✓ 6 recruitment stages created\n');

  // ── Fairness Audits ────────────────────────────────────
  console.log('⚖️  Creating fairness audits...');
  const fairnessIssues = [
    { issue: 'Education institution appears to have a stronger influence on ranking than intended', severity: 'MEDIUM' as const, rec: 'Consider normalizing education weighting or removing institution prestige from scoring factors.' },
    { issue: 'Candidates from certain geographic locations are consistently ranked lower', severity: 'HIGH' as const, rec: 'Review whether location-based features are acting as proxy for protected characteristics.' },
    { issue: 'Experience level distribution in shortlisted candidates shows potential skew', severity: 'LOW' as const, rec: 'Monitor selection rates across experience levels to ensure equitable opportunity.' },
    { issue: 'Gender distribution in top-10 ranked candidates deviates significantly from applicant pool', severity: 'HIGH' as const, rec: 'Investigate whether skill weighting or other factors contribute to the disparity. Ensure protected characteristics are not used in scoring.' },
    { issue: 'Candidates with specific certifications receive disproportionate scoring boosts', severity: 'MEDIUM' as const, rec: 'Review certification weighting in the matching algorithm to ensure it reflects actual competency rather than access to certification programs.' },
  ];
  for (const issue of fairnessIssues) {
    await prisma.fairnessAudit.create({
      data: {
        organizationId: org1,
        issue: issue.issue,
        evidence: { metric: 'ranking_distribution', deviation: randFloat(5, 25), sampleSize: randInt(50, 200) },
        severity: issue.severity,
        recommendation: issue.rec,
        status: pick(['open', 'acknowledged', 'resolved']),
      },
    });
  }
  console.log('  ✓ 5 fairness audits created\n');

  // ── Audit Logs ─────────────────────────────────────────
  console.log('📝 Creating audit logs...');
  const auditActions = [
    'candidate.created', 'candidate.viewed', 'candidate.shortlisted', 'candidate.rejected',
    'job.created', 'job.published', 'job.updated', 'job.archived',
    'application.created', 'application.reviewed', 'application.status_changed',
    'interview.scheduled', 'interview.completed', 'interview.feedback_added',
    'ai.match_executed', 'ai.analysis_completed', 'ai.search_performed',
    'fairness.audit_executed', 'user.login', 'user.logout', 'user.permissions_changed',
  ];
  const entityTypes = ['Candidate', 'Job', 'Application', 'Interview', 'AIConversation', 'FairnessAudit', 'User'];
  for (let i = 0; i < 200; i++) {
    const action = pick(auditActions);
    await prisma.auditLog.create({
      data: {
        actorId: pick(users.slice(0, 5)).id,
        action,
        entityType: pick(entityTypes),
        entityId: pick(candidateIds.slice(0, 50)),
        metadata: { source: 'demo', action, timestamp: new Date().toISOString() },
        organizationId: org1,
        createdAt: dateBetween(new Date('2025-06-01'), new Date('2026-08-28')),
      },
    });
  }
  console.log('  ✓ 200 audit logs created\n');

  // ── Notifications ──────────────────────────────────────
  console.log('🔔 Creating notifications...');
  for (const user of users.slice(0, 5)) {
    const notifCount = randInt(8, 15);
    for (let n = 0; n < notifCount; n++) {
      const type: string = pick(NOTIFICATION_TYPES as any);
      const titles = NOTIFICATION_TITLES[type as keyof typeof NOTIFICATION_TITLES] || NOTIFICATION_TITLES.system;
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: type as any,
          title: pick(titles),
          message: pick([
            'New candidate has been processed by AI',
            'Match score updated for active job',
            'Interview feedback received',
            'Weekly hiring report is ready',
            'System maintenance scheduled',
            'New application received',
            'Candidate pipeline analysis complete',
            'Fairness audit flagged an issue',
            'Job posting reached 100 views',
            'AI recommendation updated',
          ]),
          read: Math.random() > 0.4,
          organizationId: user.organizationId,
        },
      });
    }
  }
  console.log('  ✓ Notifications created\n');

  // ── Summary ────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ Demo seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Organizations:  ${orgs.length}`);
  console.log(`   Users:          ${users.length}`);
  console.log(`   Skills:         ${ALL_SKILLS.length}`);
  console.log(`   Jobs:           ${jobIds.length}`);
  console.log(`   Candidates:     ${candidateIds.length}`);
  console.log(`   Applications:   ${appCount}`);
  console.log(`   Matches:        ${matchCount}`);
  console.log(`   Interviews:     ${interviewCount}`);
  console.log(`   Audit Logs:     200`);
  console.log('');
  console.log('🔑 Demo accounts:');
  console.log('   TechVista Solutions:');
  console.log('     Admin:     admin@techvista.io     / password123');
  console.log('     Recruiter: recruiter@techvista.io / password123');
  console.log('     Hiring:    hiring@techvista.io    / password123');
  console.log('   Meridian Labs:');
  console.log('     Admin:     sarah@meridianlabs.io  / password123');
  console.log('   Pinnacle Tech Group:');
  console.log('     Admin:     admin@pinnacletech.com / password123');
  console.log('');
  console.log('⚠️  All data is fictional demo data for demonstration purposes.');
  console.log('═══════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
