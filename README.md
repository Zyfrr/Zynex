# ZyNex

ZyNex is a Next.js + TypeScript monorepo for an AI roleplay chatbot with LLM inference logging, async ingestion, and observability dashboards.

## Apps

- `apps/web`: Next.js 14 frontend using the ZyNex premium SaaS design system.
- `apps/ZyNexAPI01`: Express + TypeScript API skeleton with product-branded routes.
- `packages/shared`: shared product constants and types.
- `prisma`: PostgreSQL schema for auth, conversations, messages, inference logs, redaction events, and errors.
- `infra`: Docker Compose, ClickHouse init SQL, and K8s chart stub.

## API Naming

Product route pattern: `/api/v1/<module>/ZyNexAPI01<Module><Action>`

Examples:

- `/api/v1/auth/ZyNexAPI01AuthLogin`
- `/api/v1/auth/ZyNexAPI01AuthEmailStart`
- `/api/v1/auth/ZyNexAPI01AuthPhoneStart`
- `/api/v1/conversations/ZyNexAPI01ConversationsList`
- `/api/v1/chat/ZyNexAPI01ChatConversations/:ConversationId/Messages`
- `/api/v1/ingestion/ZyNexAPI01IngestionLogs`
- `/api/v1/analytics/ZyNexAPI01AnalyticsOverview`

## Local Development

```bash
pnpm install
pnpm dev
```

Frontend: `http://localhost:3000`

API: `http://localhost:4101/ZyNexAPI01`

Health check: `http://localhost:4101/api/v1/health/ZyNexAPI01HealthCheck`

## Deployment

Recommended free-friendly deployment:

- Neon PostgreSQL free plan for the database.
- Render free web service for `apps/ZyNexAPI01`.
- Vercel Hobby for `apps/web`.
- GitHub Actions for API build, Prisma migrations, and Render deploy trigger.

Guide: `docs/deployment/free-neon-render-cicd.md`

AWS ECS Express Mode notes are kept in `docs/deployment/aws-backend-cicd.md` for a later production upgrade path.
