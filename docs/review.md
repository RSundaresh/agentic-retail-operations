# Repository review — 27 September 2026

## Findings and fixes

| Severity | Finding | Resolution |
|---|---|---|
| High | Root-directory deployment could publish internal artifacts and future sensitive files; no test gate | Build allowlists five public files, clears stale output, and deploys only `dist/` after validation. Push and PR events validate; publishing requires manual dispatch. |
| High | Authority accepted arbitrary strings; sender labels and agent responsibilities were unchecked | Local helper rejects unsupported authority, sender, destination, and task assignments. Execution remains unavailable. Every proposal conservatively requires review. These checks do not authenticate callers. |
| High | UI and documentation claimed connected Azure, Entra authorization, verified evidence, and A2A compliance | Labels and documentation now distinguish sample behavior from production requirements. Export no longer falsely reports a generated package. |
| Medium | Regex substring routing could choose the wrong model; shared policy and evidence objects were mutable | Exact task-class matching fails closed; policies and input data are copied. |
| Medium | Loose task schema omitted generated fields and allowed invalid authority/evidence | Closed local proposal schema describes emitted fields, supported agents, route policies, bounded evidence, and conservative approval. |
| Medium | Repeated simulation launches shared timers and scenario state; promotion results contradicted model selection | Timers cancel on close/restart/scenario changes; results use captured scenario and selected model. Drawer/modal visibility updates accessibility state. |
| Medium | No CSP; remote font requests; fallback masked unknown URLs | Self-hosted assets only, restrictive script/network/frame policy, and normal missing-path behavior. Inline styles remain allowed for generated visual styles. |
| Medium | Bicep SKU used comma-separated object properties | Converted to Bicep multiline object syntax; CI compiles infrastructure. |
| Medium | `azure.yaml` implied a complete azd deployment despite a resource-group template and missing provisioning integration | Explicit metadata-only file; supported deployment instructions use Azure CLI and GitHub Actions. |

## Architecture and orchestration boundary

`index.html` loads `data.js` and `app.js`. Both scenarios and all evidence are static fixtures. The simulation is a timer-driven walkthrough, not an optimizer or workflow engine. Model choice changes the displayed illustrative summary; it does not generate a different execution plan. Rendering uses trusted checked-in fixture strings in HTML templates. External data must be escaped or rendered as text before introducing runtime ingestion.

`agents/orchestrator.js` is a separate CommonJS proposal constructor, not connected to the browser. The registry and routing policies describe intended responsibilities. Quality thresholds, cost/hop/retry budgets, independent model execution, persistent state, timeouts, idempotency, cancellation across services, and approval receipts are not enforced. A caller-controlled approval flag or agent label must never authorize a real tool operation.

The file `agents/a2a-task.schema.json` retains its original path for discoverability but defines **retail-task/1**, an internal proposal format. It is not an A2A Task or Agent Card. A production A2A adapter needs the pinned protocol's Task/Message/Artifact/status models, discovery, authenticated transport, lifecycle/error handling, and interoperability tests. See the [official A2A specification](https://a2a-protocol.org/dev/specification/); the development specification is a reference, not a version pin.

## Azure and security boundary

Bicep provisions only a public Free Static Web App. It provisions no identity enforcement, agent host, database, Key Vault, policy service, or monitoring backend. The Azure CLI resource-group deployment is the supported infrastructure path. `azure.yaml` is metadata only, not an `azd up` implementation.

The workflow uses a deployment token and a production environment. Configure required reviewers and restrict the token as appropriate before enabling publication. Action references remain major-version tags; immutable commit pinning is a remaining supply-chain hardening task. Deployment output settings follow [Azure Static Web Apps build configuration](https://learn.microsoft.com/en-us/azure/static-web-apps/build-configuration). Azure CLI schema context is documented in the [azd configuration reference](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/azd-schema).

## Validation

- Original test command passed before changes (two shallow scripts).
- Expanded `npm test`: 9 passing test cases across smoke, orchestration, UI logic, and deployment packaging.
- `npm run build`: passed; output contains exactly the five public assets.
- Browser logic tests execute the real scripts in a Node VM with a minimal DOM/timer harness. They are not full browser rendering, accessibility, or CSP enforcement tests.
- Azure CLI and Bicep are not installed locally. Infrastructure was inspected and a compilation check added to CI; compilation and cloud deployment remain unverified here.
- The JSON Schema was inspected; no standalone draft-2020-12 schema validator is installed. Runtime validation and negative cases are exercised separately.
- No live A2A, model, Azure, or enterprise integration exists to exercise.

No commit, push, or deployment was performed. Repository-local Git identity is `Rsundaresh <sundareshwarananr@gmail.com>`.
