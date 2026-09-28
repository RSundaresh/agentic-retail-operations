# Executive demo script (6 minutes)

## Before the meeting

Run `npm test` and `npm start` with Node 22. Open http://127.0.0.1:4173. For an Azure demo, complete the README authentication/setup checklist and confirm today's budget. Never paste a token while screen sharing; configure it beforehand. Have local mock ready as a separately labeled fallback, never as an undisclosed replacement for live mode.

## 0:00 — Establish scope

“This control tower demonstrates how six specialists coordinate retail decisions. Dashboard metrics and retail evidence are synthetic. The server configuration (`GET /api/config`) identifies deterministic fixtures or live Azure inference. Execution only records a demo receipt.”

## 0:45 — Run inventory disruption

Click **Analyze disruption**. Explain the dependency graph: demand and inventory analyze independently, allocation combines them, then risk and value assess the proposal in parallel. Wait for the result. Open **Audit details** for the decision UUID, revision and expiration; confirm the actual mode from server configuration. An error is an error; do not claim a live result if a dependency failed.

## 2:00 — Inspect accountability

Start with the top recommendation: **Transfer 60 units from nearby excess inventory**, **$600 net value**, **Policy check passed**, and **Human approval required** in the mock scenario. Explain that 38 stores at risk of stockout and $286K at risk describe the larger disruption; this is its first policy-constrained action. Read the rationale and value calculation in the expandable dossier, use the single **Review evidence** action, and explore the adjacent **Decision Copilot**. For technical discussion, follow **Solution architecture on GitHub** in the footer. Inspect API trace snapshots separately for agent deployment names, latency and attempt numbers. “We route by task type. Value calculations and execution use code, not model discretion. Latencies are this run's measurements; business metrics elsewhere are illustrative.”

## 3:00 — Exercise human control

Point to `pending` and the absence of an execution output. Click **Reject**. Show rejected state with no receipt. Click **Run analysis again**, inspect its proposal, then click **Approve demo transfer**. Show approved actor/time in refreshed API data if needed, completed state and receipt with `enterpriseWrite: false`. Approval controls become disabled. “The server rejects repeated or stale approvals, and another user cannot approve my run.”

## 4:15 — Explain cost and failure behavior

“Four model tasks can retry once, with eight-second deadlines. There is a shared 30-run daily cap and token caps. The planning envelope is $200 per month with economical model rates. Azure budgets notify us; an operator must act to stop spending.” Mention that blocked/failed workflows cannot execute and model outages never silently produce mock results.

## 5:00 — State the decision

“This is a deployable demo with actual coordination and an approval boundary. A production pilot still needs real data validation, evaluated models, sign-in UX, durable recovery and transactional retail-system adapters. Internal task envelopes are not a claim of official A2A compliance.”

Ask stakeholders to choose one bounded inventory use case and accountable approver for a pilot. Do not present synthetic margins as realized savings or the demo receipt as a warehouse transfer.
