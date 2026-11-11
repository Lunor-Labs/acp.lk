# Deployment Fix — Railway (Backend) + Vercel (Frontend)

> **Status: COMPLETE** — Deployed and working as of 2026-05-09.

**Goal:** Deploy the backend as a standalone Express service on Railway and keep the frontend on Vercel. Both services live on separate domains; the frontend calls the Railway backend via `VITE_API_BASE_URL`.

**Architecture:** No serverless functions. The existing Express server in `backend/src/api/express/server.ts` runs as-is on Railway. The frontend on Vercel gets the Railway URL injected at build time via a Vercel secret.

---

## What Was Done

### Backend → Railway

- `railway.json` at repo root configures build + start:
  ```json
  {
    "build": {
      "builder": "NIXPACKS",
      "buildCommand": "cd backend && npm install && npm run build"
    },
    "deploy": {
      "startCommand": "node backend/dist/api/express/server.js",
      "healthcheckPath": "/health",
      "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 10
    }
  }
  ```
- `nixpacks.toml` at repo root pins Node 20:
  ```toml
  [phases.setup]
  nixPkgs = ["nodejs_20"]
  ```
- Railway project: `acp-lk`, environment: `production`
- Required env vars set in Railway dashboard: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`

### Frontend → Vercel

- `vercel.json` at repo root:
  ```json
  {
    "buildCommand": "cd frontend && npm install && npm run build",
    "outputDirectory": "frontend/dist",
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- Vercel project: `acp-lk-v2`
- `VITE_API_BASE_URL` set as a Vercel secret → injected into `frontend/.env.production` at build time
- `frontend/src/api/client.ts` line 1:
  ```ts
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
  ```
  (`/api` fallback works locally with the Express server on port 3001)

### CI/CD (`.github/workflows/deploy.yml`)

Path-filtered — only the changed service deploys on push:

- **Frontend job**: runs `vercel build --prod` + `vercel deploy --prebuilt --prod` when `frontend/**` changes
- **Backend job**: runs `railway up --service acp-lk --environment production --detach` when `backend/**` changes
- Both jobs gate on the `prod` environment and use GitHub Actions secrets (`VERCEL_TOKEN`, `RAILWAY_API_TOKEN`, `RAILWAY_PROJECT_ID`, `VITE_API_BASE_URL`)

---

## What's Next

Continue with **Phase 2: shadcn/ui design system** (see `docs/superpowers/specs/2026-05-09-platform-refactor-design.md`).
