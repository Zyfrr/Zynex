# ZyNex Free Deployment Guide: Neon + Render + Vercel + GitHub Actions

This is the recommended low-cost assignment deployment path.

```txt
GitHub -> GitHub Actions -> Neon PostgreSQL migrations -> Render API deploy
                                                       -> Vercel web deploy
```

Use this when you want a public demo without AWS RDS or ECS billing.

## Services

| Layer | Service | Why |
| --- | --- | --- |
| Frontend | Vercel Hobby | Free-friendly Next.js hosting with automatic CI/CD. |
| Backend API | Render Free Web Service | Runs the Express Docker container from this repo. |
| Database | Neon Free PostgreSQL | Managed Postgres with a free plan suitable for demos. |
| CI/CD | GitHub Actions | Runs builds, Prisma generate, Prisma migrations, then triggers Render deploy. |

## 1. Create Neon PostgreSQL

1. Open [Neon](https://neon.com).
2. Create a project.
3. Project name:

```txt
zynex
```

4. Region: choose the closest region to your backend deployment.
5. Copy the connection string.

Neon usually gives two connection strings:

```txt
Pooled connection
Direct connection
```

For this project, use the **direct connection** as `DATABASE_URL` in GitHub Actions because Prisma migrations work best with a direct database connection.

Example:

```env
DATABASE_URL=postgresql://<USER>:<PASSWORD>@<NEON_HOST>/<DB_NAME>?sslmode=require
```

## 2. Create Render Backend Service

1. Open [Render](https://render.com).
2. New -> Blueprint.
3. Connect your GitHub repository.
4. Render will detect:

```txt
render.yaml
```

5. Service name:

```txt
zynex-api
```

6. Plan:

```txt
Free
```

7. Add environment variables in Render:

```env
NODE_ENV=production
ZYNEX_API_PORT=4101
DATABASE_URL=<NEON_DIRECT_OR_POOLED_DATABASE_URL>
ZYNEX_JWT_SECRET=<LONG_RANDOM_SECRET>
NEXTAUTH_SECRET=<LONG_RANDOM_SECRET>
ZYNEX_COOKIE_DOMAIN=
SPACESHIP_SMTP_HOST=<SPACESHIP_SMTP_HOST>
SPACESHIP_SMTP_PORT=587
SPACESHIP_SMTP_USER=support@zyfrr.com
SPACESHIP_SMTP_PASS=<SPACESHIP_EMAIL_PASSWORD>
ZYNEX_SUPPORT_EMAIL=support@zyfrr.com
TWILIO_ACCOUNT_SID=<OPTIONAL>
TWILIO_AUTH_TOKEN=<OPTIONAL>
TWILIO_FROM_PHONE=<OPTIONAL>
```

For first demo, Twilio can be empty. The backend will still work for email/password flows, and OTP delivery can be added after Twilio setup.

8. Deploy the service.
9. After deploy, test:

```txt
https://<render-service-url>/api/v1/health/ZyNexAPI01HealthCheck
```

Expected response:

```json
{
  "ok": true
}
```

## 3. Get Render Deploy Hook

1. Open Render service:

```txt
zynex-api
```

2. Settings -> Deploy Hook.
3. Copy the hook URL.

You will save this in GitHub as:

```env
RENDER_DEPLOY_HOOK_URL=<RENDER_DEPLOY_HOOK>
```

This lets GitHub Actions trigger a backend deploy after migrations pass.

## 4. Add GitHub Secrets

Open GitHub repository:

```txt
Settings -> Secrets and variables -> Actions -> New repository secret
```

Add:

```env
DATABASE_URL=<NEON_DIRECT_DATABASE_URL>
RENDER_DEPLOY_HOOK_URL=<RENDER_DEPLOY_HOOK_URL>
```

Optional but useful later:

```env
ZYNEX_JWT_SECRET=<LONG_RANDOM_SECRET>
NEXTAUTH_SECRET=<LONG_RANDOM_SECRET>
```

Render also needs those same runtime secrets in its own environment variable screen.

## 5. GitHub Actions CI/CD

Workflow file:

```txt
.github/workflows/deploy-api.yml
```

It runs when backend-related files are pushed to `main`.

It does:

1. Checkout code.
2. Install dependencies with pnpm.
3. Generate Prisma client.
4. Build the API.
5. Run Prisma migrations against Neon.
6. Trigger Render deploy hook.

Manual run:

```txt
GitHub -> Actions -> Deploy ZyNex API Free Stack -> Run workflow
```

## 6. Deploy Frontend On Vercel

1. Open [Vercel](https://vercel.com).
2. Import the same GitHub repository.
3. Framework:

```txt
Next.js
```

4. Root directory:

```txt
apps/web
```

5. Add environment variables:

```env
NEXT_PUBLIC_ZYNEX_API_URL=https://<render-service-url>
NEXTAUTH_URL=https://zynex.zyfrr.com
NEXTAUTH_SECRET=<LONG_RANDOM_SECRET>
GOOGLE_CLIENT_ID=<GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<GOOGLE_CLIENT_SECRET>
```

6. Deploy.

## 7. Google OAuth URLs

In Google Cloud Console, configure:

Authorized JavaScript origins:

```txt
https://zynex.zyfrr.com
```

Authorized redirect URI:

```txt
https://zynex.zyfrr.com/api/auth/callback/google
```

Privacy policy:

```txt
https://zynex.zyfrr.com/Privacy
```

Terms:

```txt
https://zynex.zyfrr.com/Terms
```

## 8. Cost Notes

This path is designed to avoid AWS surprises.

Still remember:

- Free tiers have usage limits.
- Render free services can sleep after inactivity.
- Neon free storage/compute limits are enough for assignment demos, not heavy production traffic.
- Vercel Hobby is good for personal/demo use.

## 9. Production Upgrade Path

When ZyNex needs a stronger production deployment:

```txt
Render Free -> Render Paid / ECS Express Mode
Neon Free -> Neon Launch / RDS PostgreSQL
GitHub deploy hook -> container registry + blue/green deploy
```

The application code does not need a database rewrite because Neon is standard PostgreSQL.
