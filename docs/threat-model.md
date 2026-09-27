# Threat model

Assets: delegated user tokens, run proposals, approvals, correlation traces, model budget, workload identity and deployment package. Boundaries: browser → Easy Auth → Functions → Blob/Azure models. Retail data is synthetic; do not enter customer or production information.

| Threat | Implemented control | Residual risk / validation |
| --- | --- | --- |
| Forged approver or principal header | Azure Easy Auth tenant/audience validation plus AAD object ID, delegated scope and Retail.Demo role checks | Principal-header trust depends on deployed Easy Auth configuration; test forged headers against Azure before release |
| Unauthorized run access | Read/approval restricted to owner; 404 hides other users' runs | No team delegation or separation of requester and approver; same assigned user may approve |
| Duplicate/replayed approval | ETag claim before execution, exact revision, pending-only, expiry | Crash after claim needs investigation; no automatic execution recovery |
| Model authorizes itself | Models have no tools; runtime policy and human gate are deterministic | A mistaken human can approve a poor recommendation; outputs are not independently verified facts |
| Prompt injection | Only enumerated scenarios accepted; numeric evidence passed between agents; exact output schema/limits | LLMs can still make bad or inconsistent decisions; separate risk deployment is not proof of independence |
| Unsafe generated HTML | Model output and trace use textContent; CSP self-only scripts | Checked-in dashboard fixtures still use HTML templates and must remain trusted |
| CSRF/cross-origin approval | JSON-only POST, same-origin check, no CORS, bearer-token authentication | A same-origin XSS could act as user; CSP and dependency review matter |
| Credential theft | ManagedIdentityCredential for Azure; no source keys; browser token not persisted or logged | Operator token entry and browser extensions remain risks; replace with MSAL for pilot |
| SSRF/config tampering | Fixed HTTPS Azure host suffixes, v1 path; no user-supplied model/endpoint | Trusted deployer can alter configuration/code; restrict deployment permissions |
| Cost abuse | Role-limited callers, atomic shared daily cap, 600 completion tokens, 4 KB prompt limit, two attempts, budget alerts | Authentication failures and reads/static traffic still cost money; budget is not a hard stop |
| Retry storm or dependency outage | Eight-second deadlines, bounded retries, fail-closed state | Azure may finish timed-out requests; no circuit breaker or Retry-After coordination |
| Data leakage in logs | Trace contains task metadata/error codes, not tokens or raw provider errors | Blob contains model text and owner IDs; seven-day deletion, RBAC, encryption required |
| State races and loss | Azure Blob ETags, durable proposal/approval records | Operator/admin can mutate/delete records; this is not tamper-evident audit storage |
| Local identity bypass | Explicit simulated approver; local dev binds 127.0.0.1, checks Host, mock-only | Local users/processes can approve; never expose dev server to a network |
| Supply chain compromise | Direct dependency pins; validation-only CI; no postinstall needed | Transitive lock generation/audit and immutable action pins remain release requirements |

Security/failure tests exercise role parsing, missing identity, ownership, concurrency, revision replay, expiry, CSRF, malformed JSON, oversized requests, unknown fields, endpoint restrictions, policy rejection, model outages and timeouts. They do not replace Azure penetration tests or live authentication/RBAC verification.
