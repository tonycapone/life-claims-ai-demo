# ClaimPath Demo Script (~5 minutes)

## Opening — The Missing Piece (30 sec)

"Modern life insurance platforms have digitized origination, underwriting, and policy admin. But when a policyholder dies and a beneficiary files a claim — that process is still largely manual, paper-driven, and carrier-by-carrier. I built a prototype of what a modern, AI-native claims module looks like. And I built the whole thing — two frontends, a Python backend, deployed to a real domain — using AI-assisted development in a matter of days."

---

## Act 1 — The Development Story (60 sec)

### How it started

"I started with a meta prompt — a product spec. I told Claude Code: here's the user flow, here are the technologies. React, Python, FastAPI, AWS CDK, ECS Fargate. Claude generated the full scaffold — models, routes, pages, design system, deployment scripts."

### Why these technologies

"I picked these because I know them inside and out. When you're putting this much trust in AI to write code, you need to supervise in a stack where you have strong intuition for what 'right' looks like. I'm not rubber-stamping AI output — I'm reviewing it in technologies I deeply understand."

### The platform

"What we ended up with is a progressive web app — claimpath.click, live right now. Single codebase for mobile and desktop. Could ship to iOS and Android via Capacitor from this same codebase. And because it's built as a module, the entire UI is white-label ready — swap a config and it's branded for any carrier."

---

## Act 2 — The Beneficiary Experience (90 sec)

### Live demo: Filing a claim via chat

*Open claimpath.click on phone (or mobile viewport in browser)*

"Imagine you've just lost a loved one. Traditionally, filing a life insurance claim means a multi-page form — confusing, clinical, the last thing you want to deal with during grief."

*Tap "File a Death Benefit Claim"*

"Instead, we give you a conversation. The AI guides you through it step by step, with empathy."

*Type: "My policy number is LT-29471"*

"Behind the scenes, two AI calls happen simultaneously: one extracts structured data from my message, the other streams a natural response. It found the policy, shows a confirmation card with a masked name for security."

*Confirm policy, provide beneficiary info naturally*

"I talk to it like a person — 'I'm Sarah Smith, his wife, my email is sarah@example.com.' It pulls out four fields from one sentence. Progress dots fill in as data is collected."

*Provide death details and payout preference*

"Review card appears inline. Certify, submit, done. Under two minutes, and it never felt like a form."

---

## Act 3 — The Adjuster Side (120 sec)

*Switch to desktop browser, open adjuster dashboard*

### Real AI, not templates

"On the adjuster side, the claim lands in the queue already risk-scored by AI. And I want to call this out: **none of this is canned.** Look at the risk summary — I said 'car accident' in the chat, and the AI wrote 'accidental vehicle collision is a covered peril with clear manner classification.' It's reasoning about the actual claim data. Different details produce a completely different assessment, every time."

### High-risk contrast

"Now look at this other claim — policy FE-00291, a final expense policy only 5 months old."

*Open the FE-00291 claim*

"Flagged **high risk**, SIU referral recommended. The AI caught that the policy was purchased less than 6 months before death — deep inside the contestability window. Same system, completely different assessment based on the facts."

### Adjuster tools

"The adjuster has an AI copilot with full claim context — ask it to explain the contestability concerns, draft a document request, get a second opinion. And in Communications, one click generates a personalized letter addressed to the beneficiary, with the adjuster's name, ready to edit and send."

### Where this gets powerful (the vision)

"Now here's where I'd take this next. The biggest time sink in claims is contestability investigation — an adjuster spends 2-3 days reading through medical records, comparing them line by line against the original insurance application, looking for misrepresentations. 'Did the insured say no to heart disease, but the records show an atrial fibrillation diagnosis?' That's the exact same capability as parsing medical records for underwriting — just applied to the other end of the policy lifecycle. The AI reads both documents, produces a discrepancy report in seconds instead of days."

"And on the intake side — if the AI knows the policy provisions, it asks smarter questions. This policy has an accidental death rider with an intoxication exclusion. So when the beneficiary says 'car accident,' the AI knows to ask for the police report number. It's not asking 'was he drunk' — it's collecting exactly what the adjuster will need, sensitively, upfront. The adjuster never has to call the beneficiary back for follow-up."

---

## Close — Why This Matters (30 sec)

"This is a production-quality prototype — conversational claims intake, AI risk scoring, adjuster copilot, communication drafting — built in days with AI-assisted development, deployed on real infrastructure. It's designed as a white-label module that any carrier could adopt. The claims side of the lifecycle is ready for the same transformation that's already happened in origination and underwriting. This is what that looks like."
