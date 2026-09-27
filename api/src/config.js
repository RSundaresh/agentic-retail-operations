'use strict';
function config(env = process.env) {
  const provider = env.MODEL_PROVIDER || 'mock';
  if (!['mock', 'azure'].includes(provider)) throw new Error('Invalid MODEL_PROVIDER');
  const deployed = !!env.WEBSITE_HOSTNAME;
  const models = Object.fromEntries(['demand','inventory','allocation','risk'].map(a => [a, provider === 'mock' ? `mock-${a}-v1` : env[`MODEL_${a.toUpperCase()}`]]));
  let endpoint;
  if (provider === 'azure') {
    endpoint = new URL(env.AZURE_OPENAI_ENDPOINT);
    if (endpoint.protocol !== 'https:' || !/\.(openai\.azure\.com|services\.ai\.azure\.com)$/.test(endpoint.hostname) || endpoint.pathname !== '/openai/v1/' || endpoint.search || endpoint.username || endpoint.password || endpoint.port) throw new Error('Use an Azure OpenAI-compatible HTTPS /openai/v1/ endpoint');
    if (Object.values(models).some(m => typeof m !== 'string' || !/^[\w.-]{1,100}$/.test(m))) throw new Error('Configure all four MODEL_* deployments');
    if (models.risk === models.allocation) throw new Error('Risk must use a separate deployment from allocation');
  }
  const dailyLimit = Number(env.DAILY_RUN_LIMIT || 30);
  if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 100) throw new Error('DAILY_RUN_LIMIT must be 1..100');
  if (deployed && !env.STATE_STORAGE_URL) throw new Error('Deployed state requires Blob storage');
  return { provider, deployed, models: {...models, value:'deterministic-code', execution:'deterministic-code'}, endpoint: endpoint?.href, dailyLimit, timeoutMs:8000, attempts:2 };
}
module.exports = { config };
