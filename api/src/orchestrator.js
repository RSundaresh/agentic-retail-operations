'use strict';
const {randomUUID} = require('node:crypto');
const {validate} = require('./providers');
const error = (status, code) => Object.assign(new Error(code), {status,code});
class Orchestrator {
  constructor({settings, provider, store, log = () => {}}) { Object.assign(this,{settings,provider,store,log}); }
  async quota() {
    const key = `quota-${new Date().toISOString().slice(0,10)}`;
    for (let i=0;i<8;i++) {
      const record = await this.store.get(key);
      if ((record?.count || 0) >= this.settings.dailyLimit) throw error(429,'DAILY_LIMIT');
      try { await this.store.put(key,{count:(record?.count || 0)+1},record?.revision ?? null); return; }
      catch(e) { if (e.status !== 409) throw e; }
    }
    throw error(429,'BUSY');
  }
  async task(run, agent, input, action) {
    const taskId = randomUUID(), model = this.settings.models[agent];
    for (let attempt=1;attempt <= (action ? 1 : this.settings.attempts);attempt++) {
      const start = Date.now(), controller = new AbortController();
      /** @type {import('./contracts').TaskEnvelope} */
      const envelope = {contractVersion:'retail-task/2',taskId,correlationId:run.id,from:'orchestrator',to:agent,taskType:agent,attempt,model,deadline:new Date(start+this.settings.timeoutMs).toISOString(),input};
      const record = (event, details={}) => { const entry = {taskId,correlationId:run.id,agent,model,attempt,event,at:new Date().toISOString(),...details}; run.trace.push(entry); this.log(entry); };
      record('started');
      let timer;
      try {
        const result = await Promise.race([
          Promise.resolve().then(() => action ? action() : this.provider.invoke(envelope, controller.signal)),
          new Promise((_,reject) => {timer=setTimeout(() => {controller.abort(); reject(Object.assign(error(504,'TIMEOUT'),{retryable:true}));},this.settings.timeoutMs);})
        ]);
        const output = action ? result : validate(agent,result,input);
        record('succeeded',{latencyMs:Date.now()-start}); return output;
      } catch(e) {
        record('failed',{latencyMs:Date.now()-start,code:e.code || 'PROVIDER_ERROR'});
        if (!e.retryable || attempt === this.settings.attempts || action) throw e;
      } finally { clearTimeout(timer); }
      await new Promise(resolve => setTimeout(resolve, 100 * attempt));
    }
  }
  async create(scenario, owner) {
    if (!['inventory','promotion'].includes(scenario)) throw error(400,'INVALID_SCENARIO');
    await this.quota();
    const id = randomUUID();
    let run = await this.store.put(id,{id,owner,scenario,state:'running',mode:this.settings.provider === 'azure' ? 'live':'simulated',executionMode:'demo-receipt-only',createdAt:new Date().toISOString(),expiresAt:new Date(Date.now()+30*60000).toISOString(),outputs:{},trace:[]});
    try {
      const first = await Promise.allSettled(['demand','inventory'].map(a => this.task(run,a,{scenario})));
      if (first.some(r => r.status === 'rejected')) throw first.find(r => r.status === 'rejected').reason;
      [run.outputs.demand,run.outputs.inventory] = first.map(r => r.value);
      const input = {scenario,demand:{forecastUnits:run.outputs.demand.forecastUnits},inventory:{availableUnits:run.outputs.inventory.availableUnits}};
      run.outputs.allocation = await this.task(run,'allocation',input);
      const second = await Promise.allSettled([
        this.task(run,'risk',{...input,allocation:{transferUnits:run.outputs.allocation.transferUnits}}),
        this.task(run,'value',{},() => { const units=run.outputs.allocation.transferUnits; return {marginProtected:units*12,transferCost:units*2,netValue:units*10}; })
      ]);
      if (second.some(r => r.status === 'rejected')) throw second.find(r => r.status === 'rejected').reason;
      [run.outputs.risk,run.outputs.value] = second.map(r => r.value);
      run.state = run.outputs.risk.approved && run.outputs.allocation.transferUnits <= 60 && run.outputs.allocation.transferUnits > 0 ? 'pending':'blocked';
    } catch(e) { run.state='failed'; run.error=e.code || 'AGENT_FAILED'; }
    return this.store.put(id,run,run.revision);
  }
  async get(id, owner) {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw error(404,'NOT_FOUND');
    const run=await this.store.get(id);
    if (!run || run.owner !== owner) throw error(404,'NOT_FOUND');
    return run;
  }
  async decide(id, owner, decision, revision) {
    if (!['approve','reject'].includes(decision)) throw error(400,'INVALID_DECISION');
    let run=await this.get(id,owner);
    if (run.revision !== revision || run.state !== 'pending') throw error(409,'INVALID_STATE');
    if (Date.parse(run.expiresAt) < Date.now()) throw error(409,'APPROVAL_EXPIRED');
    run.approval={decision,actor:owner,at:new Date().toISOString()};
    if (decision === 'reject') run.state='rejected';
    else {
      if (!run.outputs.risk.approved || run.outputs.allocation.transferUnits > 60) throw error(409,'POLICY_VIOLATION');
      // Claim approval atomically before the execution agent can run.
      run.state='executing';
      run=await this.store.put(id,run,revision);
      try {
        run.outputs.execution=await this.task(run,'execution',{},() => ({receiptId:`receipt-${run.id}`,action:'demo-transfer',units:run.outputs.allocation.transferUnits,enterpriseWrite:false}));
        run.state='completed';
      } catch(e) {run.state='failed';run.error=e.code || 'EXECUTION_FAILED';}
    }
    return this.store.put(id,run,run.revision);
  }
}
module.exports={Orchestrator,error};
