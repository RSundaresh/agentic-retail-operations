const assert = require('node:assert/strict');
const { test } = require('node:test');
const { delegate, route } = require('../agents/orchestrator');
const registry = require('../agents/registry.json');
const policies = require('../agents/model-routing.json').policies;
const input = { contextId:'evt-1', toAgent:'risk-governance', intent:'review transfer', taskClass:'risk-review' };
test('all declared task classes use exact routes and unknown classes fail closed', () => {
  for (const p of policies) for (const c of p.taskClass.split('|')) assert.equal(route(c).route, p.route);
  for (const c of ['forecast-execute', 'recalculate', '', undefined, {}, 'unknown']) assert.throws(() => route(c));
  const copy = route('calculate'); copy.route = 'unsafe';
  assert.equal(route('calculate').route, 'deterministic-code');
});
test('every registered agent can construct its supported local proposal', () => {
  for (const agent of registry.agents) for (const taskClass of agent.taskClasses) {
    const task = delegate({...input, toAgent:agent.id, taskClass});
    assert.equal(task.contractVersion, 'retail-task/1');
    assert.equal(task.requiresHumanApproval, true);
    assert.equal(task.trace.hop, 1);
  }
  assert.notEqual(delegate(input).taskId, delegate(input).taskId);
});
test('invalid identities, authorities, task assignments and evidence are rejected', () => {
  for (const patch of [ {contextId:''}, {intent:' '}, {fromAgent:'intruder'}, {toAgent:'unknown'}, {authority:'execute'}, {authority:'EXECUTE'}, {authority:'owner'}, {taskClass:'execute'}, {evidence:[{}]}, {evidence:[{source:'a',version:1}]}, {evidence:null}, {constraints:[4]}, {constraints:'policy'} ]) assert.throws(() => delegate({...input,...patch}));
  assert.throws(() => delegate());
});
test('approval is conservative and task data is detached from caller mutations', () => {
  const evidence = [{source:'policy',version:'4'}]; const constraints=['review'];
  const task = delegate({...input,evidence,constraints,authority:'prepare-action'});
  evidence[0].version='5'; constraints.push('override');
  assert.equal(task.evidence[0].version,'4'); assert.deepEqual(task.constraints,['review']);
  assert.equal(task.requiresHumanApproval,true);
});
