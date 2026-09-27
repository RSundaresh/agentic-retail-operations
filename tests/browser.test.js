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
test('initial blueprint and selected scenario/model results agree',()=>{
  const b=browser(); assert.equal(b.element('#blueprint-title').textContent,'Agent-led rebalancing');
  b.run("current='promotion';selectedModel='assist';render();runSimulation()"); b.finish();
  assert.match(b.element('#sim-results').innerHTML,/2.4 days/); assert.match(b.element('#sim-results').innerHTML,/16 actions/);
});
test('closing or restarting cancels pending simulation callbacks',()=>{
  const b=browser(); b.run('runSimulation();runSimulation()'); assert.equal(b.timers.size,1);
  b.run('closeSimulation()'); assert.equal(b.timers.size,0); assert.equal(b.element('#simulation-modal')['aria-hidden'],'true');
  b.run('runSimulation()'); b.finish(); assert.equal(b.timers.size,0); assert.match(b.element('#sim-event').innerHTML,/no actions executed/);
});
test('drawer accessibility state follows visibility',()=>{
  const b=browser(); b.run('openDrawer()'); assert.equal(b.element('#drawer')['aria-hidden'],'false');
  b.run('closeDrawer()'); assert.equal(b.element('#drawer')['aria-hidden'],'true');
});
