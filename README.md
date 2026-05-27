# ZyNex

ZyNex is a full-stack LLM chatbot and inference observability project built for the Ollive AI assessment. It combines a ChatGPT-style workspace, multi-provider model calls, a lightweight inference logging wrapper, an ingestion API, PostgreSQL persistence, analytics dashboards, Docker setup, and Kubernetes deployment support.

Live demo: https://zynex.zyfrr.com

Kubernetes validation branch: `k8s-local-setup`

## Assessment Requirement

The company asked for a lightweight inference logging and ingestion system for an LLM application:

- A chatbot application using a foundation model API.
- Multi-turn conversations with short context.
- A simple UI.
- A lightweight SDK, middleware, or wrapper around LLM calls.
- Inference metadata capture: model, provider, latency, token usage, timestamps, status/errors, conversation/session ID, and input/output previews.
- Near-real-time log ingestion endpoint.
- Validation, parsing, metadata extraction, and database storage.
- Storage for chat messages, inference logs, and extracted metadata.
- README, architecture notes, setup instructions, schema decisions, tradeoffs, and demo.

Bonus items included multi-provider support, streaming responses, latency/throughput/error dashboards, Docker Compose, event-based architecture, PII redaction, Kubernetes deployment support, and frontend features for cancel/list/resume conversations.

## What We Built

ZyNex implements the required product as a practical monorepo:

- Next.js chatbot workspace with saved multi-turn conversations.
- Express API with product-branded routes under `ZyNexAPI01`.
- Groq, OpenRouter, OpenAI-compatible, and mock fallback provider support.
- Streaming chat responses through Server-Sent Events.
- Inference logging wrapper that captures provider, model, latency, token usage, status, errors, request ID, conversation ID, timestamps, and previews.
- Ingestion API for structured inference logs.
- PostgreSQL schema through Prisma for auth, sessions, projects, conversations, messages, inference logs, redaction events, errors, provider keys, liked chats, deleted chats, and feedback.
- Dashboard pages for profile, conversations, inference logs, providers, deleted chats, liked chats, API keys, security, sessions, and settings.
- ChatGPT-like UI actions: copy, regenerate, edit, export, like/dislike, share, delete, pin, rename, cancel, resume, list conversations, and project grouping.
- Export support for Word/PDF-style documents, CSV/XLS-style tables, copyable code blocks, and HTML preview.
- Browser speech-to-text input with recording state and graceful fallback.
- Docker Compose local stack.
- Kubernetes Helm chart for web/API/Redis deployment.

## Deployment Status

ZyNex has two deployment stories, both documented honestly:

- Public demo: https://zynex.zyfrr.com
- Kubernetes support: implemented on the `k8s-local-setup` branch through Dockerfiles and the `infra/k8s` Helm chart.
- Local Kubernetes validation: completed on Docker Desktop Kubernetes using `zynex-web`, `zynex-api`, Redis, auth cookies, console OTP delivery, conversations/projects API calls, and streaming chat SSE.

The public demo is kept outside Kubernetes so reviewers have an always-available URL. The Kubernetes chart is ready for a self-hosted k3s/VPS deployment when a production server is available.

## Repository Structure

- `apps/web`: Next.js 14 frontend workspace and dashboard.
- `apps/ZyNexAPI01`: Express + TypeScript API.
- `packages/shared`: shared constants and types.
- `prisma`: PostgreSQL schema and generated Prisma client.
- `infra/docker-compose.yml`: one-command local supporting stack.
- `infra/k8s`: Helm chart for Kubernetes deployment on the `k8s-local-setup` branch.
- `docs/ARCHITECTURE.md`: detailed architecture notes and diagrams.
- `docs/SUBMISSION.md`: assessment demo checklist and submission notes.
- `docs/deployment`: deployment guides.

## System Architecture

```mermaid
flowchart TB
  User["User / Reviewer"] --> Web["Next.js Web App\nChat Workspace + Dashboard"]
  Web -->|REST API| API["ZyNexAPI01 Express API"]
  Web -->|SSE Streaming| Stream["MessagesStream Endpoint"]
  Stream --> API

  API --> Auth["Auth + Sessions"]
  API --> Chat["Conversations + Messages"]
  API --> Projects["Projects, Pins, Likes,\nDeleted Chat Retention"]
  API --> Wrapper["LLM Wrapper SDK"]
  API --> Ingestion["Inference Ingestion API"]
  API --> Analytics["Analytics APIs\nLatency, Throughput, Errors"]

  Wrapper --> Groq["Groq"]
  Wrapper --> OpenRouter["OpenRouter"]
  Wrapper --> OpenAI["OpenAI-Compatible"]
  Wrapper --> Mock["Mock Fallback"]

  Auth --> DB["PostgreSQL via Prisma"]
  Chat --> DB
  Projects --> DB
  Ingestion --> DB
  Analytics --> DB
```

## Ingestion And Logging Flow

```mermaid
sequenceDiagram
  participant U as User
  participant W as Web Workspace
  participant A as API
  participant L as LLM Wrapper
  participant P as Provider
  participant D as PostgreSQL
  participant X as Dashboard

  U->>W: Send prompt
  W->>A: POST MessagesStream
  A->>D: Store user message
  A->>D: Load short conversation context
  A->>L: Call model with metadata envelope
  L->>P: Provider request
  P-->>L: Tokens / final response
  L-->>A: Normalized response + usage + timing
  A-->>W: SSE token events
  A->>D: Store assistant message
  A->>D: Store inference log and extracted metadata
  X->>A: Fetch analytics
  A->>D: Query logs, errors, providers, latency
  A-->>X: Dashboard data
```

## Kubernetes Deployment Shape

```mermaid
flowchart LR
  Browser["Browser"] --> Ingress["Ingress\nzynex.zyfrr.com\napi.zynex.zyfrr.com"]
  Ingress --> WebSvc["zynex-web Service"]
  Ingress --> ApiSvc["zynex-api Service"]
  WebSvc --> WebPod["Next.js Pod"]
  ApiSvc --> ApiPod["Express API Pod"]
  ApiPod --> Redis["Redis StatefulSet"]
  ApiPod --> DB["Managed PostgreSQL"]
  ApiPod --> Providers["Groq / OpenRouter"]
```

For local Kubernetes validation, ingress was disabled and the services were tested through port-forwarding:

```txt
http://localhost:3000  -> zynex-web service
http://localhost:4101  -> zynex-api service
```

The successful smoke test included:

```txt
POST /api/v1/chat/ZyNexAPI01ChatConversations/:id/MessagesStream
Status: 200
Content-Type: text/event-stream
```

## API Naming

Product route pattern:

```txt
/api/v1/<module>/ZyNexAPI01<Module><Action>
```

Examples:

- `/api/v1/health/ZyNexAPI01HealthCheck`
- `/api/v1/auth/ZyNexAPI01AuthEmailStart`
- `/api/v1/auth/ZyNexAPI01AuthEmailVerify`
- `/api/v1/auth/ZyNexAPI01AuthMe`
- `/api/v1/conversations/ZyNexAPI01ConversationsList`
- `/api/v1/conversations/ZyNexAPI01Projects`
- `/api/v1/chat/ZyNexAPI01ChatConversations/:ConversationId/MessagesStream`
- `/api/v1/ingestion/ZyNexAPI01IngestionLogs`
- `/api/v1/analytics/ZyNexAPI01AnalyticsOverview`

## Local Development

Install dependencies:

```bash
pnpm install
pnpm exec prisma generate
pnpm dev
```

Frontend:

```txt
http://localhost:3000
```

API health check:

```txt
http://localhost:4101/api/v1/health/ZyNexAPI01HealthCheck
```

One-command Docker stack:

```bash
docker compose -f infra/docker-compose.yml up --build
```

## Environment

API essentials:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/zynex"
ZYNEX_JWT_SECRET="change-me"
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

## Kubernetes Local Validation

Build and deploy using the Helm chart:

```bash
docker build -f Dockerfile.api -t ghcr.io/sarankumarsankar12/zynex-api:latest .
docker build -f Dockerfile.web \
  --build-arg NEXT_PUBLIC_ZYNEX_API_URL=http://localhost:4101 \
  --build-arg NEXTAUTH_URL=http://localhost:3000 \
  -t ghcr.io/sarankumarsankar12/zynex-web:local .
```

Deploy to Docker Desktop Kubernetes:

```bash
helm upgrade --install zynex ./infra/k8s \
  --namespace zynex \
  --create-namespace \
  -f infra/k8s/values.prod.yaml \
  --set ingress.enabled=false \
  --set api.env.WEB_ORIGIN=http://localhost:3000 \
  --set web.env.NEXT_PUBLIC_ZYNEX_API_URL=http://localhost:4101 \
  --set web.env.NEXTAUTH_URL=http://localhost:3000 \
  --set api.env.ZYNEX_COOKIE_DOMAIN="" \
  --set api.env.ZYNEX_COOKIE_SECURE=false
```

Port-forward:

```bash
kubectl port-forward -n zynex svc/zynex-web 3000:3000
kubectl port-forward -n zynex svc/zynex-api 4101:4101
```

Verify:

```bash
kubectl get pods -n zynex
kubectl get svc -n zynex
kubectl logs -n zynex deployment/zynex-api --tail=80
```

## Schema Decisions

The schema separates user-facing chat state from observability data:

- Conversations and messages store the user-visible chat history.
- Projects group conversations.
- Pinned, liked, deleted, and feedback records support dashboard workflows.
- Inference logs store provider/model metadata, latency, usage, status, previews, and request identifiers.
- Redaction and error events are separate so compliance and failure analytics can evolve independently.
- Provider keys are API-backed for the assessment; production should encrypt them with KMS or an external secret manager.

This design keeps chat history stable while allowing inference analytics to scale separately.

## Failure Handling

- Provider errors are captured as failed inference logs.
- Missing or exhausted API keys surface as workspace toasts with a link to the API Keys dashboard.
- The mock provider keeps demos usable when external providers fail.
- Deleted chats remain recoverable for 30 days before purge.
- Chat cancellation blocks new messages from being added to cancelled conversations.
- Local Kubernetes OTP delivery falls back to console logs when SMTP is not configured.

## Scaling Considerations

- Move inference logs into a queue when write volume grows.
- Use ClickHouse or a warehouse for high-cardinality analytics.
- Keep PostgreSQL as the source of truth for auth and chat state.
- Add HPA and metrics-server for Kubernetes autoscaling.
- Move migrations to a Kubernetes Job for multi-replica API deployments.
- Encrypt provider keys with managed KMS.
- Add server-side DOCX/PDF generation for stricter enterprise exports.

## Tradeoffs

- Public demo is hosted on the current live deployment so reviewers always have access.
- Kubernetes was validated locally because free production VPS options either require payment details or introduce billing risk.
- Browser speech recognition avoids adding a paid speech API dependency.
- Browser print/save PDF export keeps the app lightweight.
- Short context windows control token cost and latency.

## Assessment Coverage

- Chatbot application: complete.
- Multi-turn context: complete.
- Simple UI: complete, with expanded ChatGPT-like workspace.
- LLM SDK/wrapper: complete.
- Inference metadata capture: complete.
- Ingestion endpoint: complete.
- Database storage: complete.
- README and architecture notes: complete.
- Demo link: complete.
- Multi-provider support: complete.
- Streaming responses: complete.
- Latency, throughput, and errors dashboards: complete.
- Docker Compose: complete.
- Kubernetes support: implemented and locally validated.
- PII redaction/event tracking: implemented.
- Cancel/list/resume conversations: complete.

## More Time Improvements

- Deploy the Helm chart to a paid/self-hosted k3s VPS with public ingress and TLS.
- Add queue-backed ingestion workers.
- Add Playwright visual tests for mobile and desktop workflows.
- Add KMS-backed provider key encryption.
- Add generated PDF/DOCX exports on the server.

## Key Docs

- Architecture: `docs/ARCHITECTURE.md`
- Submission notes: `docs/SUBMISSION.md`
- Kubernetes guide: `docs/deployment/kubernetes.md` on the `k8s-local-setup` branch.
- Free-friendly deployment guide: `docs/deployment/free-neon-render-cicd.md`
- AWS notes: `docs/deployment/aws-backend-cicd.md`
