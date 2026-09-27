# Budget: $200 maximum planning envelope

Default deployment is **mock mode**, with no model spend. Use a dedicated resource group and confirm its billing currency. Bicep configures a monthly budget amount of 200, with actual-cost notifications at 50% and 80%, and forecast notification at 100%. Azure budgets **do not stop spending**; alerts can lag. This is a cost-conscious demo design, not a guaranteed billing cap. See [Microsoft budget behavior](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets).

## Live-demo planning assumptions

30 admitted runs/day × 31 days = 930 runs/month. Four model tasks per run, each at most two attempts = 7,440 calls. Each request has a 4,096-byte serialized message cap and 600 completion-token cap. Conservatively budget 4,096 input tokens plus protocol overhead (use 4,300 in estimates) per call. Actual numeric-only prompts are much smaller. Reasoning tokens must fit the deployment's max_completion_tokens semantics; check your selected model.

At **assumed ceiling rates** of $2/million input tokens and $10/million completion tokens, maximum modeled monthly inference is:

`7,440 × (4,300 × $2 + 600 × $10) / 1,000,000 = $108.62`.

These are planning rate ceilings, **not a current Azure price quote**. Select pay-as-you-go deployments at or below both ceilings or reduce DAILY_RUN_LIMIT before enabling live mode. Do not use provisioned throughput. Confirm region/model prices with the [Azure pricing calculator](https://azure.microsoft.com/en-us/pricing/calculator/) and [Azure OpenAI pricing](https://azure.microsoft.com/en-au/pricing/details/azure-openai/).

| Allocation | Monthly planning reserve |
| --- | ---: |
| Model inference (including bounded retries) | $110 |
| Flex compute and requests | $15 |
| Blob storage and transactions | $5 |
| Application Insights / Log Analytics | $15 |
| Contingency and tax/currency variation | $55 |
| Total | **$200** |

Infrastructure reserves are targets for a small, access-controlled demo, not measured charges. Recalculate with your offer, region and traffic. Avoid paid search, Cosmos DB, Premium Functions, dedicated compute, APIM and always-ready instances. The single Function App serves UI and API. Flex defaults use 512 MB, no always-ready instances, and maximum scale 40 (the service minimum maximum-instance setting), not 40 provisioned instances. See [Flex consumption costs](https://learn.microsoft.com/en-us/azure/azure-functions/functions-consumption-costs).

Logs are sampled at two telemetry items/sec; workspace daily ingestion cap is 0.1 GB with 30-day retention. That cap may not be a strict instantaneous cutoff. Blob run/quota records expire after seven days. The app-wide admission cap is enforced with ETags before model calls, including failed runs. Requests and storage contention can still generate costs after the model cap is reached. Large-scale public/hostile traffic is outside this budget assumption.

Before each demo, inspect Cost Analysis, model rate limits and the daily quota; keep the Entra role assignment small. At $100 investigate. At $160 switch MODEL_PROVIDER to mock and stop nonessential traffic. If spending must stop, an operator must stop/delete resources as appropriate; storage/log retention may still charge. There is no autonomous shutdown workflow. Remove the dedicated demo resources after the event, subject to retaining needed evidence. Existing AI account consumption in the same resource group counts against this budget; use no other workloads there.
