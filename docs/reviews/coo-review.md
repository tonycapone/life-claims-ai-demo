# ClaimPath — COO / Head of Claims Operations Review

**Reviewer:** Lisa Washington, COO
**Background:** 18 years in life insurance operations; 8 years running a 200+ adjuster claims organization at a top-20 US carrier
**Date:** March 8, 2026

---

## Operations Assessment — Overall Impression

ClaimPath is one of the better claims-tech demos I have seen in the last five years. The conversational FNOL intake is genuinely compelling, and the adjuster copilot shows someone did their homework on what the daily workflow actually looks like. The white-label carrier shell is a nice touch — it signals "module, not product," which is the right positioning for selling into large carriers.

That said, this is a prototype that solves the first 20 minutes of a claims lifecycle that typically spans 14 to 60 days. The demo carefully routes around the hard operational problems — multi-beneficiary coordination, regulatory forms, reinsurance, OFAC, state-specific timing requirements, supervisor review, and the dozens of exception paths that consume 70% of an adjuster's time. What is built is polished. What is missing is the difference between a demo and a production claims system.

I would describe this as a strong proof of concept for FNOL modernization with an adjuster decision-support layer. It is not yet a claims module.

---

## What Resonates — Pain Points It Actually Addresses

### The conversational FNOL intake is the strongest feature.

My claims call center handles roughly 400 FNOLs per month. Each call averages 22 minutes. The rep is essentially reading a form aloud and typing answers into a green-screen system from the 1990s. The beneficiary is crying. The rep is asking them to spell things. It is a terrible experience for everyone involved.

ClaimPath's chat-based intake addresses this directly. The ability to say "I'm Sarah Smith, his wife, my email is sarah.smith@email.com and my phone is 555-867-5309" and have the AI extract four structured fields from one sentence — that is legitimately better than what we do today. The progress dots showing completion state are a smart UI choice. The death certificate extraction that auto-populates three fields is impressive and would save real time.

**Would beneficiaries prefer this over calling in?** Some would. The 35-55 demographic, absolutely. But I will address the demographic reality check below.

### The adjuster risk card eliminates the worst part of new claim triage.

Today, a new claim lands in an adjuster's queue as a flat file. They open it, read through everything, mentally calculate whether the policy is contestable, check for red flags, and decide what to do. That mental triage takes 15-30 minutes per claim. ClaimPath does it instantly on submission. The contestability alert, the risk flags, the AI-written summary — my best adjusters would appreciate this. It is the right information, surfaced at the right time.

### The copilot is useful, not a gimmick — with caveats.

Asking "What are the red flags on this claim?" and getting a context-aware answer is genuinely helpful for junior adjusters. The letter drafting is probably the highest-ROI feature — my team spends a disproportionate amount of time writing acknowledgment letters, document request letters, and status updates. If the AI can produce a solid first draft that the adjuster reviews and sends, that saves 10-15 minutes per communication. Across 400 claims a month with an average of 3-4 communications each, that is meaningful.

### The demo contrast between low-risk and high-risk claims is effective.

Showing Sarah Smith (medium risk, contestability) next to Patricia Johnson (high risk, 5-month-old policy, unknown cause of death, SIU recommendation) demonstrates that the AI is reasoning, not templating. That is the right way to sell this.

---

## What is Missing from the Claims Process

This is where I put on my operations hat and get specific. These are not nice-to-haves — these are requirements for any system that touches real claims.

### 1. State-Specific Claim Forms — Completely Absent

Every state has its own required claim form. California has one. New York has one. Texas has one. They are not interchangeable. A beneficiary in Missouri filing a claim on a policy issued in New York needs to complete the New York state claim form AND potentially comply with Missouri's consumer protection timelines. ClaimPath collects information conversationally, which is great, but at some point that information must populate a state-specific form that gets wet-signed or e-signed. That form is a legal document. The chatbot certification checkbox ("I certify that the information provided is true and accurate") is not a substitute.

### 2. Claimant's Statement Under Oath — Not Addressed

Most carriers require a formal claimant's statement, often notarized for claims above a threshold (typically $50K-$100K). For the $500K Sarah Smith claim, we would absolutely require a notarized statement. For the $750K Linda Chen claim, likely a medallion signature guarantee. ClaimPath's review-and-submit flow with a checkbox is appropriate for initiating the claim, but somewhere the system needs to generate and track the formal legal documents.

### 3. Multiple Beneficiary Coordination — The Hard Problem Nobody Demos

The Maria Garcia policy (LT-18823) has two beneficiaries: Carlos Garcia at 60% and Isabella Garcia at 40%. In the seed data, only Carlos filed a claim. In real life:
- Both beneficiaries must file independently
- Both must be verified independently
- The claim cannot be fully processed until both have filed (or one has been located and notified)
- If Isabella is a minor, a legal guardian or custodian must file on her behalf, and payout goes into a UTMA/UGMA account or court-supervised trust
- If one beneficiary is deceased, their share may pass to contingent beneficiaries or through their estate
- The system needs to track each beneficiary's filing status independently

ClaimPath has zero handling for any of this. The spec mentions multi-beneficiary support in passing but it is not implemented.

### 4. OFAC / Sanctions Screening — Regulatory Requirement, Not Optional

Before paying any death benefit, we are legally required to screen every payee against the OFAC Specially Designated Nationals list and other sanctions lists. This is not optional. It is a federal requirement. Failure to screen results in regulatory action, fines, and potentially criminal liability. ClaimPath does not mention OFAC anywhere.

### 5. State-Specific Timing Requirements — Not Tracked

- California: must acknowledge receipt of claim within 15 calendar days; must accept or deny within 40 days
- New York: must acknowledge within 15 business days; decide within 30 days of receiving all documents
- Texas: must acknowledge within 15 business days; pay within 60 days of receiving proof of loss
- Most states: must pay statutory interest (often 10% annual) if payment is late

ClaimPath has a "Days Open" column in the queue but no SLA tracking, no state-specific deadline calculation, no escalation alerts when a claim approaches its regulatory deadline. In my shop, missing a California 40-day deadline results in a DOI complaint and potential market conduct exam findings. This is table stakes for any production system.

### 6. Reinsurance Notification Triggers — Not Present

Any claim above a threshold (varies by carrier, typically $250K-$500K) requires notification to the reinsurer within a specified timeframe, often 72 hours of FNOL. The Sarah Smith claim ($500K) and the Linda Chen claim ($750K) would almost certainly trigger reinsurance notification. The David Williams policy ($1M) is an IUL with a face amount that would trigger immediate reinsurer involvement. ClaimPath has no reinsurance awareness.

### 7. Claims Without a Death Certificate

ClaimPath allows the beneficiary to skip the death certificate upload, which is good. But it does not address the common scenarios where a death certificate is genuinely unavailable:
- Missing persons (7-year presumption of death in most states)
- Deaths overseas (foreign death certificates require apostille or consular authentication)
- Mass casualty events (death certificates delayed weeks or months)
- Deaths under investigation (coroner holds, pending autopsy)

These are not edge cases. We handle several overseas death claims per quarter and at least one missing persons presumptive death claim per year.

### 8. Supplementary Documents — Partially Addressed

The ActionModal allows requesting Medical Records, Autopsy Report, Original Application, and Beneficiary ID. This is a reasonable start but missing:
- Police reports (required for any accident or homicide)
- Toxicology reports (required for many accidental deaths, especially overdose)
- Attending physician's statement (APS) — the single most requested document in contestability reviews
- Proof of relationship (marriage certificate, birth certificate)
- Legal documentation (letters testamentary, court orders for estate claims)
- Employer verification (for group life claims, which this system does not address but would if deployed at a real carrier)

### 9. Beneficiary Identification — Selfie Is Not Enough

The spec mentions ID upload + selfie + liveness check, which is fine for opening a claim. But for payout on a $500K+ claim, most carriers require:
- Notarized claim form
- W-9 (tax reporting — we must issue a 1099 for certain payouts)
- For trusts: trust agreement and trustee certification
- For estates: letters testamentary or letters of administration
- For minors: court-appointed guardian documentation
- For powers of attorney: the actual POA document plus verification it has not been revoked

The demo's identity verification is appropriate for the FNOL step but wildly insufficient for the payout step.

### 10. Interpleader Situations — Not Addressed

When two or more parties claim the same benefit (disputed beneficiary designations, divorce decrees vs. beneficiary forms, community property claims), the carrier typically files an interpleader action — depositing the funds with the court and letting the claimants sort it out. This is uncommon but happens several times a year at any large carrier. A claims system needs to at least flag potential interpleader situations.

---

## Adjuster Workflow Reality Check

### Risk Scoring — Directionally Correct, Operationally Insufficient

The risk scoring logic in `ai.py` considers:
- Policy age / contestability window
- Manner of death
- Months since issue

This is a reasonable starting point but misses factors that experienced adjusters weigh heavily:
- **Beneficiary change history** — was the beneficiary changed in the last 12 months? This is the number one fraud indicator.
- **Premium payment patterns** — did someone start paying premiums on a lapsed policy right before the death? Were premiums being paid by someone other than the insured?
- **Policy replacement activity** — was this policy a replacement for another policy (1035 exchange)? Did the insured have multiple policies across carriers?
- **Cause of death vs. application disclosures** — the spec mentions this but the AI prompt does not actually have access to the original application data. It cannot compare what was disclosed at underwriting to what the death certificate says. This is the core of contestability review and the biggest time sink for adjusters.
- **MIB (Medical Information Bureau) hits** — the spec mentions MIB checks but they are mocked. In production, MIB data is critical for contestability.
- **Geographic risk factors** — certain jurisdictions have higher fraud rates.
- **Agent/producer patterns** — was this policy sold by a producer with a history of suspicious claims?

The risk scoring is a good demo feature. It would need significant enrichment to replace or augment real adjuster judgment.

### The Copilot — Useful for Junior Adjusters, Potentially Annoying for Senior Ones

My senior adjusters (10+ years) would find the copilot marginally useful for letter drafting but would not use it for risk assessment — they already know what to look for and they would not trust an AI summary over their own judgment. My junior adjusters (0-3 years) would love it. The suggested actions ("Request medical records," "Draft approval letter," "Explain contestability rules") are well-chosen for someone learning the job.

The concern: the copilot is a single-turn chat with no conversation memory beyond the current session. A real adjuster works a claim over days or weeks. They need the copilot to remember that they already requested medical records, that the beneficiary called on Tuesday with a question, that the supervisor flagged something in their quality review. Context persistence across sessions is essential.

### Missing Workflow Features

- **Workload balancing / round-robin assignment:** The Patricia Johnson claim is unassigned. In real life, new claims are automatically assigned based on adjuster workload, specialty (some adjusters handle contestability, others handle SIU), and capacity. ClaimPath has no assignment engine.
- **Supervisor review workflows:** All claims above a threshold require supervisor sign-off before approval. Contestability decisions always require supervisor review. SIU escalations require SIU manager review. There is no approval chain in ClaimPath.
- **Quality assurance sampling:** Most claims organizations randomly sample 5-10% of closed claims for QA review. This is a regulatory expectation. No QA workflow exists.
- **SLA dashboards and alerts:** Adjusters need to see which claims are approaching their regulatory deadlines. Supervisors need to see which adjusters have aging claims. ClaimPath shows "Days Open" but has no SLA intelligence.
- **Diary/follow-up system:** Adjusters set follow-up dates ("check back on medical records request in 14 days"). ClaimPath has no diary system.
- **Team and role hierarchy:** Real claims organizations have adjusters, senior adjusters, supervisors, managers, SIU investigators, and support staff. ClaimPath has a flat list of three adjusters with no role differentiation.

### The 80/20 Problem

About 80% of death benefit claims are straightforward: policy is outside contestability, natural cause of death, verified beneficiary, all documents in order. These should be fast-tracked — and ClaimPath's risk scoring does identify them.

The problem is that the 20% of complex claims consume 80% of adjuster time, and those are exactly the claims ClaimPath is least equipped to handle: contestability reviews requiring medical records analysis, SIU investigations, multi-beneficiary disputes, claims with missing documents that require repeated follow-up, claims where the beneficiary is unresponsive, estate claims where there is no named beneficiary.

ClaimPath handles the easy claims well. The hard claims are where the real value would be.

---

## Beneficiary Experience Reality Check

### Would a grieving 75-year-old spouse actually use a chatbot?

Honestly? Many would not. My claims data shows that 40% of death benefit claimants are over 65. The median age is 58. These are people who lost a spouse, and many of them want to talk to a human being. The chat interface is well-designed and empathetic, but there is an entire demographic that will pick up the phone.

ClaimPath needs a phone channel that feeds into the same system. An adjuster or CSR taking a phone call should be able to use ClaimPath as their data entry tool — the chatbot becomes the agent's interface, not the beneficiary's. This is actually how most modern FNOL systems work: omnichannel intake where the system is the same regardless of whether the beneficiary self-serves or calls in.

### Non-English speakers

No language support whatsoever. In my claims organization, roughly 12% of claimants prefer Spanish, 3% prefer Mandarin or Cantonese, and we see a dozen other languages throughout the year. The AI could theoretically handle multilingual conversation, but the UI, labels, buttons, and legal disclosures are all English-only. For a California or Texas deployment, Spanish is a regulatory and practical necessity.

### Accessibility

I did not see any ARIA labels, screen reader support, or keyboard navigation considerations in the code. The FNOL chat requires typing. The death certificate upload requires drag-and-drop or file selection. The progress dots are purely visual. For ADA compliance and for elderly claimants with vision or motor impairments, this needs work.

### What if the beneficiary does not have the policy number?

The spec mentions an alternative lookup flow (insured name + DOB + last 4 SSN) but the implemented FNOL chat only supports policy number lookup. In my experience, at least 30-40% of beneficiaries do not know the policy number. Many do not even know the policy exists — they find paperwork in a drawer after their spouse dies. The system needs to handle lookup by insured name, SSN, and date of birth, and it needs to handle the case where the beneficiary is not even sure if a policy exists (this is where ACLI's policy locator service comes in).

### Walk-ins, phone calls, mail-in claims

The demo only addresses digital self-service. In reality, we receive claims through:
- Phone (45%)
- Mail (30% — yes, still)
- Digital/web (15%)
- Walk-in at agent office (5%)
- Agent-initiated on behalf of beneficiary (5%)

A claims module must support all channels or it covers only a fraction of volume.

---

## What Would Make This a Must-Have

If I am going to champion this internally, fight for budget, and put my reputation on the line with my CEO and board, I need these five things:

### 1. Medical Records vs. Application Comparison (Contestability Autopilot)

This is the feature that would make me write the check. Today, my adjusters spend 2-3 days per contestability review reading through medical records and comparing them line by line against what the insured disclosed on their application. "Did they disclose the diabetes diagnosis from 2019? Did they mention the cardiac catheterization in 2021? Was the smoking status accurate?"

If AI can ingest medical records and the original insurance application, compare them, and produce a structured report of discrepancies — that is transformative. That is not a 15-minute time savings, that is a 2-day time savings per contestability claim. At 80-100 contestability reviews per year, that is 160-300 adjuster-days saved annually. That is the feature that pays for the entire platform.

### 2. State Regulatory Compliance Engine

Build a state-by-state rules engine that automatically calculates deadlines, generates required forms, tracks SLA compliance, and alerts adjusters and supervisors when deadlines approach. If I can tell my regulators "our system automatically enforces every state timing requirement and generates state-specific forms," that is a competitive advantage in market conduct exams.

### 3. Omnichannel Intake — Phone Agent Mode

Let my CSRs use the same conversational interface when taking phone calls. The AI listens (or the CSR types), extracts the same fields, does the same validation. The beneficiary gets the same quality experience whether they self-serve or call in. This triples the addressable volume.

### 4. Multi-Beneficiary and Complex Payout Orchestration

Handle the real payout scenarios: split beneficiaries, minors, trusts, estates, IRD (income in respect of a decedent) tax reporting, W-9 collection, OFAC screening, 1099 issuance. If ClaimPath can orchestrate a $750K payout split between a spouse and two children — including the minor child's UTMA account setup — while generating all the required tax documents, that is a system my operations team would adopt.

### 5. Integration Architecture — Not a Standalone System

Show me how this plugs into my existing policy admin system (whether that is a legacy mainframe or a modern SaaS platform). Show me the API contract for pulling policy data, pushing claim status updates, triggering payment systems, and feeding data into my reinsurance reporting. A claims module that does not integrate is a science project.

---

## Scores

| Dimension | Score (1-10) | Notes |
|-----------|:---:|-------|
| Operational Realism | 4 | Strong FNOL, weak on everything after. No regulatory compliance, no multi-beneficiary, no SLA tracking, no reinsurance, no OFAC. |
| Adjuster Workflow | 5 | Risk card and copilot are genuinely useful. Missing assignment engine, supervisor review, diary system, QA sampling, SLA alerts. |
| Beneficiary UX | 7 | The FNOL chat is excellent for digitally comfortable users. Falls down on accessibility, language support, alternative channels, and complex beneficiary scenarios. |
| Regulatory Completeness | 2 | No state-specific forms, no OFAC screening, no state timing requirements, no claimant's statement under oath, no W-9/1099. This is the biggest gap. |
| "Would I Pilot This?" | 5 | I would pilot the FNOL intake and the adjuster risk scoring on a limited basis — maybe 50 claims over 90 days, low-face-amount term policies only, one state. But I would not deploy this as a claims module without the regulatory and operational gaps addressed. |

**Overall: 4.6 / 10**

---

## Bottom Line

ClaimPath demonstrates that the team understands the claims domain better than most vendors I have seen. The conversational FNOL is the best beneficiary intake experience I have encountered in any demo. The adjuster risk card and copilot are directionally excellent. The white-label positioning is smart.

But this is an FNOL tool with an adjuster decision-support layer, not a claims module. The gap between "intake plus triage" and "end-to-end claims processing" is enormous, and it is filled with regulatory requirements, multi-party coordination, document management, payment orchestration, and audit compliance that this prototype does not address.

The team should lead with the FNOL intake and the contestability analysis vision (medical records vs. application comparison). Those two features alone are worth a pilot conversation. Everything else needs significant development before a Head of Claims at a real carrier would sign off on production deployment.

I have been burned too many times by vendors who demo the happy path and then cannot handle the first edge case a real adjuster throws at them. Show me the contested beneficiary claim. Show me the overseas death with no certificate. Show me the 1035 exchange policy where the insured had three other policies across two carriers. Show me those and we will talk about a real engagement.

— Lisa Washington, COO
