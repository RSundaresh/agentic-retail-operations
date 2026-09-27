# Threat model

> Scope: this document describes the proposed production system. The current application is a public, offline demo with static fixtures; identity, retrieval, agent invocation, execution, approval verification, and telemetry are not implemented.

## Protected assets

- Enterprise process and policy knowledge
- Customer and transaction data
- Agent instructions and tool credentials
- Decisions, evidence, and approval records
- Downstream systems of record
- Transformation-value and operational telemetry

## Principal threats and controls

| Threat | Example | Primary controls |
|---|---|---|
| Prompt injection | Uploaded document attempts to override agent policy | Content isolation, instruction hierarchy, tool allowlists, input classification |
| Excessive agency | Agent posts a financial adjustment above its authority | Identity-bound tools, transaction limits, approval gates, short-lived credentials |
| Data leakage | Sensitive evidence appears in an unauthorized response | Entra authorization, Purview labels, retrieval filtering, output inspection |
| Unsupported decision | Recommendation cannot be traced to policy | Required citations, confidence threshold, fail-closed escalation |
| Automation bias | Human approves without inspecting evidence | Approval UX, counter-evidence, randomized review, override capture |
| Replay or duplicate action | Workflow retry creates a second account or payment | Idempotency keys, operation ledger, compensating transaction |
| Model or policy drift | Outcomes change after model or policy update | Version pinning, regression evaluation, canary deployment, rollback |
| Cost exhaustion | Public requests create unbounded model consumption | Authentication, quotas, token budgets, caching, anomaly alerts |

## Trust boundary principle

Model output is untrusted until validated by deterministic policy and the relevant authority boundary. Reasoning may propose an action; identity, policy, and workflow state determine whether the action is allowed.
