# WORK.md — Open Items & Bugs

## Legend
- 🔴 Blocker
- 🟡 Should fix before demo
- 🟢 Nice to have / post-demo

---

## Open Items

### W-001 🟡 Python version — upgrade to 3.12
**Context:** System Python on tony-mac is 3.7.5 (too old). Currently using Homebrew Python 3.10 at `/usr/local/opt/python@3.10/bin/python3` as a workaround. Backend Dockerfile targets `python:3.10-slim`.
**TODO:**
- Install Python 3.12 via pyenv or Homebrew (`brew install python@3.12`)
- Recreate `.venv` with 3.12
- Update Dockerfile to `python:3.12-slim`
- Re-pin requirements.txt to latest compatible versions

---

### W-002 🟡 requirements.txt — pin exact versions after install
**Context:** requirements.txt uses `>=` version ranges (loose). Good for dev, bad for reproducibility in prod.
**TODO:**
- After Python upgrade, run `.venv/bin/pip freeze > requirements.txt`
- Commit pinned versions
- Keep a `requirements.in` for human-readable unpinned deps

---

### W-003 🟢 GitHub repo not yet created
**Context:** Local repo initialized but not pushed to GitHub. Tony needs to create `tonycapone/claims-ai-assistant` on GitHub.
**TODO:**
- Tony creates repo at github.com/new
- `git remote add origin git@github.com:tonycapone/claims-ai-assistant.git`
- `git push -u origin main`

---

### W-004 🟡 PWA icons missing
**Context:** `manifest.json` references `/icon-192.png` and `/icon-512.png` but these files don't exist yet. PWA won't install properly without them.
**TODO:**
- Design or generate ClaimPath logo/icon
- Export at 192x192 and 512x512 PNG
- Add to `frontend/public/`

---

### W-005 🟡 Service worker not implemented
**Context:** Vite scaffold doesn't include a service worker. PWA install prompt and offline support won't work without one.
**TODO:**
- Add `vite-plugin-pwa` OR manually write `sw.js` with Workbox
- Register in `main.tsx`
- Cache app shell for offline support
- Handle push notification registration

---

### W-006 🟡 Mock policy seed data not created
**Context:** Spec calls for 5 mock policies and 3 pre-seeded claims for adjuster demo. Nothing seeded yet.
**TODO:**
- Create `backend/seed.py` script
- Seed policies: LT-29471 (contestability), LT-18823 (clean), FE-00291 (high risk), LT-44901 (clean), IU-10032 (clean)
- Seed 3-4 claims at various stages
- Add `Policy` model to models.py (currently only `Claim` exists)

---

### W-007 🔴 Policy model missing
**Context:** `models.py` only has `Claim`. Need a `Policy` table to look up against during FNOL.
**TODO:**
- Add `Policy` SQLAlchemy model (policy_number, insured_name, insured_dob, insured_ssn_last4, face_amount, issue_date, policy_type, status, beneficiaries JSON)
- Generate Alembic migration
- Apply migration

---

### W-008 🔴 API routes not built
**Context:** `main.py` has commented-out router imports. No actual endpoints exist beyond `/api/health`.
**TODO:** Build all routes per spec:
- `POST /api/claims/lookup`
- `POST /api/claims`
- `PUT /api/claims/:id`
- `POST /api/claims/:id/submit`
- `GET /api/claims/:id/status`
- `POST /api/claims/:id/documents`
- `POST /api/claims/:id/verify`
- `GET /api/adjuster/claims`
- `GET /api/adjuster/claims/:id`
- `POST /api/adjuster/claims/:id/action`
- `POST /api/adjuster/chat` (streaming)
- `POST /api/adjuster/draft`

---

### W-009 🔴 Frontend UI not built
**Context:** Default Vite scaffold (`App.tsx` shows React logo). No actual screens built yet.
**TODO:** Build all screens per spec:
- Customer PWA: Landing, Policy Lookup, Beneficiary Info, Death Info, Doc Upload, Identity Verify, Payout Prefs, Review/Submit, Confirmation, Status tracker
- Adjuster Dashboard: Claims Queue, Claim Detail, AI Copilot panel, Actions, Communications

---

### W-010 🟡 AI document extraction not wired up
**Context:** Spec calls for Claude to extract fields from uploaded death certificate (name, DOD, cause, etc.). Not implemented.
**TODO:**
- Add `POST /api/claims/:id/documents` route
- S3 upload logic (or local file store for dev)
- Claude API call with image/PDF input
- Return structured JSON extraction
- Show confirmation card in frontend

---

### W-011 🟡 AI risk scoring not wired up
**Context:** On claim submission, Claude should score risk, flag contestability, return structured assessment.
**TODO:**
- Add risk scoring call in `POST /api/claims/:id/submit`
- Build prompt with claim data + policy data
- Parse and store result in `Claim` model fields
- Surface on adjuster claim detail view

---

### W-012 🟡 AI adjuster copilot not wired up
**Context:** Adjuster dashboard needs a streaming chat panel powered by Claude with claim context.
**TODO:**
- `POST /api/adjuster/chat` — streaming SSE endpoint
- Pass full claim context in system prompt
- Stream response tokens to frontend
- Frontend: streaming chat UI component

---

### W-013 🟢 No auth on adjuster dashboard
**Context:** Adjuster routes are unprotected. Fine for demo but should at least have basic JWT auth.
**TODO:**
- Hardcode 2-3 adjuster users in seed data
- `POST /api/adjuster/login` → returns JWT
- Protect adjuster routes with JWT middleware
- Frontend: simple login screen for adjuster side

---

### W-014 🟢 CDK — frontend S3 bucket name missing from deploy.sh
**Context:** `deploy.sh` references `DocumentsBucket` output for the wrong bucket. Frontend bucket doesn't have a named output in the CDK stack.
**TODO:**
- Add `FrontendBucket` CfnOutput to `claimpath-stack.ts`
- Fix `deploy.sh` to sync frontend build to correct bucket

---

### W-015 🟢 No README
**Context:** No README.md at repo root.
**TODO:**
- Write README: project overview, local dev setup, how to run frontend + backend, deploy instructions
- Include demo script summary

---
