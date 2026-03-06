# WORK.md — Open Items & Bugs

## Legend
- 🔴 Blocker
- 🟡 Should fix before demo
- 🟢 Nice to have / post-demo

---

## Open Items

### W-001 ✅ Python version — upgrade to 3.12
**Context:** System Python on tony-mac is 3.7.5 (too old). Currently using Homebrew Python 3.10 at `/usr/local/opt/python@3.10/bin/python3` as a workaround. Backend Dockerfile targets `python:3.10-slim`.
**TODO:**
- Install Python 3.12 via pyenv or Homebrew (`brew install python@3.12`)
- Recreate `.venv` with 3.12
- Update Dockerfile to `python:3.12-slim`
- Re-pin requirements.txt to latest compatible versions

---

### W-002 ✅ requirements.txt — pin exact versions after install
**Context:** requirements.txt uses `>=` version ranges (loose). Good for dev, bad for reproducibility in prod.
**TODO:**
- After Python upgrade, run `.venv/bin/pip freeze > requirements.txt`
- Commit pinned versions
- Keep a `requirements.in` for human-readable unpinned deps

---

### W-003 🟢 GitHub repo not yet created
**Context:** Local repo initialized but not pushed to GitHub. Tony needs to create `tonycapone/claims-ai-assistant` on GitHub then we push.
**TODO:**
- Tony creates repo at github.com/new (name: `claims-ai-assistant`, public)
- `git remote add origin git@github.com:tonycapone/claims-ai-assistant.git`
- `git push -u origin main`

---

### W-004 ✅ PWA icons missing
**Context:** `manifest.json` references `/icon-192.png` and `/icon-512.png` but these files don't exist yet. PWA won't install properly without them.
**TODO:**
- Design or generate ClaimPath logo/icon
- Export at 192x192 and 512x512 PNG
- Add to `frontend/public/`
- Also add `icon.svg` (referenced in index.html favicon)
- Add apple-touch-icon

---

### W-005 ✅ Service worker not implemented
**Context:** Vite scaffold doesn't include a service worker. PWA install prompt and offline support won't work without one.
**TODO:**
- Add `vite-plugin-pwa` OR manually write `public/sw.js` with Workbox
- Register in `main.tsx` (same pattern as Tasker)
- Cache app shell for offline support
- Handle push notification registration
- Handle `beforeinstallprompt` event for custom install banner

---

### W-006 ✅ Mock policy seed data not created
**Context:** Spec calls for 5 mock policies and pre-seeded claims for adjuster demo. Nothing seeded yet.
**TODO:**
- Create `backend/seed.py` script (run via `npm run db:seed`)
- Seed policies: LT-29471 (14mo, contestability), LT-18823 (4yr, clean), FE-00291 (5mo, high risk), LT-44901 (clean), IU-10032 (clean)
- Seed 4 claims at various stages: submitted, under_review, contestability_review, approved
- Seed 3 mock adjusters
- Script should be idempotent (safe to re-run)

---

### W-007 ✅ Policy model missing
**Context:** `models.py` only has `Claim`. Need a `Policy` table to look up against during FNOL.
**TODO:**
- Add `Policy` SQLAlchemy model:
  - policy_number, insured_name, insured_dob, insured_ssn_last4
  - face_amount, issue_date, policy_type (term/final_expense/iul)
  - status (in_force/lapsed/cancelled)
  - beneficiaries (JSON array: [{name, relationship, percentage}])
- Generate Alembic migration (`alembic revision --autogenerate -m "add policy model"`)
- Apply migration (`alembic upgrade head`)

---

### W-008 ✅ API routes not built
**Context:** `main.py` has commented-out router imports. No actual endpoints exist beyond `/api/health`.
**TODO:** Build all routes per spec:
- `POST   /api/claims/lookup` — find policy by number or name+dob+ssn4
- `POST   /api/claims` — create draft claim
- `PUT    /api/claims/:id` — update claim (any step)
- `POST   /api/claims/:id/submit` — finalize + trigger AI risk scoring
- `GET    /api/claims/:id/status` — beneficiary status check (claim# + email)
- `POST   /api/claims/:id/documents` — upload doc → S3 → AI extract
- `POST   /api/claims/:id/verify` — mock identity verification
- `GET    /api/adjuster/claims` — queue with filters/sort
- `GET    /api/adjuster/claims/:id` — full claim detail
- `POST   /api/adjuster/claims/:id/action` — approve/deny/escalate/request docs
- `POST   /api/adjuster/chat` — streaming SSE copilot
- `POST   /api/adjuster/draft` — generate communication draft
- `POST   /api/adjuster/login` — JWT auth

---

### W-009 ✅ Frontend UI not built
**Context:** Default Vite scaffold (`App.tsx` shows React logo). No actual screens built yet.
**TODO:** Build all screens per spec:
- Customer PWA: Landing, Policy Lookup, Beneficiary Info, Death Info, Doc Upload + AI extraction confirm, Identity Verify, Payout Prefs, Review/Submit, Confirmation + Claim Tracker, Status (returning)
- Adjuster Dashboard: Login, Claims Queue, Claim Detail + AI risk card, AI Copilot panel, Actions modal, Communications
- Shared: Router setup (react-router-dom), global styles/theme, loading states, error handling

---

### W-010 ✅ AI document extraction not wired up
**Context:** Spec calls for Claude to extract fields from uploaded death certificate. Not implemented.
**TODO:**
- `POST /api/claims/:id/documents` route
- S3 upload (boto3 presigned URL or direct upload)
- Local dev fallback: store in `/tmp/claimpath-docs/`
- Claude API call with base64 image input
- Return structured JSON extraction to frontend
- Frontend: show confirmation card with extracted fields

---

### W-011 ✅ AI risk scoring not wired up
**Context:** On claim submission, Claude should score risk, flag contestability, return structured assessment.
**TODO:**
- Risk scoring function in `backend/app/ai.py`
- Called automatically on `POST /api/claims/:id/submit`
- Inputs: claim data, policy data (issue date, beneficiary match, cause of death vs. application)
- Outputs: risk_level, contestability_alert, flags[], recommendation, ai_summary
- Store results on Claim model
- Surface on adjuster claim detail view

---

### W-012 ✅ AI adjuster copilot not wired up
**Context:** Adjuster dashboard needs a streaming chat panel powered by Claude with claim context.
**TODO:**
- `POST /api/adjuster/chat` — Server-Sent Events (SSE) streaming endpoint
- System prompt includes full claim context
- Frontend: streaming chat UI (append tokens as they arrive)
- "Insert into notes" button on AI responses

---

### W-013 ✅ Root package.json — npm run scripts not set up
**Context:** Tasker has a root `package.json` with `concurrently` that lets you run `npm run dev` to spin up everything (backend + frontend + any services) in one command. We have none of that.
**TODO:**
- Create root `package.json` with scripts:
  - `dev` — concurrently run backend + frontend
  - `dev:backend` — `cd backend && .venv/bin/python run.py`
  - `dev:frontend` — `cd frontend && npm run dev`
  - `install:all` — install frontend npm deps
  - `test` — run backend pytest
  - `test:unit` — run frontend vitest
  - `test:e2e` — run playwright
  - `db:seed` — run seed.py
  - `db:migrate` — run alembic upgrade head
  - `deploy` — run deploy.sh
- Install `concurrently` as devDependency

---

### W-014 ✅ Docker Compose for local development
**Context:** Need a way to spin up the full local environment (backend + postgres + frontend) without installing everything globally. Tasker uses Docker for Redis; we should do similar for Postgres.
**TODO:**
- Create `docker-compose.yml` at repo root:
  - `postgres` service (postgres:15, port 5432, local volume)
  - `backend` service (builds from `backend/Dockerfile`, mounts code, hot reload)
  - Optional: `frontend` service (or just run via npm)
- Create `.env.docker` with docker-specific env vars
- Add `npm run dev:docker` script that starts compose + frontend
- Document in README

---

### W-015 ✅ Backend unit tests not set up
**Context:** Tasker has a full pytest setup with conftest.py, in-memory SQLite test DB, FastAPI TestClient, and per-router test files. We have nothing.
**TODO:**
- Create `backend/tests/` directory
- Create `backend/tests/conftest.py` (mirrors Tasker pattern):
  - In-memory SQLite engine
  - `db_session` fixture (rolls back after each test)
  - `client` fixture (FastAPI TestClient with DB override)
- Install test deps: `pytest`, `pytest-asyncio`, `httpx`
- Add to requirements.txt
- Write initial tests:
  - `test_health.py` — basic health check
  - `test_claims.py` — policy lookup, create claim, submit claim
  - `test_adjuster.py` — claims queue, claim detail, actions

---

### W-016 ✅ Frontend unit tests not set up
**Context:** Tasker uses Vitest + Testing Library for frontend unit tests. We have the deps installed (vitest is in devDeps from Vite scaffold) but no tests written.
**TODO:**
- Create `frontend/src/__tests__/` directory
- Configure Vitest in `vite.config.ts` (add `test` block)
- Create `frontend/src/setupTests.ts`
- Write initial tests:
  - PolicyLookup component
  - ClaimTracker component
  - Utility functions

---

### W-017 ✅ E2E tests with Playwright not set up
**Context:** Tasker has full Playwright e2e setup with separate test backend port, test DB, and mobile viewport (390x844 iPhone 14). Key flows should be covered.
**TODO:**
- Install `@playwright/test` as devDependency (root)
- Create `playwright.config.ts` at root:
  - `baseURL` → frontend dev server
  - Mobile viewport (390x844)
  - `webServer` configs for backend + frontend
- Create `tests/e2e/` directory
- Write e2e tests:
  - `claim-flow.spec.ts` — full beneficiary claim submission
  - `adjuster.spec.ts` — adjuster login, view queue, take action
- Add `npm run test:e2e` script

---

### W-018 ✅ No TypeScript types defined
**Context:** Tasker has a `frontend/src/types/` directory with shared TypeScript interfaces. We have none, so components will use `any` everywhere.
**TODO:**
- Create `frontend/src/types/`:
  - `claim.ts` — Claim, ClaimStatus, RiskLevel, ClaimDocument
  - `policy.ts` — Policy, PolicyType, Beneficiary
  - `adjuster.ts` — AdjusterAction, ChatMessage, CommunicationDraft
  - `api.ts` — API response wrappers

---

### W-019 ✅ No API client / axios setup
**Context:** Tasker uses a `useAxios` hook for authenticated requests. We need a similar pattern — a configured axios instance + hooks for API calls.
**TODO:**
- Create `frontend/src/utils/api.ts` — configured axios instance (baseURL, interceptors)
- Create `frontend/src/hooks/useApi.ts` — generic hook for loading/error state
- Create `frontend/src/hooks/useClaim.ts` — claim-specific hooks
- Create `frontend/src/hooks/useAdjuster.ts` — adjuster-specific hooks

---

### W-020 ✅ No global state / context
**Context:** Claim flow spans multiple screens. Need to persist state across steps without prop drilling or redundant API calls.
**TODO:**
- Create `frontend/src/contexts/ClaimContext.tsx`:
  - Store claim draft state across steps
  - Persist to localStorage (so user can return)
  - Clear on submission
- Create `frontend/src/contexts/AdjusterContext.tsx`:
  - Store auth token
  - Store current adjuster session

---

### W-021 ✅ No global styles / design system
**Context:** Default Vite CSS is placeholder. Need a real design system for the app to look polished for the demo.
**TODO:**
- Define CSS variables: brand colors (navy #1e3a5f, accent blue, white, grays), typography scale, spacing
- Global reset / base styles in `index.css`
- Component-level CSS modules or styled approach (match Tasker's pattern)
- Mobile-first responsive layout
- Design tokens: status colors (green=approved, yellow=pending, red=denied/flagged)

---

### W-022 ✅ No linting / formatting configured
**Context:** Tasker has ESLint configured. We have the default Vite ESLint config but no Prettier or consistent formatting rules.
**TODO:**
- Configure `.eslintrc` / `eslint.config.js` properly
- Add Prettier with `.prettierrc`
- Add `npm run lint` and `npm run format` scripts
- Add pre-commit hook (optional)

---

### W-023 ✅ Auth on adjuster dashboard — JWT
**Context:** Adjuster routes are unprotected. Need at minimum simple JWT auth for the demo.
**TODO:**
- Hardcode 3 adjuster users in seed data (J. Martinez, R. Thompson, A. Patel)
- `POST /api/adjuster/login` → validates credentials → returns JWT
- JWT middleware on all `/api/adjuster/*` routes (except login)
- Frontend: adjuster login screen, store token in localStorage
- Auto-redirect to login if token missing/expired

---

### W-024 ✅ CDK — frontend S3 bucket missing from deploy.sh
**Context:** `deploy.sh` grabs `DocumentsBucket` output but that's for claim documents, not the frontend. Frontend bucket has no named output yet.
**TODO:**
- Add `FrontendBucketName` CfnOutput to `claimpath-stack.ts`
- Add `CloudFrontDistributionId` CfnOutput (needed for cache invalidation after deploy)
- Fix `deploy.sh`:
  - Sync `frontend/dist/` to frontend S3 bucket
  - Run CloudFront invalidation (`aws cloudfront create-invalidation`)

---

### W-025 ✅ README missing
**Context:** No README.md at repo root.
**TODO:**
- Write README:
  - Project overview + demo context
  - Architecture diagram (text-based)
  - Prerequisites (Node 22, Python 3.10+, AWS CLI)
  - Local dev setup: `npm install && npm run install:all && npm run db:migrate && npm run db:seed && npm run dev`
  - Deploy instructions
  - Environment variables reference
  - Demo script summary (link to docs/spec.md)

---

### W-026 ✅ scripts/ directory missing
**Context:** Tasker has a `scripts/` dir with useful utilities: `db.sh` (prod DB access), `deploy.sh`, `logs.sh`, etc.
**TODO:**
- Create `scripts/` directory
- `scripts/db.sh` — run SQL against local or prod DB
- `scripts/logs.sh` — tail ECS logs via CloudWatch
- `scripts/seed.py` → move seed logic here, callable from npm script

---
