const crypto = require('node:crypto');
const registry = require('./registry.json');
const routing = require('./model-routing.json');

function nonempty(value, name) {
  if (typeof value !== 'string' || !value.trim() || value.length > 4096) throw new Error(`Invalid ${name}`);
}

function route(taskClass) {
  nonempty(taskClass, 'taskClass');
  const policy = routing.policies.find(p => p.taskClass.split('|').includes(taskClass));
  if (!policy) throw new Error(`Unsupported task class: ${taskClass}`);
  return structuredClone(policy);
}

// Local task construction only: caller labels are not authenticated identities.
// No execution or transport is implemented, and every proposal requires review.
function delegate({ contextId, fromAgent = registry.orchestrator, toAgent, intent, taskClass, evidence = [], constraints = [], authority = 'analyze' } = {}) {
  nonempty(contextId, 'contextId');
  nonempty(intent, 'intent');
  if (fromAgent !== registry.orchestrator) throw new Error('Only the local orchestrator may delegate');
  const agent = registry.agents.find(agent => agent.id === toAgent);
  if (!agent) throw new Error(`Unknown agent: ${toAgent}`);
  if (!['analyze', 'recommend', 'prepare-action'].includes(authority)) throw new Error('Execution and unknown authorities are not supported');
  if (!agent.taskClasses.includes(taskClass)) throw new Error('Task class is outside the agent responsibility');
  if (!Array.isArray(evidence) || evidence.length > 100 || evidence.some(e => {
    if (!e || typeof e !== 'object' || Array.isArray(e) || Object.keys(e).some(k => !['source', 'version'].includes(k))) return true;
    return ['source', 'version'].some(k => typeof e[k] !== 'string' || !e[k].trim() || e[k].length > 4096);
  })) throw new Error('Invalid evidence');
  if (!Array.isArray(constraints) || constraints.length > 100 || constraints.some(c => typeof c !== 'string' || !c.trim() || c.length > 4096)) throw new Error('Invalid constraints');
  return {
    contractVersion: registry.contractVersion, taskId: crypto.randomUUID(), contextId, fromAgent, toAgent, intent, authority,
    evidence: structuredClone(evidence), constraints: [...constraints], modelRoute: route(taskClass), requiresHumanApproval: true,
    trace: { createdAt: new Date().toISOString(), hop: 1 }
  };
}

module.exports = { delegate, route };
