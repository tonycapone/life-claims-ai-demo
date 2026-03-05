# ClaimPath Build Task

Read WORK.md, docs/spec.md, docs/research.md, and all existing code first.

Git config first:
```
git config user.email "clawd@builder-mac"
git config user.name "Clawd"
```

Work through each open item in WORK.md. After each: mark ✅, commit "W-XXX: description", continue.

## Items to complete (in order):

### W-019: API client + hooks
- Create frontend/src/utils/api.ts (axios instance, baseURL /api, attach adjuster_token Bearer header)
- Create frontend/src/hooks/useClaim.ts (usePolicyLookup, useCreateClaim, useSubmitClaim, useClaimStatus hooks)
- Create frontend/src/hooks/useAdjuster.ts (useAdjusterLogin, useClaimQueue, useClaimDetail, useClaimAction hooks)
- Commit "W-019: Add API client and hooks"

### W-020: React contexts
- Create frontend/src/contexts/ClaimContext.tsx: stores ClaimDraft, persists to localStorage key 'claim_draft', provides setDraft/clearDraft
- Create frontend/src/contexts/AdjusterContext.tsx: stores token + AdjusterUser, persists to localStorage key 'adjuster_token'/'adjuster_user'
- Commit "W-020: Add ClaimContext and AdjusterContext"

### W-021: Design system
- Replace frontend/src/index.css with full CSS design system
- Variables: --color-primary:#1e3a5f, --color-accent:#2563eb, --color-success:#16a34a, --color-warning:#d97706, --color-danger:#dc2626, --color-bg:#f8fafc, --color-surface:#ffffff, --color-text:#0f172a, --color-muted:#64748b
- Full reset, body styles, typography (Inter or system-ui), button/input/card base styles, mobile-first
- Professional insurance feel. Trustworthy, clean, not flashy.
- Commit "W-021: Add design system and global styles"

### W-005: PWA service worker
- cd frontend && npm install -D vite-plugin-pwa
- Update vite.config.ts to add VitePWA plugin with manifest (name: ClaimPath, theme_color: #1e3a5f, icons)
- Update src/main.tsx to register service worker
- Commit "W-005: Add PWA service worker"

### W-008: Backend API routes (biggest item)
First setup backend: `cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`

Create backend/app/auth.py:
- JWT creation with python-jose (SECRET_KEY from env or default dev key)
- create_access_token(username) -> str
- get_current_adjuster(token) -> Adjuster dependency

Create backend/app/ai.py:
- extract_document(file_bytes, filename) -> dict: if ANTHROPIC_API_KEY set, call Claude claude-3-5-sonnet-20241022 with vision. Else return mock: {deceased_name, date_of_death, cause_of_death, manner_of_death, certifying_physician, jurisdiction, certificate_number}
- score_risk(claim_data: dict, policy_data: dict) -> dict: if key set, call Claude. Else return realistic mock based on months_since_issue (< 24 = contestability alert, < 6 = high risk)
- stream_copilot(claim_data: dict, message: str) -> Generator: if key set, stream Claude response. Else yield mock response chunks.
- draft_communication(claim_data: dict, draft_type: str) -> str: return professional letter draft

Create backend/app/routers/claims.py:
- POST /claims/lookup: accepts {policy_number} OR {insured_name, insured_dob, insured_ssn_last4}. Query Policy table. Return {found, policy_number, insured_name_masked, policy_type, status} or 404
- POST /claims: create Claim in DB with status=draft, generate claim_number (CLM-YYYY-NNNNN), return Claim
- PUT /claims/{id}: update any fields on draft claim
- POST /claims/{id}/submit: set status=submitted, call score_risk(), update risk fields, return Claim
- GET /claims/status: query params claim_number + email, return Claim status info
- POST /claims/{id}/documents: accept multipart file upload, save to /tmp/claimpath-docs/, call extract_document(), store extracted JSON on claim, return extraction
- POST /claims/{id}/verify: mock identity verification, set identity_verified=True, return {verified: true}

Create backend/app/routers/adjuster.py:
- POST /adjuster/login: accept {username, password}, verify against Adjuster table using passlib sha256_crypt, return {access_token, token_type, adjuster}
- GET /adjuster/claims: requires auth, optional query params status/risk_level/assigned_to, return list of claims with policy info joined
- GET /adjuster/claims/{id}: requires auth, return full claim detail
- POST /adjuster/claims/{id}/action: requires auth, body {action, notes?, document_type?, assignee?}, update claim status accordingly
- POST /adjuster/chat: requires auth, body {claim_id, message}, return StreamingResponse using stream_copilot()
- POST /adjuster/draft: requires auth, body {claim_id, draft_type}, return {subject, body}

Update backend/app/main.py to import and include both routers.

Run tests: cd backend && .venv/bin/python -m pytest tests/ -v (fix any failures)
Commit "W-008: Build all API routes"

### W-009: Frontend UI (biggest item)
Install deps first: cd frontend && npm install

Create src/AppRoutes.tsx with react-router-dom BrowserRouter:
- / -> Landing
- /claim/lookup -> PolicyLookup  
- /claim/beneficiary -> BeneficiaryInfo
- /claim/death-info -> DeathInfo
- /claim/documents -> DocumentUpload
- /claim/verify -> IdentityVerify
- /claim/payout -> PayoutPrefs
- /claim/review -> ReviewSubmit
- /claim/confirmation -> Confirmation
- /claim/status -> ClaimStatus
- /adjuster -> redirect to /adjuster/login
- /adjuster/login -> adjuster/Login
- /adjuster/queue -> adjuster/Queue
- /adjuster/claims/:id -> adjuster/ClaimDetail

Update src/App.tsx to wrap with ClaimProvider, AdjusterProvider, and AppRoutes.

Create src/components/StepIndicator.tsx: shows steps 1-7 with current step highlighted
Create src/components/StatusBadge.tsx: colored pill badge for claim status

Create customer pages (use ClaimContext, call API hooks, navigate between steps):
- src/pages/Landing.tsx: Logo + tagline "We're here to help" + two CTAs + install banner
- src/pages/PolicyLookup.tsx: toggle between policy# OR name+dob+ssn4 form, call lookup, show masked result
- src/pages/BeneficiaryInfo.tsx: name/email/phone/relationship form
- src/pages/DeathInfo.tsx: date picker, manner dropdown, location
- src/pages/DocumentUpload.tsx: file upload area, show spinner, show extracted fields confirmation card
- src/pages/IdentityVerify.tsx: mock flow - show ID upload UI, then selfie, then 2s loading, then verified checkmark
- src/pages/PayoutPrefs.tsx: lump sum vs structured, bank routing/account
- src/pages/ReviewSubmit.tsx: summary of all steps, submit button, call submit API
- src/pages/Confirmation.tsx: claim number, timeline tracker (4 steps), next steps text
- src/pages/ClaimStatus.tsx: form to check status by claim# + email, show timeline

Create adjuster pages:
- src/pages/adjuster/Login.tsx: email + password, call login API, store token, redirect to queue
- src/pages/adjuster/Queue.tsx: table of claims with columns (claim#, beneficiary, insured, face amount, submitted, status badge, risk badge, contestability flag, days open), filter bar, click row -> ClaimDetail
- src/pages/adjuster/ClaimDetail.tsx: two-column layout. Left: policy info, AI risk card, beneficiary info, death info, documents list, timeline. Right: AI copilot chat panel.

Create adjuster components:
- src/components/adjuster/RiskCard.tsx: risk level badge, contestability alert box (red if flagged), fraud flags list
- src/components/adjuster/CopilotPanel.tsx: chat interface, send message -> POST /adjuster/chat, display streaming response
- src/components/adjuster/ActionModal.tsx: modal with action buttons (Approve/Deny/Escalate/Request Docs), notes field, submit

Commit "W-009: Build full frontend UI"

### W-010/011/012: Wire AI (already in W-008's ai.py, just verify it's wired)
If ai.py needs cleanup, do it. Commit "W-010/011/012: AI layer complete"

### W-014: Docker Compose
Create docker-compose.yml:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: claimpath
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: claimpath
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```
Add to root package.json scripts: "dev:docker": "docker-compose up -d postgres && npm run dev"
Commit "W-014: Add Docker Compose for local Postgres"

### W-022: Prettier
Create frontend/.prettierrc: {"semi": false, "singleQuote": true, "tabWidth": 2, "trailingComma": "es5"}
Add to frontend/package.json scripts: "format": "prettier --write src/"
Commit "W-022: Add Prettier config"

### W-024: Fix deploy.sh
Update deploy.sh to:
1. Build frontend
2. CDK deploy
3. Get FrontendBucketName output
4. aws s3 sync frontend/dist/ s3://$BUCKET --delete
5. Get CloudFrontDistributionId output
6. aws cloudfront create-invalidation --distribution-id $CF_ID --paths "/*"
Commit "W-024: Fix deploy.sh"

### W-026: Utility scripts
Create scripts/db.sh: connects to local SQLite (default) or runs psql against prod RDS
Create scripts/logs.sh: runs aws logs tail on ECS log group
chmod +x both
Commit "W-026: Add utility scripts"

## Final steps:
1. cd frontend && npm run build (fix any TS errors)
2. cd backend && .venv/bin/python -m pytest tests/ -v (fix any failures)
3. git push origin main
4. Run: openclaw system event --text "Builder Mac done: ClaimPath all items complete, pushed to GitHub" --mode now
