# Delivery roadmap and value realization

This is an indicative delivery sequence, not a committed schedule or authorization to deploy. Start with inventory disruption in one operating team and a bounded SKU/store cohort. Promotion expansion follows evidence from that scope. The repository is currently a prototype; none of the pilot or production gates is claimed complete.

## Strategy, stakeholders and roles

The strategic objective is better availability and margin with less planner effort and accountable decisions. The transformation sequence is: establish reliable evidence, improve decision support, prove user adoption and service outcomes, then introduce limited transactional automation. Automation volume is not itself a value measure.

| Stakeholder / indicative multidisciplinary role | Responsibility and acceptance interest |
| --- | --- |
| Sponsor / business product owner | Own scope, funding, benefits hypothesis and go/no-go; accept residual business risks |
| Planners, store/DC and merchandising leads / process SME and change lead | Define exceptions, authority limits and workable workflows; co-design training, test usability and retain manual fallback |
| Enterprise/solution architect and integration engineers | Maintain decisions and traceability; define application boundaries, source contracts and safe transaction design |
| Data owners/stewards and data engineers | Authorize access, resolve SKU/location semantics, classify data and certify freshness/quality |
| AI engineers and evaluation/QA specialists | Qualify model routing, retrieval, safety, business-rule tests and regression datasets |
| Security, identity, privacy and governance specialists | Approve access, separation of duties, audit/retention and threat mitigations |
| Platform/SRE, service desk and release owner | Prove deployment, reliability, recovery, incident response, support handover and rollback |
| Finance/FinOps and business analyst | Validate baseline, attribution, recurring and one-time costs, and realized benefits |

These are capabilities, not staffing commitments; roles may combine where independence is preserved. Assign named accountable owners and capacity before estimating dates. Production transactions require separate business approval and release authorization.

## Phases and exit gates

| Phase / indicative window | Sequenced work and scope | Exit evidence and accountable decision |
| --- | --- | --- |
| **Prototype / weeks 1–4** | Inventory demo walkthrough; establish baseline and eligible cohort; review requirements, threat model and decisions; qualify source availability; run local checks and hosted prerequisite validation in an authorized environment | **G0: pilot design accepted.** Sponsor, process, data, security and finance owners sign scope, authority matrix, baseline method, metric thresholds, cost ceiling, data permissions and risk register. Prototype tests/build pass; hosted prerequisites are evidenced before any hosted pilot. Synthetic dashboard outcomes do not count as benefits. |
| **Pilot / weeks 5–10, subject to readiness** | First add sign-in, scoped access, durable recovery, audit, evaluation and read adapters. Validate source reconciliation and freshness. Start read-only shadow recommendations; compare with planner decisions. Then allow assisted decisions in existing systems under their controls. Any automated write is a separately gated increment after idempotency/reconciliation/compensation drills | **G1: bounded pilot accepted and expansion decision.** Operations, data, security, service and finance owners review at least four representative weeks, volume/sample adequacy, M-01–06 and overrides. No unresolved critical safety/access finding; required evidence and approvals complete; support/fallback drill passes. Sponsor records continue, extend, stop or fund production. Calendar expiry does not pass the gate. |
| **Production / week 11 onward** | Harden source/tool integrations and durable orchestration; complete network, capacity, disaster recovery, retention, deployment rollback and model-change controls. Canary a small cohort, then expand by explicit review | **G2: production release accepted.** Release/service owners and business/risk owners sign the production-readiness evidence pack, SLO/RTO/RPO, on-call rota, funded TCO, recovery and transaction reconciliation tests. Rollout requires monitored guardrails, rollback ownership and no unaccepted high-impact risks. |

Pilot activation requires security, data and service owners to evidence the sign-in, access, audit, recovery and evaluation controls for its approved scope before real data or users enter the workflow. This activation check is distinct from G1, which evaluates pilot results.

The durations describe an initial discovery/pilot horizon; enterprise integration, procurement, source quality or access approvals may extend it. Source contracts precede retrieval evaluation; verified reads precede recommendation validation; durable state and operation authority precede external writes. A prototype deployment alone does not satisfy G0.

## Pilot governance and adoption

The product owner chairs a weekly pilot review with operations, data, AI, security, service and finance representatives. Maintain a versioned gate pack: cohort, baseline, model/prompt/policy versions, tests/evaluations, usage/costs, incidents, overrides and open risks with owners/dates. Security or operations can pause use immediately for unauthorized actions, leakage, invalid mandatory evidence or duplicate effects; the service owner disables affected integrations and restores the existing manual process. Investigate and reconcile in-flight work before resumption, with business and risk-owner approval. Lower adoption or uncertain benefit triggers an extended pilot or scope reduction rather than automatic expansion.

Train planners to inspect evidence, challenge or reject recommendations and report errors; name local champions and provide office hours. Record eligible users and eligible cases before launch. Review override reasons and unsuccessful tasks with users weekly, avoiding pressure to approve. The change lead owns communications and training; the service desk receives runbooks and escalation contacts before production handover.

## Measurement contract

Collect a comparable pre-pilot baseline (initially four weeks) and a matched store/SKU cohort or staged rollout where feasible. The analyst records seasonality, promotion, stock availability and selection differences; finance validates attribution. Report sample size, missing data and uncertainty. Extend observation when volume or seasonal coverage is insufficient. Targets below are proposals to sign at G0, not current achievements.

| Metric / owner | Definition and evidence | Proposed acceptance use |
| --- | --- | --- |
| **M-01 Decision cycle / operations** | Median and p95 elapsed time from valid disruption signal to authorized decision; separately track fulfillment completion. Join source, workflow and approval timestamps | ≥20% lower median versus comparable baseline; no p95 or service deterioration. Model latency alone is insufficient |
| **M-02 Adoption / change lead** | Weekly active planners / eligible planners; reviewed eligible cases / all eligible cases; observed review/reject task success; override reasons and satisfaction | ≥70% weekly active users and ≥90% unaided task success; investigate low case coverage. No acceptance-rate quota |
| **M-03 Realized value / finance** | Incremental contribution margin versus comparator minus incremental transport, markdown, operating and recurring platform/support costs. Track stockout hours, fill rate and cancellations alongside it | Positive net benefit with no agreed service-guardrail breach. Report redeployable labor hours separately from cash savings; show one-time investment and payback without double counting |
| **M-04 Evidence and control quality / data and risk** | Decisions with valid source IDs, timestamps, applicable policy version and verified citations / reviewed decisions; independently sampled grounding and approval audit | ≥98% complete packages; block every action missing mandatory/current evidence. 100% material actions linked to authorized approval; zero unauthorized/duplicate effects |
| **M-05 Operational readiness / service owner** | Successful end-to-end cases, p95 latency, unresolved stuck runs, detection/recovery times and data loss under load/outage drills | Set numerical SLO, RTO and RPO from business impact at G0; prove them at G2. No production SLO is implied by current synchronous code |
| **M-06 Unit economics / FinOps** | Total recurring allocated service cost / resolved eligible cases; separately report cost per admitted run, failed/retried calls and evaluation spend | Within phase-specific ceiling signed at G0 and reapproved at G2; use invoice/usage evidence and [cost guidance](cost-guidance.md), not the demo budget as production estimate |

The analyst publishes weekly pilot results; finance and operations review realized benefits at 30, 60 and 90 days after production release, then quarterly. The sponsor funds expansion only when adoption, value and control evidence support it. [Traceability](requirements-traceability.md), [decisions](decision-log.md) and [production readiness](production-readiness.md) form the linked acceptance record.
