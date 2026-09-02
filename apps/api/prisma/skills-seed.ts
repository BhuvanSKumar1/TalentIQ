/**
 * Skills Intelligence Seed — categories, skills, aliases, relationships.
 * Run: DATABASE_URL="..." npx tsx prisma/skills-seed.ts
 */
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Stable UUIDs for categories
const CAT: Record<string, string> = {};
function catId(key: string): string {
  if (!CAT[key]) CAT[key] = randomUUID();
  return CAT[key];
}

// Stable UUIDs for skills
const SK: Record<string, string> = {};
function skId(key: string): string {
  if (!SK[key]) SK[key] = randomUUID();
  return SK[key];
}

async function main() {
  console.log('🧠 Seeding skill taxonomy...');

  // ── Categories ──────────────────────────────────────────
  const categoryDefs = [
    { key: 'lang', name: 'Programming Languages', desc: 'Programming and scripting languages', icon: 'Code' },
    { key: 'fe', name: 'Frontend', desc: 'Frontend frameworks, libraries, and UI tools', icon: 'Monitor' },
    { key: 'be', name: 'Backend', desc: 'Backend frameworks, servers, and runtime', icon: 'Server' },
    { key: 'db', name: 'Databases', desc: 'Relational, NoSQL, and caching databases', icon: 'Database' },
    { key: 'cd', name: 'Cloud & DevOps', desc: 'Cloud platforms, containerization, CI/CD, and infrastructure', icon: 'Cloud' },
    { key: 'ai', name: 'AI & Machine Learning', desc: 'AI, ML, deep learning, NLP, and data science', icon: 'Brain' },
    { key: 'de', name: 'Data Engineering', desc: 'Data pipelines, warehousing, and analytics tools', icon: 'BarChart' },
    { key: 'qa', name: 'Testing', desc: 'Testing frameworks, QA, and quality tools', icon: 'ShieldCheck' },
    { key: 'soft', name: 'Soft Skills', desc: 'Interpersonal and professional soft skills', icon: 'Users' },
    { key: 'sec', name: 'Security', desc: 'Cybersecurity, compliance, and secure coding', icon: 'Lock' },
  ];

  for (const c of categoryDefs) {
    const id = catId(c.key);
    await prisma.skillCategory.upsert({
      where: { name: c.name },
      update: { description: c.desc, icon: c.icon },
      create: { id, name: c.name, description: c.desc, icon: c.icon },
    });
  }
  console.log(`  ✅ ${categoryDefs.length} categories`);

  // Fetch actual category IDs (upsert may keep existing IDs)
  const catRows = await prisma.skillCategory.findMany();
  const catNameToId: Record<string, string> = {};
  for (const r of catRows) catNameToId[r.name] = r.id;
  function catIdByName(name: string): string | undefined { return catNameToId[name]; }

  // ── Skills ──────────────────────────────────────────────
  interface SkillDef {
    key: string; name: string; cat: string;
    aliases?: string[];
    relatedTo?: string[];
  }

  const skillDefs: SkillDef[] = [
    // Programming Languages
    { key: 'javascript', name: 'JavaScript', cat: 'lang', aliases: ['JS', 'ES6', 'ECMAScript'], relatedTo: ['typescript', 'react'] },
    { key: 'typescript', name: 'TypeScript', cat: 'lang', aliases: ['TS'], relatedTo: ['javascript'] },
    { key: 'python', name: 'Python', cat: 'lang', aliases: ['py', 'Python3'], relatedTo: ['django', 'flask', 'fastapi'] },
    { key: 'java', name: 'Java', cat: 'lang', aliases: ['JDK', 'JVM'], relatedTo: ['spring-boot', 'kotlin'] },
    { key: 'go', name: 'Go', cat: 'lang', aliases: ['Golang'], relatedTo: ['rust', 'docker'] },
    { key: 'rust', name: 'Rust', cat: 'lang', aliases: [], relatedTo: ['go'] },
    { key: 'cpp', name: 'C++', cat: 'lang', aliases: ['C plus plus'], relatedTo: ['csharp'] },
    { key: 'csharp', name: 'C#', cat: 'lang', aliases: ['CSharp'], relatedTo: ['dotnet'] },
    { key: 'ruby', name: 'Ruby', cat: 'lang', aliases: [], relatedTo: ['rails'] },
    { key: 'kotlin', name: 'Kotlin', cat: 'lang', aliases: ['Android'], relatedTo: ['java'] },
    { key: 'swift', name: 'Swift', cat: 'lang', aliases: ['iOS'], relatedTo: [] },
    { key: 'php', name: 'PHP', cat: 'lang', aliases: [], relatedTo: ['laravel'] },
    { key: 'sql', name: 'SQL', cat: 'lang', aliases: ['PLSQL', 'T-SQL'], relatedTo: ['postgresql', 'mysql'] },
    { key: 'html-css', name: 'HTML/CSS', cat: 'lang', aliases: ['HTML5', 'CSS3', 'SCSS', 'Sass'], relatedTo: ['tailwind', 'react'] },
    { key: 'bash', name: 'Bash/Shell', cat: 'lang', aliases: ['Shell scripting'], relatedTo: ['linux'] },

    // Frontend
    { key: 'react', name: 'React', cat: 'fe', aliases: ['ReactJS', 'React.js', 'React Native'], relatedTo: ['nextjs', 'vue'] },
    { key: 'nextjs', name: 'Next.js', cat: 'fe', aliases: ['NextJS'], relatedTo: ['react'] },
    { key: 'vue', name: 'Vue.js', cat: 'fe', aliases: ['VueJS', 'Vue3'], relatedTo: ['react'] },
    { key: 'angular', name: 'Angular', cat: 'fe', aliases: ['AngularJS'], relatedTo: ['react', 'typescript'] },
    { key: 'svelte', name: 'Svelte', cat: 'fe', aliases: ['SvelteKit'], relatedTo: ['react'] },
    { key: 'tailwind', name: 'Tailwind CSS', cat: 'fe', aliases: ['Tailwind'], relatedTo: ['html-css', 'react'] },
    { key: 'bootstrap', name: 'Bootstrap', cat: 'fe', aliases: [], relatedTo: ['html-css'] },

    // Backend
    { key: 'nodejs', name: 'Node.js', cat: 'be', aliases: ['NodeJS', 'Node'], relatedTo: ['express', 'nestjs'] },
    { key: 'express', name: 'Express.js', cat: 'be', aliases: ['ExpressJS', 'Express'], relatedTo: ['nodejs', 'nestjs'] },
    { key: 'nestjs', name: 'NestJS', cat: 'be', aliases: ['Nest'], relatedTo: ['nodejs'] },
    { key: 'spring-boot', name: 'Spring Boot', cat: 'be', aliases: ['Spring'], relatedTo: ['java', 'microservices'] },
    { key: 'django', name: 'Django', cat: 'be', aliases: [], relatedTo: ['python', 'flask'] },
    { key: 'flask', name: 'Flask', cat: 'be', aliases: [], relatedTo: ['python', 'django'] },
    { key: 'fastapi', name: 'FastAPI', cat: 'be', aliases: [], relatedTo: ['python'] },
    { key: 'rails', name: 'Ruby on Rails', cat: 'be', aliases: ['Rails'], relatedTo: ['ruby'] },
    { key: 'laravel', name: 'Laravel', cat: 'be', aliases: [], relatedTo: ['php'] },
    { key: 'dotnet', name: '.NET', cat: 'be', aliases: ['ASP.NET', '.NET Core', 'Blazor'], relatedTo: ['csharp'] },
    { key: 'graphql', name: 'GraphQL', cat: 'be', aliases: ['Apollo'], relatedTo: ['rest-api'] },
    { key: 'rest-api', name: 'REST API', cat: 'be', aliases: ['REST', 'RESTful'], relatedTo: ['graphql', 'nodejs'] },
    { key: 'microservices', name: 'Microservices', cat: 'be', aliases: [], relatedTo: ['docker', 'kubernetes'] },
    { key: 'websockets', name: 'WebSockets', cat: 'be', aliases: ['Socket.io'], relatedTo: ['nodejs'] },

    // Databases
    { key: 'postgresql', name: 'PostgreSQL', cat: 'db', aliases: ['Postgres'], relatedTo: ['mysql', 'sql'] },
    { key: 'mysql', name: 'MySQL', cat: 'db', aliases: [], relatedTo: ['postgresql'] },
    { key: 'mongodb', name: 'MongoDB', cat: 'db', aliases: ['Mongo'], relatedTo: ['redis'] },
    { key: 'redis', name: 'Redis', cat: 'db', aliases: [], relatedTo: ['mongodb'] },
    { key: 'elasticsearch', name: 'Elasticsearch', cat: 'db', aliases: ['OpenSearch'], relatedTo: ['redis'] },
    { key: 'dynamodb', name: 'DynamoDB', cat: 'db', aliases: [], relatedTo: ['aws'] },
    { key: 'sqlite', name: 'SQLite', cat: 'db', aliases: [], relatedTo: ['sql'] },

    // Cloud & DevOps
    { key: 'aws', name: 'AWS', cat: 'cd', aliases: ['Amazon Web Services', 'EC2', 'S3', 'Lambda', 'ECS', 'EKS'], relatedTo: ['gcp', 'azure', 'docker'] },
    { key: 'gcp', name: 'Google Cloud', cat: 'cd', aliases: ['GCP', 'BigQuery', 'Cloud Run'], relatedTo: ['aws', 'azure'] },
    { key: 'azure', name: 'Azure', cat: 'cd', aliases: ['Microsoft Azure'], relatedTo: ['aws'] },
    { key: 'docker', name: 'Docker', cat: 'cd', aliases: ['Docker Compose'], relatedTo: ['kubernetes', 'aws'] },
    { key: 'kubernetes', name: 'Kubernetes', cat: 'cd', aliases: ['K8s', 'kubectl'], relatedTo: ['docker'] },
    { key: 'terraform', name: 'Terraform', cat: 'cd', aliases: ['IaC'], relatedTo: ['aws', 'ansible'] },
    { key: 'ansible', name: 'Ansible', cat: 'cd', aliases: [], relatedTo: ['terraform'] },
    { key: 'jenkins', name: 'Jenkins', cat: 'cd', aliases: ['CI/CD'], relatedTo: ['github-actions'] },
    { key: 'github-actions', name: 'GitHub Actions', cat: 'cd', aliases: [], relatedTo: ['jenkins', 'gitlab-ci'] },
    { key: 'gitlab-ci', name: 'GitLab CI', cat: 'cd', aliases: [], relatedTo: ['jenkins'] },
    { key: 'nginx', name: 'Nginx', cat: 'cd', aliases: [], relatedTo: ['linux'] },
    { key: 'linux', name: 'Linux', cat: 'cd', aliases: ['Ubuntu', 'CentOS'], relatedTo: ['bash'] },
    { key: 'git', name: 'Git', cat: 'cd', aliases: ['GitHub', 'GitLab'], relatedTo: ['github-actions'] },
    { key: 'prometheus', name: 'Prometheus', cat: 'cd', aliases: [], relatedTo: ['grafana'] },
    { key: 'grafana', name: 'Grafana', cat: 'cd', aliases: [], relatedTo: ['prometheus'] },

    // AI & ML
    { key: 'machine-learning', name: 'Machine Learning', cat: 'ai', aliases: ['ML'], relatedTo: ['deep-learning', 'pytorch'] },
    { key: 'deep-learning', name: 'Deep Learning', cat: 'ai', aliases: ['DL'], relatedTo: ['machine-learning', 'pytorch', 'tensorflow'] },
    { key: 'pytorch', name: 'PyTorch', cat: 'ai', aliases: [], relatedTo: ['tensorflow', 'machine-learning'] },
    { key: 'tensorflow', name: 'TensorFlow', cat: 'ai', aliases: ['Keras'], relatedTo: ['pytorch'] },
    { key: 'nlp', name: 'NLP', cat: 'ai', aliases: ['Natural Language Processing'], relatedTo: ['transformers'] },
    { key: 'transformers', name: 'Transformers', cat: 'ai', aliases: ['BERT', 'GPT', 'LLM', 'LangChain', 'RAG'], relatedTo: ['nlp', 'deep-learning'] },
    { key: 'scikit-learn', name: 'scikit-learn', cat: 'ai', aliases: ['sklearn'], relatedTo: ['python', 'machine-learning'] },
    { key: 'pandas', name: 'Pandas', cat: 'ai', aliases: [], relatedTo: ['python', 'numpy'] },
    { key: 'numpy', name: 'NumPy', cat: 'ai', aliases: [], relatedTo: ['pandas'] },

    // Data Engineering
    { key: 'spark', name: 'Apache Spark', cat: 'de', aliases: ['Spark', 'PySpark'], relatedTo: ['kafka'] },
    { key: 'kafka', name: 'Apache Kafka', cat: 'de', aliases: ['Kafka'], relatedTo: ['spark'] },
    { key: 'airflow', name: 'Apache Airflow', cat: 'de', aliases: ['Airflow'], relatedTo: ['spark'] },
    { key: 'tableau', name: 'Tableau', cat: 'de', aliases: [], relatedTo: ['power-bi'] },
    { key: 'power-bi', name: 'Power BI', cat: 'de', aliases: [], relatedTo: ['tableau'] },

    // Testing
    { key: 'jest', name: 'Jest', cat: 'qa', aliases: [], relatedTo: ['mocha', 'cypress'] },
    { key: 'pytest', name: 'pytest', cat: 'qa', aliases: [], relatedTo: ['jest'] },
    { key: 'cypress', name: 'Cypress', cat: 'qa', aliases: ['E2E Testing'], relatedTo: ['selenium'] },
    { key: 'selenium', name: 'Selenium', cat: 'qa', aliases: [], relatedTo: ['cypress'] },
    { key: 'tdd', name: 'TDD', cat: 'qa', aliases: ['Test-Driven Development'], relatedTo: ['agile'] },

    // Soft Skills
    { key: 'communication', name: 'Communication', cat: 'soft', aliases: ['Public Speaking'], relatedTo: ['leadership'] },
    { key: 'leadership', name: 'Leadership', cat: 'soft', aliases: ['Team Lead', 'Technical Lead'], relatedTo: ['mentoring', 'communication'] },
    { key: 'problem-solving', name: 'Problem Solving', cat: 'soft', aliases: ['Critical Thinking'], relatedTo: ['communication'] },
    { key: 'teamwork', name: 'Teamwork', cat: 'soft', aliases: ['Collaboration'], relatedTo: ['communication'] },
    { key: 'agile', name: 'Agile', cat: 'soft', aliases: ['Scrum', 'Kanban', 'Sprint'], relatedTo: ['tdd', 'project-management'] },
    { key: 'project-management', name: 'Project Management', cat: 'soft', aliases: ['PM', 'Jira'], relatedTo: ['agile'] },
    { key: 'mentoring', name: 'Mentoring', cat: 'soft', aliases: ['Coaching'], relatedTo: ['leadership'] },
  ];

  // Map category keys to names
  const catKeyToName: Record<string, string> = {};
  for (const c of categoryDefs) catKeyToName[c.key] = c.name;

  // Insert skills
  for (const sd of skillDefs) {
    const id = skId(sd.key);
    const catName = catKeyToName[sd.cat];
    const cat = catIdByName(catName);
    await prisma.skill.upsert({
      where: { name: sd.name },
      update: { categoryId: cat || null },
      create: { id, name: sd.name, categoryId: cat || null },
    });
  }
  console.log(`  ✅ ${skillDefs.length} skills`);

  // Insert aliases
  let aliasCount = 0;
  for (const sd of skillDefs) {
    if (!sd.aliases) continue;
    const skillId = skId(sd.key);
    for (const alias of sd.aliases) {
      try {
        await prisma.skillAlias.create({ data: { skillId, alias, type: 'synonym' } });
        aliasCount++;
      } catch { /* duplicate alias — skip */ }
    }
  }
  console.log(`  ✅ ${aliasCount} aliases`);

  // Insert relationships
  let relCount = 0;
  const relSet = new Set<string>();
  for (const sd of skillDefs) {
    if (!sd.relatedTo) continue;
    const sourceId = skId(sd.key);
    for (const targetKey of sd.relatedTo) {
      const targetId = skId(targetKey);
      const k1 = `${sourceId}|${targetId}`;
      const k2 = `${targetId}|${sourceId}`;
      if (relSet.has(k1) || relSet.has(k2)) continue;
      relSet.add(k1);
      try {
        await prisma.skillRelation.create({
          data: { sourceId, targetId, relation: 'related_to', weight: 0.8 },
        });
        relCount++;
      } catch { /* duplicate */ }
      try {
        await prisma.skillRelation.create({
          data: { sourceId: targetId, targetId: sourceId, relation: 'related_to', weight: 0.8 },
        });
        relCount++;
      } catch { /* duplicate */ }
    }
  }
  console.log(`  ✅ ${relCount} relationships`);

  console.log('🎉 Skill taxonomy seeded successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
