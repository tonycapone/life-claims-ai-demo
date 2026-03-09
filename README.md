# ClaimPath

> The missing claims module for modern life insurance.

**Live demo:** [https://claimpath.click](https://claimpath.click)

ClaimPath reimagines the death benefit claims experience for life insurance carriers. Today, beneficiaries navigate a maze of phone calls, paper forms, and weeks of silence after losing a loved one. Adjusters spend most of their time on data entry and document chasing instead of actual decision-making.

ClaimPath fixes both sides with an AI-native, white-label platform that any carrier could adopt.

---

## What It Does

### For Beneficiaries (Carrier-Branded Mobile App)
A mobile-first web app embedded in a carrier-branded shell (Tidewell Life Insurance). Guides a grieving beneficiary through filing a death benefit claim in about 10 minutes — no phone calls, no paper, no confusion.

- **Conversational intake** — AI-driven chat guides the beneficiary through filing, one question at a time
- **AI document extraction** — upload the death certificate and Claude pulls out the key fields instantly
- **Identity verification** — ID upload + selfie capture UI (simulated for demo)
- **Claim status lookup** — beneficiaries can check where their claim stands by claim number and email
- **PWA installable** — works in the browser or installs to the home screen like a native app

### For Claims Adjusters (Web Dashboard)
A desktop workspace where every claim arrives pre-structured, pre-analyzed, and pre-flagged — so adjusters can make decisions instead of doing data entry.

- **AI risk assessment** — every claim is scored on submission: risk level, contestability status, fraud flags
- **Contestability alerts** — automatically flagged if policy is within the 2-year window
- **AI copilot** — streaming chat panel with full claim context; ask questions, get draft letters, surface policy details
- **AI-drafted communications** — one-click generation of approval letters, denial letters, and document requests
- **Full audit trail** — every action timestamped and logged

---

## Architecture

```
                        ┌──────────────┐
                        │  Route 53    │
                        │claimpath.click│
                        └──────┬───────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    CloudFront CDN                            │
│              (ACM TLS + frontend + /api/* proxy)            │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌─────────▼────────┐
│   S3 Bucket    │    │   ECS Fargate     │
│  (React PWA)   │    │  (FastAPI + AI)   │
│                │    │   256 CPU / 512MB │
└────────────────┘    └─────────┬────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
             ┌──────▼──┐  ┌────▼───┐  ┌────▼─────┐
             │   RDS   │  │  S3    │  │  AWS     │
             │Postgres │  │ Docs   │  │ Bedrock  │
             │  (15)   │  │Bucket  │  │(Claude)  │
             └─────────┘  └────────┘  └──────────┘
```

**Frontend:** React + TypeScript + Vite, PWA, hosted on S3 + CloudFront

**Backend:** FastAPI (Python), running on ECS Fargate behind an ALB

**Database:** PostgreSQL 15 on RDS (SQLite for local dev)

**AI:** AWS Bedrock + Claude Haiku — conversational intake, document extraction, risk scoring, adjuster copilot, communication drafting

**Document Storage:** S3 (encrypted, private)

**Infrastructure:** AWS CDK (TypeScript) — everything is code, one `npm run deploy` to stand up the full stack

---

## Local Development

### Prerequisites
- Node 22+
- Python 3.10+
- AWS credentials configured (for Bedrock AI — falls back to mock responses if unavailable)

### Setup

```bash
# Install all dependencies
npm run install:all

# Set up environment
cp backend/.env.example backend/.env

# Run database migrations
npm run db:migrate

# Seed mock data (policies + demo claims)
npm run db:seed

# Start everything
npm run dev
```

`npm run dev` starts the backend (port 8000) and frontend (port 5173) concurrently.

Open http://localhost:5173 — demo landing page with portal selection.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start backend + frontend concurrently |
| `npm run dev:backend` | Backend only (port 8000) |
| `npm run dev:frontend` | Frontend only (port 5173) |
| `npm run install:all` | Install frontend npm dependencies |
| `npm run db:migrate` | Run Alembic migrations |
| `npm run db:seed` | Seed mock policies + claims |
| `npm run test` | Run backend pytest suite |
| `npm run test:unit` | Run frontend Vitest suite |
| `npm run test:e2e` | Run Playwright e2e tests |
| `npm run deploy` | Full deploy (build + CDK + S3 sync) |

---

## Deployment

Deployed to AWS via CDK. The full deploy script runs tests, builds, deploys infrastructure, syncs the frontend, and invalidates CloudFront:

```bash
npm run deploy
```

This provisions:
- Custom domain (claimpath.click) with ACM TLS certificate
- VPC (2 AZs)
- ECS Fargate service (backend API)
- RDS Postgres 15
- S3 bucket for claim documents (encrypted)
- S3 bucket for frontend (private, CloudFront served)
- CloudFront distribution (frontend + /api/* proxy)
- Route53 DNS records
- Bedrock IAM permissions for Claude AI

No API keys required — AI access uses the AWS default credential chain via Bedrock.

---

## AI Layer

Claude (via AWS Bedrock) powers four distinct capabilities:

**1. Conversational Claim Intake** (FNOL chat)
AI-guided conversation that collects all claim information naturally — policy number, beneficiary details, death information, payout preferences — without a multi-page form.

**2. Document Extraction** (on death certificate upload)
Extracts structured data from uploaded death certificate images/PDFs: deceased name, date of death, cause of death, manner of death, certifying physician, jurisdiction, certificate number.

**3. Risk Scoring** (on claim submission)
Analyzes claim data against policy data to produce: risk level (low/medium/high), contestability alert, fraud flags, auto-triage recommendation, and a plain-English summary for the adjuster.

**4. Adjuster Copilot** (streaming chat)
Context-aware chat assistant pre-loaded with the full claim. Adjusters can ask questions, request document drafts, and surface policy details — all in natural language. Responses stream in real time.

---

## Built with AI

This project was built almost entirely with AI-assisted development — architecture, code, design, synthetic data, even the demo script. The repo is structured so that AI agents (and humans) have full context at every step.

All important context lives in the repo:

| Path | What's in it |
|---|---|
| `docs/spec.md` | Full product spec — features, data models, AI capabilities, UX flows |
| `docs/research.md` | Domain research — claims industry, regulations, competitive landscape |
| `docs/reviews/` | AI executive reviews (CEO, CTO, COO personas) that stress-tested the demo |
| `WORK.md` | Living backlog — every work item, open and closed, with context |

### AI Executive Reviews

Before presenting to humans, we had three AI personas — a CEO, CTO, and COO — independently review the platform as if evaluating it for adoption. Each brought a different lens:

- **CEO review** (`docs/reviews/ceo-review.md`) — Market positioning, competitive differentiation, go-to-market readiness
- **CTO review** (`docs/reviews/cto-review.md`) — Architecture, security, scalability, integration patterns
- **COO review** (`docs/reviews/coo-review.md`) — Operational realism, claims workflow accuracy, regulatory compliance

Their feedback directly shaped the backlog. The contestability analysis feature (comparing medical records against the insurance application) was flagged by all three as the single highest-value capability — and became the centerpiece of the demo. The regulatory timeline card, OFAC screening mock, and multi-beneficiary awareness items all came from these reviews.

Summary: `docs/reviews/executive-summary.md`
