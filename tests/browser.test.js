const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function browser() {
  const elements = new Map();
  const html = fs.readFileSync('index.html', 'utf8');
  const element = s => {
    assert(s.startsWith('#') && html.includes(`id="${s.slice(1)}"`), `Missing UI element: ${s}`);
    if (!elements.has(s)) { const classes=new Set(); elements.set(s,{textContent:'',innerHTML:'',setAttribute(k,v){this[k]=v},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),toggle(){},replace(a,b){classes.delete(a);classes.add(b)}}}); }
    return elements.get(s);
  };
  const context=vm.createContext({window:{},document:{querySelector:element,querySelectorAll:()=>[]}});
  for (const file of ['data.js','app.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context);
  return {element,run:s=>vm.runInContext(s,context)};
}
test('Operations renders safe business results and approval status',async()=>{
  const b=browser();
  b.run(`fetch = async (url, options) => ({ok:true,json:async()=>url==='/api/config' ? {mode:'simulated',identity:'local'} : {id:'run-1',scenario:'inventory',state:'pending',mode:'simulated',expiresAt:'soon',revision:1,outputs:{demand:{rationale:'<script>bad</script>'}},trace:[{event:'succeeded',agent:'demand',model:'mock-demand-v1',latencyMs:2}]}})`);
  await b.run('runSimulation()');
  assert.match(b.element('#sim-event').textContent,/pending/);
  assert.match(b.element('#sim-track').textContent,/awaiting your approval/);
  assert.doesNotMatch(b.element('#sim-track').textContent,/mock-demand|latency|ms/);
  assert.equal(b.element('#approve-run').disabled,false);
  assert.match(b.element('#sim-results').textContent,/<script>/);
  assert.equal(b.element('#sim-results').innerHTML,'');
});
test('API errors remain visible without fabricated results',async()=>{
  const b=browser();b.run("fetch=async()=>{throw new Error('offline')}");
  await b.run('runSimulation()');
  assert.match(b.element('#sim-event').textContent,/offline/);
  assert.equal(b.element('#approve-run').disabled,true);
});
test('closing prevents stale asynchronous responses from updating the run',async()=>{
  const b=browser();b.run("let release;fetch=()=>new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>({mode:'simulated'})})})");
  const pending=b.run('runSimulation()');b.run('closeSimulation();release()');
  await new Promise(r=>setImmediate(r));b.run('release()');await pending;
  assert.equal(b.element('#simulation-modal')['aria-hidden'],'false');
  assert.equal(b.element('#approve-run').disabled,true);
});
test('drawer accessibility state follows visibility',()=>{
  const b=browser(); b.run('openDrawer()'); assert.equal(b.element('#drawer')['aria-hidden'],'false');
  b.run('closeDrawer()'); assert.equal(b.element('#drawer')['aria-hidden'],'true');
});

test('token is sent only in authorization header and approval/rejection keep API contract',async()=>{
  const b=browser();b.element('#api-token').value='secret-token';
  b.run(`let calls=[];fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>url==='/api/config'?{mode:'simulated',identity:'local'}:{id:'run-1',scenario:'inventory',mode:'simulated',state:options.body?.includes('approve')?'completed':options.body?.includes('reject')?'rejected':'pending',revision:1,outputs:{},trace:[]}}}`);
  await b.run('runSimulation()');await b.run("decideRun('approve')");
  assert.equal(b.run('calls[2].options.headers.Authorization'),'Bearer secret-token');
  assert.equal(b.run('calls[2].options.body'),'{"decision":"approve","revision":1}');
  assert.equal(b.element('#approve-run').disabled,true);
  await b.run('runSimulation()');await b.run("decideRun('reject')");
  assert.equal(b.run('calls[5].options.body'),'{"decision":"reject","revision":1}');
  assert.match(b.element('#response-status').textContent,/rejected/);
  assert.equal(b.run('calls.length'),6);
  assert.equal(b.run("calls.every(({url,options}) => !url.includes('secret-token') && !(options.body || '').includes('secret-token') && options.headers.Authorization === 'Bearer secret-token')"),true);
  for (const selector of ['#sim-event','#sim-results','#sim-track','#dossier-grid','#audit-reference','#response-status','#runtime-mode']) {
    assert.doesNotMatch(b.element(selector).textContent + b.element(selector).innerHTML,/secret-token/);
  }
});

test('workflow distinguishes parallel investigation, independent challenge and deterministic value',()=>{
  const b=browser();
  assert.match(b.element('#process-flow').innerHTML,/Investigate in parallel/);
  assert.match(b.element('#process-flow').innerHTML,/Waiting/);
  b.run("showRun({id:'r',scenario:'inventory',state:'blocked',outputs:{risk:{approved:false,rationale:'Limit exceeded'},value:{netValue:600,marginProtected:720,transferCost:120}},trace:[{agent:'demand',event:'started'},{agent:'inventory',event:'succeeded'}]})");
  const flow=b.element('#process-flow').innerHTML;
  assert.match(flow,/Analyzing/); assert.match(flow,/Complete/); assert.match(flow,/Challenged/);
  assert.match(flow,/Independent checks/); assert.match(flow,/deterministic calculation/);
  assert.equal(b.element('#approve-run').disabled,true);
});
test('dossier and guided answers use returned evidence safely and preserve accountability',()=>{
  const b=browser();
  b.run("showRun({id:'r',scenario:'promotion',state:'completed',outputs:{demand:{forecastUnits:80,rationale:'<img onerror=bad>'},inventory:{availableUnits:70,rationale:'Sample availability'},allocation:{transferUnits:60,rationale:'Within limits'},risk:{approved:true,rationale:'Policy passed'},value:{netValue:600,marginProtected:720,transferCost:120},execution:{receiptId:'receipt-r',units:60}},approval:{decision:'approve',actor:'operator@example.com',at:'today'},trace:[]})");
  const dossier=b.element('#dossier-grid').innerHTML;
  for(const label of ['Proposed action','Evidence','Policy result','Expected value','Accountable human decision','receipt-r','operator@example.com']) assert.ok(dossier.includes(label));
  assert.doesNotMatch(dossier,/<img/);assert.match(dossier,/&lt;img/);
  assert.match(b.element('#process-flow').innerHTML,/Executed/);
  b.run("answerQuestion('why')");assert.match(b.element('#copilot-answer').textContent,/60 units/);
  b.run("answerQuestion('inaction')");assert.match(b.element('#copilot-answer').textContent,/720/);assert.match(b.element('#copilot-answer').textContent,/No separate no-action forecast/);
  b.run("answerQuestion('evidence')");assert.match(b.element('#copilot-answer').textContent,/80 forecast units/);
  b.run("answerQuestion('policy')");assert.match(b.element('#copilot-answer').textContent,/60 units/);
  b.run('render()');assert.doesNotMatch(b.element('#dossier-grid').innerHTML,/receipt-r/);
});

 test('recommendation prioritizes returned action and value, with audit metadata separated',()=>{
  const b=browser();
  assert.equal(b.element('#recommendation-policy').textContent,'Policy check pending');
  assert.equal(b.element('#simulate-btn').textContent,'Analyze disruption');
  b.run("showRun({id:'decision-uuid',revision:3,expiresAt:'2026-09-27T18:00:00Z',scenario:'inventory',state:'pending',outputs:{allocation:{transferUnits:60,rationale:'Nearby excess'},risk:{approved:true,rationale:'Within policy'},value:{netValue:600}},trace:[]})");
  assert.equal(b.element('#recommendation-title').textContent,'Transfer 60 units from nearby excess inventory');
  assert.equal(b.element('#recommendation-value').textContent,'$600 net value');
  assert.equal(b.element('#recommendation-policy').textContent,'Policy check passed');
  assert.equal(b.element('#simulate-btn').textContent,'Run analysis again');
  assert.equal(b.element('#approve-run').disabled,false);
  assert.equal(b.element('#reject-run').disabled,false);
  assert.match(b.element('#audit-reference').textContent,/decision-uuid · Revision: 3 · Expires: 2026-09-27T18:00:00Z/);
  assert.doesNotMatch(b.element('#sim-event').textContent,/decision-uuid|2026-09-27/);
  assert.match(b.element('#process-flow').innerHTML,/06 · Execute & record/);
  b.run("showRun({id:'decision-uuid',state:'completed',outputs:{},trace:[]})");
  assert.equal(b.element('#simulate-btn').textContent,'Run analysis again');
  assert.equal(b.element('#approve-run').disabled,true);
  assert.equal(b.element('#reject-run').disabled,true);
  b.run('render()');
  assert.equal(b.element('#recommendation-policy').textContent,'Policy check pending');
  assert.doesNotMatch(b.element('#audit-reference').textContent,/decision-uuid/);
});
test('blocked recommendation never reports policy passed or enables a decision',()=>{
  const b=browser();
  b.run("showRun({id:'blocked',state:'blocked',outputs:{allocation:{transferUnits:70},risk:{approved:false}},trace:[]})");
  assert.equal(b.element('#recommendation-title').textContent,'Transfer 70 units from nearby excess inventory');
  assert.equal(b.element('#recommendation-policy').textContent,'Policy check blocked');
  assert.equal(b.element('#approve-run').disabled,true);
  assert.equal(b.element('#reject-run').disabled,true);
});
