# Reference benchmark

> Scope: this document describes the proposed production system. The current application is a public, offline demo with static fixtures; identity, retrieval, agent invocation, execution, approval verification, and telemetry are not implemented.

The AWS Wealth Management and Advisor Demo Platform is the architectural quality bar for this project. It demonstrates a mature domain platform with multiple APIs, eight agents, A2A collaboration, MCP gateways, graph and analytical data, voice, event-driven workflows, governance, observability, and infrastructure as code.

Agentic Retail Operations does not attempt to win by listing more cloud services. Its target design proposes five mechanisms that are central to safe enterprise adoption:

| Dimension | Advancement |
|---|---|
| Orchestration | Local task proposals illustrate how future A2A payloads could carry authority, evidence, constraints, artifacts, and end-to-end trace context—not only conversational messages. |
| Model selection | Forecasting, retrieval, general reasoning, independent evaluation, and deterministic calculations use separate routing policies. |
| Decision quality | A risk agent independently challenges the producing agent before material action. |
| Safe action | Model output cannot authorize execution; deterministic policy and applicable human approval control tools. |
| Value realization | Every workflow connects predicted operational and financial value with observed outcomes. |

These are design goals, not verified advantages or implemented production capabilities. No reference implementation was supplied for a code-level comparison.
