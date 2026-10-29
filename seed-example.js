'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const DEMO_PERIOD='2026-08';
const source=path.join(__dirname,'agosto_2026_capim_dourado.json');
function seedAugustExample(db,{onlyFreshDatabase=false,overwrite=false}={}){
  const storeCount=db.prepare('SELECT count(*) AS total FROM stores').get().total;
  if(onlyFreshDatabase&&storeCount!==0)return {created:false,reason:'already-has-stores'};
  const oldStore=db.prepare('SELECT id,name,type FROM stores WHERE name=? COLLATE NOCASE LIMIT 1').get('Capim Dourado');
  if(oldStore&&oldStore.type!=='vermelha')return {created:false,reason:'conflicting-store-type'};
  const existing=oldStore && db.prepare('SELECT 1 FROM forecasts WHERE store_id=? AND period=?').get(oldStore.id,DEMO_PERIOD);
  if(existing&&!overwrite)return {created:false,reason:'forecast-exists',storeId:oldStore.id};
  const data=JSON.parse(fs.readFileSync(source,'utf8'));
  if(data.current?.period!==DEMO_PERIOD||!Array.isArray(data.sellers)||data.sellers.length!==4)throw new Error('O arquivo de exemplo está inválido');
  const now=new Date().toISOString();const id=oldStore?.id||crypto.randomUUID();
  const snapshot={...data,store:'Capim Dourado',storeType:'vermelha',exampleData:true};
  const archiveId='capim-dourado__2026-08';
  const record={id:archiveId,store:'Capim Dourado',period:DEMO_PERIOD,title:'Prognóstico de Agosto 2026 — EXEMPLO',createdAt:now,updatedAt:now,snapshot};
  // Uma transação evita dados de demonstração parcialmente carregados.
  db.exec('BEGIN IMMEDIATE');
  try{
    if(!oldStore)db.prepare('INSERT INTO stores (id,name,type,created_at,updated_at) VALUES (?,?,?,?,?)').run(id,'Capim Dourado','vermelha',now,now);
    db.prepare('INSERT INTO forecasts(store_id,period,snapshot,updated_by,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(store_id,period) DO UPDATE SET snapshot=excluded.snapshot,updated_by=excluded.updated_by,updated_at=excluded.updated_at').run(id,DEMO_PERIOD,JSON.stringify(snapshot),'EXAMPLE_IMPORT',now);
    // Preserve an archive if one already exists unless explicitly told to overwrite.
    if(!existing || overwrite){
      db.prepare('INSERT INTO archives(store_id,archive_id,period,title,record,updated_by,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(store_id,archive_id) DO UPDATE SET record=excluded.record,title=excluded.title,updated_at=excluded.updated_at').run(id,archiveId,DEMO_PERIOD,record.title,JSON.stringify(record),'EXAMPLE_IMPORT',now);
    }
    db.exec('COMMIT');
    return {created:true,storeId:id,period:DEMO_PERIOD,updatedExisting:Boolean(existing),storeName:'Capim Dourado'};
  }catch(err){db.exec('ROLLBACK');throw err}
}
module.exports={seedAugustExample};
