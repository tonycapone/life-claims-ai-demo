# ClaimPath Demo Script (~5 minutes)

## Opening — The Two Theses (30 sec)

"This demo has two layers. On the surface, I'm going to show you an AI-powered life insurance claims platform — how AI can transform the beneficiary experience and the adjuster workflow. But underneath that, there's a second story: **how I built this**. The entire codebase — two frontends, a Python backend, cloud infrastructure, deployed to a real domain — was built with Claude Code in a matter of days, not months. So this is really a demo of AI on both sides of the glass: AI as the product, and AI as the developer."

---

## Act 1 — The Development Story (90 sec)

### How it started

"I started with what I call a meta prompt — essentially a product spec. I told Claude: here's the layout I want, here's the user flow, here are the technologies I'm comfortable with. React, Python, FastAPI, AWS CDK, ECS Fargate. And then Claude Code generated the entire scaffold — models, routes, pages, design system, deployment scripts."

### Why these technologies

"A quick note on technology choices. I didn't pick React and Python because they're objectively the 'best' tools for this job. I picked them because **I know them inside and out**. When you're putting this much trust in AI to write your code, you need to be working in a stack where you have strong intuition for what 'right' looks like. I'm not rubber-stamping AI output — I'm supervising it. And I can only supervise effectively in technologies I deeply understand."

### The platform

"What we ended up with is a progressive web app — claimpath.click, live right now. It's a single codebase that serves both mobile and desktop. It's not in the app stores today because that approval process takes time, but architecturally there's nothing stopping us. We'd use a framework like Capacitor to wrap this as a native app and ship to iOS and Android from this same codebase. One team, one codebase, web and mobile."

---

## Act 2 — The Beneficiary Experience (120 sec)

### Live demo: Filing a claim via chat

*Open claimpath.click on phone (or mobile viewport in browser)*

"Now let's look at what we built. Imagine you've just lost a loved one. You need to file a life insurance claim. Traditionally, this is a multi-page form — confusing, clinical, the last thing you want to deal with during grief."

*Tap "File a Death Benefit Claim"*

"Instead, we give you a conversation. The AI greets you, acknowledges what you're going through, and walks you through it one step at a time."

*Type: "My policy number is LT-29471"*

"I give it my policy number in plain English. Behind the scenes, two things happen simultaneously: Claude extracts the structured data from my message, and then streams back a natural response. Watch — it found the policy, shows me a confirmation card with a masked name for security."

*Confirm policy, then provide beneficiary info naturally*

"I just talk to it like I'd talk to a person. 'My name is Sarah Smith, I'm his wife.' It pulls out name and relationship in one shot. Notice the progress dots up top — those fill in as fields are collected."

*Provide death details and payout preference*

"Once all the required information is gathered, it shows me a review card right inline — no page navigation. I certify, submit, and I'm done. That entire claim filing took under two minutes, and at no point did it feel like filling out a form."

---

## Act 3 — The Adjuster Side (60 sec)

*Switch to desktop browser, open adjuster dashboard*

"On the other side, the adjuster logs in and sees the claim in their queue — already risk-scored by AI. And I want to call out: **none of this is canned or templated.** Look at the risk summary — it specifically references the cause of death I entered in the chat. I said 'car accident' and the AI wrote 'accidental vehicle collision is a covered peril with clear manner classification.' It's reasoning about the actual claim data in real time, every time. Different claim details would produce a completely different assessment."

"Now let me show you what happens with a riskier claim. I pre-filed one against policy FE-00291 — a final expense policy that's only been in force for about 5 months."

*Open the FE-00291 claim in the queue*

"Look at the difference. This one's flagged **high risk** with an SIU referral recommendation. The AI caught that the policy was purchased less than 6 months before death — that's deep inside the 2-year contestability window — and it's recommending a special investigations unit review. Same AI, same system, completely different assessment based on the facts. That's the power here: it's not one-size-fits-all, it's reasoning about each claim individually."

"The adjuster also has an AI copilot — they can ask it to explain the contestability concerns, draft a document request letter, or get a second opinion on next steps. And down here in Communications, one click generates a personalized letter — fully drafted by AI, ready to send."

---

## Close — What This Demonstrates (30 sec)

"So to recap: this is a production-quality prototype built almost entirely with AI-assisted development. A conversational claims experience powered by Claude on AWS Bedrock, a full adjuster dashboard with AI copilot, deployed on real infrastructure. The development story matters as much as the product story — this is what's possible when you pair an experienced engineer with AI tooling. You move at prototype speed with production quality."
