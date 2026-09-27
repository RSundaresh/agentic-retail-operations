const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function browser() {
  const elements = new Map(); const timers = new Map(); let id=0;
  const element = s => {
    if (!elements.has(s)) { const classes=new Set(); elements.set(s,{textContent:'',innerHTML:'',setAttribute(k,v){this[k]=v},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),toggle(){},replace(a,b){classes.delete(a);classes.add(b)}}}); }
    return elements.get(s);
  };
  const context=vm.createContext({window:{},document:{querySelector:element,querySelectorAll:()=>[]},setTimeout(fn){timers.set(++id,fn);return id},clearTimeout(id){timers.delete(id)}});
  for (const file of ['data.js','app.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context);
  return {element,timers,run:s=>vm.runInContext(s,context),finish(){while(timers.size){const [key,fn]=timers.entries().next().value;timers.delete(key);fn();}}};
}
test('frontend calls API and renders approval, routing, latency and safe model text',async()=>{
  const b=browser();
  assert.equal(b.element('#blueprint-title').textContent,'Agent-led rebalancing');
  b.run(`fetch = async (url, options) => ({ok:true,json:async()=>url==='/api/config' ? {mode:'simulated',identity:'local'} : {id:'run-1',scenario:'inventory',state:'pending',mode:'simulated',expiresAt:'soon',revision:1,outputs:{demand:{rationale:'<script>bad</script>'}},trace:[{event:'succeeded',agent:'demand',model:'mock-demand-v1',latencyMs:2}]}})`);
  await b.run('runSimulation()');
  assert.match(b.element('#sim-event').textContent,/pending/);
  assert.match(b.element('#sim-track').textContent,/mock-demand-v1.*2 ms/);
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
  assert.equal(b.element('#simulation-modal')['aria-hidden'],'true');
  assert.equal(b.element('#approve-run').disabled,true);
});
test('drawer accessibility state follows visibility',()=>{
  const b=browser(); b.run('openDrawer()'); assert.equal(b.element('#drawer')['aria-hidden'],'false');
  b.run('closeDrawer()'); assert.equal(b.element('#drawer')['aria-hidden'],'true');
});
