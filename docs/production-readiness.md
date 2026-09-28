# Production readiness

The repository implements a deployable, bounded multi-agent **demo**, not a production retail transaction platform.

Implemented: real dependency-aware orchestration, parallel fan-out/fan-in, environment-routed models, explicit managed identity, deterministic offline provider, structured output validation, correlated traces, bounded retries/timeouts, API-connected UI, Azure role/owner checks, expiring human approval, ETag concurrency, shared daily admission limit, Blob persistence, Insights logging, Bicep and tests.

Release prerequisites still requiring a network-enabled Azure environment:

- Install pinned SDKs, generate/review a transitive lockfile, run dependency audit, and run the Functions v4 host. Mock unit/integration tests intentionally do not need SDK installation.
- Compile Bicep; review what-if, provider registration, region capacity, subscription permissions and budget support. No deployment has been validated in Azure from this workspace.
- Configure Entra registration/scope/role assignment and obtain a correct delegated token. Verify unauthenticated, wrong-role, wrong-tenant, wrong-audience and forged-header rejection at the hosted boundary.
- Validate managed identity Blob access, deployment-container access, OpenAI User RBAC propagation, model availability and supported JSON/token parameters. Confirm real model schemas and failure behavior; test quotas and cost assumptions.
- Verify traces in Application Insights, Blob persistence across restarts, ETag contention across instances, retention and actual budget notification delivery.

Before any real system-of-record action: add scoped tool adapters, independently verified business evidence, policy versioning, operation-specific permissions, separation of duties where needed, idempotency keys honored by the target system, transactional outbox/reconciliation and compensation. Do not replace the demo receipt function with an external write and assume the current crash semantics are sufficient.

For a production pilot: use MSAL user sign-in, workload-specific identities, private networking where justified, tamper-evident approval audit, user/team access model, tenant isolation, queue-backed durable orchestration, resumable workflow stages, cancellation, circuit breakers, rate enforcement on all routes, formal model evaluations and prompt-injection tests. Measure recommendation quality, fairness of allocations and real business value; dashboard numbers are not benchmark results.

Known demo limits: local state is volatile; approved runs cannot be rolled back; hosting interruption can leave `running` or `executing` runs; trace snapshots save at stage completion rather than every event; initial response loss has no client idempotency/recovery key; traces are fetched after completion rather than streamed. Model rationale is unverified. Different risk deployment names do not guarantee epistemic independence. Resource-group budgets are alerts, not spend enforcement. Internal envelopes are not official A2A, and no A2A conformance testing has been performed.

Use the [delivery roadmap](delivery-roadmap.md) for G0–G2 entry/exit evidence, accountable roles and pilot stop/resume rules. The [requirements matrix](requirements-traceability.md) links remaining controls to risks and measurable outcomes; the [decision log](decision-log.md) records why prototype choices must evolve. Technical checks here are necessary but do not replace data-owner, business, security, service and finance acceptance. The [proposed integration and Foundry path](architecture.md#production-path-to-microsoft-foundry-retrieval-and-governed-tools) is design guidance, not a claim of implemented retrieval, governed tools or live platform validation.
