# Agentic Retail Operations

A deployable Azure Functions demo with six cooperating agents, explicit model routing, parallel analysis, and human approval. The browser calls a real Node.js API. Run locally without dependencies or credentials; deploy with managed identity and optional Azure OpenAI model calls.

**Demo boundaries:** retail evidence and dashboard metrics are synthetic. In `simulated` mode, model outputs are deterministic fixtures. In `live` mode, four specialists call Azure models. Value and execution always use deterministic code. Execution creates a persisted **demo receipt**, never a real inventory transfer. Every execution requires a human approval request. Local human identity is simulated; Azure requires an authenticated Entra user with `Retail.Demo` role.

Internal `retail-task/2` envelopes are **not standards-compliant A2A**. No official protocol validation or interoperability is claimed. The older `agents/` folder is retained as a legacy proposal-format example, not the runtime.

## Run locally

Use Node.js 22 or newer (check `node --version`).

```sh
npm test
npm start
```

Open **http://127.0.0.1:4173** (use that hostname exactly). Click **Run agent workflow**, inspect outputs and traces, then approve or reject. No npm installation is needed for the mock server. State and the daily quota reset when the local server restarts. The Azure token field stays empty locally.

`npm run build` copies public files to `dist/` and `api/public/`. The Functions package serves the frontend and API on the same origin, avoiding a paid Static Web Apps tier or a proxy. `staticwebapp.config.json` is reused as the security-header source. The old static deployment workflow is now validation-only.

## Runtime and API

| Endpoint | Purpose |
| --- | --- |
| `GET /api/config` | Actual model mode, routing, execution boundary, identity mode |
| `POST /api/runs` | `{ "scenario": "inventory" }` or `promotion`; returns run and correlation ID |
| `GET /api/runs/{id}` | Reload a run owned by the caller |
| `POST /api/runs/{id}/approval` | `{ "decision": "approve", "revision": <returned revision> }` or `reject` |

Demand and inventory run concurrently. Allocation consumes both outputs. Risk and deterministic value run concurrently. Risk rejection or a failed policy check blocks approval. Successful analysis stops in `pending`; approval expiry is 30 minutes. Approval uses an atomic revision check before execution. Duplicate/stale approvals return 409; other users cannot read or approve your runs. Failed model requests never silently use mock results.

The request runs synchronously, with two attempts per model task and an eight-second timeout per attempt. Expect up to approximately 49 seconds plus storage/network overhead in the worst retry path. Trace entries include correlation/task IDs, routing, attempts, timestamps, latency and sanitized error codes. The UI displays completed traces; this is not streaming telemetry.

## Azure configuration

Install deployment dependencies on a network-enabled machine:

```sh
npm install --prefix api --ignore-scripts
npm run build
```

Direct SDK versions are pinned. Generate and review `api/package-lock.json` after this install and use `npm ci --prefix api` for subsequent releases. The restricted implementation environment could not reach npm, so it could not generate a transitive lockfile or validate the Functions host with installed SDKs.

See [api/.env.example](api/.env.example). Environment variables must be exported or set in Function App settings; `.env` files are not automatically loaded.

| Variable | Meaning |
| --- | --- |
| `MODEL_PROVIDER` | `mock` (default) or `azure`; invalid values fail startup |
| `AZURE_OPENAI_ENDPOINT` | HTTPS Azure OpenAI-compatible `/openai/v1/` endpoint, including the trailing slash |
| `MODEL_DEMAND`, `MODEL_INVENTORY` | Low-cost deployment names for evidence interpretation |
| `MODEL_ALLOCATION` | Deployment for constrained allocation reasoning |
| `MODEL_RISK` | Separate deployment from allocation, for independent challenge |
| `AZURE_CLIENT_ID` | Optional user-assigned managed identity; omit for the Bicep system identity |
| `STATE_STORAGE_URL` | Blob service URL; required on Azure |
| `DAILY_RUN_LIMIT` | Shared UTC daily run cap, default 30, allowed range 1–100 |

The Azure adapter supports Azure OpenAI models configured in Microsoft Foundry through the OpenAI-compatible v1 endpoint. It does not implement the Foundry project/Agent Service API or arbitrary provider endpoints. Select deployments supporting `chat/completions`, `json_object`, and `max_completion_tokens`. Risk and allocation may use separate deployments of the same economical model; separate routing does not guarantee independent reasoning. ManagedIdentityCredential is used explicitly, with no API-key fallback. There are no embedded credentials.

## Deployment prerequisites and operator steps

No resources have been created and no deployment has been performed. Before deploying:

1. Have Azure CLI with Bicep, Functions Core Tools v4, Node 22, and access to an Azure subscription. Choose a region with Flex Consumption capacity. The deployer needs resource creation, scoped role-assignment and budget permissions.
2. Create a **single-tenant Entra app registration** for the API. Set its Application ID URI to `api://<client-id>`, expose delegated scope `access_as_user`, and define the user app role `Retail.Demo`. Assign only demo users to that role in the enterprise application. Require user assignment. Configure a public client (or preauthorize Azure CLI where tenant policy permits) to obtain a delegated access token for that scope. No client secret is required for bearer-token validation.
3. For live mode, provision an Azure OpenAI account and economical pay-as-you-go model deployments in the **same resource group**. Verify availability, quota, compatibility and current pricing. Supply its name and deployment names to Bicep. Mock deployment needs no AI account. An existing shared AI account's other consumption also counts against the resource-group budget.
4. Review [cost guidance](docs/cost-guidance.md). Supply budget email recipients and the first day of the billing month. Compile and review the template. Perform a what-if review in your subscription before creating resources.

Commands below are **operator instructions**, not automatically executed by this repository:

```sh
az bicep build --file infra/main.bicep
az deployment group what-if --resource-group YOUR_RG --template-file infra/main.bicep \
  --parameters authClientId=YOUR_CLIENT_ID budgetEmails='["you@example.com"]' \
  budgetStartDate=2026-09-01T00:00:00Z
# After your own review/authorization, use the same parameters with deployment group create.
# Add modelProvider=azure openAiAccountName=YOUR_ACCOUNT and MODEL deployment parameters for live mode.
# After provisioning and RBAC propagation:
(cd api && func azure functionapp publish YOUR_FUNCTION_APP)
```

Build the frontend before publishing; `api/public/` is part of the Functions package. Flex uses managed-identity deployment storage. Bicep sets up Flex Consumption (512 MB, zero always-ready instances, minimum supported maximum-scale setting of 40), Blob storage, seven-day state retention, Application Insights, Log Analytics, managed identity, scoped RBAC, Easy Auth, and a 200-unit monthly budget (USD if your billing currency is USD).

Open the resulting Function App URL. Obtain a delegated API token with the `Retail.Demo` role using your approved Entra public client, then paste it into the password field. It is not persisted to browser storage. For an authorized/preauthorized Azure CLI client, the token command is `az account get-access-token --scope api://YOUR_CLIENT_ID/access_as_user --query accessToken -o tsv`. Tenant consent may be necessary. Do not use ARM tokens, Function keys or fabricated principal headers.

Validate unauthenticated API requests return 401, wrong-role requests return 403, and an assigned user can create/read/approve their own run. Verify identity storage access, model calls, Application Insights traces, budget notifications and concurrent approval behavior. Local tests do not validate Azure RBAC or Easy Auth infrastructure.

## Tests and documentation

`npm test` runs unit, API integration, frontend VM, security, concurrency and failure-path tests without Azure or third-party packages. `npm run build` builds both hosting artifacts. CI also installs the Azure SDKs and compiles Bicep; it has no deploy job.

- [Architecture](docs/architecture.md)
- [Threat model](docs/threat-model.md)
- [Cost guidance](docs/cost-guidance.md)
- [Production readiness and remaining limitations](docs/production-readiness.md)
- [Executive demo script](docs/executive-demo.md)
- [Validation review](docs/review.md)
