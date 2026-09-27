'use strict';
const {error} = require('./orchestrator');
function principal(headers, deployed) {
  if (!deployed) return 'local-demo-human';
  // Trusted ONLY behind App Service Easy Auth, configured by infra/main.bicep.
  const encoded=headers.get('x-ms-client-principal');
  try {
    const p=JSON.parse(Buffer.from(encoded || '', 'base64').toString());
    const oid=p.claims.find(c => ['http://schemas.microsoft.com/identity/claims/objectidentifier','oid'].includes(c.typ))?.val;
    const roles=p.claims.filter(c => [p.role_typ,'roles'].includes(c.typ)).map(c => c.val);
    const scopes=p.claims.filter(c => ['scp','http://schemas.microsoft.com/identity/claims/scope'].includes(c.typ)).flatMap(c => c.val.split(' '));
    if (p.auth_typ !== 'aad' || !oid || !roles.includes('Retail.Demo') || !scopes.includes('access_as_user')) throw new Error();
    return oid;
  } catch { throw error(403,'DEMO_ROLE_REQUIRED'); }
}
function createHandler(orchestrator, settings) {
  return async function handle(request) {
    const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
    try {
      const url=new URL(request.url), path=url.pathname;
      const owner=principal(request.headers,settings.deployed);
      if (request.method === 'GET' && path === '/api/config') return {status:200,headers,jsonBody:{mode:settings.provider === 'azure' ? 'live':'simulated',routing:settings.models,executionMode:'demo-receipt-only',identity:settings.deployed ? 'Entra Retail.Demo':'simulated local approver'}};
      let body;
      if (request.method === 'POST') {
        if (request.headers.get('origin') && request.headers.get('origin') !== url.origin) throw error(403,'ORIGIN_DENIED');
        if (!(request.headers.get('content-type') || '').startsWith('application/json')) throw error(415,'JSON_REQUIRED');
        const raw=await request.text();
        if (raw.length > 2048) throw error(413,'BODY_TOO_LARGE');
        try { body=JSON.parse(raw); } catch { throw error(400,'INVALID_JSON'); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw error(400,'INVALID_BODY');
      }
      let result;
      if (path === '/api/runs' && request.method === 'POST') {
        if (Object.keys(body).some(k => k !== 'scenario')) throw error(400,'UNKNOWN_FIELD');
        result=await orchestrator.create(body.scenario,owner);
      } else {
        const match=path.match(/^\/api\/runs\/([a-f0-9-]{36})(\/approval)?$/);
        if (!match) throw error(404,'NOT_FOUND');
        if (request.method === 'GET' && !match[2]) result=await orchestrator.get(match[1],owner);
        else if (request.method === 'POST' && match[2]) {
          if (Object.keys(body).some(k => !['decision','revision'].includes(k))) throw error(400,'UNKNOWN_FIELD');
          result=await orchestrator.decide(match[1],owner,body.decision,body.revision);
        } else throw error(405,'METHOD_NOT_ALLOWED');
      }
      return {status:200,headers,jsonBody:result};
    } catch(e) { return {status:e.status || 500,headers,jsonBody:{error:e.status ? e.code:'INTERNAL_ERROR'}}; }
  };
}
module.exports={createHandler,principal};
