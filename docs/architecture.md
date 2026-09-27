# Architecture

The implemented demo is one Node.js 22 Azure Functions v4 app serving public frontend assets and protected API routes. It orchestrates bounded specialist tasks, using either deterministic mock inference or managed-identity Azure model calls. It does not require a paid agent platform, vector database, Fabric, Agent 365, Purview or API Management. Those labels in the proposed blueprint are future architecture concepts.

```mermaid
flowchart TD
  UI[Browser: mode, approval, trace] --> AUTH[Easy Auth + Retail.Demo role]
  AUTH --> O[Orchestrator + shared daily quota]
  O --> D[Demand: configured model]
  O --> I[Inventory: configured model]
  D --> A[Allocation: configured model]
  I --> A
  A --> R[Risk: separate deployment]
  A --> V[Value: deterministic code]
  R --> G[Policy gate]
  V --> G
  G --> H[Pending human approval]
  H --> CAS[Owner, expiry, revision check]
  CAS --> E[Execution: demo receipt only]
  O --> B[Blob run state and ETags]
  CAS --> B
  O --> T[Application Insights trace logs]
```

`api/src/orchestrator.js` implements this dependency graph with `Promise.allSettled`. Independent tasks start before fan-in; all siblings settle before a failure is persisted so no late sibling mutates the final trace. Demand/inventory outputs feed allocation. Only numeric evidence flows between model agents; narratives are displayed as text and are not concatenated into downstream instructions. Risk and value follow allocation concurrently. Value applies fixture unit economics ($12 margin, $2 cost). A deterministic cap of 60 units and positive quantity supplements model risk review.

`contracts.d.ts` defines internal task envelopes, outputs, trace records and workflow states. JSDoc types the actual task construction; runtime checks validate each model output's exact fields, types, bounds and allocation evidence. Deployment names route by task type, never by browser input. Value and execution cannot be routed to a model. The older `agents/` contract remains a separately tested legacy example. Neither contract implements official A2A discovery, wire messages, streaming or protocol lifecycle semantics; no compliance claim is made.

## State and approval

`running → pending | blocked | failed`; `pending → rejected | executing → completed | failed`. Approval expires 30 minutes after run creation. The owner must be an Entra user with the demo role (or the explicit simulated identity in the loopback-only local server). Approval includes decision, actor and timestamp; the proposal is immutable after creation. Its revision is bound to approval. Azure Blob ETags provide compare-and-swap across instances. The winning approval claims `executing` before any execution task starts. No automatically retried enterprise action exists.

Deployed state is Blob JSON, retained for seven days. The local store preserves the same revision semantics in memory. UTC daily admission counters share that store and consume a slot before inference, including failed runs. Restarting a deployed app does not reset quota or approvals. Local restart resets both. Owner checks occur before reads and writes.

Execution only constructs a receipt and persists it. A host crash after claiming execution leaves an `executing` record; it does not automatically repeat the action. A host crash during analysis leaves `running`. Manual investigation is required; this short synchronous workflow is not a durable workflow engine. Clients losing the initial HTTP response cannot currently recover the generated run ID automatically.

## Reliability, telemetry and authentication

Each model call gets an internal task ID, workflow correlation ID, deadline, abort signal, deployment name and attempt. Timeouts, HTTP 429 and 5xx retry once, with bounded backoff; invalid output, authorization and policy errors fail closed. Timed-out remote inference might still incur charges. Overall Functions timeout is two minutes. There is no live-to-mock fallback. Trace snapshots persist at final analysis/approval state, and events also go to invocation logs. Application Insights sampling can drop log copies; Blob state is the demo review record, not an immutable compliance archive.

Easy Auth validates deployed bearer tokens and strips/splices trusted principal headers. The application checks AAD identity, object ID, delegated `access_as_user` scope and `Retail.Demo`. Do not host its deployed adapter behind a proxy that forwards user-controlled principal headers without authenticating them. Same-origin JSON requests, content limits and role/owner checks protect approval. ManagedIdentityCredential obtains Azure OpenAI and Blob tokens. Managed identity has Blob Data Owner on the host storage account and OpenAI User on the configured existing AI account; it has no retail system permissions.

The Functions app hosts frontend assets on the same origin, reusing CSP/security headers. A password input accepts a delegated API token for this operator demo; production should use an audited MSAL sign-in flow. UI business metrics remain illustrative and are labeled accordingly.

Sources: [Functions deployment configuration](https://learn.microsoft.com/en-us/azure/azure-functions/functions-infrastructure-as-code), [identity-based storage](https://learn.microsoft.com/en-us/azure/azure-functions/functions-identity-based-connections-tutorial), [keyless Azure model access](https://learn.microsoft.com/en-us/azure/developer/ai/keyless-connections), [Easy Auth](https://learn.microsoft.com/en-gb/azure/app-service/overview-authentication-authorization).
