const ts=require(process.cwd()+'/node_modules/typescript');
const fs=require('fs');const assert=require('node:assert/strict');
const moduleUnderTest={exports:{}};
new Function('exports',ts.transpileModule(fs.readFileSync('src/lib/adminRequest.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(moduleUnderTest.exports);
const {adminGet}=moduleUnderTest.exports;
(async()=>{
 let calls=0;global.fetch=async()=>{calls++;if(calls===1)throw new TypeError('Failed to fetch');return Response.json({success:true,clients:[{id:1}]});};
 assert.equal((await adminGet('/clients')).result.clients.length,1);assert.equal(calls,2);
 calls=0;global.fetch=async(url,{signal})=>{calls++;if(calls===1)return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));return Response.json({success:true});};
 assert.equal((await adminGet('/clients',{timeoutMs:10})).result.success,true);assert.equal(calls,2);
 calls=0;global.fetch=async()=>{calls++;return Response.json({success:false},{status:401});};assert.equal((await adminGet('/clients')).response.status,401);assert.equal(calls,1);
 calls=0;global.fetch=async()=>{calls++;return Response.json({}, {status:503});};await assert.rejects(adminGet('/clients'),/click Refresh/);assert.equal(calls,3);
 calls=0;global.fetch=async(url,{signal})=>{calls++;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));};const controller=new AbortController();const request=adminGet('/clients',{signal:controller.signal});controller.abort();await assert.rejects(request);assert.equal(calls,1);
 console.log('PASS: network recovery, timeout recovery, no auth retry, bounded server retries, cancellation');
})();
