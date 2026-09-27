# Production readiness

> Scope: this document describes the proposed production system. The current application is a public, offline demo with static fixtures; identity, retrieval, agent invocation, execution, approval verification, and telemetry are not implemented.

## Pilot entry criteria

- Executive sponsor and accountable process owner identified
- Current-state telemetry and baseline agreed
- User population and business outcome defined
- Data classifications and residency constraints recorded
- Agent authority and human approval boundaries approved
- Evaluation set represents common, ambiguous, and adversarial cases
- Integration owners and rollback paths confirmed

## Technical readiness

- [ ] Threat model reviewed
- [ ] Workload and user identities separated
- [ ] Tools enforce least privilege independently of prompts
- [ ] Secrets stored in Key Vault
- [ ] Retrieval honors source permissions
- [ ] Model, prompt, policy, and workflow versions recorded
- [ ] Idempotency and compensating actions tested
- [ ] End-to-end traces contain no prohibited data
- [ ] Offline and online evaluations meet thresholds
- [ ] Latency, availability, and unit-cost budgets established

## Operational readiness

- [ ] Named service owner and incident path
- [ ] Dashboards for workflow, model, tool, security, and value metrics
- [ ] Alert thresholds and runbooks exercised
- [ ] Human fallback available during agent failure
- [ ] Change approval and rollback tested
- [ ] User training and feedback mechanism complete
- [ ] Weekly pilot review and value-realization cadence scheduled

## Pilot exit criteria

The pilot advances only if it improves the agreed business outcome, maintains control compliance, meets evaluation and reliability thresholds, stays within unit economics, and demonstrates sustained adoption. A technically functional agent without measurable process improvement does not pass.
