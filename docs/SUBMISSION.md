# ZyNex Submission Notes

## Repository

Submit the GitHub repository containing this monorepo.

Suggested branch for Kubernetes review:

```txt
k8s-local-setup
```

This branch contains the Kubernetes Helm chart, Dockerfile updates, and documentation for local Kubernetes validation.

## Demo Routes

- Workspace: `/workspace`
- Dashboard overview: `/dashboard?zx=overview`
- Inference logs: `/dashboard?zx=inference-logs`
- Providers: `/dashboard?zx=providers`
- Deleted chats: `/dashboard?zx=deleted-chats`
- Liked chats: `/dashboard?zx=liked-chats`
- API keys: `/dashboard?zx=api-keys`

## What To Show In Demo

1. Log in or sign up.
2. Start a new chat and show streaming tokens.
3. Open provider/model controls and send a Groq or OpenRouter prompt.
4. Show inference metadata in the dashboard.
5. Like a response and show it in Liked Chats.
6. Delete a chat and show the 30-day retention page.
7. Open API Keys and explain expired-key recovery.
8. Export a response as Word/PDF/CSV/XLS.
9. Show an HTML response preview in the workspace.
10. Use the mic button and show speech text inserted into the prompt.

## Build Verification

Last verified commands:

```bash
pnpm exec prisma generate
pnpm -r --filter ./apps/* run build
```

Kubernetes validation completed on Docker Desktop Kubernetes:

- `zynex-web` pod running and reachable through `kubectl port-forward`
- `zynex-api` pod running and health check passing
- Redis StatefulSet running
- Login OTP delivered through console mode
- Auth cookies set correctly for `localhost`
- Conversations and projects loaded from the API
- Chat endpoint reached successfully through Kubernetes:

```txt
POST /api/v1/chat/ZyNexAPI01ChatConversations/:id/MessagesStream
Status: 200
Content-Type: text/event-stream
```

## One-Command Local Stack

```bash
docker compose -f infra/docker-compose.yml up --build
```

Then open:

- Web: `http://localhost:3000`
- API health: `http://localhost:4101/api/v1/health/ZyNexAPI01HealthCheck`

## Email

Send to `work@ollive.ai`:

- GitHub repo link
- Architecture notes link: `docs/ARCHITECTURE.md`
- Demo link or Loom video
- Optional screenshots from the workspace and dashboard

Suggested Kubernetes note:

```txt
The live demo is hosted on the public ZyNex deployment for stable review. Kubernetes support is included through Dockerfiles and a Helm chart under infra/k8s, and the deployment was validated locally on Docker Desktop Kubernetes. The same chart can be deployed to self-hosted k3s by switching kubeconfig, setting production secrets, and enabling ingress/TLS.
```
