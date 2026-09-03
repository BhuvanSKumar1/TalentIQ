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

## Deploying to Vercel (Frontend + API)

The Vercel project serves the React frontend **and** the Express API from the
same domain:

- `build.cjs` runs `prisma generate`, compiles the API (`apps/api/dist`), then
  builds the web frontend (`apps/web/dist`).
- The serverless function in `api/[...path].js` mounts the compiled Express app,
  so every `/api/*` request is handled by the API on the same domain
  (e.g. `https://<your-app>.vercel.app/api/v1/auth/login`). No CORS needed.
- `apps/web/src/lib/api.ts` defaults to the same-origin path `/api/v1`, so login
  and all API calls work without a `VITE_API_URL`.

### Before your first deploy

1. **Create a hosted PostgreSQL database** (free tier is fine, e.g. Neon or
   Supabase) and copy its connection string.

2. **Add these env vars to your Vercel project** (Project → Settings →
   Environment Variables → Production):

   | Variable | Example |
   |----------|---------|
   | `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` (Neon URL) |
   | `JWT_SECRET` | random string of 32+ characters |
   | `JWT_REFRESH_SECRET` | a different random string of 32+ characters |
   | `CORS_ORIGIN` | `https://<your-app>.vercel.app` |

3. **Create the schema and seed the demo data** (run once from this repo,
   pointing at the hosted database):

   ```bash
   DATABASE_URL="<your-neon-url>" pnpm --filter api db:push
   DATABASE_URL="<your-neon-url>" pnpm --filter api db:seed
   ```

4. **Commit and push** to redeploy. The build generates the Prisma client,
   compiles the API, builds the frontend, and Vercel serves both from one URL.

> Note: the seed script wipes and recreates data, so run it once against the
> hosted database — not on every deploy.

## License

Proprietary — TalentIQ © 2024
