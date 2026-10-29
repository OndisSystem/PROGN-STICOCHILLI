'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chilli-example-'));
process.env.DB_PATH=path.join(tmp,'forecast.sqlite');
process.env.MASTER_USERNAME='ExampleMaster';
process.env.MASTER_PASSWORD='MasterOnlyForAutomatedTesting2026';
process.env.SEED_AUGUST_EXAMPLE='1';
const {server,db}=require('../server');
const {seedAugustExample}=require('../demo/seed-example');
let base='';let csrf='',cookie='';
async function req(route,{method='GET',body}={}){
 const headers={};if(cookie)headers.Cookie=cookie;if(method!=='GET')headers['X-CSRF-Token']=csrf;
 if(body!==undefined)headers['Content-Type']='application/json';
 const r=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const c=r.headers.get('set-cookie');if(c)cookie=c.split(';')[0];
 const result=await r.json();return {status:r.status,...result};
}
test.before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`});
test.after(async()=>{await new Promise(resolve=>server.close(resolve));db.close();fs.rmSync(tmp,{recursive:true,force:true})});
test('Exemplo de Agosto é importado uma única vez sem afetar lojas criadas depois',async()=>{
 const beforeAuth=await req('/api/stores');assert.equal(beforeAuth.status,401);
 const login=await req('/api/login',{method:'POST',body:{login:'ExampleMaster',password:'MasterOnlyForAutomatedTesting2026'}});
 assert.equal(login.status,200);csrf=login.user.csrf;
 const list=await req('/api/stores');assert.equal(list.status,200);assert.equal(list.stores.length,1);
 const example=list.stores[0];assert.equal(example.name,'Capim Dourado');assert.equal(example.latestPeriod,'2026-08');
 const load=await req(`/api/stores/${example.id}/forecast?period=2026-08`);
 assert.equal(load.status,200);assert.equal(load.snapshot.exampleData,true);
 assert.equal(load.snapshot.current.revenue,209812.81);assert.equal(load.snapshot.current.target,246000);
 assert.equal(load.snapshot.previous.revenue,230538.63);assert.deepEqual(load.snapshot.sellers.map(x=>x.name),['Cristian','Noeme','Iolanda','Andressa']);
 const archive=await req(`/api/stores/${example.id}/archives`);assert.equal(archive.records.length,1);
 assert.equal(archive.records[0].snapshot.current.revenue,209812.81);
 // Reexecutar não apaga o prognóstico preenchido.
 assert.equal(seedAugustExample(db,{onlyFreshDatabase:true}).created,false);
 assert.equal(seedAugustExample(db,{onlyFreshDatabase:false}).created,false);
 const newStore=await req('/api/stores',{method:'POST',body:{name:'Loja nova',type:'optica'}});
 assert.equal(newStore.status,201);
 const fresh=await req(`/api/stores/${newStore.store.id}/forecast?period=2026-08`);
 assert.equal(fresh.snapshot,null);
 assert.equal((await req('/demo/agosto_2026_capim_dourado.json')).status,404);
});
