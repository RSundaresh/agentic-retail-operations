'use strict';
const {config} = require('./config');
const {MockProvider,AzureProvider} = require('./providers');
const {MemoryStore,BlobStore} = require('./store');
const {Orchestrator} = require('./orchestrator');
const {createHandler} = require('./http');
function runtime(log) {
  const settings=config();
  const credential = settings.deployed || settings.provider === 'azure' ? new (require('@azure/identity').ManagedIdentityCredential)(process.env.AZURE_CLIENT_ID ? {clientId:process.env.AZURE_CLIENT_ID} : {}) : null;
  const store=settings.deployed ? new BlobStore(process.env.STATE_STORAGE_URL,credential) : new MemoryStore();
  const provider=settings.provider === 'mock' ? new MockProvider() : new AzureProvider(settings,credential);
  const orchestrator=new Orchestrator({settings,provider,store,log});
  return {handle:createHandler(orchestrator,settings),settings};
}
module.exports={runtime};
