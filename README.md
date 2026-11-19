# TalentIQ — AI Recruitment Intelligence Platform

> An AI-powered recruitment intelligence platform with semantic candidate matching, explainable AI recommendations, fairness monitoring, resume parsing, and advanced analytics.

## Features

- **Jobs** — create, edit, publish, archive, duplicate, and analyze job descriptions
- **Candidates** — searchable profiles with skills, experience, education, projects, and certifications
- **Resume parsing** — upload PDF/DOCX resumes; the AI service extracts contact info, sections, skills, and entities
- **Matching** — score candidates against jobs with evidence-backed, explainable rankings
- **Skill gap analysis** — per-candidate gaps and generated learning plans
- **AI Copilot** — conversational assistant over your recruitment data
- **Fairness** — fairness dashboard, bias tests, and per-match explanations
- **Interviews** — scheduling, status tracking, feedback, generated questions, and summaries
- **Search** — global search, suggestions, and saved searches
- **Analytics & observability** — hiring dashboards, CSV export, service health, and logs
- **Admin** — audit logs, notifications, settings, and role-based access control
- **Demo mode** — the frontend falls back to built-in demo data when the API is unreachable

## Architecture

```
talentiq/
├── apps/
│   ├── web/                  # React + Vite + TypeScript frontend
│   │   └── src/
│   │       ├── app/          # Router
│   │       ├── components/   # UI primitives, layout, shared, and feature components
│   │       ├── lib/          # API client, auth, animations, demo data
│   │       ├── pages/        # Route pages (dashboard, jobs, candidates, ...)
│   │       ├── styles/       # Global CSS
│   │       └── types/        # TypeScript types
│   ├── api/                  # Express + Prisma + TypeScript backend
│   │   ├── src/
│   │   │   ├── __tests__/    # Unit, integration, and security tests
│   │   │   ├── config/       # Database, Redis, environment
│   │   │   ├── controllers/  # Request handlers
│   │   │   ├── middleware/   # Auth, audit, rate limiting, security, validation
│   │   │   ├── routes/v1/    # API route definitions
│   │   │   ├── services/     # Business logic (matching, AI, fairness, ...)
│   │   │   ├── validators/   # Zod request schemas
│   │   │   └── utils/        # Logger, errors, JWT, RBAC, passwords
│   │   └── prisma/
│   │       ├── schema.prisma # Database schema (34 models)
│   │       ├── seed.ts       # Demo data seed
│   │       └── seed-demo.ts  # Extended demo seed
│   └── ai/                   # Python FastAPI resume intelligence service
│       ├── main.py           # Endpoints: /parse, /parse-file, /embedding, /health
│       ├── services/         # Text, section, entity, and skill extraction; embeddings
│       └── schemas/          # Pydantic models
├── packages/                 # Shared workspace packages (@taliq/types, @taliq/ui, @taliq/config)
├── docker/                   # Dockerfiles for api and web
├── docker-compose.yml        # Local Postgres (pgvector), Redis, API, and web
├── render.yaml               # Render blueprint for the API
├── vercel.json               # Vercel config for the frontend
└── build.cjs                 # Frontend build script used by Vercel
```

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI / shadcn-style components, Framer Motion, Three.js (React Three Fiber), TanStack Query, Recharts, React Router, React Hook Form + Zod, Axios, Sonner, cmdk |
| Backend | Node.js 20, TypeScript, Express, Prisma, PostgreSQL (pgvector), Redis (ioredis), JWT, bcrypt, Zod, Pino, Helmet, Multer, pdf-parse, Mammoth |
| AI service | Python, FastAPI, Uvicorn, Pydantic, PyPDF2, python-docx, pytesseract |
| Tooling | pnpm workspaces, Docker / docker-compose, Vitest, ESLint, Prettier |

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 10+ (`corepack enable`)
- Docker & Docker Compose (for Postgres and Redis)
- Python 3.10+ (only if you want resume parsing via the AI service)

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
pnpm db:migrate
pnpm db:seed        # or: pnpm --filter api db:seed:demo
```

### 5. Start development servers
```bash
pnpm dev
```

This starts:
- API server at `http://localhost:3001` (health check: `/api/health`)
- Frontend at `http://localhost:5173` (Vite proxies `/api` to the API)

### 6. (Optional) Start the AI service
```bash
cd apps/ai
pip install -r requirements.txt
python main.py      # http://localhost:3002
```

The API calls it through `AI_SERVICE_URL` (default `http://localhost:3002`) for resume parsing.

### Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@techvista.io | password123 |
| Recruiter | recruiter@techvista.io | password123 |
| Hiring Manager | hiring@techvista.io | password123 |

The login page also has one-click **demo login** buttons (admin / recruiter) that work without a backend.

## Environment Variables

See `.env.example` for the full list. Main variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Token signing secrets (32+ characters) |
| `CORS_ORIGIN` | Allowed frontend origin |
| `OPENAI_API_KEY` | Optional; leave empty for offline AI mode |
| `AI_SERVICE_URL`, `AI_SERVICE_API_KEY` | Location and key of the Python AI service |
| `VITE_API_URL` | API base URL baked into the frontend build (full `/api/v1` URL or bare origin) |

## API Documentation

Base URL: `http://localhost:3001/api/v1`. All routes except auth and health require a `Bearer` access token.

### Health
```
GET  /api/health                 - Basic health check
GET  /api/health/detailed        - Detailed dependency health
GET  /api/health/readiness       - Readiness probe
GET  /api/health/liveness        - Liveness probe
```

### Auth — `/auth`
```
POST /register                   - Register new user
POST /login                      - Login
POST /refresh                    - Refresh access token
POST /logout                     - Logout
GET  /me                         - Current user
POST /forgot-password            - Request password reset
POST /reset-password             - Reset password
POST /verify-email               - Verify email
POST /resend-verification        - Resend verification email
```

### Jobs — `/jobs`
```
GET    /                         - List jobs (paginated, filterable)
GET    /stats                    - Job statistics
GET    /:id                      - Get job
POST   /                         - Create job
PUT    /:id                      - Update job
DELETE /:id                      - Delete job (soft)
POST   /:id/publish              - Publish job
POST   /:id/archive              - Archive job
POST   /:id/duplicate            - Duplicate job
POST   /analyze                  - Analyze a job description
```

### Candidates — `/candidates`
```
GET    /                         - List candidates (paginated, searchable)
GET    /stats                    - Candidate statistics
GET    /:id                      - Get candidate with full profile
POST   /                         - Create candidate
PUT    /:id                      - Update candidate
DELETE /:id                      - Delete candidate (soft)
```

### Other modules
| Prefix | Endpoints |
|--------|-----------|
| `/resumes` | `POST /upload`, `GET /`, `GET /:id/status`, `POST /:id/retry` |
| `/skills` | `GET /`, `GET /:id`, `GET /categories`, `GET /analytics`, `GET /graph`, `GET /resolve` |
| `/matching` | `POST /calculate/:candidateId/:jobId`, `POST /job/:jobId/run`, `GET /rankings`, `GET /detail/:candidateId/:jobId`, `GET /stats/:jobId` |
| `/search` | `GET /`, `GET /suggestions`, `GET /saved`, `POST /saved`, `DELETE /saved/:id` |
| `/ai` | `POST /chat`, `GET /conversations`, `GET /conversations/:id`, `DELETE /conversations/:id` |
| `/skill-gap` | `GET /candidate/:candidateId`, `GET /candidate/:candidateId/job/:jobId`, `POST /candidate/:candidateId/job/:jobId/plan`, `GET /candidate/:candidateId/plans`, `GET /summary` |
| `/fairness` | `GET /dashboard`, `GET /explain/:candidateId/:jobId`, `POST /tests` |
| `/interviews` | `GET /`, `GET /:id`, `POST /`, `PATCH /:id/status`, `POST /feedback`, `POST /:interviewId/questions`, `GET /:interviewId/summary` |
| `/analytics` | `GET /dashboard`, `GET /export` |
| `/observability` | `GET /dashboard`, `GET /service-health`, `GET /logs` |

## Database Schema

34 Prisma models:
- **Auth**: User, RoleModel, Permission, RefreshToken, PasswordResetToken, EmailVerificationToken
- **Organization**: Organization
- **Jobs**: Job, JobSkill
- **Candidates**: Candidate, Resume, CandidateSkill, CandidateExperience, CandidateEducation, CandidateProject, Certification
- **Skills**: Skill, SkillCategory, SkillRelation, SkillAlias
- **Matching**: Application, CandidateMatch, MatchEvidence
- **Interviews**: Interview, InterviewFeedback
- **Pipeline**: RecruitmentStage, RecruitmentEvent
- **AI**: SkillGap, LearningPlan, AIConversation, AIMessage
- **Fairness**: FairnessAudit
- **System**: AuditLog, Notification

## Security Features

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Rate limiting on `/api/v1`
- Input validation (Zod) and input sanitization
- Security headers (Helmet) and CORS configuration
- SQL injection prevention (Prisma ORM)
- Secure password hashing (bcrypt, 12 rounds)
- Correlation IDs, request timing, and audit logging
- Soft deletion

## Development Commands

```bash
pnpm dev                          # Start API and web together
pnpm build                        # Build the frontend (build.cjs)
pnpm typecheck                    # Type check all packages
pnpm lint                         # Lint all packages
pnpm format                       # Format with Prettier
pnpm test                         # Run all tests (Vitest)
pnpm db:migrate                   # Run database migrations
pnpm db:seed                      # Seed database with demo data
pnpm db:reset                     # Reset and reseed database
pnpm --filter api db:push         # Push schema without migrations
pnpm --filter api db:seed:demo    # Seed extended demo data
```

## Production Deployment

The app is split across two hosts:

- **Vercel** serves the React frontend (static build of `apps/web/dist`).
- **Render** runs the Express API (`apps/api`) as a Node process, connected to a hosted PostgreSQL database.
- `apps/web/src/lib/api.ts` calls whatever `VITE_API_URL` points to. A bare origin (e.g. `https://my-api.onrender.com`) gets `/api/v1` appended automatically. Without it, the client uses the same-origin path `/api/v1`.
- When the API is unreachable (e.g. during a Render cold start), the frontend falls back to built-in demo data.

### 1. Database (e.g. Neon)

Create a hosted PostgreSQL (Neon or Supabase) and copy its connection string. Paste it into Render; never commit real secrets.

### 2. API on Render

1. In Render choose **New → Blueprint** and select this repo — `render.yaml` creates the `talentiq-api` service.
2. In the service's **Environment** tab set the blank variables:

   | Variable | Example |
   |----------|---------|
   | `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` |
   | `JWT_SECRET` | random string of 32+ characters |
   | `JWT_REFRESH_SECRET` | a different random string of 32+ characters |
   | `CORS_ORIGIN` | `https://<your-app>.vercel.app` |
   | `OPENAI_API_KEY` | optional — leave empty for offline AI mode |
   | `REDIS_URL` | optional |

3. Create the schema and seed demo data **once** against the hosted database:

   ```bash
   DATABASE_URL="<your-db-url>" pnpm --filter api db:push
   DATABASE_URL="<your-db-url>" pnpm --filter api db:seed
   ```

   The seed script wipes and recreates data, so run it once, not on every deploy.

> Free Render instances sleep after ~15 minutes of inactivity; the first request after idle takes a few seconds.

### 3. Frontend on Vercel

1. Set `VITE_API_URL` (in `vercel.json` or the Vercel project's Production env vars) to your API, e.g. `https://<your-api>.onrender.com`.
2. Redeploy so Vite bakes the URL into the bundle, then sign in with a demo account, e.g. `admin@techvista.io` / `password123`.

## License

Proprietary — TalentIQ © 2024
