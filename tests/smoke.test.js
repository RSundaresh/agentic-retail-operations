const fs = require('fs');
const assert = require('assert');
const required = ['index.html','styles.css','app.js','data.js','staticwebapp.config.json'];
required.forEach(file => assert(fs.existsSync(file), `Missing ${file}`));
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('app.js','utf8');
assert(html.includes('Agentic Retail Operations'), 'Brand missing');
assert(html.includes('Analyze disruption'), 'Simulation CTA missing');
console.log(`✓ Agentic Retail Operations smoke test passed (${required.length} artifacts verified)`);

assert.match(html, /Review evidence/);
assert.match(html, /Response progress/);
assert.match(html, /DECISION GUARDRAILS/);
assert.match(html, /<details class="connection panel"><summary>Demo access<\/summary>/);
assert.doesNotMatch(html, /role="tab|data-persona|architecture-panel|MULTI-AGENT|retail-task|TARGET OPERATING|live-trace/);
assert.doesNotMatch(js, /renderTab|selectPersona|renderModels|live-trace|runtime-details|localStorage|sessionStorage|console\./);
assert.match(html, /<a href="https:\/\/github\.com\/RSundaresh\/agentic-retail-operations\/blob\/main\/docs\/architecture\.md" target="_blank" rel="noopener noreferrer">Solution architecture on GitHub<\/a>/);

assert.equal((html.match(/id="evidence-btn"/g) || []).length, 1);
assert.doesNotMatch(html, /inspect-btn|data-scenario="promotion"/);
assert.match(html, /<details class="audit-details"><summary>Audit details<\/summary>/);
assert.match(html, /Human approval required/);
assert.match(html, /first policy-constrained action within the larger \$286K disruption response/);
assert.ok(html.indexOf('id="approve-run"') < html.indexOf('id="process-flow"'));
assert.ok(html.indexOf('id="copilot-title"') < html.indexOf('id="process-flow"'));
assert.match(fs.readFileSync('data.js','utf8'), /38 stores at risk of stockout/);
assert.doesNotMatch(fs.readFileSync('data.js','utf8'), /38 stockouts/);
