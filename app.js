const D = window.FRONTIER_DATA;
let current = "inventory";
let selectedModel = "balanced";
let simulationTimer;
function closeSimulation(){
  clearTimeout(simulationTimer);
  $("#simulation-modal").classList.remove("open");
  $("#simulation-modal").setAttribute("aria-hidden", "true");
}

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const colors = {amber:"#d78a23",blue:"#3979c9",red:"#d15b67",violet:"#735fe8"};

function render() {
  const d = D[current];
  $("#page-title").textContent = d.title;
  $("#page-subtitle").textContent = d.subtitle;
  $("#summary-grid").innerHTML = d.metrics.map(m => `<article class="metric" style="--accent:${colors[m.tone]}"><label>${m.label}</label><strong>${m.value}</strong><small>${m.change}</small></article>`).join("");
  $("#process-flow").innerHTML = d.steps.map((s,i) => `<article class="step" style="--step-color:${s.type==='human'?'#6d5ce7':'#16a6b6'}"><span class="step-time">${s.time}</span><span class="step-index">${i+1}</span><strong>${s.name}</strong><small>${s.owner}</small>${s.risk?'<small class="risk-flag">● Control gap</small>':''}</article>`).join("");
  $("#insight-title").textContent=d.insightTitle; $("#insight-copy").textContent=d.insightCopy;
  $("#models").innerHTML=d.models.map(m => `<article class="model-card ${m.id===selectedModel?'selected':''}" data-model="${m.id}"><div class="model-top"><span class="model-label">${m.label}</span><span class="model-tag">${m.tag}</span></div><h3>${m.title}</h3><p>${m.desc}</p><div class="mini-metrics"><span>Cycle<strong>${m.cycle}</strong></span><span>Human effort<strong>${m.effort}</strong></span><span>Cost/case<strong>${m.cost}</strong></span></div><div class="autonomy">Agent autonomy · ${m.autonomy}%<div class="bar"><i style="width:${m.autonomy}%"></i></div></div></article>`).join("");
  $$('.model-card').forEach(el=>el.onclick=()=>{selectedModel=el.dataset.model;renderModels();renderTab('architecture')});
  renderModels();
  renderTab('architecture');
}

function renderModels(){
  $$('.model-card').forEach(c=>c.classList.toggle('selected',c.dataset.model===selectedModel));
  const m=D[current].models.find(x=>x.id===selectedModel); $("#blueprint-title").textContent=m.title;
}

function renderTab(tab){
  $$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
  const m=D[current].models.find(x=>x.id===selectedModel);
  const content={
    architecture:`<div class="architecture-grid"><div class="arch-canvas">
      <div class="arch-lane"><strong>EXPERIENCE</strong><div class="arch-nodes"><span class="arch-node">Operations workspace</span><span class="arch-node">Approvals</span><span class="arch-node">Value dashboard</span></div></div>
      <div class="arch-lane"><strong>AGENT LAYER</strong><div class="arch-nodes"><span class="arch-node agent">Process orchestrator</span><span class="arch-node agent">Evidence agent</span><span class="arch-node agent">Risk agent</span></div></div>
      <div class="arch-lane"><strong>KNOWLEDGE</strong><div class="arch-nodes"><span class="arch-node">Foundry IQ</span><span class="arch-node">Microsoft Fabric</span><span class="arch-node">Policy graph</span></div></div>
      <div class="arch-lane"><strong>CONTROL</strong><div class="arch-nodes"><span class="arch-node control">Microsoft Entra ID</span><span class="arch-node control">Agent 365</span><span class="arch-node control">Purview</span></div></div>
      <div class="arch-lane"><strong>OPERATIONS</strong><div class="arch-nodes"><span class="arch-node">Azure Monitor</span><span class="arch-node">Evaluation pipeline</span><span class="arch-node">Cost Management</span></div></div>
    </div><aside class="arch-side"><span class="kicker">PROPOSED CONTROL BOUNDARY</span><h3>${m.autonomy}% delegated execution</h3><ul class="control-list"><li><span class="check">✓</span> Identity-bound tool calls</li><li><span class="check">✓</span> Evidence attached to decisions</li><li><span class="check">✓</span> Material exceptions require approval</li><li><span class="check">✓</span> Model and workflow evaluations</li><li><span class="check">✓</span> End-to-end activity audit</li></ul></aside></div>`,
    decisions:`<div>${[
      ["ADR-01","Use agent-led orchestration with human approval","Cuts queue time while preserving accountability for material exceptions."],
      ["ADR-02","Separate evidence assembly from decision authority","Allows automation to scale without silently expanding agent permissions."],
      ["ADR-03","Ground every recommendation in versioned policy","Enables reproducibility, audit, and controlled policy evolution."],
      ["ADR-04","Measure business outcome alongside model quality","Prevents technically successful agents from masking poor adoption or process value."]
    ].map((x,i)=>`<article class="decision"><span class="num">${i+1}</span><div><strong>${x[0]} · ${x[1]}</strong><p>${x[2]}</p></div><span class="state">Accepted</span></article>`).join('')}</div>`,
    traceability:`<div>${[
      ["R-01 · Reduce cycle time","Process orchestrator + parallel evidence","Median completion ≤ 3.5 days"],
      ["C-02 · Human accountability","Risk gate + signed approval","100% material exceptions approved"],
      ["C-04 · Explain decisions","Citation and policy-version capture","≥ 98% evidence completeness"],
      ["R-07 · Control unit economics","Model routing + token budgets","AI cost ≤ $2.50 per completed case"]
    ].map(x=>`<article class="trace-row"><div><span>REQUIREMENT / CONSTRAINT</span><strong>${x[0]}</strong></div><div><span>ARCHITECTURE RESPONSE</span><strong>${x[1]}</strong></div><div><span>ACCEPTANCE MEASURE</span><strong>${x[2]}</strong></div></article>`).join('')}</div>`,
    roadmap:`<div class="roadmap">${[
      ["Days 0–30 · Prove","Instrument baseline, curate policies, test offline evaluations, and validate the approval boundary."],
      ["Days 31–60 · Pilot","Deploy to one operating team, capture adoption and exception telemetry, and tune controls."],
      ["Days 61–90 · Scale","Complete production review, integrate systems of record, and establish the value-realization cadence."]
    ].map(x=>`<article class="roadmap-item"><strong>${x[0]}</strong><p>${x[1]}</p></article>`).join('')}</div>`
  };
  $("#tab-content").innerHTML=content[tab];
}

function openDrawer(){
  const evidence=[
    ["Process telemetry","90 days of case-event history","Confidence 94%"],
    ["Operating policy","Inventory transfer and safety-stock policy v4.2","Effective 12 Aug 2026"],
    ["Control standard","Material exception authorization matrix","Owner: Enterprise Risk"],
    ["Stakeholder input","Operations, Compliance, Technology","7 validated observations"],
    ["Economic baseline","Activity-based handling cost model","Finance reviewed"],
    ["Architecture principle","Least agency: minimum delegated authority","Mandatory control"]
  ];
  $("#drawer-content").innerHTML=`<p style="font-size:10px;color:#667085;line-height:1.6">The twin connects recommendations to source evidence, constraints, and accountable owners. These are illustrative fixtures, not verified enterprise evidence.</p>${evidence.map(e=>`<article class="evidence-card"><strong>${e[0]}</strong><p>${e[1]}</p><div class="evidence-meta"><span>${e[2]}</span><span>Sample</span></div></article>`).join('')}`;
  $("#drawer").setAttribute("aria-hidden", "false");$("#drawer").classList.add('open');$("#overlay").classList.add('open');
}
function closeDrawer(){ $("#drawer").setAttribute("aria-hidden", "true");$("#drawer").classList.remove('open');$("#overlay").classList.remove('open') }

function runSimulation(){
  closeSimulation();
  const scenario=current;
  const model=D[scenario].models.find(m=>m.id===selectedModel);
  const events=D[scenario].simulation;
  $("#sim-event").textContent="Preparing illustrative simulation…";
  $("#simulation-modal").setAttribute("aria-hidden", "false");
  $("#sim-title").textContent=current==='inventory'?'Resolving inventory disruption EVT-2048':'Optimizing promotion event PRM-8821';
  $("#sim-track").innerHTML=events.map((e,i)=>`<div class="sim-node" data-i="${i}"><div class="sim-icon">${e[2]==='human'?'HU':e[2]==='system'?'SY':'AI'}</div><small>${e[0]}</small></div>`).join('');
  $("#sim-results").innerHTML=''; $("#simulation-modal").classList.add('open');
  let i=0; const advance=()=>{
    if(i>0) $(`.sim-node[data-i="${i-1}"]`).classList.replace('active','done');
    if(i<events.length){ const e=events[i]; $(`.sim-node[data-i="${i}"]`).classList.add('active'); $("#sim-event").innerHTML=`<strong>${e[0]}</strong> · ${e[1]}<br><small>${e[4]} · routed to <b>${e[3]}</b></small>`; i++; simulationTimer=setTimeout(advance,850); }
    else { $("#sim-event").innerHTML='<strong>Simulation complete</strong> · Illustrative walkthrough only; no actions executed.'; $("#sim-results").innerHTML=`<div class="sim-result"><small>Resolution time</small><strong>${model.cycle}</strong></div><div class="sim-result"><small>Planned human effort</small><strong>${model.effort}</strong></div><div class="sim-result"><small>Projected margin protected</small><strong>${scenario==='inventory'?'$184K':'$231K'}</strong></div>`; }
  }; simulationTimer=setTimeout(advance,400);
}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),3100)}

$$('.scenario').forEach(s=>s.onclick=()=>{closeSimulation();current=s.dataset.scenario;selectedModel='balanced';$$('.scenario').forEach(x=>x.classList.toggle('active',x===s));render()});
$$('.tab').forEach(t=>t.onclick=()=>renderTab(t.dataset.tab));
$('#evidence-btn').onclick=openDrawer;$('#inspect-btn').onclick=openDrawer;$('#close-drawer').onclick=closeDrawer;$('#overlay').onclick=closeDrawer;
$('#simulate-btn').onclick=runSimulation;$('#close-simulation').onclick=closeSimulation;
$('#export-btn').onclick=()=>toast('Architecture export is planned; no package was generated');
$$('.nav-item').forEach(n=>n.onclick=()=>toast(`${n.textContent.trim()} · Included in the enterprise roadmap`));
render();
