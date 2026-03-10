# Life Insurance Death Benefit Claims — Research Brief

## Overview

This document captures research on the life insurance death benefit claims process, including current workflows, pain points, industry terminology, and AI opportunities.

---

## The Death Benefit Claims Process

### Step 1: First Notice of Loss (FNOL)

The official start of a claim. Beneficiary contacts the carrier to report the insured's death.

**What gets collected:**
- Policy number (or insured name + SSN + DOB to look it up)
- Beneficiary name and contact info
- Relationship to insured
- Date of death
- Cause of death (initial)

**Current state:** Mostly still phone calls and paper forms at legacy carriers. Modern carriers are moving to web portals and mobile apps, but the experience is still largely transactional and cold. No guidance, no status transparency, no empathy built into the flow.

**The opportunity:** Conversational AI intake that guides a grieving beneficiary through the process, collects complete information upfront, and validates everything in real time — eliminating the back-and-forth that delays most claims.

---

### Step 2: Document Collection

Required documents (minimum):
- **Certified death certificate** — must show cause and manner of death. Most carriers want the original certified copy, not a photocopy.
- **Completed claim form** (beneficiary statement)
- **Government-issued photo ID** of the beneficiary
- **Proof of relationship** (in some cases: marriage certificate, birth certificate)
- **Bank account info** for payout

Additional docs that may be required:
- Medical records (if death is within contestability period)
- Autopsy report (if accidental or suspicious death)
- Police report (if applicable)
- Original policy document (if available)

**Pain point:** Missing a single document can stall the claim for weeks. Carriers send a generic "we need more information" letter with little guidance. Beneficiaries are grieving and have to navigate bureaucracy with zero support.

---

### Step 3: Beneficiary Identity Verification

**Phase 1 (to open the claim — low bar):**
- Policy number OR insured name + DOB + last 4 SSN
- Beneficiary name matches what's on file
- Claim opens, packet gets sent

**Phase 2 (before money moves — high bar):**
- Government-issued ID scan (driver's license or passport)
- Biometric selfie match — AI compares face on ID to live selfie (same tech as opening a bank account online)
- SSN cross-reference
- Bank account details for payout

Modern carriers use identity verification services like **Persona**, **Jumio**, or **Onfido** for this. It's a ~1-minute digital flow.

**Multiple beneficiaries:** If the policy names multiple beneficiaries (e.g., spouse 60%, two children 20% each), each beneficiary must verify separately and submit their own claim. A significant and underappreciated pain point.

---

### Step 4: Coverage Verification

Adjuster (or automated system) checks:
- Is the policy in force? (not lapsed or canceled)
- Are premiums current?
- Does the cause of death fall within covered causes?
- Any applicable exclusions? (e.g., suicide within first 2 years, war, aviation)
- Is the claimant the actual listed beneficiary?
- What is the face amount / benefit amount?

---

### Step 5: Investigation / Contestability Review

**The contestability period** is the most legally significant phase. Standard across US carriers: the first **2 years** after policy issuance. During this window, the carrier can deny a claim for **material misrepresentation** on the original application — things like:

- Undisclosed pre-existing conditions
- Misrepresented smoking status
- Unreported risky hobbies (skydiving, etc.)
- Incorrect age or income

**Stats:**
- ~20% of contestability-period claims are rescinded
- Rate is higher for simplified-issue policies and younger insureds
- ~1-3% of all life claims are investigated for fraud or denied

**Fraud red flags adjusters look for:**
- Policy purchased shortly before death (especially if insured was ill)
- Beneficiary changed recently, especially to someone unrelated
- Multiple life policies across different carriers taken out in a short window
- Inconsistencies between cause of death and what was disclosed in the application
- Policy owner/payer has no clear insurable interest in the insured

**SIU (Special Investigation Unit):** Most carriers have a small team (often 1-3 people) dedicated to fraud investigation. Very few have algorithmic flagging — it's mostly manual. The industry estimates fraud costs $10-20 billion/year across life lines.

---

### Step 6: Decision & Payout

**Timelines:**
| Claim Type | Typical Timeline |
|---|---|
| Standard claim (clean) | 1-3 weeks |
| Contestability review | 4-8 weeks |
| Accidental death | 4-12 weeks |
| Incomplete documentation | Varies (often weeks of delay) |
| Fraud investigation | Open-ended |

**Payout options:**
- Lump sum (most common)
- Structured settlement / installment payments
- Retained asset account (interest-bearing account held by insurer)

State regulations require carriers to pay interest on delayed claims (typically 10%/year after a certain window).

---

## Industry Terminology

| Term | Meaning |
|---|---|
| **FNOL** | First Notice of Loss — the claim-opening event |
| **Contestability period** | First 2 years; carrier can deny for misrepresentation |
| **LAE** | Loss Adjustment Expense — cost to process a claim; AI reduces this |
| **Fast-track** | Simple, clean claims routed for quick processing |
| **Non-fast-track** | Complex claims requiring investigation or review |
| **SIU** | Special Investigation Unit — fraud team |
| **In-force** | Policy is active, premiums current |
| **Beneficiary** | Person(s) entitled to receive the death benefit |
| **Face amount** | The death benefit amount on the policy |
| **Rescission** | Carrier voids the policy and returns premiums instead of paying claim |
| **Material misrepresentation** | Applicant lied about something that would have changed underwriting decision |
| **Claimant's statement** | The formal claim form filled out by the beneficiary |

---

## Where AI Fits — Prototype Opportunities

### Customer-Facing (FNOL + Intake)
- **Conversational intake AI:** Replace phone calls and paper forms with a guided, empathetic chat flow
- **Document upload + AI extraction:** Beneficiary uploads death certificate; AI extracts name, date, cause of death, jurisdiction, certifying physician instantly
- **Real-time completeness check:** AI flags missing information before submission, preventing delays
- **Status transparency:** Claim tracker with real-time status updates (docs received, under review, approved, payout scheduled)

### Adjuster-Facing (Claims Copilot)
- **Pre-populated claim file:** AI structures the intake data so adjuster opens a file that's already organized
- **Contestability flag:** AI automatically checks policy issue date vs. date of death and flags if within 2-year window
- **Fraud risk scoring:** AI surfaces red flags (recent beneficiary change, policy age, cause of death vs. application data)
- **AI-drafted beneficiary communications:** Adjuster reviews and sends, rather than writing from scratch
- **Document classification:** AI identifies and labels uploaded documents automatically

---

## Prototype App Concept: ClaimPath

**Tagline:** AI-guided death benefit claims for life carriers.

### Customer side (PWA — installable on mobile):
1. Land on app, tap "File a Death Claim"
2. Lookup: enter policy number OR insured name + DOB + last 4 SSN
3. System locates policy, shows masked confirmation ("We found a policy for J*** S*****")
4. Conversational AI intake: date of death, cause of death, relationship to insured
5. Document upload: death certificate, beneficiary ID
6. AI extracts and confirms: "I found a death certificate for John Smith, date of death March 1, 2026, cause: cardiac arrest. Is this correct?"
7. Identity verification: scan ID, take selfie (Persona/Jumio in production)
8. Payout preference: lump sum, account info
9. Claim submitted: claim number issued, status tracker shown

### Adjuster side (web dashboard):
1. Claims queue: incoming claims with AI-assigned priority and status
2. Claim detail view:
   - Beneficiary verified ✅
   - Death certificate extracted ✅ (key fields shown)
   - Policy in-force ✅
   - **⚠️ Contestability alert: Policy issued 14 months ago. Recommend medical records review.**
   - Fraud risk score: Low / Medium / High
3. AI copilot panel: ask questions about the claim ("What does the policy say about aviation exclusions?")
4. One-click actions: Request additional docs, Approve claim, Escalate to SIU, Draft beneficiary communication

---

## Key Stats for Loom Narration

- Life insurance death claims take **14-60 days** on average to process
- **30% reduction in operational costs** reported by insurers using AI-driven claims automation
- **20% of contestability-period claims** are rescinded — most carriers detect this manually
- Industry loses **$10-20 billion/year** to fraud across life lines
- Most carriers have fewer than **3 people** in their Special Investigation Unit
- AI in FNOL can cut **hours or days** from the intake process
- Return on fraud prevention spend averages **$30 saved per $1 spent**
