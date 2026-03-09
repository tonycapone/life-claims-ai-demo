# ClaimPath Demo Script

A step-by-step walkthrough of the ClaimPath demo application for presenting to potential clients, stakeholders, or hiring managers. Anyone following this script should be able to run the demo successfully without prior knowledge of the product.

**Demo URL:** https://claimpath.click

**Estimated total time:** 12-15 minutes (can be shortened to 8 minutes by trimming talking points)

---

## Quick Reference: Demo Credentials

| Portal | Username / Email | Password | Notes |
|--------|-----------------|----------|-------|
| Customer App (Carrier Login) | john.smith@email.com | password123 | Any credentials work; these match the demo persona |
| Adjuster Dashboard | jmartinez | password123 | Also available: `rthompson`, `apatel` |

**Death certificate PDFs (choose one):**
- **Low-risk:** `/demo/death-certificate-smith.pdf` — natural death, cardiac arrest (straightforward claim)
- **High-risk:** `/demo/death-certificate-smith-high-risk.pdf` — accidental death, rock climbing fall (triggers hazardous activity mismatch + beneficiary change flags)

**Policy number to use:** `LT-29471` (John Michael Smith, $500K Term Life, 14 months old -- triggers contestability)

---

## Pre-Demo Checklist

- [ ] Open https://claimpath.click in a browser (Chrome recommended)
- [ ] Download the death certificate PDF you want to use: either `death-certificate-smith.pdf` (low-risk) or `death-certificate-smith-high-risk.pdf` (high-risk) and save to your desktop
- [ ] If showing the customer app on a phone, have it open in a separate mobile browser or use browser dev tools to emulate a mobile viewport (390x844 iPhone 14 Pro)
- [ ] If possible, have two browser windows ready: one for the customer experience, one for the adjuster dashboard
- [ ] Clear any previous chat state by clearing localStorage if you have run the demo before (DevTools > Application > Local Storage > Clear)
- [ ] Run `npm run db:seed` on the backend before the demo to ensure fresh seed data (stale Smith claims are auto-cleaned)

---

## Part 1: The Landing Page (1-2 minutes)

### What you see

Navigate to https://claimpath.click. You land on the demo landing page with:

- The **ClaimPath** logo and tagline: "The missing claims module for modern life insurance."
- A subtitle describing it as "an AI-native prototype"
- Two portal cards: **Customer App** and **Adjuster Dashboard**
- A "What the AI does" section with four capabilities: conversational claim intake, AI risk scoring, adjuster copilot, AI-drafted communications
- A context paragraph at the bottom

### Talking points

> "Modern life insurance platforms have digitized origination, underwriting, and policy admin. But when a policyholder dies and a beneficiary needs to file a claim, that process is still largely manual, paper-driven, and handled differently by every carrier. ClaimPath is a prototype of what a modern, AI-native claims module looks like."

> "There are two sides to this -- the customer-facing app where beneficiaries file claims, and the adjuster dashboard where claims professionals review and process them. Both are powered by the same backend and the same AI. Let me show you both."

### What to click

**Click the "Customer App" card** to proceed to the carrier login.

---

## Part 2: The Customer Experience (5-7 minutes)

This is the most important part of the demo. The customer flow shows the conversational FNOL (First Notice of Loss) chat -- the core product experience.

### Step 2.1: Carrier Login

**URL:** `/carrier/login`

You see a carrier-branded login screen for "Tidewell Life Insurance" (a fictional carrier). This is a white-label app shell -- the branding, colors, and logo are all configurable via a single config file.

**What to do:**
1. Note the demo credentials shown at the bottom: `john.smith@email.com / password123`
2. You can enter those credentials, or simply click **"Sign in with Face ID"** -- both work

> "Notice this isn't the ClaimPath brand -- it's a fictional carrier called Tidewell Life Insurance. The entire customer experience is white-label. Swap one config file and the whole app re-skins for any carrier. This is designed as a module, not a standalone product."

### Step 2.2: Carrier Home Screen

**URL:** `/carrier/home`

You see a polished mobile app home screen with:
- A greeting ("Good morning/afternoon/evening, John")
- A hero banner image
- A **policy card** showing: Term Life Insurance, $500,000, Active, Policy # LT-29471, insured name, issue date, premium info
- A **2x2 grid of quick actions**: Chat, Make a Payment, Documents, Contact Us
- A **recent activity feed** with mock transaction history
- A floating **chat button** (teal FAB) in the bottom-right corner
- A support phone number at the bottom

> "This is John Smith's account -- he's the policyholder. Notice it looks and feels like a real carrier's mobile app. The only live action is the Chat button, which opens a general-purpose AI assistant."

**What to click:** Tap **"Chat"** (top-left action button) or the floating chat button in the bottom-right corner.

### Step 2.3: Agent-Powered Chat

**URL:** `/carrier/chat`

This is a **general-purpose AI assistant** powered by a Strands Agent with tools. It can answer any question about John's policy. When the user mentions a death, the agent naturally transitions into claim filing -- no mode switching, no keyword detection. The agent reasons.

**What you see initially:**
- A header bar with "Chat" title and a back arrow
- The AI's opening message: "Hi John! How can I help you today?"
- A text input at the bottom
- **No progress dots** -- this starts as a general assistant, not a claim form

> "This is John's account. The chat is a general-purpose AI assistant -- it can answer questions about his policy, payments, beneficiaries, anything. There's no 'file a claim' mode. Watch what happens when someone reports a death."

#### Step 2.3.1: Ask a general policy question

**Type:** `When is my next payment?`

**What happens:**
- The agent calls the `get_payment_info()` tool behind the scenes
- It responds with real data from the policy: next payment date, amount, autopay status
- This demonstrates the agent is a real assistant, not just a claims form

> "The AI called a tool to look up the actual payment information. This isn't canned -- it's reading from the policy database. Let me ask another question."

#### Step 2.3.2: Ask about beneficiaries

**Type:** `Who are my beneficiaries?`

**What happens:**
- The agent calls the `get_beneficiaries()` tool
- It responds with the beneficiary list: Sarah Smith, spouse, 100%

> "Again, real data from the policy. Now here's where it gets interesting -- imagine Sarah picks up John's phone after he passes away."

#### Step 2.3.3: Report a death

**Type:** `My husband passed away last week`

**What happens:**
- The agent responds with genuine empathy
- It asks who it's speaking with and their relationship to the insured
- **No mode switch**, no keyword detection -- the agent reasons that someone is reporting a death on the policyholder's account
- The header still says "Chat" (it changes to "File a Claim" once a claim is created)

> "Notice what just happened. The AI didn't switch into 'claim mode' based on a keyword. It reasoned: someone on John's account just said their husband died. It responded with empathy and asked who it's speaking with. This is an AI agent, not a state machine."

#### Step 2.3.4: Provide identity

**Type:** `I'm Sarah, his wife. My phone is 555-867-5309 and my email is sarah@email.com`

**What happens:**
- The agent recognizes it has enough information to start a claim
- It calls `start_claim()` behind the scenes, creating a real claim in the database
- A `state` event pushes claim_id and beneficiary info to the frontend
- The header changes to **"File a Claim"** and **progress dots** appear
- The agent confirms the claim was created and asks for identity verification of the insured

> "The agent decided it had enough information -- name, relationship, phone, email -- and created the claim automatically. Watch the header change and the progress dots appear. Now it needs to verify the insured's identity before proceeding."

#### Step 2.3.5: Verify insured identity

The agent asks you to confirm the insured's identity -- full legal name, date of birth, and last 4 of their Social Security number. This is standard claims procedure.

**Type:** `His full name is John Michael Smith, born April 15, 1968, and his last four are 4471`

**What happens:**
- The agent confirms the identity details match the policy on file
- It proceeds to request the death certificate

> "The agent is following a real claims checklist -- it needs to verify who the deceased is before processing a half-million-dollar death benefit. Name, DOB, last four of the SSN. This is exactly what a claims rep would ask for."

#### Step 2.3.6: Upload the death certificate

The agent requests a death certificate upload. An **upload widget** appears inline in the chat with:
- A "Upload Death Certificate" header
- A drag-and-drop zone with "Tap to upload or drag and drop" text
- Accepted formats: PDF, JPG, or PNG
- An "I don't have it right now" skip link at the bottom

**What to do:**
1. Click the upload zone
2. Select the death certificate PDF you downloaded earlier (`death-certificate-smith.pdf` for low-risk or `death-certificate-smith-high-risk.pdf` for high-risk)
3. A "**Analyzing document...**" spinner appears while the AI processes the document

**What happens after upload:**
- The AI extracts fields from the death certificate using Claude's document understanding
- A **"Certificate processed"** card appears with a green checkmark, showing extracted fields:
  - Deceased Name: John Michael Smith
  - Date of Death: 2026-03-01
  - Cause of Death: Acute myocardial infarction
  - Manner of Death: Natural
  - Certifying Physician: Dr. Emily Torres
  - Jurisdiction: St. Louis County, Missouri
  - Certificate Number: 2026-MO-041892
- Two buttons appear: **"Looks correct -- continue"** and **"Re-upload"**

**Click:** **"Looks correct -- continue"**

> "This is AI document extraction in action. The death certificate PDF is sent to Claude, which reads the document and extracts seven structured fields. The extracted data auto-populates three claim fields automatically."

#### Step 2.3.7: Payout preference

The AI asks about payout preference.

**Type:** `Lump sum please`

**What happens:**
- The agent calls `update_claim()` with the payout preference
- The agent then calls `show_claim_review()` to display the review card
- A **review card** appears inline showing all collected information

> "The agent decided all required information has been collected and showed the review card. Nine data points collected through a natural conversation -- starting from general policy questions and transitioning naturally into claim filing."

#### Step 2.3.8: Review and submit

The review card shows:
- All 9 fields with their values in a clean summary table
- A certification checkbox: "I certify that the information provided is true and accurate to the best of my knowledge."
- A **"Submit Claim"** button (disabled until the checkbox is checked)

**What to do:**
1. Check the certification checkbox
2. Click **"Submit Claim"**

#### Step 2.3.9: Confirmation screen

**URL:** `/claim/confirmation`

After submission, you see:
- A large green checkmark
- "Claim Submitted" heading
- The claim number (e.g., `CLM-2026-XXXXX`)
- A **"What happens next"** tracker with four steps:
  1. Claim Received (green checkmark -- complete)
  2. Under Review (hourglass -- active/current)
  3. Decision (pending)
  4. Payout (pending)
- An info box with email update promise
- A **"Done"** button

> "The beneficiary gets a claim number, a visual timeline of what comes next, and a promise of email updates. On the backend, AI risk scoring has already run -- that claim is sitting in the adjuster's queue right now, pre-scored. Let me show you."

**Do not click "Done" yet** -- note the claim number. You will look for it in the adjuster queue.

---

## Part 3: The Adjuster Dashboard (4-5 minutes)

### Step 3.1: Navigate to adjuster login

Open a new browser tab (or window) and navigate to https://claimpath.click/adjuster/login

Alternatively, navigate back to the landing page (https://claimpath.click) and click the **"Adjuster Dashboard"** card.

### Step 3.2: Adjuster login

**URL:** `/adjuster/login`

You see a clean login form with:
- "ClaimPath" heading with "Adjuster Dashboard" subtitle
- Username and password fields
- Demo credentials shown at the bottom: `jmartinez / password123`

**What to do:**
1. Enter username: `jmartinez`
2. Enter password: `password123`
3. Click **"Sign In"**

### Step 3.3: Claims queue

**URL:** `/adjuster/queue`

You see the claims queue -- the adjuster's primary workspace. The page shows:

**Header bar:** "ClaimPath Adjuster" with the logged-in adjuster's name (J. Martinez) and a Logout button.

**Stats bar** at the top with four cards:
- **Open Claims** -- total count (blue)
- **High Risk** -- count of high-risk claims (red)
- **Contestable** -- count of contestability-flagged claims (orange)
- **Avg Days Open** -- average days since submission (gray)

**Filter dropdowns:** Status filter (All Statuses, Submitted, Under Review, etc.) and Risk Level filter (All, Low, Medium, High).

**Claims table** with columns:
- Claim # (with warning icon for contestability-flagged claims)
- Beneficiary name
- Insured name
- Amount (face value)
- Status (color-coded badge)
- Risk (color-coded badge: green/yellow/red)
- Days open

**Pre-seeded claims in the queue:**

| Claim # | Beneficiary | Insured | Amount | Status | Risk |
|---------|-------------|---------|--------|--------|------|
| CLM-2026-00135 | Carlos Garcia | Maria Elena Garcia | $250,000 | Under Review | Low |
| CLM-2026-00140 | Patricia Johnson | Robert James Johnson | $25,000 | Submitted | High |
| CLM-2026-00129 | David Chen | Linda Wei Chen | $750,000 | Approved | Low |
| (New) Sarah Smith claim | Sarah Smith | John Michael Smith | $500,000 | Submitted | Medium/varies |

> "The claim Sarah just filed is already here -- submitted, risk-scored, ready for review. And notice the contrast: three different claims at different risk levels. The AI assessed each one independently based on the actual facts."

**Point out the high-risk claim:** CLM-2026-00140 (Patricia Johnson / Robert James Johnson) has a warning icon, "High" risk badge, and "Submitted" status.

### Step 3.4: Open the newly filed claim (Sarah Smith)

**Click** on the Sarah Smith claim row in the table.

**URL:** `/adjuster/claims/:id`

### Step 3.5: Claim detail page

The claim detail page is a two-column layout:

**Header bar:** Shows the claim number, a back arrow ("< Queue"), and a **"Take Action"** button (accent color).

**Left column -- Claim Data:**

Four information cards stacked vertically:

1. **Policy Information** -- Policy number (LT-29471), insured name (John Michael Smith), policy age in months
2. **Beneficiary** -- Name, email, phone, relationship, identity verification status
3. **Death Details** -- Date of death, cause (acute myocardial infarction), manner (natural)
4. **Claim Details** -- Status, payout method, created date, assigned adjuster

Plus a **Communications** section with three draft buttons.

**Right column -- AI Intelligence:**

5. **AI Risk Assessment Card** (color-coded border based on risk level):
   - Risk level badge (e.g., "medium risk" with yellow indicator)
   - **AI Summary** -- a 2-3 sentence natural language assessment written by the AI (this is NOT canned -- it references specific claim details)
   - **Contestability alert** (if applicable) -- yellow warning box: "Policy issued 14 months ago -- within 2-year contestability window. Recommend medical records review."
   - **Risk flags** -- bullet list of specific concerns identified by the AI
   - **Recommendation** -- e.g., "contestability review"

6. **Regulatory Timeline Card** -- state-specific compliance deadlines:
   - Shows the claim's jurisdiction (e.g., "Illinois") and statute reference
   - Two deadline bars: Acknowledgment and Decision
   - Each shows due date, days remaining, and color-coded status (green = on track, yellow = approaching, red = overdue)
   - Status is calculated automatically from the claim filing date and state-specific rules

7. **AI Copilot Panel** -- a chat interface for the adjuster to ask questions about the claim

> "Look at the risk assessment card. This isn't a template -- the AI wrote this summary by analyzing the actual claim data. It caught that the policy is 14 months old, inside the 2-year contestability window. It noted the cause of death and whether it aligns with the original application. Different claims produce completely different assessments."

> "And notice the regulatory timeline below it -- the system automatically tracks state-specific deadlines. This is an Illinois claim, so we have 15 business days to acknowledge and 30 days to decide per 215 ILCS 5/154.6. The deadlines are calculated from the filing date and the system knows whether we're on track, approaching a deadline, or overdue. Go look at the Linda Chen claim later -- that's a California claim, different statute, different rules, all handled automatically."

### Step 3.6: Run Contestability Analysis (THE Demo Moment)

Below the risk card, you'll see a **Contestability Analysis** card with a prominent button: **"Run Contestability Analysis"**. This only appears for claims within the 2-year contestability window.

> "Now here's where it gets really powerful. This policy is 14 months old -- within the 2-year contestability period. The adjuster has the original insurance application and the insured's medical records. Normally, an adjuster spends 2-3 days reading through these documents line by line, comparing what the applicant disclosed against what the medical records show. Let me show you what AI can do."

**Click** the **"Run Contestability Analysis"** button.

**What happens:**
- A loading state appears: "Analyzing application against medical records..."
- The AI compares the insurance application health questionnaire answers against the actual medical records
- After a few seconds, a detailed **Contestability Analysis Report** appears

**The report shows:**

1. **Header** with a red severity indicator: "4 Material" discrepancies found

2. **Summary**: "Four material misrepresentations identified on the insurance application..."

3. **Discrepancy Table** -- each finding is a structured card showing:
   - **Application Question**: "Have you ever been diagnosed with heart disease?"
   - **Applicant's Answer**: "No" (highlighted in red)
   - **Medical Record Finding**: "Patient was diagnosed with atrial fibrillation on June 15, 2023..." (with source date)
   - **Assessment**: "Material misrepresentation -- AFib is a form of cardiac arrhythmia..."

4. **Materiality Assessment**: "The undisclosed conditions are directly and causally related to the cause of death (acute myocardial infarction / STEMI)..."

5. **AI Recommendation**: "contestability review"

> "In seconds, the AI compared the original insurance application against the medical records and found four material misrepresentations. The applicant denied having heart disease, but the records show an atrial fibrillation diagnosis. He denied being on blood pressure medication, but he was on lisinopril. He denied ER visits, but there's a chest pain ER visit nine months before the application. And he denied taking any medications while actively on four cardiovascular drugs."

> "This analysis normally takes an adjuster 2-3 days of manual review. The AI did it in seconds. And notice -- the undisclosed conditions are directly related to the cause of death. The insured died of a heart attack, and he concealed a history of heart disease. That's the kind of finding that changes the trajectory of a $500,000 claim."

> "This single feature -- application versus medical records comparison -- is what shifts the conversation from 'nice demo' to 'when can we pilot this.' It's the same core AI capability as medical records parsing on the underwriting side, just applied to the other end of the policy lifecycle."

**Tip:** You can also open the insurance application and medical records PDFs from the landing page's "Demo resources" section to show the audience what the AI was analyzing. The application shows the yes/no health questionnaire, and the medical records show the actual doctor visits and prescriptions that contradict those answers.

### Step 3.7: Demonstrate the AI Copilot (if time permits)

The copilot panel shows:
- A header with "AI Copilot" label
- **Suggested Actions** (shown when no messages have been sent):
  - "Request medical records"
  - "Draft approval letter"
  - "Explain contestability rules"
  - "What are the red flags?"
- A text input area with "Ask anything about this claim..." placeholder
- A Send button

**Option A -- Click a suggested action:**

Click **"What are the red flags?"**

The AI streams a response analyzing the specific claim's risk factors. Wait for it to complete.

**Option B -- Type a custom question:**

**Type:** `What should I do next with this claim?`

The AI responds with context-aware advice based on the claim data (e.g., recommending medical records review for contestability, etc.).

**Option C -- Ask for a draft letter:**

**Type:** `Draft a letter requesting medical records from the beneficiary`

The AI generates a professional, empathetic letter in real time, addressing the beneficiary by name and referencing the specific claim number.

> "The copilot has full context on the claim -- policy details, beneficiary info, risk assessment, everything. It's not just a generic chatbot. Ask it about contestability and it explains the rules in the context of THIS specific claim. Ask it to draft a letter and it personalizes it with the beneficiary's name and claim number."

**Tip:** Wait for the streaming response to finish completely before asking another question. The responses render with Markdown formatting.

### Step 3.8: Draft a communication

Scroll down the left column to the **Communications** section.

**Click** one of the draft buttons:
- **"Acknowledgment"** -- drafts a claim-received letter
- **"Status Update"** -- drafts a status update letter
- **"Doc Request"** -- drafts a document request letter

**What happens:**
- The AI generates a professional letter with:
  - A subject line (editable)
  - A full letter body (editable in a textarea)
  - The beneficiary's name, claim number, and adjuster name inserted automatically
- Both the subject and body are fully editable -- the adjuster can modify before sending

> "One click generates a personalized, professional letter. It's addressed to the beneficiary by name, references the claim number, and signs off with the adjuster's name. And it's fully editable -- the adjuster reviews and modifies before sending."

### Step 3.9: Take action on the claim

**Click** the **"Take Action"** button in the header bar.

A modal appears with a 2x2 grid of action buttons:
- **Move to Review** (gray)
- **Approve Claim** (green)
- **Deny Claim** (red)
- **Escalate to SIU** (red)
- **Request Documents** (gray)
- **Open Contestability Review** (gray)

Plus:
- A notes field (optional internal notes)
- A document type dropdown (appears only when "Request Documents" is selected, with options: Medical Records, Autopsy Report, Original Application, Beneficiary ID)
- **"Confirm Action"** and **"Cancel"** buttons

**For the demo, select "Move to Review"** and click Confirm Action. The claim status updates.

> "The adjuster can approve, deny, escalate to SIU, request documents, or open a formal contestability review -- all from one screen. Every action is logged in the audit trail."

### Step 3.10: Show the high-risk contrast

**Click** the **"< Queue"** button to go back to the claims queue.

**Click** on the **CLM-2026-00140** claim (Patricia Johnson / Robert James Johnson).

This is a **high-risk** claim with very different characteristics:
- **Final Expense** policy (FE-00291), only $25,000
- Policy purchased only **5 months ago** -- deep inside the contestability window
- Cause of death: Unknown
- Manner of death: Accident
- Identity NOT verified
- Risk level: **High** (red badge)
- Multiple risk flags:
  - "Policy purchased only 5 months before death"
  - "Cause of death listed as unknown/accident -- requires investigation"
  - "Policy within 2-year contestability period"
- AI recommendation: **SIU referral**

> "Compare this to the Sarah Smith claim. Same system, completely different assessment. A final expense policy purchased 5 months before death, cause unknown, accident -- the AI flagged it immediately and recommended SIU referral. The AI reasons about the actual facts, not a template."

---

## Part 4: Wrap-Up (1-2 minutes)

Navigate back to the landing page (https://claimpath.click).

### Key value propositions

> "What you just saw is a full claims lifecycle -- from a grieving beneficiary filing a claim through a conversation, to an adjuster reviewing it with AI-powered risk scoring and a copilot. Here's what makes this different:"

1. **An AI agent, not a form.** The customer starts with a general-purpose assistant. When they report a death, the agent naturally transitions into claim filing -- no mode switching, no keyword detection. It reasons about context and calls tools to create claims, request documents, and guide the process.

2. **AI risk scoring happens instantly.** The moment a claim is submitted, it's already assessed -- contestability, fraud indicators, recommended next steps. The adjuster doesn't start from scratch.

3. **The copilot knows the claim.** It's not a generic chatbot. It has full context on every claim detail and can draft communications, explain risks, and suggest actions.

4. **Nothing is canned.** Every risk assessment, every copilot response, every drafted letter is generated live from the actual claim data. File a different claim with different details and you get a completely different analysis.

5. **White-label ready.** The customer app is carrier-branded from a single config. Swap the config and the entire experience re-skins for a different carrier.

6. **Contestability analysis in seconds.** The biggest time sink in claims -- an adjuster spending 2-3 days comparing medical records against the insurance application -- is done by AI in seconds. Four material misrepresentations found instantly, with structured evidence and legal citations.

### The bigger picture

> "What you just saw is the same core AI capability as medical records parsing on the underwriting side -- reading, comparing, and reasoning about complex medical documents -- just applied to the other end of the policy lifecycle. The contestability analysis alone, according to one COO review, 'is not a 15-minute time savings -- it's a 2-day time savings per contestability claim. That alone justifies the entire platform.'"

---

## Troubleshooting

### The carrier chat is not responding
- Check that the backend is running and the API is reachable
- Check browser DevTools console for errors
- If Bedrock is unavailable, the system falls back to keyword-based mock responses (the experience still works, but the agent won't reason or call tools)

### The death certificate extraction shows generic data
- This means Bedrock/Claude is not available and the system fell back to mock extraction
- The real extraction with Bedrock returns accurate fields from the PDF

### The adjuster login fails
- Use exactly `jmartinez` (not an email) with password `password123`
- If the database has been reset, run `npm run db:seed` first

### The new claim doesn't appear in the adjuster queue
- The claim only appears after submission (clicking "Submit Claim" on the review card)
- If you navigate away before submitting, the claim stays in draft status and won't show in the queue
- Refresh the queue page after submitting

### Progress dots aren't filling in
- The dots represent the 9 required fields: policy_number, beneficiary_name, beneficiary_email, beneficiary_phone, beneficiary_relationship, date_of_death, cause_of_death, manner_of_death, payout_method
- Dots fill as the AI successfully extracts each field
- If a field isn't recognized, try rephrasing (e.g., "My name is Sarah Smith" instead of a complex sentence)

### Clearing state for a fresh demo
- Open browser DevTools > Application > Local Storage > Clear all
- This resets the chat state so you can start fresh
- Run `npm run db:seed` on the backend to reset seed data

---

## Appendix: Seed Data Reference

### Policies

| Policy # | Insured | Type | Face Amount | Issue Date | Contestable? |
|----------|---------|------|-------------|------------|-------------|
| LT-29471 | John Michael Smith | Term | $500,000 | ~14 months ago | Yes |
| LT-18823 | Maria Elena Garcia | Term | $250,000 | ~4 years ago | No |
| FE-00291 | Robert James Johnson | Final Expense | $25,000 | ~5 months ago | Yes (high risk) |
| LT-44901 | Linda Wei Chen | Term | $750,000 | ~3 years ago | No |
| IU-10032 | David Anthony Williams | IUL | $1,000,000 | ~2.5 years ago | No |

### Pre-seeded Claims

| Claim # | Beneficiary | Insured | Status | Risk | Assigned |
|---------|-------------|---------|--------|------|----------|
| CLM-2026-00135 | Carlos Garcia | Maria Elena Garcia | Under Review | Low | R. Thompson |
| CLM-2026-00140 | Patricia Johnson | Robert James Johnson | Submitted | High | Unassigned |
| CLM-2026-00129 | David Chen | Linda Wei Chen | Approved | Low | A. Patel |

### Adjuster Accounts

| Username | Full Name | Password |
|----------|-----------|----------|
| jmartinez | J. Martinez | password123 |
| rthompson | R. Thompson | password123 |
| apatel | A. Patel | password123 |

---

## Appendix: Timing Guide

| Section | Duration | Notes |
|---------|----------|-------|
| Part 1: Landing Page | 1-2 min | Can be shortened to 30 sec for technical audiences |
| Part 2: Customer Experience | 5-7 min | The core demo; don't rush the FNOL chat |
| Part 3: Adjuster Dashboard | 4-5 min | Show risk card + copilot + high-risk contrast |
| Part 4: Wrap-Up | 1-2 min | Hit the key value props, mention the vision |
| **Total** | **12-15 min** | Can be trimmed to 8 min by skipping some talking points |

### Shortened version (8 minutes)

If time is limited:
1. Skip the carrier login/home screen -- go directly to `/carrier/chat`
2. Skip the general policy questions -- go straight to "My husband passed away"
3. Move quickly through the claim chat (skip talking points between messages)
4. On the adjuster side, show only the newly filed claim (skip the high-risk contrast)
5. Show just one copilot question and one communication draft
6. Keep the wrap-up to 30 seconds
