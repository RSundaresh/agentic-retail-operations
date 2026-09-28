const D = window.FRONTIER_DATA;
let current = "inventory";
function closeSimulation(){
  requestGeneration++;
  $("#simulation-modal").classList.remove("open");
  $("#simulation-modal").setAttribute("aria-hidden", "false");
}

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const colors = {amber:"#d78a23",blue:"#3979c9",red:"#d15b67",violet:"#735fe8"};

function render() {
  const d = D[current];
  $("#page-title").textContent = d.title;
  $("#page-subtitle").textContent = d.subtitle;
  $("#summary-grid").innerHTML = d.metrics.map(m => `<article class="metric" style="--accent:${colors[m.tone]}"><label>${m.label}</label><strong>${m.value}</strong><small>${m.change}</small></article>`).join("");
  activeRun = null;
  renderDecision();
  $('#response-status').textContent = 'Ready to analyze. No action has been approved.';
  $("#insight-title").textContent=d.insightTitle; $("#insight-copy").textContent="Analyze the disruption to establish a plan, independently check policy and review the expected value.";
}

let evidenceTrigger;
function openDrawer(){
  evidenceTrigger = document.activeElement;
  const o = activeRun?.outputs || {};
  const evidence = ['demand','inventory','allocation','risk'].filter(key => o[key]);
  $('#drawer-content').innerHTML = '<p class="view-note">Synthetic scenario evidence. These findings are returned by the current analysis, not verified enterprise records.</p>' + (evidence.length ? evidence.map(key => `<article class="evidence-card"><strong>${escapeHTML(key)}</strong><p>${escapeHTML(o[key].rationale)}</p></article>`).join('') : '<p>No investigation results returned yet. Analyze the disruption to review evidence.</p>');
  $("#drawer").inert=false; $("#drawer").setAttribute("aria-hidden", "false");$("#drawer").classList.add('open');$("#overlay").classList.add('open');
  $("#close-drawer").focus?.();
}
function closeDrawer(){ $("#drawer").inert=true; $("#drawer").setAttribute("aria-hidden", "true");$("#drawer").classList.remove('open');$("#overlay").classList.remove('open'); evidenceTrigger?.focus?.(); }

let activeRun;
let requestGeneration = 0;
async function api(path, body) {
  const token = $('#api-token').value?.trim();
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: {'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {})},
    ...(body ? {body:JSON.stringify(body)} : {})
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  return result;
}
function showRun(run) {
  activeRun = run;
  $('#sim-title').textContent = `${run.scenario} · Disruption response`;
  $('#sim-event').textContent = `Approval state: ${run.state}${run.error ? ` · ${run.error}` : ''}`;
  const progress = {running:'Analyzing demand and availability', pending:'Recommendation ready · awaiting your approval', blocked:'Response blocked by policy', approved:'Response approved', executing:'Recording approved demo outcome', completed:'Demo receipt recorded', rejected:'Response rejected', failed:'Analysis failed', expired:'Approval expired'};
  $('#sim-track').textContent = progress[run.state] || `Response ${run.state}`;
  $('#response-status').textContent = $('#sim-track').textContent;
  const o = run.outputs;
  renderDecision();
  $('#insight-copy').textContent = 'The first bounded transfer is part of the larger $286K response. Review the recommendation above and the recorded agent findings below.';
  $('#runtime-mode').textContent = `${run.mode === 'live' ? 'Live analysis' : 'Simulated analysis'} · demo receipts only`;
  $('#sim-results').textContent = [
    o.demand && `Demand: ${o.demand.forecastUnits} units. ${o.demand.rationale}`,
    o.inventory && `Available inventory: ${o.inventory.availableUnits} units. ${o.inventory.rationale}`,
    o.allocation && `Recommendation: transfer ${o.allocation.transferUnits} units. ${o.allocation.rationale}`,
    o.risk && `Policy review: ${o.risk.approved ? 'Passed; human approval required' : 'Blocked'}. ${o.risk.rationale}`,
    o.value && `Illustrative business impact: $${o.value.marginProtected} margin protected · $${o.value.transferCost} transfer cost · $${o.value.netValue} net value`,
    o.execution && `Demo receipt: ${o.execution.receiptId} · ${o.execution.units} units. No real inventory transfer.`
  ].filter(Boolean).join('\n\n');
  $('#approve-run').disabled = run.state !== 'pending';
  $('#reject-run').disabled = run.state !== 'pending';
  $('#refresh-run').disabled = false;
}
async function runSimulation(){
  closeSimulation();
  const generation = ++requestGeneration;
  activeRun = null;
  renderDecision();
  $('#simulation-modal').classList.add('open');
  $('#simulation-modal').setAttribute('aria-hidden', 'false');
  $('#sim-title').textContent = 'Analyzing disruption…';
  $('#response-status').textContent = 'Analysis requested · waiting for recorded agent results.';
  $('#sim-event').textContent = 'Reviewing demand, availability, response options and policy before your approval';
  $('#sim-track').textContent = '';
  $('#sim-results').textContent = '';
  $('#approve-run').disabled = true;
  $('#reject-run').disabled = true;
  $('#refresh-run').disabled = true;
  $('#simulate-btn').disabled = true;
  try {
    await api('/api/config');
    if (generation !== requestGeneration) return;
    $('#runtime-mode').textContent = 'Connected · awaiting analysis results';
    const run = await api('/api/runs', {scenario:current});
    if (generation === requestGeneration) showRun(run);
  } catch(e) {
    if (generation === requestGeneration) {
      $('#sim-event').textContent = `API error: ${e.message}. No simulated fallback. Reconnect before starting another run.`;
      $('#response-status').textContent = 'Analysis could not finish. Reconnect and try again.';
    }
  } finally { $('#simulate-btn').disabled = ['running', 'approved', 'executing'].includes(activeRun?.state); }
}
async function decideRun(decision) {
  if (!activeRun || activeRun.state !== 'pending') return;
  const run = activeRun, generation = requestGeneration;
  $('#approve-run').disabled = true; $('#reject-run').disabled = true;
  try {
    const result = await api(`/api/runs/${run.id}/approval`, {decision,revision:run.revision});
    if (generation === requestGeneration) showRun(result);
  } catch(e) { if(generation===requestGeneration)$('#sim-event').textContent = `Approval error: ${e.message}. Refresh state before retrying.`; }
}
async function refreshRun() {
  if (!activeRun) return;
  const generation=requestGeneration, id=activeRun.id;
  try {const result=await api(`/api/runs/${id}`);if(generation===requestGeneration)showRun(result);}
  catch(e) {if(generation===requestGeneration)$('#sim-event').textContent = `Refresh error: ${e.message}`;}
}

const escapeHTML = value => String(value ?? 'Not yet available').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selectedQuestion;
function agentState(agent) {
  const run = activeRun, output = run?.outputs?.[agent];
  if (output) return agent === 'execution' ? 'Executed' : agent === 'risk' && !output.approved ? 'Challenged' : 'Complete';
  const event = run?.trace?.filter(item => item.agent === agent).at(-1)?.event;
  return event === 'started' ? 'Analyzing' : event === 'succeeded' ? 'Complete' : event === 'failed' ? 'Failed' : 'Waiting';
}
function renderDecision() {
  const run = activeRun, o = run?.outputs || {};
  $('#recommendation-title').textContent = o.allocation ? `Transfer ${o.allocation.transferUnits} units from nearby excess inventory` : 'Analyze the disruption to prepare a recommendation';
  $('#recommendation-value').textContent = o.value ? `$${o.value.netValue} net value` : 'Value awaiting analysis';
  $('#recommendation-policy').textContent = o.risk ? (o.risk.approved ? 'Policy check passed' : 'Policy check blocked') : 'Policy check pending';
  $('#audit-reference').textContent = run ? `Decision UUID: ${run.id} · Revision: ${run.revision} · Expires: ${run.expiresAt}` : 'No decision recorded yet.';
  $('#simulate-btn').textContent = run ? 'Run analysis again' : 'Analyze disruption';
  $('#simulate-btn').disabled = ['running', 'approved', 'executing'].includes(run?.state);
  const card = (name, state, copy) => `<article class="agent-card" data-state="${escapeHTML(state)}"><span class="agent-state">${escapeHTML(state)}</span><h3>${escapeHTML(name)}</h3><p>${escapeHTML(copy)}</p></article>`;
  const stage = (label, cards) => `<div class="workflow-stage"><p class="stage-label">${label}</p>${cards}</div>`;
  const human = run?.approval ? (run.approval.decision === 'approve' ? 'Approved' : 'Rejected') : run?.state === 'pending' ? 'Awaiting approval' : run?.state === 'blocked' ? 'Blocked' : 'Waiting';
  $('#process-flow').innerHTML = [
    stage('01 · Detect', card('Retail disruption', 'Detected', D[current].insightTitle + ' · Illustrative scenario')),
    stage('02 · Investigate in parallel', card('Demand Signal agent', agentState('demand'), o.demand ? `${o.demand.forecastUnits} forecast units` : 'Assess the demand signal') + card('Inventory agent', agentState('inventory'), o.inventory ? `${o.inventory.availableUnits} available units` : 'Check supply available to rebalance')),
    stage('03 · Plan', card('Allocation agent', agentState('allocation'), o.allocation ? `Propose a ${o.allocation.transferUnits}-unit transfer` : 'Create a rebalancing plan from both findings')),
    stage('04 · Independent checks', card('Risk agent', agentState('risk'), o.risk ? o.risk.rationale : 'Independently challenge the plan against policy') + card('Value agent', agentState('value'), o.value ? `$${o.value.netValue} net value · deterministic calculation` : 'Deterministic economics: $12 margin − $2 cost per unit')),
    stage('05 · Human decision', card('Regional operator', human, run?.approval ? `${run.approval.actor} · ${run.approval.at}` : 'Review the evidence, then approve or reject')),
    stage('06 · Execute & record', card('Execution agent', agentState('execution'), o.execution ? `Demo receipt ${o.execution.receiptId}` : 'Record an auditable demo receipt after approval'))
  ].join('');
  const entries = [
    ['Proposed action', o.allocation ? `Transfer ${o.allocation.transferUnits} units. ${o.allocation.rationale}` : 'Analyze the disruption to prepare a rebalancing recommendation.'],
    ['Evidence', [o.demand && `Demand: ${o.demand.forecastUnits} units. ${o.demand.rationale}`, o.inventory && `Availability: ${o.inventory.availableUnits} units. ${o.inventory.rationale}`].filter(Boolean).join(' ') || 'Scenario signals are illustrative. No investigation results returned yet.'],
    ['Policy result', o.risk ? `${o.risk.approved ? 'Risk check passed' : 'Challenged by Risk'}. ${o.risk.rationale} Decision status: ${run.state}.` : 'Awaiting independent Risk review. Human approval is required.'],
    ['Expected value', o.value ? `$${o.value.netValue} net value = $${o.value.marginProtected} margin protected − $${o.value.transferCost} transfer cost. Illustrative economics, not realized value.` : 'Awaiting deterministic calculation.'],
    ['Accountable human decision', run?.approval ? `${human} by ${run.approval.actor} at ${run.approval.at}.` : `${human}. The authenticated regional operator must review the evidence before deciding.`],
    ['Audit receipt', o.execution ? `${o.execution.receiptId} · ${o.execution.units} units · Demo only; no real inventory transfer. ` : 'No receipt recorded. Execution requires approval.']
  ];
  $('#dossier-grid').innerHTML = entries.map(([title,copy]) => `<article><h3>${title}</h3><p>${escapeHTML(copy)}</p></article>`).join('');
  if (!run) {
    $('#sim-title').textContent = 'Your decision dossier';
    $('#sim-event').textContent = 'Analyze this scenario to prepare a decision.';
    $('#sim-track').textContent = '';
    $('#approve-run').disabled = $('#reject-run').disabled = $('#refresh-run').disabled = true;
  }
  if (selectedQuestion) answerQuestion(selectedQuestion);
}
function answerQuestion(question) {
  selectedQuestion = question;
  const o = activeRun?.outputs || {};
  const answers = {
    why: o.allocation ? `The recommendation is to transfer ${o.allocation.transferUnits} units. ${o.allocation.rationale} ${o.risk ? `Risk review: ${o.risk.rationale}` : 'Risk review has not returned.'}` : `${D[current].insightTitle}. No recommendation has been returned yet.`,
    inaction: o.allocation && o.value ? `Taking no action would forgo the proposed ${o.allocation.transferUnits}-unit transfer and its illustrative $${o.value.marginProtected} protected margin, while avoiding $${o.value.transferCost} transfer cost. No separate no-action forecast was calculated; these figures do not establish actual lost sales.` : 'The scenario indicates stockout exposure. A quantified no-action forecast is not available.',
    evidence: [o.demand && `Demand Signal: ${o.demand.forecastUnits} forecast units. ${o.demand.rationale}`, o.inventory && `Inventory: ${o.inventory.availableUnits} available units. ${o.inventory.rationale}`].filter(Boolean).join(' ') || 'No agent evidence has returned. The displayed scenario metrics are illustrative context, not verified business evidence.',
    policy: `Transfers must be positive, no greater than 60 units, and cannot exceed forecast demand or available inventory. Risk must pass and an authenticated human must approve before a demo receipt is created. ${o.risk ? `Current review: ${o.risk.rationale}` : 'Current policy review is pending.'}`
  };
  $('#copilot-answer').textContent = answers[question];
  $$('[data-question]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.question === question)));
}

$$('.scenario').forEach(s=>s.onclick=()=>{closeSimulation();current=s.dataset.scenario;$$('.scenario').forEach(x=>x.classList.toggle('active',x===s));render()});
$('#evidence-btn').onclick=openDrawer;$('#close-drawer').onclick=closeDrawer;$('#overlay').onclick=closeDrawer;
$('#approve-run').onclick=()=>decideRun('approve');
$('#reject-run').onclick=()=>decideRun('reject');
$('#refresh-run').onclick=refreshRun;
$('#simulate-btn').onclick=runSimulation;$('#close-simulation').onclick=closeSimulation;
$$('[data-question]').forEach(button => button.onclick = () => answerQuestion(button.dataset.question));
if (document.addEventListener) document.addEventListener('keydown', event => { if(event.key === 'Escape') closeDrawer(); if(event.key === 'Tab' && $('#drawer').getAttribute?.('aria-hidden') === 'false') { event.preventDefault(); $('#close-drawer').focus?.(); } });
render();
