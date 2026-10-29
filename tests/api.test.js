'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const work=fs.mkdtempSync(path.join(os.tmpdir(),'prognostico-saas-test-'));
process.env.DB_PATH=path.join(work,'data.sqlite');
process.env.MASTER_USERNAME='AdminTest';
process.env.MASTER_PASSWORD='UseOnlyTestingPassword2026!';
const {server,db}=require('../server');
let base='';
let csrf={},cookies={};
async function req(route,{method='GET',body,user='master',raw=false}={}){
 const headers={};if(cookies[user])headers.Cookie=cookies[user];
 if(method!=='GET')headers['X-CSRF-Token']=csrf[user]||'';
 if(body!==undefined)headers['Content-Type']='application/json';
 const r=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 if(r.headers.get('set-cookie'))cookies[user]=r.headers.get('set-cookie').split(';',1)[0];
 const payload=await r.json();return {status:r.status,...payload};
}
async function login(user,login,password){
 const data=await req('/api/login',{method:'POST',body:{login,password},user});
 if(data.user)csrf[user]=data.user.csrf;
 return data;
}
test.before(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base=`http://127.0.0.1:${server.address().port}`;
});
test.after(async()=>{await new Promise(resolve=>server.close(resolve));db.close();fs.rmSync(work,{recursive:true,force:true})});

test('Segurança e ciclo de vida das quatro funções',async()=>{
 assert.equal((await req('/api/me')).status,401);
 assert.equal((await login('master','AdminTest','senha-errada')).status,401);
 assert.equal((await login('master','AdminTest','UseOnlyTestingPassword2026!')).status,200);
 const master=await req('/api/me');assert.equal(master.user.role,'master');
 const a=await req('/api/stores',{method:'POST',body:{name:'Shopping Norte',type:'vermelha'}});
 const b=await req('/api/stores',{method:'POST',body:{name:'Ótica Palmas',type:'optica'}});
 assert.equal(a.status,201);assert.equal(b.status,201);
 const idA=a.store.id,idB=b.store.id;
 assert.equal((await req('/api/stores',{method:'POST',body:{name:'Shopping Norte',type:'vermelha'}})).status,409);
 const manager=await req('/api/users',{method:'POST',body:{name:'Gerente Norte',email:'gerente@teste.com',password:'senhaSegura2026!!',role:'gerente',storeId:idA}});
 const supervisor=await req('/api/users',{method:'POST',body:{name:'Supervisor Norte',email:'supervisor@teste.com',password:'senhaSegura2026!!',role:'supervisor'}});
 const franchisee=await req('/api/users',{method:'POST',body:{name:'Franqueado Norte',email:'franqueado@teste.com',password:'senhaSegura2026!!',role:'franqueado'}});
 assert.equal(manager.status,201);assert.equal(supervisor.status,201);assert.equal(franchisee.status,201);
 assert.equal((await login('manager','gerente@teste.com','senhaSegura2026!!')).status,200);
 assert.equal((await login('sup','supervisor@teste.com','senhaSegura2026!!')).status,200);
 assert.equal((await login('franchisee','franqueado@teste.com','senhaSegura2026!!')).status,200);
 const mgrStores=await req('/api/stores',{user:'manager'});assert.deepEqual(mgrStores.stores.map(x=>x.id),[idA]);
 const supStores=await req('/api/stores',{user:'sup'});assert.equal(supStores.stores.length,2);
 const franStores=await req('/api/stores',{user:'franchisee'});assert.equal(franStores.stores.length,2);
 assert.equal((await req('/api/users',{user:'manager'})).status,403);
 assert.equal((await req('/api/users',{user:'sup'})).status,403);
 assert.equal((await req(`/api/stores/${idB}/forecast?period=2026-10`,{user:'manager'})).status,403);
 assert.equal((await req(`/api/stores/${idB}/archives`,{user:'manager'})).status,403);
 assert.equal((await req(`/api/stores/${idB}/forecast?period=2026-10`,{user:'sup'})).status,200);
 assert.equal((await req(`/api/stores/${idB}/forecast?period=2026-10`,{user:'franchisee'})).status,200);
 const snap={store:'FRAUDE',storeType:'optica',current:{period:'2026-10',target:45000,revenue:12500,solar:1000,lens:3000,categoryPieces:{}},previous:{period:'2025-10'},sellers:[],visibleColumns:['name']};
 const setA=await req(`/api/stores/${idA}/forecast?period=2026-10`,{method:'PUT',body:{snapshot:snap},user:'manager'});
 assert.equal(setA.status,200);
 const readA=await req(`/api/stores/${idA}/forecast?period=2026-10`,{user:'master'});
 assert.equal(readA.snapshot.store,'Shopping Norte');assert.equal(readA.snapshot.storeType,'vermelha');assert.equal(readA.snapshot.current.revenue,12500);
 assert.equal((await req(`/api/stores/${idB}/forecast?period=2026-10`,{user:'master'})).snapshot,null);
 assert.equal((await req(`/api/stores/${idB}/forecast?period=2026-10`,{method:'PUT',body:{snapshot:snap},user:'manager'})).status,403);
 const record={id:'shopping-norte__2026-10',title:'Outubro',period:'2026-10',store:'Shopping Norte',snapshot:snap};
 assert.equal((await req(`/api/stores/${idA}/archives/${record.id}`,{method:'PUT',body:record,user:'manager'})).status,200);
 assert.equal((await req(`/api/stores/${idA}/archives`,{user:'master'})).records.length,1);
 assert.equal((await req(`/api/stores/${idA}/archives/${record.id}`,{user:'manager'})).snapshot.current.revenue,12500);
 assert.equal((await req(`/api/stores/${idB}/archives/${record.id}`,{user:'manager'})).status,403);
 // Server must reject missing CSRF token even with valid cookie.
 const prevCsrf=csrf.manager;csrf.manager='';
 assert.equal((await req(`/api/stores/${idA}/forecast?period=2026-10`,{method:'PUT',body:{snapshot:snap},user:'manager'})).status,403);
 csrf.manager=prevCsrf;
 // Master can reassign manager; permissions change without reconnecting.
 assert.equal((await req(`/api/users/${manager.user.id}`,{method:'PATCH',body:{name:'Gerente Norte',email:'gerente@teste.com',role:'gerente',storeId:idB}})).status,200);
 assert.equal((await req(`/api/stores/${idA}/forecast?period=2026-10`,{user:'manager'})).status,403);
 assert.equal((await req(`/api/stores/${idB}/forecast?period=2026-10`,{user:'manager'})).status,200);
 assert.equal((await req(`/api/users/${manager.user.id}`,{method:'PATCH',body:{active:false}})).status,200);
 assert.equal((await req('/api/me',{user:'manager'})).status,401);
 assert.equal((await req('/api/me/password',{method:'PATCH',body:{currentPassword:'errada',newPassword:'NovaSenhaBemForte2026!'}})).status,403);
 assert.equal((await req('/api/me/password',{method:'PATCH',body:{currentPassword:'UseOnlyTestingPassword2026!',newPassword:'NovaSenhaBemForte2026!'}})).status,200);
 assert.equal((await login('master-again','AdminTest','NovaSenhaBemForte2026!')).status,200);
});
