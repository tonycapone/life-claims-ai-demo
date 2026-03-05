# ClaimPath — Feature & Functionality Spec

## Overview

ClaimPath is a two-sided AI-powered death benefit claims platform for life insurance carriers. It has two distinct experiences:

1. **Customer PWA** — A mobile-first, installable web app for beneficiaries to file and track death benefit claims
2. **Adjuster Dashboard** — A desktop web app for claims adjusters to review, investigate, and process incoming claims

Both share the same backend API. The AI layer (Claude) powers the conversational intake, document extraction, risk scoring, and adjuster copilot.

---

## App 1: Customer PWA (Beneficiary-Facing)

### Design Principles
- Mobile-first, PWA-installable (Add to Home Screen prompt)
- Empathetic tone — this person just lost someone
- Progressive disclosure — don't overwhelm, one step at a time
- Save progress — claim drafts persist so they can come back
- Clear status at all times — no black holes after submission

---

### Screen 1: Landing / Home

**Unauthenticated state:**
- ClaimPath logo + tagline: "We're here to help."
- Primary CTA: "File a Death Benefit Claim"
- Secondary: "Check Claim Status" (for returning users)
- Subtext: "This process takes about 10 minutes. You can save your progress and come back."

**Installability:**
- PWA install banner shown on first visit on mobile ("Add ClaimPath to your home screen")
- iOS install instructions shown if browser doesn't support install prompt

---

### Screen 2: Policy Lookup

**Purpose:** Find the policy before collecting any personal info.

**Fields:**
- Option A: Policy Number (text input)
- Option B (toggle): "I don't have the policy number" → show:
  - Insured's full name
  - Insured's date of birth
  - Insured's last 4 of SSN

**On submit:**
- API call to `/api/claims/lookup`
- If found: show masked confirmation card
  - "We found a policy for **J\*\*\* S\*\*\*\*\***"
  - Coverage type (Term Life)
  - Face amount (masked as "a death benefit policy")
  - "Is this the right policy?" → Yes / No
- If not found: friendly error + phone number to call

**AI note:** No AI here — pure database lookup against mock policy data.

---

### Screen 3: Beneficiary Information

**Purpose:** Collect who is filing the claim.

**Fields:**
- Full legal name
- Email address
- Phone number
- Relationship to insured (dropdown: Spouse, Child, Parent, Sibling, Other)
- "Are you the primary beneficiary listed on the policy?" (Yes / No)
  - If No: explain they may still be eligible if primary has predeceased, show info

**Validation:**
- Real-time field validation
- Email format check
- Phone format

**Save state:** Draft claim created in DB at this point with a claim number assigned.

---

### Screen 4: Death Information

**Purpose:** Collect the circumstances of death.

**Fields:**
- Date of death (date picker, cannot be future date)
- Place of death (city, state — optional)
- Manner of death (dropdown):
  - Natural causes / illness
  - Accident
  - Undetermined
  - (Note: "Suicide" deliberately omitted from dropdown — adjuster handles this sensitively offline)
- "Was the death within the United States?" (Yes / No)
  - If No: note that additional documentation may be required

**Tone note:** Copy here is gentle. "We're sorry for your loss. We just need a few details to get started."

---

### Screen 5: Document Upload — Death Certificate

**Purpose:** Upload the certified death certificate.

**UI:**
- Drag-and-drop on desktop
- Camera capture or file picker on mobile
- Accepts: PDF, JPG, PNG
- Max size: 20MB

**On upload:**
- File sent to backend → stored in S3
- AI extraction triggered (Claude Vision or Textract):
  - Extracts: deceased name, date of death, cause of death, manner of death, certifying physician, jurisdiction, certificate number
- Confirmation card shown to user:
  - "We extracted the following from your death certificate. Please confirm:"
  - Name: John Michael Smith ✓
  - Date of death: March 1, 2026 ✓
  - Cause: Acute myocardial infarction ✓
  - "Does this look correct?" → Confirm / Something looks wrong
- If wrong: user can correct fields manually; both versions saved

**Error states:**
- Unreadable document → prompt to retake/reupload
- Wrong document type detected → friendly error

---

### Screen 6: Identity Verification

**Purpose:** Verify the beneficiary is who they say they are.

**Flow:**
- Step 1: Upload government-issued ID
  - Driver's license or passport
  - Front + back (if DL)
  - Camera capture preferred on mobile
- Step 2: Selfie / liveness check
  - "Take a quick selfie so we can confirm your identity"
  - Basic liveness prompt (smile, turn head — simplified for prototype)
  - AI face match: compare selfie to ID photo
- Step 3: SSN confirmation
  - "Enter the last 4 digits of your Social Security Number"

**In production:** This would be handled by Persona, Jumio, or Onfido SDK embedded as an iframe/flow. For prototype: simplified mock verification that always passes with a 2-second loading state.

**On success:**
- Green checkmark: "Identity verified ✓"
- `identity_verified = true` set on claim

---

### Screen 7: Payout Preferences

**Purpose:** Collect how they want to receive the money.

**Options:**
- Lump sum (default, most common)
- Structured installments (note: subject to carrier approval)

**Bank account collection:**
- Routing number
- Account number (confirm)
- Account type (checking / savings)
- Account holder name

**Security note shown:** "Your banking information is encrypted and only used for claim payout."

**In prototype:** Fields collected and stored (masked), no actual ACH integration.

---

### Screen 8: Review & Submit

**Purpose:** Final review before submitting.

**Shows:**
- Summary of all collected info
- Documents uploaded (checkmarks)
- Identity verified status
- Payout method
- Disclaimer: "By submitting this claim, I certify that the information provided is accurate and complete to the best of my knowledge."
- Checkbox: agree to terms
- Submit button

**On submit:**
- Claim status changes from `draft` → `submitted`
- Confirmation screen shown immediately

---

### Screen 9: Confirmation + Claim Tracker

**Purpose:** Reassure the beneficiary and give them something to check.

**Shows:**
- Claim number (e.g., CLM-2026-00142)
- "Your claim has been submitted. Here's what happens next."
- Timeline visualization:
  1. ✅ Claim Received
  2. ⏳ Under Review (current)
  3. ○ Decision
  4. ○ Payout
- Estimated timeline: "Standard claims are typically resolved within 14-30 days."
- "We'll email you at [email] with updates."
- "Add to calendar" button (ICS download for follow-up reminder)

**Returning users:**
- "Check Claim Status" from home → enter claim number + email → see this tracker view

---

### Screen 10: Claim Status / Detail (Returning)

**Purpose:** Let beneficiaries check in without calling.

**Shows:**
- Current status with timeline
- Any pending actions required (e.g., "Please upload: Medical Records")
- Messages from adjuster (read-only)
- Document status (received, under review, etc.)

---

### Additional Customer PWA Features

**Multi-beneficiary support:**
- After submission confirmation: "Is there another beneficiary who needs to file?"
- Link to share: pre-fills the policy lookup with the policy number
- Each beneficiary goes through the same flow independently

**Document requests:**
- If adjuster requests additional docs, push notification + email sent
- Beneficiary returns to app → sees "Action Required" banner
- Upload flow for additional docs

**Notifications (PWA push):**
- Claim received
- Status change
- Document request
- Claim approved / payout scheduled

---

## App 2: Adjuster Dashboard (Desktop Web)

### Design Principles
- Information density — adjusters are power users, show them everything
- Action-oriented — every screen should have a clear next action
- AI as copilot, not autopilot — AI surfaces info, human makes the call
- Audit trail — every action logged with timestamp and adjuster ID

---

### Screen 1: Claims Queue

**Purpose:** Main landing screen for adjusters. Overview of all incoming claims.

**Layout:** Table/list view with filters

**Columns:**
- Claim # 
- Beneficiary name
- Insured name
- Face amount
- Date submitted
- Policy age (months since issue)
- Status badge (color-coded)
- Risk level badge (Low 🟢 / Medium 🟡 / High 🔴)
- Contestability flag (⚠️ if within 2-year window)
- Assigned to
- Days open

**Filters:**
- Status (all, submitted, under review, pending docs, contestability review, SIU)
- Risk level
- Assigned to me / unassigned / all
- Contestability flagged
- Date range

**Sort:** Any column, default = date submitted desc

**Bulk actions:**
- Assign to adjuster
- Mark as priority

**Stats bar at top:**
- Total open claims
- Avg days open
- Pending document requests
- Contestability reviews
- SIU referrals

---

### Screen 2: Claim Detail

**Purpose:** Full view of a single claim. The core adjuster workspace.

**Layout:** Two-column
- Left: claim info, beneficiary info, documents, timeline
- Right: AI copilot panel (persistent)

**Left column sections:**

#### Policy Information
- Policy number
- Insured name, DOB
- Policy type (Term, Final Expense, IUL)
- Face amount
- Issue date
- Policy age in months
- Premium status (in-force / lapsed)
- Beneficiary listed on policy vs. claimant name (match/mismatch indicator)

#### AI Risk Assessment Card (prominent, top of left column)
- Overall risk level: Low / Medium / High
- Contestability status:
  - 🟢 "Policy is 4 years old — outside contestability period"
  - 🔴 "⚠️ Policy issued 14 months ago — WITHIN 2-year contestability period. Recommend medical records review."
- Fraud risk flags (listed):
  - "Beneficiary changed 3 months before date of death"
  - "Policy purchased within 6 months of death"
  - "Cause of death inconsistent with application health disclosure"
  - "Multiple policies detected across carriers (MIB flag)"
- Auto-triage recommendation: Fast-track / Standard review / Contestability review / Escalate to SIU

#### Beneficiary Information
- Name, email, phone
- Relationship to insured
- Identity verification status (✅ Verified / ❌ Not verified)
- ID type used
- SSN last 4 confirmed

#### Death Information
- Date of death
- Cause of death (from death certificate)
- Manner of death
- Location

#### Documents
- List of all uploaded documents with status:
  - Death certificate ✅ Received | AI extracted ✅
  - Beneficiary ID ✅ Received | Verified ✅
  - Medical records ⏳ Requested (sent 3/3/2026)
  - Autopsy report — Not required
- Each document: preview button, download button
- Extracted data from death certificate shown inline (collapsible)

#### Claim Timeline / Audit Log
- Chronological list of all events:
  - 3/4/2026 9:12am — Claim submitted by beneficiary
  - 3/4/2026 9:12am — AI risk assessment completed (Medium risk)
  - 3/4/2026 9:13am — Contestability alert triggered (14 months)
  - 3/4/2026 2:30pm — Assigned to J. Martinez
  - 3/5/2026 10:00am — Medical records requested
  - etc.

**Right column: AI Copilot Panel**

Always visible, context-aware to the current claim.

- Pre-loaded with a claim summary at the top:
  > "This is a death benefit claim for John Smith (Policy #LT-29471), submitted by spouse Sarah Smith. John passed away on March 1, 2026. The policy was issued on January 12, 2025 — **14 months ago, placing this within the 2-year contestability period.** Cause of death: acute myocardial infarction. No cardiac conditions were disclosed on the original application. Recommend requesting medical records before approving."

- Chat interface below summary:
  - Adjuster can ask free-form questions:
    - "What does the policy say about aviation exclusions?"
    - "What's the standard processing time for a contestability review?"
    - "Draft a letter requesting medical records from the beneficiary"
    - "What are the red flags on this claim?"
  - AI responds with context-aware answers
  - "Insert into notes" button on AI responses

- Suggested actions (chips below summary):
  - "Request medical records"
  - "Draft approval letter"
  - "Escalate to SIU"
  - "Run MIB check" (mock)

---

### Screen 3: Claim Actions

**Available actions on a claim (via buttons/dropdown):**

- **Request Documents** — opens modal, select doc type, customizable message, sends email + push notification to beneficiary
- **Approve Claim** — confirmation modal with face amount, payout method; sets status to Approved; triggers mock payout initiation
- **Deny Claim** — requires denial reason (dropdown + free text); generates denial letter draft via AI; sends to beneficiary
- **Escalate to SIU** — flags for Special Investigation Unit; requires reason; sets status to SIU Review
- **Contestability Review** — formally opens contestability investigation; records reason
- **Assign to Adjuster** — dropdown of adjuster team
- **Add Note** — internal notes (not visible to beneficiary)
- **Draft Communication** — AI drafts email to beneficiary; adjuster reviews and sends

---

### Screen 4: Adjuster Communications Center

**Purpose:** All outbound communications to beneficiaries, drafted and sent from here.

**Features:**
- List of sent communications per claim
- AI draft generation (select template type → AI writes it)
- Template types:
  - Acknowledgment (claim received)
  - Document request
  - Status update
  - Approval notification
  - Denial letter
  - Request for medical records (contestability)
- Adjuster edits draft before sending
- Sent communications logged in audit trail

---

### Screen 5: Analytics Dashboard (Bonus)

**Purpose:** High-level operational metrics. Makes the demo look like a real carrier product.

**Metrics:**
- Claims volume (daily/weekly chart)
- Average days to close
- Fast-track rate (% of claims auto-approved)
- Contestability rate (% of claims flagged)
- SIU referral rate
- Document request rate (how often claims are incomplete)
- Denial rate

**Shown as:** Simple charts + stat cards. Not interactive for prototype.

---

## AI Layer — Detailed

### 1. Document Extraction (Claude)
**Trigger:** Death certificate uploaded
**Input:** Image or PDF → sent to Claude with vision
**Output:** Structured JSON:
```json
{
  "deceased_name": "John Michael Smith",
  "date_of_death": "2026-03-01",
  "cause_of_death": "Acute myocardial infarction",
  "manner_of_death": "Natural",
  "certifying_physician": "Dr. Emily Torres",
  "jurisdiction": "St. Louis County, Missouri",
  "certificate_number": "2026-MO-041892"
}
```

### 2. Risk Scoring (Claude)
**Trigger:** Claim submitted (all data collected)
**Input:** Full claim data + mock policy record
**Output:**
```json
{
  "risk_level": "medium",
  "contestability_alert": true,
  "months_since_issue": 14,
  "flags": [
    "Policy within 2-year contestability period",
    "Cause of death (cardiac) not disclosed on application"
  ],
  "recommendation": "contestability_review",
  "summary": "..."
}
```

### 3. Adjuster Copilot (Claude)
**Trigger:** Adjuster asks a question in the chat panel
**Input:** Claim context (full claim data) + adjuster's question
**Output:** Conversational response, context-aware
**Streaming:** Yes — responses stream word by word for responsiveness

### 4. Communication Drafting (Claude)
**Trigger:** Adjuster clicks "Draft Communication"
**Input:** Claim data + template type + any adjuster notes
**Output:** Professional, empathetic letter draft
**Tone:** Clear, compassionate, legally appropriate

---

## Mock Data

For the demo, seed the DB with:

**Mock Policies (5):**
1. Policy LT-29471 — John Smith, issued Jan 2025 (14 months — contestability)
2. Policy LT-18823 — Maria Garcia, issued Mar 2022 (clean, 4 years)
3. Policy FE-00291 — Robert Johnson, issued Oct 2025 (5 months — high risk)
4. Policy LT-44901 — Linda Chen, issued Jun 2023 (clean)
5. Policy IU-10032 — David Williams, issued Aug 2021 (clean)

**Mock Claims (pre-seeded for adjuster demo):**
- 3 at various stages (submitted, under review, pending docs)
- At least 1 with contestability flag
- At least 1 with SIU flag
- 1 approved (to show full lifecycle)

**Mock Adjusters:**
- J. Martinez
- R. Thompson
- A. Patel

---

## Tech Notes

### Auth
- Customer PWA: no login required to start — claim number + email to check status
- Adjuster Dashboard: simple JWT auth (email + password), hardcoded users for demo

### API Routes (planned)
```
POST   /api/claims/lookup          — policy lookup by number or name/DOB/SSN
POST   /api/claims                 — create draft claim
PUT    /api/claims/:id             — update claim (any step)
POST   /api/claims/:id/submit      — finalize and submit
GET    /api/claims/:id/status      — beneficiary status check (claim# + email)
POST   /api/claims/:id/documents   — upload document → S3 → AI extract
POST   /api/claims/:id/verify      — identity verification (mock)

GET    /api/adjuster/claims        — claims queue with filters
GET    /api/adjuster/claims/:id    — claim detail
POST   /api/adjuster/claims/:id/action  — approve / deny / escalate / request docs
POST   /api/adjuster/chat          — AI copilot chat (streaming)
POST   /api/adjuster/draft         — generate communication draft
```

### PWA Requirements
- manifest.json ✅
- Service worker with offline support (cache shell)
- Install prompt handling (beforeinstallprompt)
- Push notification registration

### Deployment
- Frontend: S3 + CloudFront ✅ (CDK)
- Backend: ECS Fargate ✅ (CDK)
- DB: RDS Postgres ✅ (CDK) / SQLite for local dev
- Documents: S3 ✅ (CDK)
- AI: Anthropic Claude API (claude-3-5-sonnet)

---

## Demo Script (for Loom)

1. **Open on desktop browser** — show landing page
2. **Walk through customer flow** — policy lookup, conversational intake, death cert upload + AI extraction, identity verify (mock), submit
3. **Show PWA install** — "And here's the same experience on my phone" — pull out phone, open installed app, show claim tracker
4. **Switch to adjuster dashboard** — show claims queue, click into the contestability-flagged claim
5. **Show AI risk assessment card** — explain the contestability alert, fraud flags
6. **Show AI copilot** — type "draft a letter requesting medical records" → AI writes it in real time
7. **Approve a clean claim** — show how fast a standard claim moves
8. **Close** — mention LLMs + cloud: Claude for AI, AWS (ECS Fargate, RDS, S3, CloudFront), CDK for infra-as-code
