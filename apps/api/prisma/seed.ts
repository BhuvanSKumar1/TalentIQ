import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up
  await prisma.$executeRaw`TRUNCATE TABLE "AuditLog" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Notification" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "FairnessAudit" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "AIMessage" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "AIConversation" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "LearningPlan" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "SkillGap" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "MatchEvidence" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "CandidateMatch" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "InterviewFeedback" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Interview" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "RecruitmentEvent" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "RecruitmentStage" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Application" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Certification" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "CandidateProject" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "CandidateEducation" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "CandidateExperience" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "CandidateSkill" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "JobSkill" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Resume" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Candidate" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Job" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "SkillRelation" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Skill" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "SkillCategory" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "RefreshToken" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Permission" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "roles" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Organization" CASCADE`;

  // ── Roles ──────────────────────────────────────────────
  console.log('  Creating roles...');
  const roles: { id: string; name: Role; description: string }[] = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'SUPER_ADMIN', description: 'Super administrator with full access' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'ORG_ADMIN', description: 'Organization administrator' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'RECRUITER', description: 'Recruiter with candidate management access' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'HIRING_MANAGER', description: 'Hiring manager with job and candidate access' },
    { id: '55555555-5555-5555-5555-555555555555', name: 'INTERVIEWER', description: 'Interviewer with interview access' },
  ];

  for (const role of roles) {
    await prisma.roleModel.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // ── Organization ───────────────────────────────────────
  console.log('  Creating organization...');
  const org = await prisma.organization.create({
    data: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'TechVista Solutions',
      domain: 'techvista.io',
    },
  });

  // ── Users ──────────────────────────────────────────────
  console.log('  Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = [
    {
      id: 'a1111111-1111-1111-1111-111111111111',
      email: 'admin@techvista.io',
      firstName: 'Sarah',
      lastName: 'Chen',
      roleId: '22222222-2222-2222-2222-222222222222',
    },
    {
      id: 'a2222222-2222-2222-2222-222222222222',
      email: 'recruiter@techvista.io',
      firstName: 'James',
      lastName: 'Mitchell',
      roleId: '33333333-3333-3333-3333-333333333333',
    },
    {
      id: 'a3333333-3333-3333-3333-333333333333',
      email: 'hiring@techvista.io',
      firstName: 'Priya',
      lastName: 'Sharma',
      roleId: '44444444-4444-4444-4444-444444444444',
    },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: {
        ...user,
        password: hashedPassword,
        organizationId: org.id,
        emailVerified: true,
      },
    });
  }

  // ── Skill Categories ───────────────────────────────────
  console.log('  Creating skill categories...');
  const categories = [
    { id: 'b0000001-0000-0000-0000-000000000001', name: 'Programming Languages', icon: 'code' },
    { id: 'b0000002-0000-0000-0000-000000000002', name: 'Frontend', icon: 'layout' },
    { id: 'b0000003-0000-0000-0000-000000000003', name: 'Backend', icon: 'server' },
    { id: 'b0000004-0000-0000-0000-000000000004', name: 'Cloud & DevOps', icon: 'cloud' },
    { id: 'b0000005-0000-0000-0000-000000000005', name: 'Data & AI', icon: 'database' },
    { id: 'b0000006-0000-0000-0000-000000000006', name: 'Soft Skills', icon: 'users' },
    { id: 'b0000007-0000-0000-0000-000000000007', name: 'Security', icon: 'shield' },
    { id: 'b0000008-0000-0000-0000-000000000008', name: 'Mobile', icon: 'smartphone' },
  ];

  for (const cat of categories) {
    await prisma.skillCategory.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon },
      create: cat,
    });
  }

  // ── Skills ─────────────────────────────────────────────
  console.log('  Creating skills...');
  const skillData: Array<{ id: string; name: string; categoryId: string }> = [
    { id: 'c0000000-0000-0000-0000-000000000001', name: 'JavaScript', categoryId: 'b0000001-0000-0000-0000-000000000001' },
    { id: 'c0000000-0000-0000-0000-000000000002', name: 'TypeScript', categoryId: 'b0000001-0000-0000-0000-000000000001' },
    { id: 'c0000000-0000-0000-0000-000000000003', name: 'Python', categoryId: 'b0000001-0000-0000-0000-000000000001' },
    { id: 'c0000000-0000-0000-0000-000000000004', name: 'Java', categoryId: 'b0000001-0000-0000-0000-000000000001' },
    { id: 'c0000000-0000-0000-0000-000000000005', name: 'Go', categoryId: 'b0000001-0000-0000-0000-000000000001' },
    { id: 'c0000000-0000-0000-0000-000000000006', name: 'Rust', categoryId: 'b0000001-0000-0000-0000-000000000001' },
    { id: 'c0000000-0000-0000-0000-000000000007', name: 'React', categoryId: 'b0000002-0000-0000-0000-000000000002' },
    { id: 'c0000000-0000-0000-0000-000000000008', name: 'Next.js', categoryId: 'b0000002-0000-0000-0000-000000000002' },
    { id: 'c0000000-0000-0000-0000-000000000009', name: 'Vue.js', categoryId: 'b0000002-0000-0000-0000-000000000002' },
    { id: 'c0000000-0000-0000-0000-000000000010', name: 'Tailwind CSS', categoryId: 'b0000002-0000-0000-0000-000000000002' },
    { id: 'c0000000-0000-0000-0000-000000000011', name: 'HTML/CSS', categoryId: 'b0000002-0000-0000-0000-000000000002' },
    { id: 'c0000000-0000-0000-0000-000000000012', name: 'Node.js', categoryId: 'b0000003-0000-0000-0000-000000000003' },
    { id: 'c0000000-0000-0000-0000-000000000013', name: 'Express.js', categoryId: 'b0000003-0000-0000-0000-000000000003' },
    { id: 'c0000000-0000-0000-0000-000000000014', name: 'Spring Boot', categoryId: 'b0000003-0000-0000-0000-000000000003' },
    { id: 'c0000000-0000-0000-0000-000000000015', name: 'Django', categoryId: 'b0000003-0000-0000-0000-000000000003' },
    { id: 'c0000000-0000-0000-0000-000000000016', name: 'PostgreSQL', categoryId: 'b0000003-0000-0000-0000-000000000003' },
    { id: 'c0000000-0000-0000-0000-000000000017', name: 'MongoDB', categoryId: 'b0000003-0000-0000-0000-000000000003' },
    { id: 'c0000000-0000-0000-0000-000000000018', name: 'Redis', categoryId: 'b0000003-0000-0000-0000-000000000003' },
    { id: 'c0000000-0000-0000-0000-000000000019', name: 'GraphQL', categoryId: 'b0000003-0000-0000-0000-000000000003' },
    { id: 'c0000000-0000-0000-0000-000000000020', name: 'AWS', categoryId: 'b0000004-0000-0000-0000-000000000004' },
    { id: 'c0000000-0000-0000-0000-000000000021', name: 'Docker', categoryId: 'b0000004-0000-0000-0000-000000000004' },
    { id: 'c0000000-0000-0000-0000-000000000022', name: 'Kubernetes', categoryId: 'b0000004-0000-0000-0000-000000000004' },
    { id: 'c0000000-0000-0000-0000-000000000023', name: 'CI/CD', categoryId: 'b0000004-0000-0000-0000-000000000004' },
    { id: 'c0000000-0000-0000-0000-000000000024', name: 'Terraform', categoryId: 'b0000004-0000-0000-0000-000000000004' },
    { id: 'c0000000-0000-0000-0000-000000000025', name: 'Machine Learning', categoryId: 'b0000005-0000-0000-0000-000000000005' },
    { id: 'c0000000-0000-0000-0000-000000000026', name: 'TensorFlow', categoryId: 'b0000005-0000-0000-0000-000000000005' },
    { id: 'c0000000-0000-0000-0000-000000000027', name: 'PyTorch', categoryId: 'b0000005-0000-0000-0000-000000000005' },
    { id: 'c0000000-0000-0000-0000-000000000028', name: 'Data Analysis', categoryId: 'b0000005-0000-0000-0000-000000000005' },
    { id: 'c0000000-0000-0000-0000-000000000029', name: 'SQL', categoryId: 'b0000005-0000-0000-0000-000000000005' },
    { id: 'c0000000-0000-0000-0000-000000000030', name: 'Communication', categoryId: 'b0000006-0000-0000-0000-000000000006' },
    { id: 'c0000000-0000-0000-0000-000000000031', name: 'Team Leadership', categoryId: 'b0000006-0000-0000-0000-000000000006' },
    { id: 'c0000000-0000-0000-0000-000000000032', name: 'Problem Solving', categoryId: 'b0000006-0000-0000-0000-000000000006' },
    { id: 'c0000000-0000-0000-0000-000000000033', name: 'Project Management', categoryId: 'b0000006-0000-0000-0000-000000000006' },
    { id: 'c0000000-0000-0000-0000-000000000034', name: 'OAuth/JWT', categoryId: 'b0000007-0000-0000-0000-000000000007' },
    { id: 'c0000000-0000-0000-0000-000000000035', name: 'React Native', categoryId: 'b0000008-0000-0000-0000-000000000008' },
    { id: 'c0000000-0000-0000-0000-000000000036', name: 'Flutter', categoryId: 'b0000008-0000-0000-0000-000000000008' },
  ];

  for (const skill of skillData) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill,
    });
  }

  // ── Skill Relations ────────────────────────────────────
  console.log('  Creating skill relations...');
  const relations = [
    { sourceId: 'c0000000-0000-0000-0000-000000000012', targetId: 'c0000000-0000-0000-0000-000000000013', relation: 'related_to', weight: 0.9 },
    { sourceId: 'c0000000-0000-0000-0000-000000000012', targetId: 'c0000000-0000-0000-0000-000000000001', relation: 'related_to', weight: 0.8 },
    { sourceId: 'c0000000-0000-0000-0000-000000000012', targetId: 'c0000000-0000-0000-0000-000000000018', relation: 'uses', weight: 0.7 },
    { sourceId: 'c0000000-0000-0000-0000-000000000007', targetId: 'c0000000-0000-0000-0000-000000000002', relation: 'requires', weight: 0.8 },
    { sourceId: 'c0000000-0000-0000-0000-000000000007', targetId: 'c0000000-0000-0000-0000-000000000001', relation: 'requires', weight: 0.9 },
    { sourceId: 'c0000000-0000-0000-0000-000000000007', targetId: 'c0000000-0000-0000-0000-000000000010', relation: 'related_to', weight: 0.6 },
    { sourceId: 'c0000000-0000-0000-0000-000000000008', targetId: 'c0000000-0000-0000-0000-000000000007', relation: 'requires', weight: 0.95 },
    { sourceId: 'c0000000-0000-0000-0000-000000000008', targetId: 'c0000000-0000-0000-0000-000000000002', relation: 'requires', weight: 0.85 },
    { sourceId: 'c0000000-0000-0000-0000-000000000020', targetId: 'c0000000-0000-0000-0000-000000000021', relation: 'related_to', weight: 0.7 },
    { sourceId: 'c0000000-0000-0000-0000-000000000021', targetId: 'c0000000-0000-0000-0000-000000000022', relation: 'related_to', weight: 0.8 },
    { sourceId: 'c0000000-0000-0000-0000-000000000022', targetId: 'c0000000-0000-0000-0000-000000000024', relation: 'related_to', weight: 0.6 },
    { sourceId: 'c0000000-0000-0000-0000-000000000025', targetId: 'c0000000-0000-0000-0000-000000000026', relation: 'related_to', weight: 0.8 },
    { sourceId: 'c0000000-0000-0000-0000-000000000025', targetId: 'c0000000-0000-0000-0000-000000000027', relation: 'related_to', weight: 0.85 },
    { sourceId: 'c0000000-0000-0000-0000-000000000003', targetId: 'c0000000-0000-0000-0000-000000000025', relation: 'related_to', weight: 0.7 },
    { sourceId: 'c0000000-0000-0000-0000-000000000004', targetId: 'c0000000-0000-0000-0000-000000000014', relation: 'requires', weight: 0.9 },
    { sourceId: 'c0000000-0000-0000-0000-000000000003', targetId: 'c0000000-0000-0000-0000-000000000015', relation: 'requires', weight: 0.8 },
  ];

  for (const rel of relations) {
    await prisma.skillRelation.upsert({
      where: {
        sourceId_targetId_relation: {
          sourceId: rel.sourceId,
          targetId: rel.targetId,
          relation: rel.relation,
        },
      },
      update: {},
      create: rel,
    });
  }

  // ── Jobs ───────────────────────────────────────────────
  console.log('  Creating jobs...');

  const jobsData = [
    {
      id: 'e1000000-0000-0000-0000-000000000001',
      title: 'Senior Full-Stack Engineer',
      description: 'We are looking for a Senior Full-Stack Engineer to join our core platform team. You will work on building scalable web applications using modern technologies. Responsibilities include designing and implementing RESTful APIs, building responsive front-end interfaces, and collaborating with cross-functional teams.',
      department: 'Engineering',
      location: 'San Francisco, CA (Hybrid)',
      employmentType: 'FULL_TIME' as const,
      experienceLevel: 'SENIOR' as const,
      salaryMin: 150000,
      salaryMax: 200000,
      status: 'PUBLISHED' as const,
    },
    {
      id: 'e2000000-0000-0000-0000-000000000002',
      title: 'Machine Learning Engineer',
      description: 'Join our AI/ML team to build and deploy machine learning models at scale. You will work on natural language processing, recommendation systems, and predictive analytics. Experience with large-scale data processing and model deployment is essential.',
      department: 'AI/ML',
      location: 'Remote',
      employmentType: 'FULL_TIME' as const,
      experienceLevel: 'SENIOR' as const,
      salaryMin: 160000,
      salaryMax: 220000,
      status: 'PUBLISHED' as const,
    },
    {
      id: 'e3000000-0000-0000-0000-000000000003',
      title: 'DevOps Engineer',
      description: 'We need a skilled DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. You will work with AWS, Kubernetes, and Terraform to ensure reliability, scalability, and security of our production systems.',
      department: 'Infrastructure',
      location: 'Austin, TX',
      employmentType: 'FULL_TIME' as const,
      experienceLevel: 'MID' as const,
      salaryMin: 120000,
      salaryMax: 160000,
      status: 'PUBLISHED' as const,
    },
    {
      id: 'e4000000-0000-0000-0000-000000000004',
      title: 'Junior React Developer',
      description: 'Entry-level position for a React developer. Great opportunity to learn and grow. You will assist in building user interfaces, learn best practices, and contribute to our design system.',
      department: 'Engineering',
      location: 'New York, NY',
      employmentType: 'FULL_TIME' as const,
      experienceLevel: 'ENTRY' as const,
      salaryMin: 70000,
      salaryMax: 90000,
      status: 'PUBLISHED' as const,
    },
    {
      id: 'e5000000-0000-0000-0000-000000000005',
      title: 'Backend Engineer (Go)',
      description: 'Build high-performance backend services using Go. Design and implement distributed systems, RESTful APIs, and microservices architecture. Strong understanding of concurrency and performance optimization required.',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'FULL_TIME' as const,
      experienceLevel: 'MID' as const,
      salaryMin: 130000,
      salaryMax: 170000,
      status: 'DRAFT' as const,
    },
    {
      id: 'e6000000-0000-0000-0000-000000000006',
      title: 'Product Designer',
      description: 'Seeking a Product Designer who can think holistically about user experience and create beautiful, intuitive interfaces. Experience with design systems, prototyping, and user research is important.',
      department: 'Design',
      location: 'San Francisco, CA',
      employmentType: 'FULL_TIME' as const,
      experienceLevel: 'MID' as const,
      salaryMin: 110000,
      salaryMax: 150000,
      status: 'CLOSED' as const,
    },
  ];

  const createdJobs: string[] = [];
  for (const job of jobsData) {
    const { id, ...data } = job;
    await prisma.job.create({
      data: {
        ...data,
        id,
        organizationId: org.id,
        createdById: users[0].id,
      },
    });
    createdJobs.push(id);
  }

  // Add skills to jobs
  const jobSkills: Array<{ jobId: string; skillId: string; required: boolean }> = [
    // Senior Full-Stack
    { jobId: 'e1000000-0000-0000-0000-000000000001', skillId: 'c0000000-0000-0000-0000-000000000002', required: true },
    { jobId: 'e1000000-0000-0000-0000-000000000001', skillId: 'c0000000-0000-0000-0000-000000000007', required: true },
    { jobId: 'e1000000-0000-0000-0000-000000000001', skillId: 'c0000000-0000-0000-0000-000000000012', required: true },
    { jobId: 'e1000000-0000-0000-0000-000000000001', skillId: 'c0000000-0000-0000-0000-000000000016', required: true },
    { jobId: 'e1000000-0000-0000-0000-000000000001', skillId: 'c0000000-0000-0000-0000-000000000020', required: false },
    { jobId: 'e1000000-0000-0000-0000-000000000001', skillId: 'c0000000-0000-0000-0000-000000000021', required: false },
    // ML Engineer
    { jobId: 'e2000000-0000-0000-0000-000000000002', skillId: 'c0000000-0000-0000-0000-000000000003', required: true },
    { jobId: 'e2000000-0000-0000-0000-000000000002', skillId: 'c0000000-0000-0000-0000-000000000025', required: true },
    { jobId: 'e2000000-0000-0000-0000-000000000002', skillId: 'c0000000-0000-0000-0000-000000000027', required: true },
    { jobId: 'e2000000-0000-0000-0000-000000000002', skillId: 'c0000000-0000-0000-0000-000000000029', required: true },
    { jobId: 'e2000000-0000-0000-0000-000000000002', skillId: 'c0000000-0000-0000-0000-000000000020', required: false },
    { jobId: 'e2000000-0000-0000-0000-000000000002', skillId: 'c0000000-0000-0000-0000-000000000026', required: false },
    // DevOps
    { jobId: 'e3000000-0000-0000-0000-000000000003', skillId: 'c0000000-0000-0000-0000-000000000020', required: true },
    { jobId: 'e3000000-0000-0000-0000-000000000003', skillId: 'c0000000-0000-0000-0000-000000000021', required: true },
    { jobId: 'e3000000-0000-0000-0000-000000000003', skillId: 'c0000000-0000-0000-0000-000000000022', required: true },
    { jobId: 'e3000000-0000-0000-0000-000000000003', skillId: 'c0000000-0000-0000-0000-000000000024', required: true },
    { jobId: 'e3000000-0000-0000-0000-000000000003', skillId: 'c0000000-0000-0000-0000-000000000023', required: false },
    // Junior React
    { jobId: 'e4000000-0000-0000-0000-000000000004', skillId: 'c0000000-0000-0000-0000-000000000001', required: true },
    { jobId: 'e4000000-0000-0000-0000-000000000004', skillId: 'c0000000-0000-0000-0000-000000000007', required: true },
    { jobId: 'e4000000-0000-0000-0000-000000000004', skillId: 'c0000000-0000-0000-0000-000000000011', required: false },
    { jobId: 'e4000000-0000-0000-0000-000000000004', skillId: 'c0000000-0000-0000-0000-000000000010', required: false },
  ];

  for (const js of jobSkills) {
    await prisma.jobSkill.create({ data: js });
  }

  // ── Candidates ─────────────────────────────────────────
  console.log('  Creating candidates...');

  const candidatesData = [
    {
      id: 'd1000000-0000-0000-0000-000000000001',
      firstName: 'Rahul',
      lastName: 'Patel',
      email: 'rahul.patel@email.com',
      phone: '+1-555-0101',
      location: 'San Francisco, CA',
      summary: 'Full-stack engineer with 6 years of experience building scalable web applications. Expertise in React, Node.js, and cloud infrastructure. Passionate about clean code and user experience.',
    },
    {
      id: 'd2000000-0000-0000-0000-000000000002',
      firstName: 'Ananya',
      lastName: 'Krishnan',
      email: 'ananya.k@email.com',
      phone: '+1-555-0102',
      location: 'Remote',
      summary: 'Machine learning engineer with 4 years of experience in NLP and recommendation systems. Published researcher with strong Python and PyTorch skills.',
    },
    {
      id: 'd3000000-0000-0000-0000-000000000003',
      firstName: 'Marcus',
      lastName: 'Johnson',
      email: 'marcus.j@email.com',
      phone: '+1-555-0103',
      location: 'Austin, TX',
      summary: 'DevOps engineer with 5 years of experience managing cloud infrastructure. AWS certified with deep expertise in Kubernetes and Terraform.',
    },
    {
      id: 'd4000000-0000-0000-0000-000000000004',
      firstName: 'Elena',
      lastName: 'Rodriguez',
      email: 'elena.r@email.com',
      phone: '+1-555-0104',
      location: 'New York, NY',
      summary: 'Junior frontend developer with 1 year of experience. Strong React skills and a keen eye for design. Recent bootcamp graduate.',
    },
    {
      id: 'd5000000-0000-0000-0000-000000000005',
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@email.com',
      phone: '+1-555-0105',
      location: 'Seattle, WA',
      summary: 'Backend engineer with 3 years of Go experience. Built high-throughput microservices handling millions of requests per day.',
    },
    {
      id: 'd6000000-0000-0000-0000-000000000006',
      firstName: 'Priyanka',
      lastName: 'Desai',
      email: 'priyanka.d@email.com',
      phone: '+1-555-0106',
      location: 'San Francisco, CA',
      summary: 'Full-stack developer with 5 years of experience. Strong in both frontend (React, Next.js) and backend (Node.js, PostgreSQL). Experienced with AWS and Docker.',
    },
    {
      id: 'd7000000-0000-0000-0000-000000000007',
      firstName: 'Alexander',
      lastName: 'Petrov',
      email: 'alex.p@email.com',
      phone: '+1-555-0107',
      location: 'Remote',
      summary: 'Senior backend engineer with 8 years of Java experience. Expert in Spring Boot, microservices, and distributed systems.',
    },
    {
      id: 'd8000000-0000-0000-0000-000000000008',
      firstName: 'Mei',
      lastName: 'Lin',
      email: 'mei.lin@email.com',
      phone: '+1-555-0108',
      location: 'New York, NY',
      summary: 'Product designer with 4 years of experience creating beautiful, user-centered interfaces. Proficient in Figma, prototyping, and design systems.',
    },
    {
      id: 'd9000000-0000-0000-0000-000000000009',
      firstName: 'Jordan',
      lastName: 'Williams',
      email: 'jordan.w@email.com',
      phone: '+1-555-0109',
      location: 'Chicago, IL',
      summary: 'Data scientist with 3 years of experience. Strong in Python, ML, and data analysis. Experience building predictive models for healthcare and fintech.',
    },
    {
      id: 'da000000-0000-0000-0000-00000000000a',
      firstName: 'Aisha',
      lastName: 'Ibrahim',
      email: 'aisha.i@email.com',
      phone: '+1-555-0110',
      location: 'San Francisco, CA',
      summary: 'Cloud infrastructure engineer with 4 years of experience. AWS Solutions Architect certified. Expert in Kubernetes, Terraform, and CI/CD pipelines.',
    },
  ];

  for (const candidate of candidatesData) {
    const { id, ...data } = candidate;
    await prisma.candidate.create({
      data: {
        ...data,
        id,
        organizationId: org.id,
      },
    });
  }

  // ── Candidate Skills ───────────────────────────────────
  console.log('  Creating candidate skills...');
  const candidateSkills = [
    // Rahul - Full-stack
    { candidateId: 'd1000000-0000-0000-0000-000000000001', skillId: 'c0000000-0000-0000-0000-000000000002', proficiency: 'EXPERT' as const, yearsOfExp: 5, confidence: 0.95 },
    { candidateId: 'd1000000-0000-0000-0000-000000000001', skillId: 'c0000000-0000-0000-0000-000000000007', proficiency: 'EXPERT' as const, yearsOfExp: 4, confidence: 0.92 },
    { candidateId: 'd1000000-0000-0000-0000-000000000001', skillId: 'c0000000-0000-0000-0000-000000000012', proficiency: 'ADVANCED' as const, yearsOfExp: 5, confidence: 0.90 },
    { candidateId: 'd1000000-0000-0000-0000-000000000001', skillId: 'c0000000-0000-0000-0000-000000000016', proficiency: 'ADVANCED' as const, yearsOfExp: 4, confidence: 0.85 },
    { candidateId: 'd1000000-0000-0000-0000-000000000001', skillId: 'c0000000-0000-0000-0000-000000000020', proficiency: 'INTERMEDIATE' as const, yearsOfExp: 3, confidence: 0.75 },
    { candidateId: 'd1000000-0000-0000-0000-000000000001', skillId: 'c0000000-0000-0000-0000-000000000021', proficiency: 'ADVANCED' as const, yearsOfExp: 3, confidence: 0.80 },
    { candidateId: 'd1000000-0000-0000-0000-000000000001', skillId: 'c0000000-0000-0000-0000-000000000030', proficiency: 'ADVANCED' as const, yearsOfExp: 5, confidence: 0.88 },
    // Ananya - ML
    { candidateId: 'd2000000-0000-0000-0000-000000000002', skillId: 'c0000000-0000-0000-0000-000000000003', proficiency: 'EXPERT' as const, yearsOfExp: 5, confidence: 0.95 },
    { candidateId: 'd2000000-0000-0000-0000-000000000002', skillId: 'c0000000-0000-0000-0000-000000000025', proficiency: 'EXPERT' as const, yearsOfExp: 4, confidence: 0.93 },
    { candidateId: 'd2000000-0000-0000-0000-000000000002', skillId: 'c0000000-0000-0000-0000-000000000027', proficiency: 'ADVANCED' as const, yearsOfExp: 3, confidence: 0.88 },
    { candidateId: 'd2000000-0000-0000-0000-000000000002', skillId: 'c0000000-0000-0000-0000-000000000029', proficiency: 'ADVANCED' as const, yearsOfExp: 4, confidence: 0.85 },
    { candidateId: 'd2000000-0000-0000-0000-000000000002', skillId: 'c0000000-0000-0000-0000-000000000020', proficiency: 'INTERMEDIATE' as const, yearsOfExp: 2, confidence: 0.70 },
    { candidateId: 'd2000000-0000-0000-0000-000000000002', skillId: 'c0000000-0000-0000-0000-000000000026', proficiency: 'ADVANCED' as const, yearsOfExp: 3, confidence: 0.85 },
    // Marcus - DevOps
    { candidateId: 'd3000000-0000-0000-0000-000000000003', skillId: 'c0000000-0000-0000-0000-000000000020', proficiency: 'EXPERT' as const, yearsOfExp: 5, confidence: 0.95 },
    { candidateId: 'd3000000-0000-0000-0000-000000000003', skillId: 'c0000000-0000-0000-0000-000000000021', proficiency: 'EXPERT' as const, yearsOfExp: 4, confidence: 0.92 },
    { candidateId: 'd3000000-0000-0000-0000-000000000003', skillId: 'c0000000-0000-0000-0000-000000000022', proficiency: 'ADVANCED' as const, yearsOfExp: 3, confidence: 0.88 },
    { candidateId: 'd3000000-0000-0000-0000-000000000003', skillId: 'c0000000-0000-0000-0000-000000000024', proficiency: 'ADVANCED' as const, yearsOfExp: 3, confidence: 0.85 },
    { candidateId: 'd3000000-0000-0000-0000-000000000003', skillId: 'c0000000-0000-0000-0000-000000000023', proficiency: 'ADVANCED' as const, yearsOfExp: 4, confidence: 0.87 },
    { candidateId: 'd3000000-0000-0000-0000-000000000003', skillId: 'c0000000-0000-0000-0000-000000000012', proficiency: 'INTERMEDIATE' as const, yearsOfExp: 2, confidence: 0.70 },
    // Elena - Junior React
    { candidateId: 'd4000000-0000-0000-0000-000000000004', skillId: 'c0000000-0000-0000-0000-000000000001', proficiency: 'INTERMEDIATE' as const, yearsOfExp: 1, confidence: 0.75 },
    { candidateId: 'd4000000-0000-0000-0000-000000000004', skillId: 'c0000000-0000-0000-0000-000000000007', proficiency: 'INTERMEDIATE' as const, yearsOfExp: 1, confidence: 0.72 },
    { candidateId: 'd4000000-0000-0000-0000-000000000004', skillId: 'c0000000-0000-0000-0000-000000000011', proficiency: 'ADVANCED' as const, yearsOfExp: 1, confidence: 0.80 },
    { candidateId: 'd4000000-0000-0000-0000-000000000004', skillId: 'c0000000-0000-0000-0000-000000000010', proficiency: 'BEGINNER' as const, yearsOfExp: 0.5, confidence: 0.60 },
    // David - Go Backend
    { candidateId: 'd5000000-0000-0000-0000-000000000005', skillId: 'c0000000-0000-0000-0000-000000000005', proficiency: 'ADVANCED' as const, yearsOfExp: 3, confidence: 0.88 },
    { candidateId: 'd5000000-0000-0000-0000-000000000005', skillId: 'c0000000-0000-0000-0000-000000000019', proficiency: 'ADVANCED' as const, yearsOfExp: 2, confidence: 0.82 },
    { candidateId: 'd5000000-0000-0000-0000-000000000005', skillId: 'c0000000-0000-0000-0000-000000000021', proficiency: 'INTERMEDIATE' as const, yearsOfExp: 2, confidence: 0.72 },
    { candidateId: 'd5000000-0000-0000-0000-000000000005', skillId: 'c0000000-0000-0000-0000-000000000016', proficiency: 'INTERMEDIATE' as const, yearsOfExp: 2, confidence: 0.70 },
    // Priyanka - Full-stack
    { candidateId: 'd6000000-0000-0000-0000-000000000006', skillId: 'c0000000-0000-0000-0000-000000000002', proficiency: 'EXPERT' as const, yearsOfExp: 5, confidence: 0.93 },
    { candidateId: 'd6000000-0000-0000-0000-000000000006', skillId: 'c0000000-0000-0000-0000-000000000007', proficiency: 'ADVANCED' as const, yearsOfExp: 4, confidence: 0.88 },
    { candidateId: 'd6000000-0000-0000-0000-000000000006', skillId: 'c0000000-0000-0000-0000-000000000008', proficiency: 'ADVANCED' as const, yearsOfExp: 3, confidence: 0.85 },
    { candidateId: 'd6000000-0000-0000-0000-000000000006', skillId: 'c0000000-0000-0000-0000-000000000012', proficiency: 'ADVANCED' as const, yearsOfExp: 4, confidence: 0.87 },
    { candidateId: 'd6000000-0000-0000-0000-000000000006', skillId: 'c0000000-0000-0000-0000-000000000016', proficiency: 'ADVANCED' as const, yearsOfExp: 4, confidence: 0.85 },
    { candidateId: 'd6000000-0000-0000-0000-000000000006', skillId: 'c0000000-0000-0000-0000-000000000020', proficiency: 'ADVANCED' as const, yearsOfExp: 3, confidence: 0.82 },
    { candidateId: 'd6000000-0000-0000-0000-000000000006', skillId: 'c0000000-0000-0000-0000-000000000021', proficiency: 'ADVANCED' as const, yearsOfExp: 3, confidence: 0.80 },
    // Alexander - Java Backend
    { candidateId: 'd7000000-0000-0000-0000-000000000007', skillId: 'c0000000-0000-0000-0000-000000000004', proficiency: 'EXPERT' as const, yearsOfExp: 8, confidence: 0.96 },
    { candidateId: 'd7000000-0000-0000-0000-000000000007', skillId: 'c0000000-0000-0000-0000-000000000014', proficiency: 'EXPERT' as const, yearsOfExp: 6, confidence: 0.94 },
    { candidateId: 'd7000000-0000-0000-0000-000000000007', skillId: 'c0000000-0000-0000-0000-000000000016', proficiency: 'ADVANCED' as const, yearsOfExp: 7, confidence: 0.90 },
    { candidateId: 'd7000000-0000-0000-0000-000000000007', skillId: 'c0000000-0000-0000-0000-000000000018', proficiency: 'ADVANCED' as const, yearsOfExp: 5, confidence: 0.85 },
    { candidateId: 'd7000000-0000-0000-0000-000000000007', skillId: 'c0000000-0000-0000-0000-000000000021', proficiency: 'INTERMEDIATE' as const, yearsOfExp: 3, confidence: 0.75 },
  ];

  for (const cs of candidateSkills) {
    const { proficiency, ...rest } = cs;
    await prisma.candidateSkill.create({
      data: {
        ...rest,
        proficiency: proficiency as any,
        source: 'resume',
      },
    });
  }

  // ── Applications ───────────────────────────────────────
  console.log('  Creating applications...');
  const applications = [
    { candidateId: 'd1000000-0000-0000-0000-000000000001', jobId: 'e1000000-0000-0000-0000-000000000001', status: 'SHORTLISTED' as const },
    { candidateId: 'd6000000-0000-0000-0000-000000000006', jobId: 'e1000000-0000-0000-0000-000000000001', status: 'INTERVIEW_SCHEDULED' as const },
    { candidateId: 'd2000000-0000-0000-0000-000000000002', jobId: 'e2000000-0000-0000-0000-000000000002', status: 'SHORTLISTED' as const },
    { candidateId: 'd9000000-0000-0000-0000-000000000009', jobId: 'e2000000-0000-0000-0000-000000000002', status: 'SCREENING' as const },
    { candidateId: 'd3000000-0000-0000-0000-000000000003', jobId: 'e3000000-0000-0000-0000-000000000003', status: 'INTERVIEWED' as const },
    { candidateId: 'da000000-0000-0000-0000-00000000000a', jobId: 'e3000000-0000-0000-0000-000000000003', status: 'SHORTLISTED' as const },
    { candidateId: 'd4000000-0000-0000-0000-000000000004', jobId: 'e4000000-0000-0000-0000-000000000004', status: 'APPLIED' as const },
    { candidateId: 'd1000000-0000-0000-0000-000000000001', jobId: 'e2000000-0000-0000-0000-000000000002', status: 'APPLIED' as const },
    { candidateId: 'd5000000-0000-0000-0000-000000000005', jobId: 'e5000000-0000-0000-0000-000000000005', status: 'SHORTLISTED' as const },
    { candidateId: 'd7000000-0000-0000-0000-000000000007', jobId: 'e1000000-0000-0000-0000-000000000001', status: 'SCREENING' as const },
    { candidateId: 'd8000000-0000-0000-0000-000000000008', jobId: 'e6000000-0000-0000-0000-000000000006', status: 'HIRED' as const },
  ];

  for (const app of applications) {
    await prisma.application.create({
      data: {
        ...app,
        appliedById: users[1].id,
      },
    });
  }

  // ── Candidate Matches ──────────────────────────────────
  console.log('  Creating candidate matches...');
  const matches = [
    { candidateId: 'd1000000-0000-0000-0000-000000000001', jobId: 'e1000000-0000-0000-0000-000000000001', overallScore: 91, skillScore: 95, experienceScore: 87, projectScore: 93, educationScore: 88, semanticScore: 90 },
    { candidateId: 'd6000000-0000-0000-0000-000000000006', jobId: 'e1000000-0000-0000-0000-000000000001', overallScore: 88, skillScore: 90, experienceScore: 85, projectScore: 88, educationScore: 86, semanticScore: 87 },
    { candidateId: 'd7000000-0000-0000-0000-000000000007', jobId: 'e1000000-0000-0000-0000-000000000001', overallScore: 72, skillScore: 65, experienceScore: 90, projectScore: 70, educationScore: 75, semanticScore: 68 },
    { candidateId: 'd2000000-0000-0000-0000-000000000002', jobId: 'e2000000-0000-0000-0000-000000000002', overallScore: 93, skillScore: 96, experienceScore: 88, projectScore: 92, educationScore: 90, semanticScore: 94 },
    { candidateId: 'd9000000-0000-0000-0000-000000000009', jobId: 'e2000000-0000-0000-0000-000000000002', overallScore: 78, skillScore: 82, experienceScore: 70, projectScore: 75, educationScore: 80, semanticScore: 76 },
    { candidateId: 'd3000000-0000-0000-0000-000000000003', jobId: 'e3000000-0000-0000-0000-000000000003', overallScore: 94, skillScore: 97, experienceScore: 90, projectScore: 91, educationScore: 92, semanticScore: 93 },
    { candidateId: 'da000000-0000-0000-0000-00000000000a', jobId: 'e3000000-0000-0000-0000-000000000003', overallScore: 89, skillScore: 91, experienceScore: 86, projectScore: 88, educationScore: 87, semanticScore: 90 },
    { candidateId: 'd5000000-0000-0000-0000-000000000005', jobId: 'e5000000-0000-0000-0000-000000000005', overallScore: 82, skillScore: 85, experienceScore: 80, projectScore: 83, educationScore: 78, semanticScore: 81 },
  ];

  const matchIds: string[] = [];
  for (const match of matches) {
    const created = await prisma.candidateMatch.create({ data: match });
    matchIds.push(created.id);
  }

  // ── Match Evidence ─────────────────────────────────────
  console.log('  Creating match evidence...');
  const evidence = [
    { matchId: matchIds[0], type: 'skill_match', detail: 'Strong match in TypeScript, React, Node.js, PostgreSQL — all required skills', score: 0.95 },
    { matchId: matchIds[0], type: 'experience', detail: '6 years of full-stack development aligns with senior-level requirements', score: 0.87 },
    { matchId: matchIds[0], type: 'semantic', detail: 'Candidate profile strongly aligns with job description requirements', score: 0.90 },
    { matchId: matchIds[3], type: 'skill_match', detail: 'Excellent match in Python, ML, PyTorch, and data analysis', score: 0.96 },
    { matchId: matchIds[3], type: 'experience', detail: '4 years of ML engineering with published research papers', score: 0.88 },
    { matchId: matchIds[5], type: 'skill_match', detail: 'Perfect match in AWS, Docker, Kubernetes, and Terraform — all required', score: 0.97 },
    { matchId: matchIds[5], type: 'experience', detail: '5 years of cloud infrastructure management with AWS certification', score: 0.90 },
  ];

  for (const e of evidence) {
    await prisma.matchEvidence.create({ data: e });
  }

  // ── Recruitment Stages ─────────────────────────────────
  console.log('  Creating recruitment stages...');
  const stages = [
    { name: 'Applied', order: 1 },
    { name: 'Screening', order: 2 },
    { name: 'Shortlisted', order: 3 },
    { name: 'Interview', order: 4 },
    { name: 'Offer', order: 5 },
    { name: 'Hired', order: 6 },
  ];

  for (const stage of stages) {
    await prisma.recruitmentStage.create({
      data: {
        ...stage,
        organizationId: org.id,
      },
    });
  }

  // ── Notifications ──────────────────────────────────────
  console.log('  Creating notifications...');
  const notifications = [
    { userId: users[1].id, type: 'application', title: 'New Application', message: 'Elena Rodriguez applied for Junior React Developer', read: false },
    { userId: users[0].id, type: 'interview', title: 'Interview Scheduled', message: 'Interview with Priyanka Desai for Senior Full-Stack Engineer', read: false },
    { userId: users[1].id, type: 'job_update', title: 'Job Published', message: 'DevOps Engineer position has been published', read: true },
    { userId: users[2].id, type: 'candidate', title: 'Candidate Shortlisted', message: 'Rahul Patel has been shortlisted for Senior Full-Stack Engineer', read: false },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({
      data: {
        ...notif,
        organizationId: org.id,
      },
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('Demo accounts:');
  console.log('  Admin:     admin@techvista.io     / password123');
  console.log('  Recruiter: recruiter@techvista.io / password123');
  console.log('  Hiring:    hiring@techvista.io    / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
