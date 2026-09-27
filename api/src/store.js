'use strict';
const conflict = () => Object.assign(new Error('State changed; reload the run'), {status:409, code:'CONFLICT'});
class MemoryStore {
  constructor() { this.items = new Map(); }
  async get(id) { const v = this.items.get(id); return v ? structuredClone(v) : null; }
  async put(id, value, revision = null) {
    const existing = this.items.get(id);
    if ((existing?.revision ?? null) !== revision) throw conflict();
    const next = structuredClone({...value, revision:(revision || 0)+1});
    this.items.set(id,next); return structuredClone(next);
  }
}
class BlobStore {
  constructor(url, credential) {
    const {BlobServiceClient} = require('@azure/storage-blob');
    this.container = new BlobServiceClient(url, credential).getContainerClient('runs');
  }
  async get(id) {
    try {
      const response = await this.container.getBlockBlobClient(`${id}.json`).download();
      const chunks = []; for await (const c of response.readableStreamBody) chunks.push(c);
      return {...JSON.parse(Buffer.concat(chunks).toString()), revision:response.etag};
    } catch (e) { if (e.statusCode === 404) return null; throw e; }
  }
  async put(id, value, revision = null) {
    const body = JSON.stringify({...value, revision:undefined});
    try {
      const result = await this.container.getBlockBlobClient(`${id}.json`).upload(body, Buffer.byteLength(body), {conditions:revision ? {ifMatch:revision} : {ifNoneMatch:'*'}, blobHTTPHeaders:{blobContentType:'application/json'}});
      return {...value, revision:result.etag};
    } catch (e) { if ([409,412].includes(e.statusCode)) throw conflict(); throw e; }
  }
}
module.exports = {MemoryStore, BlobStore};
