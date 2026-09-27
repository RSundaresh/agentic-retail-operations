'use strict';
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
if (process.env.WEBSITE_HOSTNAME || (process.env.MODEL_PROVIDER && process.env.MODEL_PROVIDER !== 'mock')) throw new Error('Local demo server requires mock mode');
const {handle}=require('../api/src/runtime').runtime();
const assets=new Set(['index.html','app.js','data.js','styles.css']);
const server=http.createServer(async (req,res) => {
  try {
    const origin='http://127.0.0.1:4173';
    if (req.headers.host !== '127.0.0.1:4173') {res.writeHead(403);return res.end();}
    const url=new URL(req.url,origin);
    if (url.pathname.startsWith('/api/')) {
      let body=''; for await (const chunk of req) {body+=chunk; if (body.length>2048) {res.writeHead(413);return res.end();}}
      const request=new Request(url,{method:req.method,headers:req.headers,...(body ? {body}: {})});
      const result=await handle(request);res.writeHead(result.status,result.headers);return res.end(JSON.stringify(result.jsonBody));
    }
    const file=url.pathname === '/' ? 'index.html':url.pathname.slice(1);
    if (!assets.has(file)) {res.writeHead(404);return res.end();}
    const config=JSON.parse(await fs.readFile(path.join(__dirname,'../staticwebapp.config.json'),'utf8'));
    res.writeHead(200,{...config.globalHeaders,'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});
    res.end(await fs.readFile(path.join(__dirname,'../dist',file)));
  } catch {res.writeHead(500);res.end('Internal error');}
});
server.listen(4173,'127.0.0.1',() => console.log('Simulated demo: http://127.0.0.1:4173 (local approval identity; no Azure required)'));
