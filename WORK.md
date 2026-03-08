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

### W-027 🟡 Deploy FNOL chat to claimpath.click
**Context:** Conversational FNOL chat is built locally (backend AI functions, SSE endpoint, FNOLChat.tsx page). Needs to be deployed to claimpath.click so it's live.
**TODO:**
- Build frontend (`npm run build`) and deploy to S3/CloudFront
- Deploy backend (ECS Fargate) with updated `ai.py` and `claims.py`
- Verify Bedrock access from ECS task role (Claude Haiku model)
- Smoke test: file a claim via chat on claimpath.click
- Confirm claim appears in adjuster queue

---

### W-028 🟡 Migrate AI layer to Strands Agents SDK + AgentCore Runtime
**Context:** Currently using raw boto3 `converse()` / `converse_stream()` calls in `backend/app/ai.py`. Should migrate to [Strands Agents SDK](https://github.com/strands-agents/sdk-python) for agent orchestration and deploy agents via AWS AgentCore Runtime for managed hosting, auth, sessions, and observability.
**TODO:**
- Install `strands-agents` and `strands-agents-builder` packages
- Refactor FNOL chat agent: define tools (policy lookup, field extraction, claim creation) as Strands tools
- Refactor adjuster copilot agent: claim context tools, draft generation, risk explanation
- Define agent configs (model, system prompt, tools) as Strands Agent instances
- Deploy agents to AgentCore Runtime (`agentcore create-agent`)
- Update backend endpoints to invoke agents via AgentCore Runtime API instead of direct Bedrock calls
- Keep mock fallbacks for local dev without AgentCore access

---

### W-029 🟡 Finalize demo script
**Context:** Draft demo script at `docs/demo-script.md`. Covers dual thesis (AI as product + AI as developer), live FNOL chat walkthrough, adjuster dashboard, PWA/Capacitor story, and the AI-forward development process. ~5 minutes.
**TODO:**
- Tony reviews and adjusts emphasis/talking points
- Rehearse with live claimpath.click to confirm timing
- Decide whether to show adjuster copilot live or just flash it
- Add speaker notes for transitions if presenting with slides

---

### W-030 🟢 SSN last 4 verification in FNOL chat
**Context:** After policy lookup, ask beneficiary to confirm last 4 of the insured's SSN. We already store `insured_ssn_last4` on the Policy model. Shows an inline verified/failed card.
**TODO:**
- Backend: after policy found, send `action: verify_ssn4` event
- Frontend: render inline input card (4-digit masked field + Verify button)
- Backend: validate against policy record, return verified/failed event
- Frontend: green checkmark card on success, retry prompt on failure

---

### W-031 🟢 Inline relationship picker widget
**Context:** Instead of parsing "I'm his wife" from free text, show a horizontal button group (Spouse / Child / Parent / Sibling / Other) inline in the chat after beneficiary name is collected.
**TODO:**
- Backend: send `action: pick_relationship` event when beneficiary_name collected but relationship missing
- Frontend: render button group inline, on tap send as user message and set draft field directly

---

### W-032 🟢 Inline manner of death picker widget
**Context:** Sensitive field — easier to tap than type. Show Natural / Accident / Undetermined as inline buttons.
**TODO:**
- Backend: send `action: pick_manner` event when date/cause collected but manner missing
- Frontend: render button group, same pattern as relationship picker

---

### W-033 🟢 Inline payout selector widget
**Context:** Show a card with the policy face amount and two options (Lump Sum / Structured Payments) with brief descriptions. More visual than typing.
**TODO:**
- Backend: send `action: pick_payout` event with face_amount in data
- Frontend: card showing "$500,000 Death Benefit" with two tappable option cards
- On select, send as user message and set draft field

---

### W-034 🟢 Inline date picker for date of death
**Context:** Date parsing from free text works but a native date input is more reliable and mobile-friendly.
**TODO:**
- Backend: send `action: pick_date_of_death` event when ready for death info
- Frontend: render inline card with native date input + Confirm button
- Set draft field directly on confirm

---

### W-035 🟡 RAG: Ground AI copilot in carrier claims handling manual
**Context:** The adjuster copilot currently reasons from Claude's general knowledge. In production, it should be grounded in the carrier's actual claims handling manual — contestability checklists, escalation procedures, documentation requirements, etc. Industry standards come from LOMA, ACLI, and NAIC, but every carrier has their own internal manual.
**TODO:**
- Source or create a sample claims handling manual (could synthesize from LOMA/NAIC guidelines)
- Implement RAG pipeline: chunk manual → embed → vector store (e.g. Bedrock Knowledge Bases or OpenSearch)
- Update copilot system prompt to include retrieved context from manual
- Copilot responses should cite specific manual sections when applicable
- Demo talking point: "Imagine this grounded in your company's actual procedures"

---

### W-036 🔴 Contestability analysis: Application vs. Medical Records comparison
**Context:** The highest-value AI feature for claims adjusters. During the 2-year contestability period, adjusters spend 2-3 days manually reading medical records and comparing against the original insurance application looking for material misrepresentations. AI can do this in seconds.
**TODO:**
- Create synthetic seed documents:
  - 1-page insurance application PDF (yes/no health questionnaire) for each contestable policy
  - 3-4 pages of medical record excerpts (doctor visits, prescriptions, lab results)
  - Plant 2-3 deliberate discrepancies (e.g. "No" to heart disease but atrial fibrillation diagnosis in records)
- Store documents on Policy or Claim model (application_url, medical_records_url)
- Add `analyze_contestability(application, medical_records) -> DiscrepancyReport` to ai.py
  - Returns structured table: question, applicant answer, medical record finding, source, assessment
- Add "Run Contestability Analysis" button on adjuster claim detail for contestable claims
- Add backend endpoint: `POST /api/adjuster/claims/:id/contestability`
- Display discrepancy report as a structured card in the adjuster UI

---

### W-037 🟡 Mock MIB (Medical Information Bureau) cross-carrier detection
**Context:** In real life, adjusters query MIB to check for undisclosed applications or medical history across carriers. Policy stacking (multiple policies purchased in a short window) is a major fraud indicator. We can mock this with a seed table.
**TODO:**
- Add `MIBRecord` model: insured_ssn_last4, carrier_name, application_date, face_amount, medical_codes
- Seed 3-4 MIB records for demo policies (e.g. Robert Johnson has 2 additional apps totaling $1.75M)
- Auto-query MIB on claim submission, store results on claim
- Display MIB findings on adjuster risk card: "2 additional applications found across carriers in 6-month window"
- Flag in risk scoring: policy stacking → high risk

---

### W-038 🔴 Policy-aware FNOL chat with smart follow-ups
**Context:** If the AI knows the policy provisions (riders, exclusions), the customer-facing chat can ask intelligent follow-up questions. E.g. if the policy has an accidental death rider with an intoxication exclusion and the beneficiary says "car accident," the AI asks for the police report number — surfacing the info the adjuster needs without being insensitive about why.
**TODO:**
- Add `provisions` field to Policy model (JSON: riders, exclusions, conditions)
- Seed provisions for demo policies (e.g. accidental death rider, intoxication exclusion on LT-29471)
- Inject policy provisions into FNOL chat system prompt after policy lookup
- AI reasons about which follow-ups matter based on cause of death + policy terms
- Collected follow-up info visible on adjuster claim detail (police report #, accident details, etc.)
- Add follow-up fields to Claim model: police_report_number, accident_details, etc.

---

### W-039 🟢 White-label / multi-carrier theming
**Context:** The platform should demonstrate that it's not a one-off app but a configurable module that any carrier can adopt. A single config change should re-skin the entire UI with a different carrier's branding (logo, colors, company name).
**TODO:**
- Extract brand config to a single `theme.ts` file (logo, primary color, company name, tagline)
- CSS variables already exist — just need to swap them per config
- Add a theme switcher or URL param (`?carrier=nationwide`) for demo purposes
- Create 2-3 sample carrier themes (default ClaimPath + 2 mock carriers)
- All copy references ("Claims Department", company name in letters) pull from config

---

### W-040 🔴 Mock carrier app shell — full mobile experience
**Context:** The beneficiary experience currently drops you straight into claim filing. For the demo, it should feel like you're inside a real carrier's mobile app — login, dashboard, policy cards — and then navigate to "File a Claim" from within that context. Everything except the claim flow is static mock UI.
**TODO:**
- Create a fictional carrier brand (name, logo, color palette, tagline) — not USAA but that vibe
- Generate a carrier logo/hero image (Gemini CLI or similar)
- Mock login screen (email + password + biometric icon, carrier-branded)
- Mock home dashboard: "Welcome back, Tony" + policy card (Term Life $500K, active) + quick actions (File a Claim, Make a Payment, Documents, Contact Us) + recent activity feed
- Mock policy detail screen (coverage summary, beneficiaries, payment history)
- "File a Claim" button navigates to real FNOL chat
- All other buttons are static / show "Coming soon" toast or just look tappable
- Integrate with W-039 white-label theming — carrier brand defined in config

---

### W-041 🔴 Regulatory timeline card on adjuster claim detail
**Context:** The COO review flagged regulatory completeness at 2/10 — no state-specific timing requirements tracked. Even as a demo, a claims professional expects to see deadlines. This is a quick win that dramatically increases operational credibility.
**TODO:**
- Add a "Regulatory Timeline" card to AdjusterClaimDetail showing state-specific deadlines
- Calculate deadlines based on claim filing date + state rules (hardcode a few key states: CA 15-day ack / 40-day decision, NY 15 business days, TX 60 days)
- Show status (on track / approaching / overdue) with color coding
- Include a "State" field on claims (derive from jurisdiction or beneficiary address)
- This is the single cheapest way to raise the COO's "would I pilot this" score

---

### W-042 🔴 Medical records vs. application comparison (contestability analysis)
**Context:** All three executive reviewers independently identified this as THE killer feature. The COO: "That is not a 15-minute time savings, that is a 2-day time savings per contestability claim. That alone justifies the entire platform." This is W-036 from the existing backlog, elevated to top priority.
**TODO:**
- Create synthetic insurance application PDF for John Michael Smith (yes/no health questionnaire)
- Create synthetic medical records (3-4 pages of doctor visits, prescriptions, lab results)
- Plant 2-3 deliberate discrepancies (e.g., "No" to heart disease on application but AFib diagnosis in records)
- Add `analyze_contestability(application, medical_records)` to ai.py
- Returns structured discrepancy table: question, applicant answer, medical record finding, assessment
- Add "Run Contestability Analysis" button on adjuster detail for contestable claims
- Display discrepancy report as a structured card
- This single feature shifts the conversation from "nice demo" to "when can we pilot this"

---

### W-043 🟡 OFAC / sanctions screening (mocked)
**Context:** OFAC screening is a federal requirement before any death benefit payout. All reviewers flagged its absence. Even a mock check adds credibility.
**TODO:**
- Add mock OFAC check that runs automatically on claim submission
- Show "OFAC Screening: Clear" badge on adjuster claim detail (green checkmark)
- For one seed claim, show a simulated "OFAC Alert" to demonstrate the system catches it
- Add to risk scoring — OFAC hit = automatic high risk + SIU referral

---

### W-044 🟡 State-specific claim acknowledgment letter
**Context:** AI-drafted communications currently use generic language. Real carriers must include state-specific disclosures and timing commitments. Even showing one state-aware letter dramatically increases operational credibility.
**TODO:**
- Update communication drafting to accept a `state` parameter
- For California claims: include "You will receive a decision within 40 calendar days" per CA Insurance Code §10112.95
- For New York: include specific disclosure language per NY Insurance Law §3214
- Add state to claim data (derive from beneficiary address or jurisdiction)
- The copilot should know state requirements when asked "What are the timing requirements?"

---

### W-045 🟡 Multi-beneficiary awareness in FNOL chat
**Context:** The COO called multi-beneficiary coordination "the hard problem nobody demos." We don't need full orchestration, but the chat should at least acknowledge other beneficiaries exist and handle it gracefully.
**TODO:**
- After policy lookup, if multiple beneficiaries exist, show them in the policy card
- AI should acknowledge: "I see this policy has two beneficiaries — Carlos (60%) and Isabella (40%). I'll help you file for Carlos's portion today."
- Track which beneficiary is filing in the claim
- On adjuster side, show "1 of 2 beneficiaries filed" indicator
- This doesn't need full payout orchestration — just awareness

---

### W-046 🟡 Adjuster claim assignment engine
**Context:** New claims arrive unassigned. The COO flagged that real claims orgs use round-robin or workload-based assignment. Having claims sit unassigned looks unrealistic.
**TODO:**
- Auto-assign new claims to an adjuster on submission (round-robin across active adjusters)
- Show assignment on claim detail and in queue
- Allow manual reassignment from the claim detail page
- Filter queue by "My Claims" vs "All Claims"

---

### W-047 🟢 Copilot state-awareness (regulatory questions)
**Context:** The copilot should be able to answer "What are the state timing requirements for this claim?" and "What documents do I still need?" — questions a real adjuster asks constantly.
**TODO:**
- Inject state regulatory data into copilot system prompt
- Inject document checklist status (death cert: received, medical records: not requested, etc.)
- Copilot can answer: "This is a California claim — you have 40 days from proof of loss to make a decision. You're on day 5."
- Copilot can answer: "You still need: attending physician's statement, claimant's statement under oath"

---

### W-048 🟢 Beneficiary policy lookup without policy number
**Context:** The COO noted 30-40% of beneficiaries don't know the policy number. The backend already supports lookup by name + DOB + SSN last 4, but the FNOL chat only uses policy number.
**TODO:**
- Update FNOL chat to accept alternative lookup: "I don't have the policy number but his name was John Smith, born April 15 1968"
- Backend already has the lookup endpoint — just need to wire it into the chat flow
- Show matching policies if multiple found

---

### W-026 ✅ scripts/ directory missing
**Context:** Tasker has a `scripts/` dir with useful utilities: `db.sh` (prod DB access), `deploy.sh`, `logs.sh`, etc.
**TODO:**
- Create `scripts/` directory
- `scripts/db.sh` — run SQL against local or prod DB
- `scripts/logs.sh` — tail ECS logs via CloudWatch
- `scripts/seed.py` → move seed logic here, callable from npm script

---
