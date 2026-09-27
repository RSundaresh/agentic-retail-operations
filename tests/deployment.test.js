const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
test('build publishes only public assets and removes stale files',()=>{
  fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/private.txt','not public');
  execFileSync(process.execPath,['scripts/build.js']);
  assert.deepEqual(fs.readdirSync('dist').sort(),['app.js','data.js','index.html','staticwebapp.config.json','styles.css']);
  const html=fs.readFileSync('dist/index.html','utf8');
  for(const [,asset] of html.matchAll(/(?:src|href)="([^"]+)"/g)) assert(fs.existsSync(`dist/${asset}`));
  const config=JSON.parse(fs.readFileSync('dist/staticwebapp.config.json','utf8'));
  assert.match(config.globalHeaders['Content-Security-Policy'],/script-src 'self';/);
  assert.equal(config.navigationFallback,undefined);
});
