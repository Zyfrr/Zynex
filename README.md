# ZyNex

ZyNex is a Next.js + TypeScript monorepo for an AI roleplay chatbot with LLM inference logging, async ingestion, and observability dashboards.

## Apps

- `apps/web`: Next.js 14 frontend using the ZyNex premium SaaS design system.
- `apps/ZyNexAPI01`: Express + TypeScript API skeleton with product-branded routes.
- `packages/shared`: shared product constants and types.
- `prisma`: PostgreSQL schema for auth, conversations, messages, inference logs, redaction events, and errors.
- `infra`: Docker Compose, ClickHouse init SQL, and K8s chart stub.
- `docs`: architecture, deployment, and submission notes.

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
pnpm exec prisma generate
pnpm dev
```

Frontend: `http://localhost:3000`

API: `http://localhost:4101/ZyNexAPI01`

Health check: `http://localhost:4101/api/v1/health/ZyNexAPI01HealthCheck`

One-command Docker stack:

```bash
docker compose -f infra/docker-compose.yml up --build
```

## Environment

Create environment files for the API and web app before running locally.

API essentials:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/zynex"
JWT_SECRET="change-me"
ZYNEX_COOKIE_DOMAIN=""
ZYNEX_COOKIE_SECURE="false"
WEB_ORIGIN="http://localhost:3000"
GROQ_API_KEY="gsk_..."
OPENROUTER_API_KEY="sk-or-v1-..."
ZYNEX_DEFAULT_PROVIDER="Groq"
ZYNEX_DEFAULT_MODEL="llama-3.3-70b-versatile"
```

Frontend essentials:

```bash
NEXT_PUBLIC_ZYNEX_API_URL="http://localhost:4101"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me"
```

## Architecture Overview

ZyNex is split into three layers:

- Chat workspace: a Next.js UI with multi-turn streaming conversations, projects, pinned chats, liked chats, deleted-chat retention, response feedback, exports, voice-to-text input, code preview, and provider selection.
- LLM wrapper SDK: provider clients for Groq, OpenRouter, OpenAI-compatible APIs, and a mock fallback. Each request captures model, provider, latency, token counts, request status, request ID, conversation ID, and input/output previews.
- Ingestion/API service: Express routes validate auth, conversation access, chat messages, analytics, and ingestion payloads, then persist normalized records through Prisma.

## Ingestion Flow

1. The user sends a message from the workspace.
2. The API stores the user message and gathers the short conversation context.
3. The LLM provider wrapper performs the model call.
4. Streaming calls emit SSE token events to the UI.
5. The assistant message is stored.
6. `InferenceLogger` records latency, token usage, provider, model, status, previews, and errors.
7. Dashboard and analytics routes read the processed records for latency, throughput, error, and provider views.

## Schema Decisions

The database keeps conversations, messages, projects, liked chats, provider keys, response feedback, inference logs, redaction events, and errors as separate tables so chat history and observability data can grow independently. Message rows are append-only for auditability. Inference logs reference conversations and messages where possible, while still allowing ingestion of standalone external SDK events.

Practical tradeoffs:

- Conversation context is intentionally short to keep token cost predictable.
- Provider keys are API-backed for the assessment workflow; production should encrypt them with a managed KMS.
- PDF export uses the browser print/save flow to avoid heavy client PDF dependencies.
- Voice input uses browser speech recognition when available, with graceful fallback messaging.

## Failure Handling

- LLM errors are captured as failed inference logs before being surfaced to the caller.
- The API returns product-coded JSON errors for auth, validation, and chat failures.
- If provider keys are absent or a provider is unavailable, the SDK can fall back to a mock provider for demo continuity.
- Expired or exhausted provider keys show a workspace toast with a link to the API Keys dashboard.
- Chat cancellation prevents new messages from being added to a cancelled conversation.
- Deleted chats remain archived for 30 days, then purge related messages, logs, redaction events, and error events.

## Scaling Notes

The current implementation is production-shaped but still compact. For higher scale, the next step would be moving inference logs through a queue, writing analytics into ClickHouse or a warehouse, adding encrypted key storage through KMS, and partitioning older inference logs.

## Completed Assessment Coverage

- Multi-turn chatbot UI with saved streaming conversations.
- Multi-provider model selection with Groq, OpenRouter, OpenAI-compatible, and mock fallback support.
- LLM SDK wrapper with metadata logging.
- Ingestion endpoint and analytics API.
- PostgreSQL schema for conversations, messages, projects, liked chats, provider keys, feedback, inference logs, redaction, and errors.
- Dashboard pages for profile, conversations, inference, providers, deleted chats, liked chats, API keys, security, sessions, and settings.
- Conversation cancel, resume/list, rename, delete, pin, like, projects, export, and response actions.
- Word/PDF/CSV/XLS export, table extraction, code syntax styling, HTML preview, browser speech-to-text input, and API key recovery flow.

## Improvements With More Time

- Add server-generated PDF/DOCX files for stricter enterprise exports.
- Add a queue-backed ingestion worker and ClickHouse dashboard queries.
- Add Playwright visual tests for the chat workspace and auth flows.
- Encrypt provider keys with managed KMS.

## Deployment

Recommended free-friendly deployment:

- Neon PostgreSQL free plan for the database.
- Render free web service for `apps/ZyNexAPI01`.
- Vercel Hobby for `apps/web`.
- GitHub Actions for API build, Prisma migrations, and Render deploy trigger.

Guide: `docs/deployment/free-neon-render-cicd.md`

AWS ECS Express Mode notes are kept in `docs/deployment/aws-backend-cicd.md` for a later production upgrade path.

Architecture notes: `docs/ARCHITECTURE.md`

Submission checklist: `docs/SUBMISSION.md`
