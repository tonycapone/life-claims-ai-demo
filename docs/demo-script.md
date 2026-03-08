# ClaimPath Demo Script

A step-by-step walkthrough of the ClaimPath demo application for presenting to potential clients, stakeholders, or hiring managers. Anyone following this script should be able to run the demo successfully without prior knowledge of the product.

**Demo URL:** https://claimpath.click

**Estimated total time:** 12-15 minutes (can be shortened to 8 minutes by trimming talking points)

---

## Quick Reference: Demo Credentials

| Portal | Username / Email | Password | Notes |
|--------|-----------------|----------|-------|
| Customer App (Carrier Login) | sarah.smith@email.com | password123 | Any credentials work; these match the demo persona |
| Adjuster Dashboard | jmartinez | password123 | Also available: `rthompson`, `apatel` |

**Death certificate PDF:** Available at `/demo/death-certificate-smith.pdf` on the demo site (download it locally before the demo or have it ready in a separate tab)

**Policy number to use:** `LT-29471` (John Michael Smith, $500K Term Life, 14 months old -- triggers contestability)

---

## Pre-Demo Checklist

- [ ] Open https://claimpath.click in a browser (Chrome recommended)
- [ ] Download the death certificate PDF: https://claimpath.click/demo/death-certificate-smith.pdf and save it to your desktop or downloads folder
- [ ] If showing the customer app on a phone, have it open in a separate mobile browser or use browser dev tools to emulate a mobile viewport (390x844 iPhone 14 Pro)
- [ ] If possible, have two browser windows ready: one for the customer experience, one for the adjuster dashboard
- [ ] Clear any previous FNOL chat state by clearing localStorage if you have run the demo before (DevTools > Application > Local Storage > Clear)
- [ ] Run `npm run db:seed` on the backend before the demo to ensure fresh seed data (stale Sarah Smith claims are auto-cleaned)

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
1. Note the demo credentials shown at the bottom: `sarah.smith@email.com / password123`
2. You can enter those credentials, or simply click **"Sign in with Face ID"** -- both work

> "Notice this isn't the ClaimPath brand -- it's a fictional carrier called Tidewell Life Insurance. The entire customer experience is white-label. Swap one config file and the whole app re-skins for any carrier. This is designed as a module, not a standalone product."

### Step 2.2: Carrier Home Screen

**URL:** `/carrier/home`

You see a polished mobile app home screen with:
- A greeting ("Good morning/afternoon/evening, Tony")
- A hero banner image
- A **policy card** showing: Term Life Insurance, $500,000, Active, Policy # LT-29471, insured name, issue date, premium info
- A **2x2 grid of quick actions**: File a Claim, Make a Payment, Documents, Contact Us
- A **recent activity feed** with mock transaction history
- A support phone number at the bottom

> "This looks and feels like a real carrier's mobile app. It shows the policyholder their coverage, payment history, quick actions. Everything here is static except one button -- File a Claim. That's where our product begins."

**What to click:** Tap **"File a Claim"** (top-left action button). This is the only live action; the other three buttons are intentionally non-functional.

### Step 2.3: FNOL Chat -- Filing a Claim

**URL:** `/claim/chat`

This is the conversational claims intake. The AI guides the beneficiary through filing a death benefit claim step by step, collecting structured data from natural conversation.

**What you see initially:**
- A header bar with "File a Claim" title and a back arrow
- **Progress dots** in the top-right corner (9 dots representing the 9 required fields)
- The AI's opening message: "I'm so sorry for your loss. I'm here to help you file a death benefit claim -- I'll walk you through it step by step. Let's start with your policy number..."
- A text input at the bottom

#### Step 2.3.1: Provide the policy number

**Type:** `My policy number is LT-29471`

**What happens:**
- The AI extracts the policy number from your natural language
- A **policy confirmation card** appears inline showing: Policy number, masked insured name (J**** M****** S****), and policy type
- The AI streams a response asking for your information next
- The first progress dot fills in

**Wait for** the AI response to finish streaming before proceeding.

**Click:** The **"Yes, that's correct"** button on the policy confirmation card.

> "Two AI calls happen simultaneously behind the scenes. One extracts the policy number from my message -- it could be buried in a sentence, and the AI pulls it out. The other streams a natural, empathetic response. The policy is looked up in real time and a confirmation card appears inline."

#### Step 2.3.2: Provide beneficiary information

**Type:** `I'm Sarah Smith, his wife. My email is sarah.smith@email.com and my phone is 555-867-5309`

**What happens:**
- The AI extracts four fields from one natural sentence: beneficiary name, relationship, email, phone
- Four more progress dots fill in (beneficiary_name, beneficiary_email, beneficiary_phone, beneficiary_relationship)
- The AI responds, acknowledging the information and moving to the next step

**Wait for** the AI response to finish streaming.

> "I gave it four pieces of information in one natural sentence -- my name, relationship, email, and phone number. The AI extracted all four structured fields. Watch the progress dots fill in. It never felt like a form."

#### Step 2.3.3: Upload the death certificate

After beneficiary info is collected, the AI asks if you have a copy of the death certificate. An **upload widget** appears inline in the chat with:
- A "Upload Death Certificate" header
- A drag-and-drop zone with "Tap to upload or drag and drop" text
- Accepted formats: PDF, JPG, or PNG
- An "I don't have it right now" skip link at the bottom

**What to do:**
1. Click the upload zone
2. Select the death certificate PDF you downloaded earlier (`death-certificate-smith.pdf`)
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

> "This is AI document extraction in action. The death certificate PDF is sent to Claude, which reads the document and extracts seven structured fields -- deceased name, date, cause of death, physician, jurisdiction, certificate number. The extracted data auto-populates three claim fields: date of death, cause, and manner. The beneficiary just confirms it looks right."

**Important:** Three more progress dots fill in automatically (date_of_death, cause_of_death, manner_of_death) because the death certificate extraction populated those fields.

#### Step 2.3.4: Payout preference

The AI asks about payout preference since almost all fields are now collected.

**Type:** `Lump sum please`

**What happens:**
- The AI extracts payout_method = "lump_sum"
- The final progress dot fills in
- All 9 required fields are now collected
- A **review card** appears inline showing all collected information

> "That's the last field. Nine data points collected through a natural conversation -- and three of them came automatically from the death certificate. Under three minutes, and it never felt like filling out a form."

#### Step 2.3.5: Review and submit

The review card shows:
- All 9 fields with their values in a clean summary table
- A certification checkbox: "I certify that the information provided is true and accurate to the best of my knowledge."
- A **"Submit Claim"** button (disabled until the checkbox is checked)

**What to do:**
1. Check the certification checkbox
2. Click **"Submit Claim"**

#### Step 2.3.6: Confirmation screen

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
- An info box: "We'll email updates to sarah.smith@email.com. Standard claims are typically resolved within 14-30 days."
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

6. **AI Copilot Panel** -- a chat interface for the adjuster to ask questions about the claim

> "Look at the risk assessment card. This isn't a template -- the AI wrote this summary by analyzing the actual claim data. It caught that the policy is 14 months old, inside the 2-year contestability window. It noted the cause of death and whether it aligns with the original application. Different claims produce completely different assessments."

### Step 3.6: Demonstrate the AI Copilot

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

### Step 3.7: Draft a communication

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

### Step 3.8: Take action on the claim

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

### Step 3.9: Show the high-risk contrast

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

1. **Conversational intake replaces forms.** The beneficiary never fills out a form. The AI extracts structured data from natural conversation and documents.

2. **AI risk scoring happens instantly.** The moment a claim is submitted, it's already assessed -- contestability, fraud indicators, recommended next steps. The adjuster doesn't start from scratch.

3. **The copilot knows the claim.** It's not a generic chatbot. It has full context on every claim detail and can draft communications, explain risks, and suggest actions.

4. **Nothing is canned.** Every risk assessment, every copilot response, every drafted letter is generated live from the actual claim data. File a different claim with different details and you get a completely different analysis.

5. **White-label ready.** The customer app is carrier-branded from a single config. Swap the config and the entire experience re-skins for a different carrier.

### The bigger vision

> "And there's a clear roadmap for what makes this truly transformative: contestability analysis. The biggest time sink in claims is an adjuster spending two to three days reading medical records, comparing them line by line against the insurance application, looking for material misrepresentations. AI can do that comparison in seconds. That's the same capability as Underwriter Assist -- parsing medical records -- just applied to the other end of the policy lifecycle."

---

## Troubleshooting

### The FNOL chat is not responding
- Check that the backend is running and the API is reachable
- Check browser DevTools console for errors
- If Bedrock is unavailable, the system falls back to mock responses (the experience still works, but responses are simpler)

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
- This resets the FNOL chat state so you can start fresh
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
1. Skip the carrier login/home screen -- go directly to `/claim/chat`
2. Move quickly through the FNOL chat (skip talking points between messages)
3. On the adjuster side, show only the newly filed claim (skip the high-risk contrast)
4. Show just one copilot question and one communication draft
5. Keep the wrap-up to 30 seconds
