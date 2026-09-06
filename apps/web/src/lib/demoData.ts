import type { Candidate, Job, Application, Interview, CandidateMatch } from '@/types';

// ============================================================
// DEMO CANDIDATES
// ============================================================
export const DEMO_CANDIDATES: any[] = [
  {
    id: 'cand-1',
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@example.com',
    phone: '+1 (555) 342-9812',
    location: 'San Francisco, CA (Open to Remote)',
    linkedin: 'https://linkedin.com/in/priyasharma-dev',
    portfolio: 'https://priyasharma.io',
    summary:
      'Lead Full-Stack & Distributed Systems Architect with 8+ years experience building high-throughput microservices, data-intensive pipelines, and responsive web applications. Specialized in Python, TypeScript, React, and cloud-native architecture.',
    organizationId: 'org-demo',
    createdAt: '2026-08-12T10:00:00Z',
    updatedAt: '2026-09-01T14:30:00Z',
    _count: { applications: 3 },
    skills: [
      { id: 'cs-1', skillId: 's-python', proficiency: 'EXPERT', yearsOfExp: 8, confidence: 0.96, evidence: '8 years production backend, microservices handling 2M+ daily requests', skill: { id: 's-python', name: 'Python', category: { id: 'c-lang', name: 'Languages' } } },
      { id: 'cs-2', skillId: 's-react', proficiency: 'EXPERT', yearsOfExp: 7, confidence: 0.94, evidence: 'Built complex dashboard design systems with React 18, Zustand, and Tailwind', skill: { id: 's-react', name: 'React', category: { id: 'c-front', name: 'Frontend' } } },
      { id: 'cs-3', skillId: 's-ts', proficiency: 'EXPERT', yearsOfExp: 6, confidence: 0.95, evidence: 'Strict type safety across shared monorepos, SDK libraries', skill: { id: 's-ts', name: 'TypeScript', category: { id: 'c-lang', name: 'Languages' } } },
      { id: 'cs-4', skillId: 's-aws', proficiency: 'ADVANCED', yearsOfExp: 5, confidence: 0.91, evidence: 'AWS Certified Solutions Architect (ECS, Lambda, SQS, RDS)', skill: { id: 's-aws', name: 'AWS', category: { id: 'c-cloud', name: 'Cloud' } } },
      { id: 'cs-5', skillId: 's-postgres', proficiency: 'ADVANCED', yearsOfExp: 6, confidence: 0.89, evidence: 'Optimized partitioning & indexing reducing query latency by 42%', skill: { id: 's-postgres', name: 'PostgreSQL', category: { id: 'c-db', name: 'Databases' } } },
      { id: 'cs-6', skillId: 's-docker', proficiency: 'ADVANCED', yearsOfExp: 5, confidence: 0.90, evidence: 'Multi-stage Docker containerization and CI/CD pipelines', skill: { id: 's-docker', name: 'Docker', category: { id: 'c-devops', name: 'DevOps' } } },
      { id: 'cs-7', skillId: 's-graphql', proficiency: 'INTERMEDIATE', yearsOfExp: 3, confidence: 0.82, evidence: 'Apollo Federation micro-graph for mobile clients', skill: { id: 's-graphql', name: 'GraphQL', category: { id: 'c-api', name: 'APIs' } } },
    ],
    experiences: [
      {
        id: 'exp-1',
        company: 'Starlight Scale Tech',
        title: 'Lead Full-Stack Engineer',
        location: 'San Francisco, CA',
        startDate: '2022-03-01',
        endDate: null,
        isCurrent: true,
        description: 'Architected distributed event-driven microservices serving 4M+ monthly active users. Mentored 9 mid-level engineers and drove migration from monolithic REST to resilient async queues.'
      },
      {
        id: 'exp-2',
        company: 'Apex Data Systems',
        title: 'Senior Software Engineer',
        location: 'Mountain View, CA',
        startDate: '2019-06-01',
        endDate: '2022-02-28',
        isCurrent: false,
        description: 'Built customer-facing analytics dashboards using React, D3, and FastAPI. Led PostgreSQL database sharding initiative reducing peak query degradation by 50%.'
      },
      {
        id: 'exp-3',
        company: 'Vanguard Interactive',
        title: 'Full Stack Developer',
        location: 'Seattle, WA',
        startDate: '2017-08-01',
        endDate: '2019-05-30',
        isCurrent: false,
        description: 'Implemented web portals and API services with Python/Django and React. Automated regression testing pipelines.'
      }
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'University of Washington',
        degree: 'B.S. in Computer Science',
        field: 'Software Systems & Distributed Computing',
        startDate: '2013-09-01',
        endDate: '2017-06-15',
        gpa: 3.88
      }
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'Nexus Stream Hub',
        description: 'Open-source distributed streaming engine built in Python & Go with sub-10ms event dissemination.',
        url: 'https://github.com/priyasharma/nexus-stream',
        technologies: ['Python', 'Go', 'Docker', 'Redis', 'Kafka']
      },
      {
        id: 'proj-2',
        name: 'OmniDash Design System',
        description: 'Accessible component library and interactive charting system used by 12 internal engineering teams.',
        url: 'https://github.com/priyasharma/omnidash',
        technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Storybook']
      }
    ],
    certifications: [
      { id: 'cert-1', name: 'AWS Certified Solutions Architect - Associate', issuer: 'Amazon Web Services', issueDate: '2023-04-10' },
      { id: 'cert-2', name: 'Certified Kubernetes Application Developer (CKAD)', issuer: 'Linux Foundation', issueDate: '2024-01-18' }
    ],
    resumes: [
      { id: 'res-1', fileName: 'Priya_Sharma_Resume_2026.pdf', processingStatus: 'COMPLETED', parsedData: { skillsExtracted: 18, matchConfidence: '98%' } }
    ],
    applications: [
      { id: 'app-1', status: 'SHORTLISTED', job: { id: 'job-1', title: 'Senior Full-Stack Engineer' }, createdAt: '2026-08-20' },
      { id: 'app-2', status: 'INTERVIEW_SCHEDULED', job: { id: 'job-2', title: 'Lead Machine Learning Engineer' }, createdAt: '2026-08-25' }
    ]
  },
  {
    id: 'cand-2',
    firstName: 'Marcus',
    lastName: 'Chen',
    email: 'marcus.chen@example.com',
    phone: '+1 (555) 789-2311',
    location: 'Seattle, WA',
    linkedin: 'https://linkedin.com/in/marcus-chen-ml',
    portfolio: 'https://marcuschen.ai',
    summary:
      'Principal AI/ML Systems Engineer specialized in LLM infrastructure, retrieval-augmented generation (RAG), vector embeddings, and low-latency model inference in production environments.',
    organizationId: 'org-demo',
    createdAt: '2026-08-14T09:15:00Z',
    updatedAt: '2026-09-02T11:20:00Z',
    _count: { applications: 2 },
    skills: [
      { id: 'cs-21', skillId: 's-python', proficiency: 'EXPERT', yearsOfExp: 9, confidence: 0.98, evidence: 'Core contributor to machine learning frameworks and model serving runtimes', skill: { id: 's-python', name: 'Python', category: { id: 'c-lang', name: 'Languages' } } },
      { id: 'cs-22', skillId: 's-pytorch', proficiency: 'EXPERT', yearsOfExp: 7, confidence: 0.96, evidence: 'Trained transformer architectures, LoRA fine-tuning, and vLLM quantization', skill: { id: 's-pytorch', name: 'PyTorch', category: { id: 'c-ai', name: 'AI/ML' } } },
      { id: 'cs-23', skillId: 's-fastapi', proficiency: 'EXPERT', yearsOfExp: 6, confidence: 0.93, evidence: 'Engineered sub-50ms inference gateways using FastAPI, Redis caching', skill: { id: 's-fastapi', name: 'FastAPI', category: { id: 'c-back', name: 'Backend' } } },
      { id: 'cs-24', skillId: 's-k8s', proficiency: 'ADVANCED', yearsOfExp: 5, confidence: 0.90, evidence: 'Kubernetes GPU cluster orchestration, KubeRay, and Triton Inference Server', skill: { id: 's-k8s', name: 'Kubernetes', category: { id: 'c-cloud', name: 'Cloud' } } },
      { id: 'cs-25', skillId: 's-vector', proficiency: 'EXPERT', yearsOfExp: 4, confidence: 0.95, evidence: 'Designed multi-million embedding vector indices (Pinecone, Qdrant, pgvector)', skill: { id: 's-vector', name: 'Vector DBs (pgvector/Pinecone)', category: { id: 'c-db', name: 'Databases' } } },
      { id: 'cs-26', skillId: 's-ts', proficiency: 'INTERMEDIATE', yearsOfExp: 3, confidence: 0.80, evidence: 'Built internal ML evaluation playgrounds in Next.js/TypeScript', skill: { id: 's-ts', name: 'TypeScript', category: { id: 'c-lang', name: 'Languages' } } },
    ],
    experiences: [
      {
        id: 'exp-21',
        company: 'Cognitive Matrix Labs',
        title: 'Senior Staff ML Engineer',
        location: 'Seattle, WA',
        startDate: '2021-04-01',
        endDate: null,
        isCurrent: true,
        description: 'Led R&D of LLM evaluation benchmarks and distributed inference infrastructure. Reduced p99 model latency by 64% while tripling batch throughput.'
      },
      {
        id: 'exp-22',
        company: 'DeepRoute Analytics',
        title: 'Machine Learning Specialist',
        location: 'San Jose, CA',
        startDate: '2018-02-01',
        endDate: '2021-03-31',
        isCurrent: false,
        description: 'Trained neural network ranking systems for e-commerce search recommendations. Deployed automated continuous retraining pipelines.'
      }
    ],
    education: [
      {
        id: 'edu-21',
        institution: 'Stanford University',
        degree: 'M.S. in Computer Science (Artificial Intelligence)',
        field: 'Machine Learning & Natural Language Processing',
        startDate: '2016-09-01',
        endDate: '2018-06-15',
        gpa: 3.94
      }
    ],
    projects: [
      {
        id: 'proj-21',
        name: 'AutoRAG Evaluator',
        description: 'Automated framework for synthetic evaluation of Retrieval-Augmented Generation context precision and hallucination detection.',
        url: 'https://github.com/marcuschen/autorag-eval',
        technologies: ['Python', 'PyTorch', 'LangChain', 'FastAPI', 'Docker']
      }
    ],
    certifications: [
      { id: 'cert-21', name: 'NVIDIA Certified Deep Learning Professional', issuer: 'NVIDIA Deep Learning Institute', issueDate: '2023-08-14' }
    ],
    resumes: [
      { id: 'res-21', fileName: 'Marcus_Chen_CV.pdf', processingStatus: 'COMPLETED', parsedData: { skillsExtracted: 22, matchConfidence: '99%' } }
    ],
    applications: [
      { id: 'app-21', status: 'SHORTLISTED', job: { id: 'job-2', title: 'Lead Machine Learning Engineer' }, createdAt: '2026-08-18' }
    ]
  },
  {
    id: 'cand-3',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena.rostova@example.com',
    phone: '+1 (555) 492-8834',
    location: 'Austin, TX (Remote)',
    linkedin: 'https://linkedin.com/in/elena-rostova-cloud',
    portfolio: 'https://rostova.tech',
    summary:
      'Staff Cloud Architect & DevOps Platform Engineer with deep expertise in multi-region Kubernetes, Terraform infrastructure-as-code, zero-trust security postures, and enterprise CI/CD automation.',
    organizationId: 'org-demo',
    createdAt: '2026-08-15T14:20:00Z',
    updatedAt: '2026-09-03T16:45:00Z',
    _count: { applications: 2 },
    skills: [
      { id: 'cs-31', skillId: 's-k8s', proficiency: 'EXPERT', yearsOfExp: 8, confidence: 0.97, evidence: 'Managed 80+ node Kubernetes clusters across AWS and GCP with GitOps (ArgoCD)', skill: { id: 's-k8s', name: 'Kubernetes', category: { id: 'c-cloud', name: 'Cloud' } } },
      { id: 'cs-32', skillId: 's-tf', proficiency: 'EXPERT', yearsOfExp: 7, confidence: 0.96, evidence: 'Architected complete multi-account infrastructure modules with Terraform & OpenTofu', skill: { id: 's-tf', name: 'Terraform', category: { id: 'c-devops', name: 'DevOps' } } },
      { id: 'cs-33', skillId: 's-aws', proficiency: 'EXPERT', yearsOfExp: 8, confidence: 0.95, evidence: 'AWS Certified Solutions Architect Professional & Security Specialty', skill: { id: 's-aws', name: 'AWS', category: { id: 'c-cloud', name: 'Cloud' } } },
      { id: 'cs-34', skillId: 's-go', proficiency: 'ADVANCED', yearsOfExp: 5, confidence: 0.88, evidence: 'Developed custom Kubernetes operators and CLI tools in Go', skill: { id: 's-go', name: 'Go (Golang)', category: { id: 'c-lang', name: 'Languages' } } },
      { id: 'cs-35', skillId: 's-cicd', proficiency: 'EXPERT', yearsOfExp: 7, confidence: 0.94, evidence: 'Constructed automated compliance pipelines with GitHub Actions, Vault, Trivy', skill: { id: 's-cicd', name: 'CI/CD & Security', category: { id: 'c-devops', name: 'DevOps' } } },
    ],
    experiences: [
      {
        id: 'exp-31',
        company: 'CloudMatrix Infrastructure',
        title: 'Staff Platform Engineer',
        location: 'Austin, TX',
        startDate: '2021-09-01',
        endDate: null,
        isCurrent: true,
        description: 'Defined cloud platform strategy for 300+ developers. Achieved 99.99% uptime SLA across 4 global regions and cut monthly cloud expenditure by $180,000 via spot orchestration.'
      },
      {
        id: 'exp-32',
        company: 'Fortress Cyber Guard',
        title: 'Senior DevOps Specialist',
        location: 'Dallas, TX',
        startDate: '2018-05-01',
        endDate: '2021-08-31',
        isCurrent: false,
        description: 'Automated SOC2 compliance verification and implemented zero-trust network policies with Istio service mesh.'
      }
    ],
    education: [
      {
        id: 'edu-31',
        institution: 'Georgia Institute of Technology',
        degree: 'B.S. in Computer Engineering',
        field: 'Systems & Cloud Infrastructure',
        startDate: '2014-08-01',
        endDate: '2018-05-15',
        gpa: 3.82
      }
    ],
    projects: [
      {
        id: 'proj-31',
        name: 'KubeGuard Operator',
        description: 'Kubernetes controller that monitors cluster pods for unpatched vulnerabilities and enforces network isolation.',
        url: 'https://github.com/elenarostova/kubeguard',
        technologies: ['Go', 'Kubernetes', 'Terraform', 'Prometheus']
      }
    ],
    certifications: [
      { id: 'cert-31', name: 'AWS Solutions Architect Professional', issuer: 'Amazon Web Services', issueDate: '2024-03-02' },
      { id: 'cert-32', name: 'Certified Kubernetes Administrator (CKA)', issuer: 'CNCF', issueDate: '2023-11-20' }
    ],
    resumes: [
      { id: 'res-31', fileName: 'Elena_Rostova_Resume.pdf', processingStatus: 'COMPLETED', parsedData: { skillsExtracted: 24, matchConfidence: '98%' } }
    ],
    applications: [
      { id: 'app-31', status: 'SHORTLISTED', job: { id: 'job-3', title: 'Senior DevOps & Cloud Architect' }, createdAt: '2026-08-22' }
    ]
  },
  {
    id: 'cand-4',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@example.com',
    phone: '+1 (555) 671-4455',
    location: 'New York, NY',
    linkedin: 'https://linkedin.com/in/david-kim-design-eng',
    portfolio: 'https://davidkim.design',
    summary:
      'Principal Frontend Design Engineer combining award-winning design sensibilities with cutting-edge WebGL, Three.js, React, and modern micro-frontend architectures. Passionate about delighting users through micro-interactions and performance.',
    organizationId: 'org-demo',
    createdAt: '2026-08-16T12:00:00Z',
    updatedAt: '2026-09-02T17:10:00Z',
    _count: { applications: 2 },
    skills: [
      { id: 'cs-41', skillId: 's-react', proficiency: 'EXPERT', yearsOfExp: 8, confidence: 0.98, evidence: 'Authored core component libraries, React 19 transitions, Web Workers', skill: { id: 's-react', name: 'React', category: { id: 'c-front', name: 'Frontend' } } },
      { id: 'cs-42', skillId: 's-three', proficiency: 'EXPERT', yearsOfExp: 5, confidence: 0.95, evidence: 'Built complex 3D interactive graphics scenes with Three.js and React Three Fiber', skill: { id: 's-three', name: 'Three.js / WebGL', category: { id: 'c-front', name: 'Frontend' } } },
      { id: 'cs-43', skillId: 's-ts', proficiency: 'EXPERT', yearsOfExp: 7, confidence: 0.96, evidence: 'Strict TypeScript typing for dynamic design token systems', skill: { id: 's-ts', name: 'TypeScript', category: { id: 'c-lang', name: 'Languages' } } },
      { id: 'cs-44', skillId: 's-tailwind', proficiency: 'EXPERT', yearsOfExp: 5, confidence: 0.97, evidence: 'Created design systems with Tailwind CSS, CVA, Framer Motion', skill: { id: 's-tailwind', name: 'Tailwind CSS', category: { id: 'c-front', name: 'Frontend' } } },
      { id: 'cs-45', skillId: 's-node', proficiency: 'ADVANCED', yearsOfExp: 5, confidence: 0.85, evidence: 'BFF (Backend for Frontend) layers with Next.js Server Components', skill: { id: 's-node', name: 'Node.js', category: { id: 'c-back', name: 'Backend' } } }
    ],
    experiences: [
      {
        id: 'exp-41',
        company: 'Verve Creative Tech',
        title: 'Lead Frontend Architect',
        location: 'New York, NY',
        startDate: '2022-01-01',
        endDate: null,
        isCurrent: true,
        description: 'Directed frontend engineering for consumer products reaching 15M monthly users. Maintained 100 Lighthouse performance and accessibility audits.'
      }
    ],
    education: [
      {
        id: 'edu-41',
        institution: 'Carnegie Mellon University',
        degree: 'B.S. in Computer Science & Human-Computer Interaction',
        field: 'HCI & Graphics Computing',
        startDate: '2014-09-01',
        endDate: '2018-05-20',
        gpa: 3.91
      }
    ],
    projects: [
      {
        id: 'proj-41',
        name: 'ChromaCanvas WebGL',
        description: 'Real-time interactive shader playground and 3D nodal graph visualizer.',
        url: 'https://github.com/davidkim/chromacanvas',
        technologies: ['React', 'Three.js', 'WebGL', 'TypeScript', 'GLSL']
      }
    ],
    certifications: [],
    resumes: [
      { id: 'res-41', fileName: 'David_Kim_Resume.pdf', processingStatus: 'COMPLETED', parsedData: { skillsExtracted: 16, matchConfidence: '97%' } }
    ],
    applications: [
      { id: 'app-41', status: 'SHORTLISTED', job: { id: 'job-4', title: 'Frontend Design Engineer' }, createdAt: '2026-08-24' }
    ]
  },
  {
    id: 'cand-5',
    firstName: 'Aisha',
    lastName: 'Patel',
    email: 'aisha.patel@example.com',
    phone: '+1 (555) 912-3344',
    location: 'Chicago, IL',
    linkedin: 'https://linkedin.com/in/aisha-patel-swe',
    summary: 'Full Stack Engineer with 5 years experience creating secure, scalable SaaS applications with React, Node.js, MongoDB, and Redis.',
    organizationId: 'org-demo',
    createdAt: '2026-08-17T11:00:00Z',
    updatedAt: '2026-09-03T10:00:00Z',
    _count: { applications: 1 },
    skills: [
      { id: 'cs-51', skillId: 's-react', proficiency: 'EXPERT', yearsOfExp: 5, confidence: 0.93, evidence: 'React frontend for enterprise fintech portals', skill: { id: 's-react', name: 'React', category: { id: 'c-front', name: 'Frontend' } } },
      { id: 'cs-52', skillId: 's-node', proficiency: 'EXPERT', yearsOfExp: 5, confidence: 0.91, evidence: 'Node.js Express microservices handling card payments', skill: { id: 's-node', name: 'Node.js', category: { id: 'c-back', name: 'Backend' } } },
      { id: 'cs-53', skillId: 's-ts', proficiency: 'ADVANCED', yearsOfExp: 4, confidence: 0.89, evidence: 'Full TypeScript fullstack implementations', skill: { id: 's-ts', name: 'TypeScript', category: { id: 'c-lang', name: 'Languages' } } },
      { id: 'cs-54', skillId: 's-postgres', proficiency: 'ADVANCED', yearsOfExp: 4, confidence: 0.87, evidence: 'Relational data modeling and transaction integrity', skill: { id: 's-postgres', name: 'PostgreSQL', category: { id: 'c-db', name: 'Databases' } } }
    ],
    experiences: [
      {
        id: 'exp-51',
        company: 'FinPulse Systems',
        title: 'Senior Software Engineer',
        location: 'Chicago, IL',
        startDate: '2021-06-01',
        endDate: null,
        isCurrent: true,
        description: 'Implemented multi-tenant billing platform integrating Stripe and automated reconciliation.'
      }
    ],
    education: [
      {
        id: 'edu-51',
        institution: 'University of Illinois Urbana-Champaign',
        degree: 'B.S. in Computer Science',
        field: 'Software Engineering',
        startDate: '2016-09-01',
        endDate: '2020-05-15',
        gpa: 3.79
      }
    ],
    projects: [],
    certifications: [],
    resumes: [],
    applications: [
      { id: 'app-51', status: 'SCREENING', job: { id: 'job-1', title: 'Senior Full-Stack Engineer' }, createdAt: '2026-08-28' }
    ]
  },
  {
    id: 'cand-6',
    firstName: 'Lucas',
    lastName: 'Silva',
    email: 'lucas.silva@example.com',
    phone: '+1 (555) 438-7612',
    location: 'Boston, MA (Remote)',
    linkedin: 'https://linkedin.com/in/lucassilva-go',
    summary: 'Distributed Systems & Go Specialist with 6+ years designing low-latency communication protocols, Raft consensus engines, and gRPC microservices.',
    organizationId: 'org-demo',
    createdAt: '2026-08-18T10:00:00Z',
    updatedAt: '2026-09-04T09:30:00Z',
    _count: { applications: 2 },
    skills: [
      { id: 'cs-61', skillId: 's-go', proficiency: 'EXPERT', yearsOfExp: 6, confidence: 0.97, evidence: 'High-throughput networking engines processing 50k RPS in Go', skill: { id: 's-go', name: 'Go (Golang)', category: { id: 'c-lang', name: 'Languages' } } },
      { id: 'cs-62', skillId: 's-k8s', proficiency: 'ADVANCED', yearsOfExp: 4, confidence: 0.89, evidence: 'Container deployment and service mesh configuration', skill: { id: 's-k8s', name: 'Kubernetes', category: { id: 'c-cloud', name: 'Cloud' } } },
      { id: 'cs-63', skillId: 's-kafka', proficiency: 'EXPERT', yearsOfExp: 5, confidence: 0.92, evidence: 'Distributed streaming clusters and partition rebalancing', skill: { id: 's-kafka', name: 'Apache Kafka', category: { id: 'c-data', name: 'Data Systems' } } },
      { id: 'cs-64', skillId: 's-postgres', proficiency: 'ADVANCED', yearsOfExp: 5, confidence: 0.88, evidence: 'High availability database replication and failover', skill: { id: 's-postgres', name: 'PostgreSQL', category: { id: 'c-db', name: 'Databases' } } }
    ],
    experiences: [
      {
        id: 'exp-61',
        company: 'NetScale Core Technologies',
        title: 'Lead Systems Engineer',
        location: 'Boston, MA',
        startDate: '2020-03-01',
        endDate: null,
        isCurrent: true,
        description: 'Engineered peer-to-peer data ingestion pipeline handling 12TB daily telemetry data.'
      }
    ],
    education: [
      {
        id: 'edu-61',
        institution: 'MIT',
        degree: 'B.S. in Computer Science',
        field: 'Computer Systems',
        startDate: '2015-09-01',
        endDate: '2019-06-01',
        gpa: 3.92
      }
    ],
    projects: [],
    certifications: [],
    resumes: [],
    applications: [
      { id: 'app-61', status: 'SHORTLISTED', job: { id: 'job-5', title: 'Distributed Systems Engineer (Go)' }, createdAt: '2026-08-26' }
    ]
  }
];

// ============================================================
// DEMO JOBS
// ============================================================
export const DEMO_JOBS: any[] = [
  {
    id: 'job-1',
    title: 'Senior Full-Stack Engineer',
    description:
      'We are looking for a Senior Full-Stack Engineer to architect and expand our talent intelligence web platform. You will lead technical design for complex candidate matching systems, implement high-performance React frontends, and collaborate on distributed backend microservices.',
    department: 'Engineering',
    location: 'San Francisco, CA (Hybrid / Remote)',
    employmentType: 'FULL_TIME',
    experienceLevel: 'SENIOR',
    salaryMin: 150000,
    salaryMax: 190000,
    status: 'PUBLISHED',
    organizationId: 'org-demo',
    createdById: 'user-admin',
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-09-01T12:00:00Z',
    _count: { applications: 42 },
    skills: [
      { id: 'js-1', skillId: 's-python', required: true, weight: 0.35, skill: { id: 's-python', name: 'Python' } },
      { id: 'js-2', skillId: 's-react', required: true, weight: 0.30, skill: { id: 's-react', name: 'React' } },
      { id: 'js-3', skillId: 's-ts', required: true, weight: 0.20, skill: { id: 's-ts', name: 'TypeScript' } },
      { id: 'js-4', skillId: 's-aws', required: false, weight: 0.10, skill: { id: 's-aws', name: 'AWS' } },
      { id: 'js-5', skillId: 's-postgres', required: false, weight: 0.05, skill: { id: 's-postgres', name: 'PostgreSQL' } }
    ]
  },
  {
    id: 'job-2',
    title: 'Lead Machine Learning Engineer',
    description:
      'Lead our AI Research and Engineering unit to advance generative ranking models, context-aware semantic search, and bias-detection pipelines for modern recruitment.',
    department: 'AI & Data Science',
    location: 'Seattle, WA (Remote Eligible)',
    employmentType: 'FULL_TIME',
    experienceLevel: 'LEAD',
    salaryMin: 175000,
    salaryMax: 225000,
    status: 'PUBLISHED',
    organizationId: 'org-demo',
    createdById: 'user-admin',
    createdAt: '2026-08-05T10:30:00Z',
    updatedAt: '2026-09-02T15:00:00Z',
    _count: { applications: 28 },
    skills: [
      { id: 'js-21', skillId: 's-python', required: true, weight: 0.35, skill: { id: 's-python', name: 'Python' } },
      { id: 'js-22', skillId: 's-pytorch', required: true, weight: 0.35, skill: { id: 's-pytorch', name: 'PyTorch' } },
      { id: 'js-23', skillId: 's-fastapi', required: true, weight: 0.15, skill: { id: 's-fastapi', name: 'FastAPI' } },
      { id: 'js-24', skillId: 's-k8s', required: false, weight: 0.15, skill: { id: 's-k8s', name: 'Kubernetes' } }
    ]
  },
  {
    id: 'job-3',
    title: 'Senior DevOps & Cloud Architect',
    description:
      'Spearhead multi-region cloud infrastructure, infrastructure-as-code automation, automated compliance, and reliability engineering across all production clusters.',
    department: 'Infrastructure',
    location: 'Austin, TX (Remote)',
    employmentType: 'FULL_TIME',
    experienceLevel: 'SENIOR',
    salaryMin: 155000,
    salaryMax: 195000,
    status: 'PUBLISHED',
    organizationId: 'org-demo',
    createdById: 'user-admin',
    createdAt: '2026-08-08T11:00:00Z',
    updatedAt: '2026-09-03T10:00:00Z',
    _count: { applications: 22 },
    skills: [
      { id: 'js-31', skillId: 's-k8s', required: true, weight: 0.40, skill: { id: 's-k8s', name: 'Kubernetes' } },
      { id: 'js-32', skillId: 's-tf', required: true, weight: 0.30, skill: { id: 's-tf', name: 'Terraform' } },
      { id: 'js-33', skillId: 's-aws', required: true, weight: 0.20, skill: { id: 's-aws', name: 'AWS' } },
      { id: 'js-34', skillId: 's-go', required: false, weight: 0.10, skill: { id: 's-go', name: 'Go (Golang)' } }
    ]
  },
  {
    id: 'job-4',
    title: 'Frontend Design Engineer',
    description:
      'Create breathtaking, performant web interfaces with fluid animations, WebGL data visualizations, and robust TypeScript component architectures.',
    department: 'Product Design',
    location: 'New York, NY (Hybrid)',
    employmentType: 'FULL_TIME',
    experienceLevel: 'SENIOR',
    salaryMin: 140000,
    salaryMax: 175000,
    status: 'PUBLISHED',
    organizationId: 'org-demo',
    createdById: 'user-admin',
    createdAt: '2026-08-10T14:00:00Z',
    updatedAt: '2026-09-04T12:00:00Z',
    _count: { applications: 35 },
    skills: [
      { id: 'js-41', skillId: 's-react', required: true, weight: 0.40, skill: { id: 's-react', name: 'React' } },
      { id: 'js-42', skillId: 's-ts', required: true, weight: 0.30, skill: { id: 's-ts', name: 'TypeScript' } },
      { id: 'js-43', skillId: 's-three', required: false, weight: 0.20, skill: { id: 's-three', name: 'Three.js / WebGL' } },
      { id: 'js-44', skillId: 's-tailwind', required: true, weight: 0.10, skill: { id: 's-tailwind', name: 'Tailwind CSS' } }
    ]
  },
  {
    id: 'job-5',
    title: 'Distributed Systems Engineer (Go)',
    description:
      'Build core distributed streaming engines and consensus services capable of handling millions of real-time talent events with microsecond precision.',
    department: 'Core Platform',
    location: 'Boston, MA (Remote)',
    employmentType: 'FULL_TIME',
    experienceLevel: 'SENIOR',
    salaryMin: 160000,
    salaryMax: 205000,
    status: 'DRAFT',
    organizationId: 'org-demo',
    createdById: 'user-admin',
    createdAt: '2026-08-15T15:00:00Z',
    updatedAt: '2026-09-04T16:00:00Z',
    _count: { applications: 14 },
    skills: [
      { id: 'js-51', skillId: 's-go', required: true, weight: 0.45, skill: { id: 's-go', name: 'Go (Golang)' } },
      { id: 'js-52', skillId: 's-kafka', required: true, weight: 0.25, skill: { id: 's-kafka', name: 'Apache Kafka' } },
      { id: 'js-53', skillId: 's-k8s', required: false, weight: 0.15, skill: { id: 's-k8s', name: 'Kubernetes' } },
      { id: 'js-54', skillId: 's-postgres', required: false, weight: 0.15, skill: { id: 's-postgres', name: 'PostgreSQL' } }
    ]
  }
];

// ============================================================
// DEMO MATCHES & RANKINGS
// ============================================================
export const DEMO_MATCH_RANKINGS: Record<string, any[]> = {
  'job-1': [
    {
      candidateId: 'cand-1',
      candidateName: 'Priya Sharma',
      overallScore: 94,
      categoryScores: { skills: 96, experience: 94, projects: 92, education: 90, semantic: 95 },
      skillScore: 96,
      experienceScore: 94,
      projectScore: 92,
      educationScore: 90,
      semanticScore: 95,
      candidate: DEMO_CANDIDATES[0]
    },
    {
      candidateId: 'cand-5',
      candidateName: 'Aisha Patel',
      overallScore: 84,
      categoryScores: { skills: 85, experience: 82, projects: 80, education: 86, semantic: 84 },
      skillScore: 85,
      experienceScore: 82,
      projectScore: 80,
      educationScore: 86,
      semanticScore: 84,
      candidate: DEMO_CANDIDATES[4]
    },
    {
      candidateId: 'cand-4',
      candidateName: 'David Kim',
      overallScore: 78,
      categoryScores: { skills: 82, experience: 75, projects: 88, education: 85, semantic: 76 },
      skillScore: 82,
      experienceScore: 75,
      projectScore: 88,
      educationScore: 85,
      semanticScore: 76,
      candidate: DEMO_CANDIDATES[3]
    },
    {
      candidateId: 'cand-6',
      candidateName: 'Lucas Silva',
      overallScore: 71,
      categoryScores: { skills: 68, experience: 74, projects: 70, education: 80, semantic: 72 },
      skillScore: 68,
      experienceScore: 74,
      projectScore: 70,
      educationScore: 80,
      semanticScore: 72,
      candidate: DEMO_CANDIDATES[5]
    }
  ],
  'job-2': [
    {
      candidateId: 'cand-2',
      candidateName: 'Marcus Chen',
      overallScore: 97,
      categoryScores: { skills: 98, experience: 96, projects: 95, education: 98, semantic: 97 },
      skillScore: 98,
      experienceScore: 96,
      projectScore: 95,
      educationScore: 98,
      semanticScore: 97,
      candidate: DEMO_CANDIDATES[1]
    },
    {
      candidateId: 'cand-1',
      candidateName: 'Priya Sharma',
      overallScore: 79,
      categoryScores: { skills: 80, experience: 82, projects: 78, education: 80, semantic: 77 },
      skillScore: 80,
      experienceScore: 82,
      projectScore: 78,
      educationScore: 80,
      semanticScore: 77,
      candidate: DEMO_CANDIDATES[0]
    }
  ],
  'job-3': [
    {
      candidateId: 'cand-3',
      candidateName: 'Elena Rostova',
      overallScore: 96,
      categoryScores: { skills: 97, experience: 96, projects: 94, education: 92, semantic: 96 },
      skillScore: 97,
      experienceScore: 96,
      projectScore: 94,
      educationScore: 92,
      semanticScore: 96,
      candidate: DEMO_CANDIDATES[2]
    }
  ],
  'job-4': [
    {
      candidateId: 'cand-4',
      candidateName: 'David Kim',
      overallScore: 98,
      categoryScores: { skills: 98, experience: 97, projects: 99, education: 96, semantic: 98 },
      skillScore: 98,
      experienceScore: 97,
      projectScore: 99,
      educationScore: 96,
      semanticScore: 98,
      candidate: DEMO_CANDIDATES[3]
    },
    {
      candidateId: 'cand-1',
      candidateName: 'Priya Sharma',
      overallScore: 85,
      categoryScores: { skills: 88, experience: 84, projects: 82, education: 86, semantic: 85 },
      skillScore: 88,
      experienceScore: 84,
      projectScore: 82,
      educationScore: 86,
      semanticScore: 85,
      candidate: DEMO_CANDIDATES[0]
    }
  ]
};

// ============================================================
// DEMO INTERVIEWS
// ============================================================
export const DEMO_INTERVIEWS = [
  {
    id: 'int-1',
    candidateId: 'cand-1',
    candidate: DEMO_CANDIDATES[0],
    jobId: 'job-1',
    job: DEMO_JOBS[0],
    type: 'TECHNICAL',
    status: 'SCHEDULED',
    scheduledAt: '2026-09-08T15:00:00Z',
    duration: 60,
    location: 'Google Meet (https://meet.google.com/xyz-demo-taliq)',
    notes: 'Focus on distributed caching, React 18 state management, and PostgreSQL sharding experience.',
    interviewerName: 'Alex Rivera (VP Engineering)'
  },
  {
    id: 'int-2',
    candidateId: 'cand-2',
    candidate: DEMO_CANDIDATES[1],
    jobId: 'job-2',
    job: DEMO_JOBS[1],
    type: 'SYSTEM_DESIGN',
    status: 'SCHEDULED',
    scheduledAt: '2026-09-09T17:30:00Z',
    duration: 75,
    location: 'Zoom (https://zoom.us/j/demo-taliq)',
    notes: 'System design for multi-tenant LLM inference gateway and GPU scheduling optimization.',
    interviewerName: 'Dr. Sarah Lin (Chief AI Scientist)'
  },
  {
    id: 'int-3',
    candidateId: 'cand-3',
    candidate: DEMO_CANDIDATES[2],
    jobId: 'job-3',
    job: DEMO_JOBS[2],
    type: 'TECHNICAL',
    status: 'COMPLETED',
    scheduledAt: '2026-09-05T14:00:00Z',
    duration: 60,
    location: 'Google Meet',
    notes: 'Exceptional answers on Terraform state locking and Kubernetes multi-cluster networking.',
    interviewerName: 'Marcus Vance (Staff SRE)'
  }
];

// ============================================================
// DEMO OBSERVABILITY DATA
// ============================================================
export const DEMO_OBSERVABILITY_DATA = {
  health: {
    status: 'healthy',
    uptime: '14 days, 6 hours',
    checks: {
      database: { status: 'healthy', latencyMs: 3.2, message: 'PostgreSQL Primary online (pool: 12/20)' },
      redis: { status: 'healthy', latencyMs: 0.8, message: 'Redis Cache cluster responsive (hit rate: 94.2%)' },
      memory: { status: 'healthy', latencyMs: 0, message: 'Heap usage within target thresholds' },
      disk: { status: 'healthy', latencyMs: 0, message: 'NVMe storage at 28% capacity' }
    }
  },
  performance: {
    totalRequests: 842910,
    errorRate: '0.04%',
    avgLatencyMs: 42,
    requestsByRoute: {
      '/api/v1/matching/rankings': { count: 32410, avgLatency: 84 },
      '/api/v1/candidates': { count: 184520, avgLatency: 28 },
      '/api/v1/jobs': { count: 98110, avgLatency: 18 },
      '/api/v1/ai/chat': { count: 42100, avgLatency: 180 },
      '/api/v1/search': { count: 88400, avgLatency: 52 }
    }
  },
  services: {
    'ai-inference-service': { status: 'healthy', count: 142000, p95Ms: 145 },
    'candidate-indexer': { status: 'healthy', count: 98200, p95Ms: 35 },
    'embedding-pipeline': { status: 'healthy', count: 64100, p95Ms: 68 }
  },
  memory: {
    heapUsedMB: 284,
    heapTotalMB: 512,
    rssMB: 610
  },
  counters: {
    'resumes.parsed': 1420,
    'matches.computed': 84120,
    'interviews.scheduled': 142
  },
  recentErrors: []
};

// ============================================================
// DEMO FAIRNESS DATA
// ============================================================
export const DEMO_FAIRNESS_DATA = {
  overallHealth: 'healthy',
  disparateImpactRatio: 0.94,
  complianceStatus: 'PASSED (Meets EEOC 4/5ths Rule)',
  metrics: {
    demographicParityScore: 96,
    featureFairnessIndex: 94,
    auditCount: 124,
    flaggedAlerts: 0
  },
  funnelDistribution: [
    { stage: 'Applied', rate: 1.0, count: 147 },
    { stage: 'Screened', rate: 0.61, count: 89 },
    { stage: 'Shortlisted', rate: 0.23, count: 34 },
    { stage: 'Interviewed', rate: 0.08, count: 12 },
    { stage: 'Offered', rate: 0.04, count: 6 }
  ],
  featureContributions: [
    { feature: 'Relevant Technical Skills', weight: 0.40, avgContribution: 38.5, flagged: false },
    { feature: 'Verified Work Experience', weight: 0.30, avgContribution: 28.2, flagged: false },
    { feature: 'Project & Open-Source Evidence', weight: 0.20, avgContribution: 18.4, flagged: false },
    { feature: 'Formal Education Level', weight: 0.10, avgContribution: 8.9, flagged: false }
  ]
};

// ============================================================
// DEMO RECRUITER COPILOT SIMULATED RESPONSES
// ============================================================
export const COPILOT_KNOWLEDGE_BASE: Record<string, { answer: string; candidates?: any[] }> = {
  candidates: {
    answer: "I found **6 high-match candidates** currently active in your recruitment pipeline. Here are the top profiles with verified production skill evidence:",
    candidates: DEMO_CANDIDATES.slice(0, 3)
  },
  python: {
    answer: "**Priya Sharma** and **Marcus Chen** are your strongest Python engineers.\n\n- **Priya Sharma** (94% Match): 8 years building distributed Python microservices and handling 2M+ daily requests.\n- **Marcus Chen** (97% Match for ML): 9 years production Python, authoring high-throughput FastAPI gateways and PyTorch inference pipelines.",
    candidates: [DEMO_CANDIDATES[0], DEMO_CANDIDATES[1]]
  },
  jobs: {
    answer: "You currently have **4 published positions** and **1 draft position** open:\n\n1. **Senior Full-Stack Engineer** (42 applications, 12 shortlisted)\n2. **Lead Machine Learning Engineer** (28 applications, 8 shortlisted)\n3. **Senior DevOps & Cloud Architect** (22 applications, 6 shortlisted)\n4. **Frontend Design Engineer** (35 applications, 7 shortlisted)\n5. **Distributed Systems Engineer (Go)** (Draft - 14 applicants ready for review)"
  },
  compare: {
    answer: "### Candidate Comparison: Priya Sharma vs. Marcus Chen\n\n| Attribute | Priya Sharma | Marcus Chen |\n|---|---|---|\n| **Primary Focus** | Full-Stack & Distributed Systems | Machine Learning & LLM Systems |\n| **Core Languages** | Python, TypeScript, React, Go | Python, C++, PyTorch, CUDA |\n| **Top Strengths** | Microservices, System Architecture, UI | Model Quantization, Vector Search, Latency |\n| **Best Fit Role** | Senior Full-Stack Engineer (94%) | Lead ML Engineer (97%) |\n\n**Recommendation:** Priya is the ideal candidate for end-to-end platform scaling, while Marcus is unbeatable for dedicated generative AI architecture.",
    candidates: [DEMO_CANDIDATES[0], DEMO_CANDIDATES[1]]
  },
  interview: {
    answer: "Here are tailored technical interview questions for **Senior Full-Stack Engineer**:\n\n1. **System Architecture**: *Describe how you would design a zero-downtime database migration for a table with 50M rows while maintaining read/write availability.* (Targets: Priya's PostgreSQL scaling background)\n2. **State & Performance**: *How do you prevent unnecessary render cascades in complex React 18 dashboards receiving high-frequency WebSocket events?*\n3. **Resilience**: *Walk us through an outage where an external payment webhook degraded, and how you architected circuit breakers to isolate failures.*"
  }
};
