# ZyNex

ZyNex is a Next.js + TypeScript monorepo for an AI roleplay chatbot with LLM inference logging, async ingestion, and observability dashboards.

## Apps

- `apps/web`: Next.js 14 frontend using the ZyNex premium SaaS design system.
- `apps/ZyNexAPI01`: Express + TypeScript API skeleton with product-branded routes.
- `packages/shared`: shared product constants and types.
- `prisma`: PostgreSQL schema for auth, conversations, messages, inference logs, redaction events, and errors.
- `infra`: Docker Compose, ClickHouse init SQL, and K8s chart stub.

## API Naming

Product route prefix: `/ZyNexAPI01`

Examples:

- `/ZyNexAPI01/Auth/Register`
- `/ZyNexAPI01/Auth/Login`
- `/ZyNexAPI01/Conversations/List`
- `/ZyNexAPI01/Chat/Conversations/:ConversationId/Messages`
- `/ZyNexAPI01/Ingestion/Logs`
- `/ZyNexAPI01/Analytics/Overview`

## Local Development

```bash
pnpm install
pnpm dev
```

Frontend: `http://localhost:3000`

API: `http://localhost:4101/ZyNexAPI01`
