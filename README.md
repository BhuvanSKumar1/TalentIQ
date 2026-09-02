# TalentIQ — AI Recruitment Intelligence Platform

> An enterprise-grade AI-powered recruitment intelligence platform featuring semantic candidate matching, explainable AI recommendations, fairness monitoring, and advanced analytics.

## Architecture

```
talentiq/
├── apps/
│   ├── web/                  # React + Vite + TypeScript frontend
│   │   ├── src/
│   │   │   ├── app/          # Router, providers
│   │   │   ├── components/   # Reusable UI components (shadcn/ui)
│   │   │   ├── features/     # Feature modules (auth, dashboard, jobs, etc.)
│   │   │   ├── layouts/      # App layouts
│   │   │   ├── pages/        # Page components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── lib/          # Utilities, API client, auth
│   │   │   ├── services/     # API service layer
│   │   │   ├── types/        # TypeScript types
│   │   │   └── styles/       # Global CSS, Tailwind config
│   │   └── ...
│   └── api/                  # Express + Prisma + TypeScript backend
│       ├── src/
│       │   ├── config/       # Database, Redis, environment
│       │   ├── controllers/  # Request handlers
│       │   ├── middleware/    # Auth, RBAC, validation, rate limiting
│       │   ├── routes/       # API route definitions (v1)
│       │   ├── services/     # Business logic layer
│       │   ├── validators/   # Zod request schemas
│       │   └── utils/        # Logger, errors, JWT, password
│       ├── prisma/
│       │   ├── schema.prisma # Database schema (28+ models)
│       │   └── seed.ts       # Seed script with demo data
│       └── ...
├── docker/                   # Dockerfiles
├── docker-compose.yml        # Development environment
└── README.md
```

## Tech Stack

### Frontend
- **React 18** + TypeScript + Vite
- **Tailwind CSS** with custom design system
- **shadcn/ui** component primitives
- **Framer Motion** animations
- **TanStack Query** data fetching
- **Recharts** visualizations
- **React Router** routing
- **React Hook Form** + **Zod** validation
- **Axios** HTTP client

### Backend
- **Node.js 20** + TypeScript
- **Express** HTTP server
- **Prisma** ORM
- **PostgreSQL** (with pgvector)
- **Redis** caching
- **JWT** authentication
- **bcrypt** password hashing
- **Zod** validation
- **Pino** structured logging

### Infrastructure
- **Docker** + **docker-compose**
- **pnpm** workspaces (monorepo)

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker & Docker Compose (for database)

### 1. Start databases
```bash
docker-compose up -d postgres redis
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Set up environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Run migrations and seed
```bash
pnpm --filter api db:migrate
pnpm --filter api db:seed
```

### 5. Start development servers
```bash
pnpm dev
```

This starts:
- API server at `http://localhost:3001`
- Frontend at `http://localhost:5173`

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@techvista.io | password123 |
| Recruiter | recruiter@techvista.io | password123 |
| Hiring Manager | hiring@techvista.io | password123 |

## API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication
```
POST /auth/register    - Register new user
POST /auth/login       - Login
POST /auth/refresh     - Refresh access token
POST /auth/logout      - Logout
GET  /auth/me          - Get current user
```

### Jobs
```
GET    /jobs           - List jobs (paginated, filterable)
GET    /jobs/stats     - Job statistics
GET    /jobs/:id       - Get job by ID
POST   /jobs           - Create job
PUT    /jobs/:id       - Update job
DELETE /jobs/:id       - Delete job (soft)
```

### Candidates
```
GET    /candidates     - List candidates (paginated, searchable)
GET    /candidates/stats - Candidate statistics
GET    /candidates/:id - Get candidate with full profile
POST   /candidates     - Create candidate
PUT    /candidates/:id - Update candidate
DELETE /candidates/:id - Delete candidate (soft)
```

## Database Schema

28+ models including:
- **Auth**: User, Role, Permission, RefreshToken
- **Organization**: Organization
- **Jobs**: Job, JobSkill
- **Candidates**: Candidate, Resume, CandidateSkill, CandidateExperience, CandidateEducation, CandidateProject, Certification
- **Skills**: Skill, SkillCategory, SkillRelation
- **Matching**: Application, CandidateMatch, MatchEvidence
- **Interviews**: Interview, InterviewFeedback
- **Pipeline**: RecruitmentStage, RecruitmentEvent
- **AI**: SkillGap, LearningPlan, AIConversation, AIMessage
- **Fairness**: FairnessAudit
- **System**: AuditLog, Notification

## Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting
- Input validation (Zod)
- SQL injection prevention (Prisma ORM)
- XSS protection (Helmet)
- CORS configuration
- Secure password hashing (bcrypt, 12 rounds)
- Audit logging
- Soft deletion

## Development Commands

```bash
pnpm dev              # Start all services
pnpm build            # Build all packages
pnpm typecheck        # Type check all packages
pnpm lint             # Lint all packages
pnpm test             # Run all tests
pnpm db:migrate       # Run database migrations
pnpm db:seed          # Seed database with demo data
pnpm db:reset         # Reset and reseed database
```

## License

Proprietary — TalentIQ © 2024
