'use strict';
const {app} = require('@azure/functions');
const fs = require('node:fs/promises');
const path = require('node:path');
const {runtime} = require('./runtime');
const {AsyncLocalStorage} = require('node:async_hooks');
const scope = new AsyncLocalStorage();
const {handle} = runtime(entry => scope.getStore()?.log(JSON.stringify({type:'agent_trace',...entry})));
app.http('retailApi',{methods:['GET','POST'],authLevel:'anonymous',route:'api/{*path}',handler:(request,context) => scope.run(context,() => handle(request))});
const assets={'':'index.html','index.html':'index.html','app.js':'app.js','data.js':'data.js','styles.css':'styles.css'};
const types={html:'text/html',js:'text/javascript',css:'text/css'};
app.http('retailUi',{methods:['GET'],authLevel:'anonymous',route:'{*asset}',handler:async request => {
  const file=assets[request.params.asset || ''];
  if (!file) return {status:404};
  const config=JSON.parse(await fs.readFile(path.join(__dirname,'../public/staticwebapp.config.json'),'utf8'));
  return {body:await fs.readFile(path.join(__dirname,'../public',file)),headers:{...config.globalHeaders,'Content-Type':types[file.split('.').pop()]}};
}});
