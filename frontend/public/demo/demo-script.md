# ClaimPath Demo Script

**URL:** https://claimpath.click — **Time:** ~10 minutes

---

## Credentials

| Portal | Login | Password |
|--------|-------|----------|
| Customer App | john.smith@email.com | password123 |
| Adjuster | jmartinez | password123 |

**Death certificates** (download one before starting):
- **Low-risk:** `death-certificate-smith.pdf` — cardiac arrest, natural death
- **High-risk:** `death-certificate-smith-high-risk.pdf` — rock climbing fall, accidental death

**Policy:** LT-29471 — John Michael Smith, $500K Term Life, 14 months old

---

## Before you start

1. Download your chosen death certificate PDF from the landing page
2. If re-running: click **Reset Demo Claims** on the landing page
3. Ideal setup: customer app on phone (or mobile emulator), adjuster dashboard on a second window

---

## Part 1: Landing Page (~1 min)

> "Life insurance platforms have digitized underwriting and policy admin. But when someone dies and a beneficiary needs to file a claim? Still manual, still paper-driven, still different at every carrier. ClaimPath is what a modern AI-native claims module looks like."

> "Two sides — the customer-facing app where beneficiaries file, and the adjuster dashboard where claims pros review. Same backend, same AI. Let me show you both."

**Click** the **Customer App** card.

---

## Part 2: Customer Experience (~5 min)

### Login

**Click "Sign in with Face ID"** (or enter the credentials — both work).

> "This isn't ClaimPath-branded — it's a fictional carrier called Tidewell Life Insurance. The entire customer experience is white-label. Swap one config file and it re-skins for any carrier."

### Home screen

**Click "Chat"** (or the floating chat button).

> "This is John Smith's account. The chat opens a general-purpose AI assistant — not a claims form. Watch what happens when someone reports a death."

### Chat: General questions

**Type:** `When is my next payment?`

> "The AI called a tool to look up the actual payment info. This isn't canned — it's reading from the policy database."

**Type:** `Who are my beneficiaries?`

> "Real data. Now imagine Sarah picks up John's phone after he passes."

### Chat: Report the death

**Type:** `My husband passed away last week`

> "No mode switch. No keyword detection. The AI reasoned: someone on John's account said their husband died. It responded with empathy and asked who it's speaking with. This is an agent, not a state machine."

**Type:** `I'm Sarah, his wife. My phone is 555-867-5309 and my email is sarah@email.com`

> "The agent decided it had enough info and created the claim automatically. Watch the header change and progress dots appear."

### Chat: Verify identity

**Type:** `His full name is John Michael Smith, born April 15, 1968, and his last four are 4471`

> "Standard claims procedure — verify the insured's identity before processing a half-million-dollar benefit."

### Chat: Upload death certificate

An upload widget appears. **Click** the upload zone, **select** the death certificate PDF you downloaded.

Wait for extraction. **Click "Looks correct — continue"**.

> "The death certificate PDF goes to Claude, which extracts structured fields and auto-populates three claim fields. That's AI document understanding, not OCR."

### Chat: Payout preference

A payout choice widget appears. **Click "Lump Sum"** (or "Structured Payments").

### Chat: Review and submit

A review card appears. **Check** the certification checkbox, then **click "Submit Claim"**.

Note the claim number — you'll find it in the adjuster queue.

> "Nine data points collected through a natural conversation. On the backend, AI risk scoring already ran — that claim is sitting in the adjuster's queue right now, pre-scored."

---

## Part 3: Adjuster Dashboard (~4 min)

Open a new tab: **https://claimpath.click/adjuster/login**

**Enter:** `jmartinez` / `password123` — **Click "Sign In"**

### Claims queue

> "Sarah's claim is already here — submitted, risk-scored, ready for review. Notice three other claims at different risk levels. The AI assessed each one independently."

**Click** the **Sarah Smith** claim row.

### Claim detail

> "Look at the risk assessment. The AI wrote this summary by analyzing the actual claim data — it caught that the policy is 14 months old, inside the 2-year contestability window. Different claims produce completely different assessments."

> "The regulatory timeline below it tracks state-specific deadlines automatically. This is Illinois — 15 business days to acknowledge, 30 to decide. The Chen claim is California — different statute, different rules, handled automatically."

### Contestability analysis — THE demo moment

Scroll to the **Contestability Analysis** card. **Click "Run Contestability Analysis"**.

> "This policy is 14 months old — inside the contestability period. Normally an adjuster spends 2-3 days reading through the application and medical records line by line, comparing what the applicant disclosed against what the records show. Watch."

Wait for the report to appear.

> "In seconds, the AI found four material misrepresentations. The applicant denied heart disease — records show an atrial fibrillation diagnosis. Denied blood pressure medication — he was on lisinopril. Denied ER visits — there's a chest pain visit nine months before the application. Denied taking medications while on four cardiovascular drugs."

> "And the undisclosed conditions are directly related to the cause of death. He died of a heart attack and concealed a history of heart disease. That finding changes the trajectory of a $500,000 claim."

> "This analysis — application vs. medical records comparison — is the same core AI capability as medical records parsing on the underwriting side, applied to the other end of the policy lifecycle. One COO told us this isn't a 15-minute time savings, it's a 2-day time savings per contestability claim."

### AI Copilot (if time permits)

In the copilot panel, **click** "What are the red flags?" — or **type** `Draft a letter requesting medical records from the beneficiary`.

> "The copilot has full context on the claim. Ask it to draft a letter and it personalizes it with the beneficiary's name and claim number."

### High-risk contrast (if time permits)

**Click "< Queue"**, then **click** the **CLM-2026-00140** claim (Patricia Johnson).

> "Same system, completely different assessment. Final expense policy purchased 5 months ago, cause unknown, accident — the AI flagged it immediately and recommended SIU referral."

---

## Wrap-Up (~1 min)

> "Full claims lifecycle — beneficiary files through a conversation, adjuster reviews with AI-powered risk scoring and a copilot. What makes this different:"

1. **An AI agent, not a form.** The customer starts with a general assistant. When they report a death, the agent transitions naturally — no mode switching.

2. **Instant risk scoring.** The moment a claim is submitted, it's assessed — contestability, fraud indicators, next steps.

3. **Contestability analysis in seconds.** The biggest time sink in claims — comparing medical records against the application — done by AI in seconds.

4. **Nothing is canned.** Every assessment, every response, every letter is generated live from actual claim data.

---

## Troubleshooting

- **Chat not responding:** Check the browser console. If Bedrock is down, mock fallbacks still work but the agent won't reason or call tools.
- **Adjuster login fails:** Use `jmartinez` (not an email), password `password123`.
- **Claim not in queue:** It only appears after clicking "Submit Claim" on the review card. Refresh the queue page.
- **Fresh start:** Click "Reset Demo Claims" on the landing page and clear localStorage.
