const {test}=require('node:test');
const assert=require('node:assert/strict');
const {config}=require('../src/config');
const {MockProvider,AzureProvider,validate}=require('../src/providers');
const {MemoryStore,BlobStore}=require('../src/store');
const {Orchestrator}=require('../src/orchestrator');
const {createHandler,principal}=require('../src/http');
function setup(overrides={}) {
  const settings={...config({}),...overrides.settings};
  const store=overrides.store || new MemoryStore();
  const provider=overrides.provider || new MockProvider();
  const engine=new Orchestrator({settings,provider,store});
  return {engine,store,settings,handle:createHandler(engine,settings)};
}
const request=(path,body,headers={}) => new Request(`http://localhost${path}`,{method:body === undefined?'GET':'POST',headers:{'Content-Type':'application/json',...headers},...(body === undefined ? {} : {body:JSON.stringify(body)})});
test('deterministic six-agent workflow gates execution and records correlated routes',async()=>{
  const {engine}=setup();
  const a=await engine.create('inventory','human'), b=await engine.create('inventory','human');
  assert.equal(a.state,'pending');assert.deepEqual(a.outputs,b.outputs);assert.notEqual(a.id,b.id);
  assert.equal(a.outputs.execution,undefined);
  assert.equal(a.trace.filter(t=>t.event === 'succeeded').length,5);
  assert(a.trace.every(t=>t.correlationId === a.id && t.model && t.taskId));
  const done=await engine.decide(a.id,'human','approve',a.revision);
  assert.equal(done.state,'completed');assert.equal(done.approval.actor,'human');
  assert.equal(done.outputs.execution.enterpriseWrite,false);
  assert.equal(done.outputs.execution.units,60);
  await assert.rejects(engine.decide(a.id,'human','approve',a.revision),{code:'INVALID_STATE'});
});
test('fan-out starts independent work before fan-in and preserves dependencies',async()=>{
  const base=new MockProvider(), started=[];let release;
  const gate=new Promise(r=>release=r);
  const provider={async invoke(t){started.push(t.to);if(t.to==='demand')await gate;if(t.to==='inventory')release();return base.invoke(t);}};
  const {engine}=setup({provider});const run=await engine.create('promotion','human');
  assert.equal(run.state,'pending');assert.deepEqual(started,['demand','inventory','allocation','risk']);
  const idx=(a,event)=>run.trace.findIndex(t=>t.agent===a && t.event===event);
  assert(idx('inventory','started')<idx('demand','succeeded'));
  assert(idx('allocation','started')>idx('inventory','succeeded'));
  assert(idx('value','started')<idx('risk','succeeded'));
});
test('retryable errors retry, malformed output fails closed, failures retain traces',async()=>{
  const base=new MockProvider();let calls=0;
  const provider={async invoke(t){if(t.to==='demand' && ++calls===1)throw Object.assign(new Error(),{code:'MODEL_HTTP_429',retryable:true});return base.invoke(t);}};
  const {engine}=setup({provider});const run=await engine.create('inventory','human');
  assert.equal(run.state,'pending');assert.equal(calls,2);
  assert(run.trace.some(t=>t.attempt===2));
  const bad=setup({provider:{async invoke(){return {transferUnits:99999,rationale:'bad'};}}});
  const failed=await bad.engine.create('inventory','human');
  assert.equal(failed.state,'failed');assert.equal(failed.error,'INVALID_OUTPUT');
  assert.equal(failed.outputs.execution,undefined);assert.equal(failed.trace.filter(t=>t.event==='failed').length,2);
});
test('timeouts abort and exhaust a bounded retry budget',async()=>{
  let aborted=0;
  const {engine}=setup({settings:{timeoutMs:5},provider:{invoke(t,signal){signal.addEventListener('abort',()=>aborted++);return new Promise(()=>{});}}});
  const run=await engine.create('inventory','human');
  assert.equal(run.state,'failed');assert.equal(run.error,'TIMEOUT');assert.equal(aborted,4);
  assert.equal(run.trace.filter(t=>t.event==='started').length,4);
});
test('risk denial and deterministic policy prevent approval',async()=>{
  const base=new MockProvider();
  for (const force of ['risk','allocation']) {
    const {engine}=setup({provider:{async invoke(t){if(t.to===force)return force==='risk'?{approved:false,rationale:'Denied'}:{transferUnits:70,rationale:'Over policy'};return base.invoke(t);}}});
    const run=await engine.create('inventory','human');assert.equal(run.state,'blocked');
    await assert.rejects(engine.decide(run.id,'human','approve',run.revision),{code:'INVALID_STATE'});
  }
});
test('reject, expiry, ownership and concurrent approval fail safely',async()=>{
  const {engine,store}=setup();
  const run=await engine.create('inventory','alice');
  await assert.rejects(engine.get(run.id,'bob'),{status:404});
  await assert.rejects(engine.decide(run.id,'bob','approve',run.revision),{status:404});
  const results=await Promise.allSettled([engine.decide(run.id,'alice','approve',run.revision),engine.decide(run.id,'alice','approve',run.revision)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await engine.get(run.id,'alice')).trace.filter(t=>t.agent==='execution' && t.event==='started').length,1);
  const reject=await engine.create('inventory','alice');assert.equal((await engine.decide(reject.id,'alice','reject',reject.revision)).state,'rejected');
  const expired=await engine.create('inventory','alice');
  const saved=await store.put(expired.id,{...expired,expiresAt:'2000-01-01T00:00:00Z'},expired.revision);
  await assert.rejects(engine.decide(saved.id,'alice','approve',saved.revision),{code:'APPROVAL_EXPIRED'});
});
test('shared daily quota is atomic across concurrent requests and instances',async()=>{
  const store=new MemoryStore();const a=setup({store,settings:{dailyLimit:1}}),b=setup({store,settings:{dailyLimit:1}});
  const results=await Promise.allSettled([a.engine.create('inventory','a'),b.engine.create('promotion','b')]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.find(r=>r.status==='rejected').reason.code,'DAILY_LIMIT');
});
test('HTTP integration creates, reloads and approves; blocks injection and CSRF',async()=>{
  const {handle}=setup();
  const c=await handle(request('/api/config'));assert.equal(c.jsonBody.mode,'simulated');
  const run=(await handle(request('/api/runs',{scenario:'inventory'}))).jsonBody;
  assert.equal((await handle(request(`/api/runs/${run.id}`))).jsonBody.state,'pending');
  const done=await handle(request(`/api/runs/${run.id}/approval`,{decision:'approve',revision:run.revision}));assert.equal(done.jsonBody.state,'completed');
  assert.equal((await handle(request('/api/runs',{scenario:'inventory',model:'evil'}))).status,400);
  assert.equal((await handle(request('/api/runs',{scenario:'inventory'},{Origin:'https://evil.example'}))).status,403);
  assert.equal((await handle(request('/api/runs',{scenario:'inventory'},{'Content-Type':'text/plain'}))).status,415);
  assert.equal((await handle(request('/api/runs',{scenario:'x'.repeat(3000)}))).status,413);
  assert.equal((await handle(new Request('http://localhost/api/runs',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'}))).status,400);
});
test('deployed identity requires trusted Entra principal and Retail.Demo role',async()=>{
  assert.throws(()=>principal(new Headers(),true),{status:403});
  const principalHeader=role=>Buffer.from(JSON.stringify({auth_typ:'aad',role_typ:'roles',claims:[{typ:'oid',val:'alice'},{typ:'roles',val:role},{typ:'scp',val:'access_as_user'}]})).toString('base64');
  assert.throws(()=>principal(new Headers({'x-ms-client-principal':principalHeader('other')}),true),{status:403});
  assert.equal(principal(new Headers({'x-ms-client-principal':principalHeader('Retail.Demo')}),true),'alice');
  const appToken=JSON.parse(Buffer.from(principalHeader('Retail.Demo'),'base64').toString());
  appToken.claims=appToken.claims.filter(c=>c.typ!=='scp');
  assert.throws(()=>principal(new Headers({'x-ms-client-principal':Buffer.from(JSON.stringify(appToken)).toString('base64')}),true),{status:403});
  const {handle}=setup({settings:{deployed:true}});assert.equal((await handle(request('/api/config'))).status,403);
});
test('model configuration rejects unknown providers, untrusted endpoints and shared risk route',()=>{
  const env={MODEL_PROVIDER:'azure',AZURE_OPENAI_ENDPOINT:'https://demo.openai.azure.com/openai/v1/',MODEL_DEMAND:'fast',MODEL_INVENTORY:'fast',MODEL_ALLOCATION:'reason',MODEL_RISK:'risk'};
  assert.equal(config(env).models.risk,'risk');
  for(const patch of [{MODEL_PROVIDER:'other'},{AZURE_OPENAI_ENDPOINT:'https://evil.example/openai/v1/'},{MODEL_RISK:'reason'},{MODEL_DEMAND:''},{DAILY_RUN_LIMIT:'0'},{WEBSITE_HOSTNAME:'deployed'}])assert.throws(()=>config({...env,...patch}));
});
test('Azure adapter uses bearer token, selected deployment, bounded JSON and no keys',async()=>{
  let captured;
  const settings={endpoint:'https://demo.openai.azure.com/openai/v1/'};
  const credential={async getToken(scope){assert.equal(scope,'https://cognitiveservices.azure.com/.default');return {token:'test-token'};}};
  const provider=new AzureProvider(settings,credential,async(url,opts)=>{captured={url,...opts};return new Response(JSON.stringify({choices:[{message:{content:'{"forecastUnits":120,"rationale":"fixture"}'}}]}));});
  const task={to:'demand',model:'route-demand',input:{scenario:'inventory'}};
  const result=await provider.invoke(task,new AbortController().signal);assert.equal(result.forecastUnits,120);
  assert.equal(captured.headers.Authorization,'Bearer test-token');assert.equal(JSON.parse(captured.body).model,'route-demand');assert.equal(JSON.parse(captured.body).max_completion_tokens,600);
  for(const status of [401,429,503]) {
    const p=new AzureProvider(settings,credential,async()=>new Response('',{status}));
    await assert.rejects(p.invoke(task),e=>e.retryable === (status!==401));
  }
});
test('strict output validation rejects extra fields, invalid numbers and policy excess',()=>{
  for(const r of [{forecastUnits:-1,rationale:'x'},{forecastUnits:1.5,rationale:'x'},{forecastUnits:1,rationale:'x',execute:true},{forecastUnits:1,rationale:''}])assert.throws(()=>validate('demand',r,{}));
  assert.throws(()=>validate('allocation',{transferUnits:50,rationale:'x'},{inventory:{availableUnits:20},demand:{forecastUnits:100}}));
});
test('Blob store maps ETag conflicts and missing records (SDK-independent adapter test)',async()=>{
  const store=Object.create(BlobStore.prototype);let options;
  store.container={getBlockBlobClient(){return {async upload(b,n,o){options=o;return {etag:'new'};},async download(){throw {statusCode:404};}};}};
  assert.equal(await store.get('missing'),null);
  assert.equal((await store.put('run',{id:'run'},'old')).revision,'new');assert.deepEqual(options.conditions,{ifMatch:'old'});
  await store.put('run',{});assert.deepEqual(options.conditions,{ifNoneMatch:'*'});
  store.container={getBlockBlobClient(){return {async upload(){throw {statusCode:412};}};}};
  await assert.rejects(store.put('run',{},'old'),{status:409});
});
test('durable approval survives a new orchestrator and storage failure prevents execution',async()=>{
  const store=new MemoryStore();const a=setup({store});const run=await a.engine.create('inventory','human');
  const b=setup({store});assert.equal((await b.engine.get(run.id,'human')).state,'pending');
  const realPut=store.put.bind(store);let executionAttempts=0;
  b.engine.log=e=>{if(e.agent==='execution')executionAttempts++;};
  store.put=async(id,value,revision)=>{if(value.state==='executing')throw new Error('storage unavailable');return realPut(id,value,revision);};
  await assert.rejects(b.engine.decide(run.id,'human','approve',run.revision));
  assert.equal(executionAttempts,0);assert.equal((await b.engine.get(run.id,'human')).state,'pending');
});
test('approval final-write failure cannot replay a claimed execution',async()=>{
  const {engine,store}=setup();const run=await engine.create('inventory','human');
  const realPut=store.put.bind(store);
  store.put=async(id,value,revision)=>{if(value.state==='completed')throw new Error('storage unavailable');return realPut(id,value,revision);};
  await assert.rejects(engine.decide(run.id,'human','approve',run.revision));
  const persisted=await engine.get(run.id,'human');assert.equal(persisted.state,'executing');
  await assert.rejects(engine.decide(run.id,'human','approve',persisted.revision),{code:'INVALID_STATE'});
});
test('Azure adapter rejects malformed JSON and oversized prompts without fallback',async()=>{
  const credential={async getToken(){return {token:'test-token'};}};
  let calls=0;
  const p=new AzureProvider({endpoint:'https://demo.openai.azure.com/openai/v1/'},credential,async()=>{calls++;return new Response('{}');});
  await assert.rejects(p.invoke({to:'demand',model:'fast',input:{scenario:'inventory'}}),{code:'INVALID_OUTPUT'});
  await assert.rejects(p.invoke({to:'demand',model:'fast',input:{scenario:'inventory',unexpected:'x'.repeat(5000)}}),{code:'PROMPT_LIMIT'});
  assert.equal(calls,1);
});
