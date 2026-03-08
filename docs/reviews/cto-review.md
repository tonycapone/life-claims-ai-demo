# CTO Technical Assessment — ClaimPath

**Reviewer:** David Park, CTO
**Date:** March 8, 2026
**Context:** Technical evaluation of ClaimPath as a potential AI-native claims module for integration into a top-20 US life insurance carrier's technology stack.

---

## Overall Impression

ClaimPath is the most honest AI demo I have seen in the insurance space this year. Most vendors show me slides about "AI transformation" and then reveal a rules engine with a chatbot bolted on. This is different — the AI is genuinely structural, not decorative. The conversational FNOL intake, the document extraction, the risk scoring, and the adjuster copilot are all real Claude calls producing non-deterministic, context-aware output. I can see that because I read the actual code, not just the demo script.

That said, there is a significant gap between "impressive prototype" and "deployable in a regulated carrier environment." I am going to be specific about both sides.

---

## What's Impressive

### 1. Architecture Decisions That Make Sense

The API-first, two-frontend architecture is exactly right. Separating the beneficiary PWA from the adjuster dashboard while sharing a single FastAPI backend means you could replace either frontend or integrate the API into an existing system. The decision to use AWS Bedrock rather than direct Anthropic API calls is the correct one for an enterprise buyer — it means the AI stays within the AWS trust boundary, no PII leaves the VPC to a third-party API endpoint, and we get IAM-based access control rather than managing API keys. That alone puts this ahead of most AI demos I evaluate.

The CDK infrastructure is clean and complete: VPC with private subnets, RDS in private subnets, ECS Fargate, CloudFront with proper TLS, S3 with block-all-public-access. The database password is generated via Secrets Manager and injected via environment variable. This is not a throwaway demo — someone thought about the deployment topology.

The mock fallback pattern in `ai.py` is smart engineering. Every AI function has a graceful degradation path that produces realistic output when Bedrock is unavailable. This means the demo never breaks, local development works without AWS credentials, and you have a clear pattern for circuit-breaking in production.

### 2. AI Implementation Quality

I was specifically looking for whether the AI does real work or is smoke and mirrors. Verdict: it is doing real work, and the implementation is thoughtful.

**Field extraction from natural language** (`extract_fnol_fields`): The system prompt is well-engineered — it tells Claude exactly which fields are still needed, what is already collected, and what formats to use. The temperature is set to 0.0 for extraction (deterministic) vs 0.4 for conversational responses (natural). That distinction shows understanding of when you want precision vs naturalness. The extraction happens as a separate, non-streaming `converse()` call in parallel with the streaming chat response. That is the correct architectural choice — you do not want field extraction to depend on the streaming response or vice versa.

**Document extraction** (`extract_document`): Uses Bedrock's native document/image understanding via the `converse()` API. The prompt constrains output to a specific JSON schema and handles both PDF and image formats correctly (using the document format for PDFs, image format for JPG/PNG). The returned JSON auto-populates three claim fields (date_of_death, cause_of_death, manner_of_death), which eliminates redundant data entry.

**Risk scoring** (`score_risk`): This is where I see genuine domain knowledge. The system computes contestability (months since issue date) deterministically, then asks Claude to analyze the full claim + policy context and produce flags, a recommendation, and a natural-language summary. The mock fallback is also well-built — it implements the same contestability logic with heuristic flag generation, so the demo still tells a coherent story even without Bedrock.

**Adjuster copilot** (`stream_copilot`): The full claim data is injected into the system prompt, and the copilot streams via `converse_stream()`. The instruction "Never make up facts not in the claim data" is correct prompt engineering for a regulated context. The streaming SSE implementation in the FastAPI router is clean.

### 3. UX/Technical Integration

The FNOL chat experience (`FNOLChat.tsx`) is genuinely well-designed. The SSE streaming protocol uses structured events (`fields`, `policy`, `text`, `action`) rather than just raw text, which means the frontend can update structured UI elements (progress dots, policy cards, upload widgets, review cards) in response to backend signals without parsing natural language. That is a much more robust architecture than having the frontend try to interpret the AI's text output.

The progress dots showing 9 required fields filling in during conversation is an effective UX pattern — it gives the user a sense of completion without showing them a form. The inline policy confirmation card, death certificate extraction card, and review card all appear contextually based on SSE action events.

The adjuster claim detail page puts the AI intelligence (risk card + copilot) in the right column alongside the structured claim data in the left column. The copilot has suggested actions ("What are the red flags?", "Draft approval letter") which is good for discoverability, and it streams responses with Markdown rendering.

### 4. What Actually Works vs Smoke and Mirrors

**Actually works:**
- Conversational FNOL with real field extraction from natural language
- Death certificate PDF/image extraction via Claude document understanding
- AI risk scoring with contestability detection
- Streaming adjuster copilot with full claim context
- AI-drafted communications (acknowledgment, status update, document request)
- JWT-based adjuster authentication
- Full AWS deployment via CDK (this is deployed and running at claimpath.click)

**Smoke and mirrors (acknowledged):**
- Identity verification is a mock that always returns `true`
- Document storage is `/tmp/claimpath-docs` locally (not S3 in the running app)
- No actual email sending
- No actual payment processing
- Bank account routing number is stored but never validated
- The "carrier login" (sarah.smith@email.com) accepts any credentials
- No multi-beneficiary support despite being in the spec

The ratio of real to mocked is very good for a prototype. The mocked items are all integration points that would be handled by third-party services (Persona for ID verification, SES for email, ACH for payments).

---

## Technical Concerns

### 1. Security Gaps

**PII handling is the biggest issue.** This system processes SSN last-4 digits, dates of birth, death certificates, beneficiary contact information, banking details, and cause-of-death information. In the current implementation:

- PII is stored in plaintext in the database. No column-level encryption. The `beneficiary_ssn_last4`, `routing_number`, `bank_account_last4` fields are plain `String` columns. For a carrier handling death benefit claims, this data needs AES-256 encryption at the column level, not just disk-level encryption from RDS.

- The JWT secret key defaults to a hardcoded string: `"claimpath-dev-secret-change-in-prod"`. In production, this must come from Secrets Manager and be rotated.

- The claims API endpoints (`/api/claims/fnol/chat`, `/api/claims/{id}/documents`, `/api/claims/{id}/submit`) have **zero authentication**. Any HTTP client can create claims, upload documents, and submit them. The beneficiary-facing flow has no auth at all — the "carrier login" is purely cosmetic. This means in production, anyone could submit fraudulent claims programmatically.

- Death certificates are saved to `/tmp/claimpath-docs` with predictable filenames (`{claim_id}_{filename}`). No access control, no encryption at rest for local dev. The CDK stack provisions an S3 documents bucket with encryption, but the backend code does not actually use it.

- The full claim data (including PII) is embedded directly in AI prompts sent to Bedrock. While Bedrock has better data handling guarantees than direct API calls, the prompts contain the full claim JSON dump. There is no PII redaction or tokenization before sending to the model.

- CORS on the documents S3 bucket allows `allowedOrigins: ['*']`. This should be restricted to the CloudFront domain.

### 2. Scalability Issues

- The Fargate task is configured at minimum resources: 256 CPU units (0.25 vCPU) and 512MB memory, with `desiredCount: 1`. There is no auto-scaling policy defined. A single Bedrock `converse_stream()` call can take 3-10 seconds; under load with multiple adjusters using the copilot simultaneously, this single task will saturate quickly.

- The streaming SSE implementation is synchronous. The `fnol_chat` endpoint calls `extract_fnol_fields` (a blocking Bedrock call) synchronously on the main thread before starting the streaming response. Under concurrent load, this will exhaust Uvicorn worker threads.

- No connection pooling configuration for the database. The default SQLAlchemy `create_engine` creates a pool of 5 connections. With concurrent FNOL chats + adjuster queries + AI calls, this is insufficient.

- RDS is a single `t3.micro` instance, single-AZ, with 20GB storage, no autoscaling, and 1-day backup retention. This is appropriate for a demo but would need significant upgrades for production (Multi-AZ, at minimum `db.r6g.large`, automated backups with 30+ day retention, read replicas for the adjuster dashboard).

### 3. AI Reliability

- **Hallucination risk in risk scoring:** The risk scoring prompt asks Claude to produce a JSON risk assessment, but there is no validation of the output beyond JSON parsing. Claude could assign "low" risk to a claim that has obvious red flags, or vice versa. In production, the AI risk score should be one input to a deterministic scoring engine, not the sole risk determination.

- **No prompt versioning or testing:** The prompts are hardcoded strings in `ai.py`. There is no mechanism to version prompts, A/B test them, or track which prompt version produced which risk assessment. When you change a prompt and the risk scoring behavior changes for 10,000 in-flight claims, you need to know exactly what changed and when.

- **JSON parsing fragility:** The `_parse_json` function strips markdown fences and then calls `json.loads`. If Claude returns malformed JSON (which happens), the function throws an exception, which is caught by a bare `except` that falls back to mock data. In production, a claim could silently get a mock risk score instead of a real one, and no one would know.

- **Single model dependency:** Everything runs on `claude-haiku-4-5`. If Anthropic deprecates this model version, or if Bedrock has an outage in us-east-1, the entire AI layer falls back to mocks. There is no model fallback chain (try Haiku, then Sonnet, then a smaller model) and no multi-region failover for Bedrock.

- **No conversation memory for copilot:** The adjuster copilot sends only the current message — there is no conversation history. Each question is treated independently. If an adjuster asks "What are the red flags?" and then follows up with "Tell me more about the second one," the copilot has no context from the previous exchange.

### 4. Integration Challenges

- **No standard API contracts:** The API does not conform to ACORD (Association for Cooperative Operations Research and Development) data standards, which is the lingua franca of insurance system integration. Policy numbers, claim statuses, and data models are all custom. Integrating with a carrier's existing policy admin system (Sapiens, Majesco, EXL, DXC) would require a translation layer.

- **No webhook/event architecture:** When a claim status changes, there is no event emitted. A real carrier needs claim events to flow to downstream systems — payment processing, reinsurance reporting, state regulatory filing, management dashboards, agent portals. The current architecture is request-response only.

- **No document management integration:** Carriers run enterprise document management systems (OnBase, FileNet, Documentum). Documents currently go to `/tmp` or S3 directly. There is no abstraction layer for plugging in an existing DMS.

- **No policy admin system integration:** The policy lookup is against a local SQLite/Postgres table with 5 hardcoded policies. In reality, this needs to query a policy admin system via API, often with complex logic around policy riders, exclusions, grace periods, reinstatement status, and beneficiary designation history.

### 5. Data Residency and Governance

- **No audit trail for AI decisions.** The AI risk assessment is stored as fields on the claim record (`risk_level`, `risk_flags`, `ai_summary`), but there is no record of the prompt that generated it, the model version used, or the raw model response. State insurance regulators increasingly require explainability for automated decisions. If a claim is denied based on an AI risk assessment, you need to produce the exact input and output for regulatory review.

- **No data residency controls.** Bedrock processes data in the configured region (us-east-1), but there is no enforcement preventing PII from being processed in non-compliant regions. Some states and international jurisdictions have specific data residency requirements for insurance records.

- **No model governance framework.** There is no mechanism to approve model changes, track model performance over time, detect model drift, or implement human review thresholds (e.g., "any claim over $500K requires human review regardless of AI score").

---

## What's Missing for Production

### Regulatory Compliance

- **HIPAA:** Death certificates contain Protected Health Information (cause of death, certifying physician). Any system processing this data needs HIPAA compliance: BAA with AWS (which AWS offers), encryption in transit and at rest (partially done), access logging (not implemented), minimum necessary access controls (not implemented), and breach notification procedures.

- **SOC 2 Type II:** A carrier would require SOC 2 compliance before allowing claim data to flow through a vendor system. This means access controls, audit logging, change management, incident response procedures — none of which exist in the current system.

- **State insurance regulations:** Each state has specific claims handling requirements — acknowledgment timeframes (typically 15-30 days), investigation timeframes, specific language requirements for denial letters, unfair claims settlement practices acts. The AI-drafted communications need to be validated against state-specific requirements.

- **NAIC Model Laws:** The NAIC has model regulations on claims settlement practices, privacy, and increasingly on the use of AI in insurance decisions. The AI risk scoring feature would need to be evaluated under the NAIC's model bulletin on AI/ML.

### Operational Requirements

- **Load testing:** No evidence of load testing. The single-task Fargate deployment with synchronous Bedrock calls is a bottleneck.

- **Failover and disaster recovery:** Single-AZ RDS, single Fargate task, no multi-region deployment. RPO and RTO are effectively undefined.

- **Monitoring and alerting:** No CloudWatch alarms, no application-level metrics, no Bedrock usage monitoring. If the AI starts returning garbage or latency spikes, no one would know.

- **Rate limiting:** No rate limiting on any endpoint. The FNOL chat endpoint could be used to rack up significant Bedrock costs via automated requests.

- **Model versioning and rollback:** No mechanism to pin a specific model version across environments or roll back to a previous prompt version.

- **Human-in-the-loop safeguards:** The risk scoring runs automatically on submission, but there is no threshold for mandatory human review. All claims should require adjuster review, but the system does not enforce this — an API call to `/claims/{id}/action` with `action: approve` could approve a $1M claim without any human having looked at it.

---

## Integration Reality Check

### How Hard Would Integration Be?

**Medium-hard.** The API-first architecture is the right foundation, but the integration surface is thin. Here is what I would need:

1. **Policy admin system adapter:** Replace the local policy lookup with a service that queries our policy admin system. This is doable — it is a single function call in `claims.py` — but the data model would need to expand significantly (riders, exclusions, premium history, lapse/reinstatement history, beneficiary change history).

2. **Claims management system sync:** We already have a claims management system. ClaimPath would need to either (a) replace it entirely (risky, multi-year project) or (b) sync claim data bidirectionally. Option (b) requires an event/webhook architecture that does not exist yet.

3. **Document management:** Need to plug into our existing DMS via an abstraction layer. The current S3-only approach would not work.

4. **Identity verification:** Need to integrate a real IDV provider (Persona, Jumio, etc.). The mock is fine for demo, but this is a hard requirement.

5. **Communications:** Need to integrate with our email/SMS platform, apply state-specific regulatory templates, and maintain a communications audit trail.

### API-First or Rip-and-Replace?

It is API-first in theory, but in practice it leans toward module-replacement rather than integration. The data model is self-contained (its own policies table, its own claims table). To work alongside existing systems, you would need an adapter layer that treats ClaimPath as a claims intake and triage engine, feeding into the existing claims management system for adjudication and settlement.

The most realistic integration path: use ClaimPath for FNOL intake and AI risk scoring, then sync the structured claim data into the existing claims system via API. The adjuster copilot and communication drafting could remain in ClaimPath as an overlay tool that reads from the existing claims system.

### Can It Work Alongside Existing Claims Systems?

Yes, but it requires architecture work that is not built yet. The copilot and risk scoring features have the most standalone value — they could be added as a sidecar to an existing claims workflow without replacing anything. The FNOL intake would need to create claims in the existing system, not its own database.

---

## Questions I Would Ask

1. **What is your model governance story?** When you update a prompt in `ai.py`, how do you validate that risk scoring behavior has not regressed? Do you have a test suite of claims with known-correct risk assessments that you run against prompt changes?

2. **How do you handle AI disagreement with the adjuster?** If the AI scores a claim as low-risk and the adjuster disagrees, is that feedback captured? Is there a mechanism to improve the model over time based on adjuster overrides?

3. **What is your plan for conversation memory in the copilot?** The current implementation loses context between messages. An adjuster asking follow-up questions is a core use case — how will you handle it without sending the entire conversation history to Bedrock on every message (which gets expensive and hits context limits)?

4. **How would you handle a beneficiary who provides incorrect information — intentionally or accidentally?** The field extraction trusts whatever Claude extracts. If a beneficiary says "the policy number is LT-29471" but the actual beneficiary on that policy is someone else, the system creates a claim and allows document uploads against that policy. What is the verification model?

5. **What happens when Bedrock is down or throttled?** The mock fallback works for a demo, but in production, would you queue claims and retry? Serve a degraded experience? The current behavior — silently returning mock risk scores — would be dangerous in production because claims could be approved based on mock data.

6. **What is your data retention and purging strategy?** Death certificates, SSN fragments, and banking information have different retention requirements by state. How would you handle a beneficiary exercising their right to delete personal data while maintaining audit trail requirements?

7. **How do you envision handling the contestability investigation workflow?** The demo flags contestable claims and shows a "contestability review" status, but the actual investigation (requesting medical records, comparing to the original application, analyzing for material misrepresentation) is where adjusters spend 60-70% of their time on complex claims. What does AI-assisted contestability investigation look like beyond the flag?

---

## Scores

| Dimension | Score (1-10) | Notes |
|---|---|---|
| **Technical Architecture** | 7 | Clean API-first design, proper AWS services, good separation of concerns. Loses points for no event architecture, no async task processing, and synchronous AI calls blocking the request thread. |
| **AI Implementation Quality** | 8 | Best-in-class for a prototype. Real Claude calls, good prompt engineering, structured SSE protocol, mock fallbacks. Temperature tuning per use case shows sophistication. Loses points for no prompt versioning, no output validation, and no conversation memory. |
| **Security Posture** | 3 | The weakest area. No auth on beneficiary endpoints, hardcoded JWT secret, PII in plaintext, no column-level encryption, documents saved to /tmp, full PII in AI prompts with no redaction. This needs significant hardening before any carrier would allow claim data to touch it. |
| **Integration Feasibility** | 5 | The API-first foundation is right, but no ACORD standards, no event architecture, no adapter pattern for external systems, and a self-contained data model that would fight with existing claims systems. The copilot and risk scoring have the best standalone integration potential. |
| **Production Readiness** | 3 | Single-task deployment, no auto-scaling, no monitoring, no rate limiting, no audit trail for AI decisions, no regulatory compliance framework. This is correctly positioned as a prototype, not a production system. |

**Composite:** 5.2 / 10

---

## Bottom Line

This is the right idea, built by someone who understands both the insurance domain and modern software architecture. The conversational FNOL intake is genuinely better than any claims intake UX I have seen from established vendors. The AI layer is real, not vaporware.

But the gap to production is 12-18 months of focused work, primarily in three areas: (1) security hardening and compliance, (2) integration architecture for existing carrier systems, and (3) AI governance and reliability. The prototype proves the concept is viable and the approach is sound. Whether we build or buy depends on the team's ability to execute on the production roadmap and their willingness to work within our compliance framework.

I would recommend a follow-up meeting focused on: integration architecture for our specific policy admin and claims management stack, a detailed security remediation plan, and a model governance framework proposal. If those conversations go well, this warrants a proof-of-concept integration with our non-production claims data.

---

*David Park, CTO*
*March 8, 2026*
