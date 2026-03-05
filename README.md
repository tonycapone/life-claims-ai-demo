# ClaimPath

> AI-guided life insurance death benefit claims — built as a rapid prototype.

ClaimPath reimagines the death benefit claims experience for life insurance carriers. Today, beneficiaries navigate a maze of phone calls, paper forms, and weeks of silence after losing a loved one. Adjusters spend most of their time on data entry and document chasing instead of actual decision-making.

ClaimPath fixes both sides of that equation with a two-sided AI-powered platform.

---

## What It Does

### For Beneficiaries (Customer PWA)
A mobile-first, installable web app that guides a grieving beneficiary through filing a death benefit claim in about 10 minutes — no phone calls, no paper, no confusion.

- **Conversational intake** — step-by-step guided flow, one question at a time
- **AI document extraction** — upload the death certificate and Claude pulls out the key fields instantly (name, date of death, cause, jurisdiction)
- **Identity verification** — ID scan + selfie match, same flow as opening a bank account
- **Real-time claim tracker** — no more calling to check status; beneficiaries see exactly where their claim stands
- **PWA installable** — works in the browser or installs to the home screen like a native app

### For Claims Adjusters (Web Dashboard)
A desktop workspace where every claim arrives pre-structured, pre-analyzed, and pre-flagged — so adjusters can make decisions instead of doing data entry.

- **AI risk assessment** — every claim is scored on submission: risk level, contestability status, fraud flags
- **Contestability alerts** — automatically flagged if policy is within the 2-year window, with a recommendation to request medical records
- **AI copilot** — streaming chat panel with full claim context; ask questions, get draft letters, surface policy details
- **Full audit trail** — every action timestamped and logged

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CloudFront CDN                    │
│         (frontend + /api/* proxy to ALB)            │
└───────────────────┬─────────────────────────────────┘
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
             ┌──────▼──┐  ┌────▼───┐  ┌────▼────┐
             │   RDS   │  │  S3    │  │Anthropic│
             │Postgres │  │ Docs   │  │  API    │
             │  (15)   │  │Bucket  │  │(Claude) │
             └─────────┘  └────────┘  └─────────┘
```

**Frontend:** React + TypeScript + Vite, PWA (installable), hosted on S3 + CloudFront

**Backend:** FastAPI (Python), running on ECS Fargate behind an ALB

**Database:** PostgreSQL 15 on RDS (SQLite for local dev)

**AI:** Anthropic Claude — document extraction, risk scoring, adjuster copilot, communication drafting

**Document Storage:** S3 (encrypted, private)

**Infrastructure:** AWS CDK (TypeScript) — everything is code, one `cdk deploy` to stand up the full stack

---

## Local Development

### Prerequisites
- Node 22+
- Python 3.10+
- Docker (for local Postgres)

### Setup

```bash
# Install all dependencies
npm run install:all

# Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env — add your ANTHROPIC_API_KEY

# Run database migrations
npm run db:migrate

# Seed mock data (policies + demo claims)
npm run db:seed

# Start everything
npm run dev
```

`npm run dev` starts the backend (port 8000) and frontend (port 5173) concurrently.

Open http://localhost:5173 for the customer PWA.
Open http://localhost:5173/adjuster for the adjuster dashboard.

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

Infrastructure is managed with AWS CDK. One command deploys everything:

```bash
cd cdk && npx cdk deploy
```

This provisions:
- VPC (2 AZs)
- ECS Fargate service (backend API)
- RDS Postgres 15
- S3 bucket for claim documents (encrypted)
- S3 bucket for frontend (private, CloudFront served)
- CloudFront distribution (frontend + /api/* proxy)
- Secrets Manager entries for DB credentials + Anthropic API key

Before first deploy, create the Anthropic API key secret:
```bash
aws secretsmanager create-secret \
  --name claimpath/anthropic-api-key \
  --secret-string '{"key":"sk-ant-..."}'
```

---

## AI Layer

Claude powers three distinct capabilities:

**1. Document Extraction** (on death certificate upload)
Extracts structured data from uploaded death certificate images/PDFs: deceased name, date of death, cause of death, manner of death, certifying physician, jurisdiction, certificate number.

**2. Risk Scoring** (on claim submission)
Analyzes claim data against policy data to produce: risk level (low/medium/high), contestability alert, fraud flags, auto-triage recommendation, and a plain-English summary for the adjuster.

**3. Adjuster Copilot** (streaming chat)
Context-aware chat assistant pre-loaded with the full claim. Adjusters can ask questions, request document drafts, and surface policy details — all in natural language. Responses stream in real time.

---

## Project Context

This prototype was built as part of a rapid prototyping exercise. The goal: research a life insurance process I wasn't deeply familiar with, understand the domain, and build something live and demonstrable over a weekend.

The death benefit claims process was chosen because it's the core life insurance event, and it's remarkably painful for both sides — beneficiaries and adjusters alike. The opportunity for AI to reduce friction, speed up decisions, and surface risk automatically is obvious and high-value.

**Domain research:** `docs/research.md`
**Full feature spec:** `docs/spec.md`
**Open items:** `WORK.md`
