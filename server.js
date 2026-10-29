'use strict';
/* Prognóstico Mensal — servidor integrado, Node 22+ (node:sqlite).
 * Não coloque credenciais em arquivos públicos. Configure MASTER_USERNAME e MASTER_PASSWORD no ambiente.
 */
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
// .env fica no servidor (fora de public/) e nunca é servido aos navegadores.
const envPath=path.join(__dirname,'.env');
if(fs.existsSync(envPath))for(const line of fs.readFileSync(envPath,'utf8').split(/\r?\n/)){
 const match=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
 if(!match)continue;const key=match[1];let value=match[2];
 if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);
 if(process.env[key]===undefined)process.env[key]=value;
}
const {DatabaseSync}=require('node:sqlite');
const PORT=Number(process.env.PORT||3000);
const HOST=process.env.HOST||'0.0.0.0';
const publicDir=path.join(__dirname,'public');
const dbFile=path.resolve(process.env.DB_PATH||path.join(__dirname,'data','prognostico.sqlite'));
fs.mkdirSync(path.dirname(dbFile),{recursive:true,mode:0o700});
const db=new DatabaseSync(dbFile);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout=5000;');
db.exec(`CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, username TEXT UNIQUE, email TEXT UNIQUE,
 password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('master','gerente','supervisor','franqueado')),
 store_id TEXT REFERENCES stores(id), active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS stores (
 id TEXT PRIMARY KEY, name TEXT NOT NULL COLLATE NOCASE UNIQUE,
 type TEXT NOT NULL CHECK(type IN ('vermelha','optica')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 csrf TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS forecasts (
 store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
 period TEXT NOT NULL, snapshot TEXT NOT NULL, updated_by TEXT NOT NULL,
 updated_at TEXT NOT NULL, PRIMARY KEY(store_id, period)
);
CREATE TABLE IF NOT EXISTS archives (
 store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
 archive_id TEXT NOT NULL, period TEXT NOT NULL, title TEXT NOT NULL,
 record TEXT NOT NULL, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL,
 PRIMARY KEY(store_id,archive_id)
);
CREATE INDEX IF NOT EXISTS ix_archives_store_period ON archives(store_id,period);`);
const now=()=>new Date().toISOString();
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
const ROLE_SET=new Set(['gerente','supervisor','franqueado']);
const validPeriod=s=>typeof s==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(s)&&Number(s.slice(0,4))>=2020&&Number(s.slice(0,4))<=2100;
const validEmail=s=>typeof s==='string'&&s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const validName=s=>typeof s==='string'&&s.trim().length>=2&&s.trim().length<=80;
const passHash=(password,salt=crypto.randomBytes(16).toString('hex'))=>`scrypt$${salt}$${crypto.scryptSync(password,salt,64).toString('hex')}`;
function passVerify(password,hash){try{const [,salt,expected]=hash.split('$');const actual=crypto.scryptSync(password,salt,64);return crypto.timingSafeEqual(actual,Buffer.from(expected,'hex'));}catch{return false}}
function bootstrap(){
 const username=process.env.MASTER_USERNAME,pass=process.env.MASTER_PASSWORD;
 if(!db.prepare("SELECT 1 FROM users WHERE role='master'").get()){
   if(!username||!pass||pass.length<10){console.error('ERRO: configure MASTER_USERNAME e MASTER_PASSWORD (mínimo 10 caracteres) no ambiente antes de iniciar o sistema.');process.exit(1)}
   db.prepare('INSERT INTO users (id,name,username,email,password_hash,role,store_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
     .run(crypto.randomUUID(),'Administrador Master',username,null,passHash(pass),'master',null,1,now(),now());
   console.log('Conta Master inicial criada com credenciais do ambiente.');
 }
}
bootstrap();
// Carrega o exemplo recuperado da V18.8 somente na primeira inicialização
// de um banco vazio quando explicitamente habilitado em .env.
if(process.env.SEED_AUGUST_EXAMPLE==='1'){
  const {seedAugustExample}=require('./demo/seed-example');
  const seeded=seedAugustExample(db,{onlyFreshDatabase:true});
  if(seeded.created)console.log('Exemplo de Agosto/2026 criado em Capim Dourado (dados demonstrativos).');
}
const q={
 userByLogin:db.prepare('SELECT * FROM users WHERE (lower(username)=? OR lower(email)=?) AND active=1 LIMIT 1'),
 userById:db.prepare('SELECT * FROM users WHERE id=?'),
 session:db.prepare('SELECT s.*,u.name,u.email,u.username,u.role,u.store_id,u.active FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1'),
 allStores:db.prepare('SELECT s.id,s.name,s.type,s.created_at,s.updated_at,(SELECT f.period FROM forecasts f WHERE f.store_id=s.id ORDER BY f.period DESC LIMIT 1) AS latestPeriod FROM stores s ORDER BY s.name COLLATE NOCASE'),
 storeById:db.prepare('SELECT id,name,type FROM stores WHERE id=?'),
 archive:db.prepare('SELECT record FROM archives WHERE store_id=? AND archive_id=?'),
 archives:db.prepare('SELECT record FROM archives WHERE store_id=? ORDER BY updated_at DESC'),
 forecast:db.prepare('SELECT snapshot,updated_at FROM forecasts WHERE store_id=? AND period=?')
};
const attempts=new Map();
function limited(ip,login){const key=`${ip}:${login}`;const old=attempts.get(key);const t=Date.now();if(!old||t-old.start>15*60*1000){attempts.set(key,{start:t,count:1});return false}old.count++;return old.count>6}
const json=(res,status,body,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(body))};
const error=(res,status,message)=>json(res,status,{error:message});
const cookieHeader=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(s=>s.trim().split(/=(.*)/s).slice(0,2)).filter(([k])=>k));
const cookieSecure=process.env.SECURE_COOKIES==='1'||process.env.NODE_ENV==='production';
function setSessionCookie(res,token,clear=false){res.setHeader('Set-Cookie',`prognostico_session=${clear?'':token}; HttpOnly; SameSite=Strict; Path=/; ${cookieSecure?'Secure; ':''}${clear?'Max-Age=0':'Max-Age=43200'}`)}
async function readBody(req,limit=3*1024*1024){return new Promise((resolve,reject)=>{let data='',length=0;req.on('data',ch=>{length+=ch.length;if(length>limit){reject(Object.assign(new Error('Envio muito grande'),{status:413}));req.destroy()}else data+=ch});req.on('end',()=>{try{resolve(JSON.parse(data||'{}'))}catch{reject(Object.assign(new Error('JSON inválido'),{status:400}))}});req.on('error',reject)})}
function sessionInfo(req){const token=cookieHeader(req).prognostico_session||'';return token?q.session.get(sha(token),now()):null}
function actorPublic(s){return {id:s.user_id,name:s.name,email:s.email||null,username:s.username||null,role:s.role,storeId:s.store_id,csrf:s.csrf}}
function canStore(s,id){return s.role!=='gerente'||s.store_id===id}
function checkStore(s,id,res){const store=q.storeById.get(id);if(!store||!canStore(s,id)){error(res,403,'Sem permissão para acessar esta loja');return null}return store}
function permissionMaster(s,res){if(s.role!=='master'){error(res,403,'Somente o Master pode realizar esta operação');return false}return true}
function sanitizeSnapshot(v,store,period){
 if(!v||typeof v!=='object'||Array.isArray(v)||!v.current||typeof v.current!=='object')throw Object.assign(new Error('Prognóstico inválido'),{status:400});
 const out=JSON.parse(JSON.stringify(v));out.store=store.name;out.storeType=store.type;out.current.period=period;
 if(!out.previous||typeof out.previous!=='object')out.previous={};
 if(!Array.isArray(out.sellers)||out.sellers.length>10)throw Object.assign(new Error('Máximo de 10 vendedores'),{status:400});
 return out;
}
function archiveSanitize(row,store){if(!row||typeof row!=='object'||!validPeriod(row.period)||typeof row.id!=='string'||row.id.length>180||!/^[-a-zA-Z0-9_]+$/.test(row.id))throw Object.assign(new Error('Arquivo inválido'),{status:400});const snapshot=sanitizeSnapshot(row.snapshot,store,row.period);return {...row,store:store.name,title:String(row.title||`Prognóstico ${row.period}`).slice(0,120),snapshot}}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.svg':'image/svg+xml'};
function serveFile(req,res,pathName){
 const filename=pathName==='/'?'/index.html':pathName;
 let f;
 try{f=path.resolve(publicDir,'.'+filename)}catch{return error(res,404,'Não encontrado')}
 if(!f.startsWith(publicDir+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile())return error(res,404,'Não encontrado');
 const ext=path.extname(f);if(!MIME[ext])return error(res,404,'Não encontrado');
 res.writeHead(200,{'Content-Type':MIME[ext],'X-Content-Type-Options':'nosniff','Cache-Control':ext==='.html'||ext==='.js'||ext==='.css'?'no-store':'public, max-age=3600', 'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",'X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'});
 fs.createReadStream(f).pipe(res);
}
async function handler(req,res){
 const url=new URL(req.url,'http://local');const pathname=url.pathname;const method=req.method;
 if(!pathname.startsWith('/api/')){if(method!=='GET')return error(res,405,'Método não permitido');return serveFile(req,res,pathname)}
 if(pathname==='/api/health'&&method==='GET')return json(res,200,{ok:true,version:'saas-19.3'});
 if(pathname==='/api/login'&&method==='POST'){
  const {login,password}=await readBody(req,5000);
  if(typeof login!=='string'||typeof password!=='string'||login.length>254||password.length>256)return error(res,400,'Informe usuário e senha');
  const key=login.trim().toLowerCase(); const ip=req.socket.remoteAddress||'unknown';
  if(limited(ip,key))return error(res,429,'Muitas tentativas. Tente novamente em 15 minutos.');
  const u=q.userByLogin.get(key,key);
  if(!u||!passVerify(password,u.password_hash))return error(res,401,'Usuário ou senha incorretos');
  attempts.delete(`${ip}:${key}`);
  const token=crypto.randomBytes(32).toString('hex'),csrf=crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token_hash,user_id,csrf,expires_at,created_at) VALUES (?,?,?,?,?)').run(sha(token),u.id,csrf,new Date(Date.now()+12*3600*1000).toISOString(),now());
  setSessionCookie(res,token);return json(res,200,{user:{id:u.id,name:u.name,role:u.role,storeId:u.store_id,email:u.email,username:u.username,csrf}})
 }
 const s=sessionInfo(req);
 if(!s)return error(res,401,'Sessão expirada ou não autenticada');
 if(method!=='GET'&&method!=='HEAD'){
   const origin=req.headers.origin;
   if(origin){let reqOrigin;try{reqOrigin=new URL(origin)}catch{return error(res,403,'Origem inválida')}const requestHost=req.headers.host||'';if(reqOrigin.host!==requestHost)return error(res,403,'Origem não permitida')}
   if(req.headers['x-csrf-token']!==s.csrf)return error(res,403,'Token de segurança inválido');
 }
 if(pathname==='/api/me'&&method==='GET')return json(res,200,{user:actorPublic(s)});
 if(pathname==='/api/me/password'&&method==='PATCH'){
  const v=await readBody(req,8000);const u=q.userById.get(s.user_id);
  if(typeof v.currentPassword!=='string'||!passVerify(v.currentPassword,u.password_hash))return error(res,403,'Senha atual incorreta');
  if(typeof v.newPassword!=='string'||v.newPassword.length<12||v.newPassword.length>128)return error(res,400,'A nova senha deve ter 12 a 128 caracteres');
  if(v.currentPassword===v.newPassword)return error(res,400,'Escolha uma senha diferente da atual');
  db.prepare('UPDATE users SET password_hash=?,updated_at=? WHERE id=?').run(passHash(v.newPassword),now(),u.id);
  db.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').run(u.id,sha(cookieHeader(req).prognostico_session||''));
  return json(res,200,{ok:true});
 }
 if(pathname==='/api/logout'&&method==='POST'){
  db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(cookieHeader(req).prognostico_session||''));setSessionCookie(res,'',true);return json(res,200,{ok:true})
 }
 if(pathname==='/api/stores'&&method==='GET')return json(res,200,{stores:(s.role==='gerente'?q.allStores.all().filter(st=>st.id===s.store_id):q.allStores.all())});
 if(pathname==='/api/stores'&&method==='POST'){
  if(!permissionMaster(s,res))return;
  const v=await readBody(req,8000);if(!validName(v.name)||!['vermelha','optica'].includes(v.type))return error(res,400,'Informe nome e tipo da loja');
  const name=v.name.trim().replace(/\s+/g,' '),id=crypto.randomUUID();
  db.prepare('INSERT INTO stores (id,name,type,created_at,updated_at) VALUES (?,?,?,?,?)').run(id,name,v.type,now(),now());return json(res,201,{store:q.storeById.get(id)})
 }
 const storeUpdate=pathname.match(/^\/api\/stores\/([a-f0-9-]{36})$/);
 if(storeUpdate&&method==='PATCH'){
  if(!permissionMaster(s,res))return;const st=q.storeById.get(storeUpdate[1]);if(!st)return error(res,404,'Loja não encontrada');
  const v=await readBody(req,8000),name=String(v.name||st.name).trim().replace(/\s+/g,' '),type=v.type||st.type;
  if(!validName(name)||!['vermelha','optica'].includes(type))return error(res,400,'Dados de loja inválidos');
  db.prepare('UPDATE stores SET name=?, type=?,updated_at=? WHERE id=?').run(name,type,now(),st.id);
  return json(res,200,{store:q.storeById.get(st.id)})
 }
 if(pathname==='/api/users'&&method==='GET'){
  if(!permissionMaster(s,res))return;
  return json(res,200,{users:db.prepare("SELECT id,name,email,username,role,store_id AS storeId,active,created_at AS createdAt FROM users ORDER BY created_at DESC").all()})
 }
 if(pathname==='/api/users'&&method==='POST'){
  if(!permissionMaster(s,res))return;
  const v=await readBody(req,10000),name=String(v.name||'').trim(),email=String(v.email||'').trim().toLowerCase(),password=v.password;
  if(!validName(name)||!validEmail(email)||typeof password!=='string'||password.length<12||password.length>128||!ROLE_SET.has(v.role))return error(res,400,'Nome, e-mail, perfil ou senha inválidos. Use senha com pelo menos 12 caracteres.');
  const storeId=v.role==='gerente'?String(v.storeId||''):null;
  if(v.role==='gerente'&&!q.storeById.get(storeId))return error(res,400,'Selecione uma loja válida para o gerente');
  const id=crypto.randomUUID();
  db.prepare('INSERT INTO users (id,name,username,email,password_hash,role,store_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,name,null,email,passHash(password),v.role,storeId,1,now(),now());
  return json(res,201,{user:{id,name,email,role:v.role,storeId}})
 }
 const userUpdate=pathname.match(/^\/api\/users\/([a-f0-9-]{36})$/);
 if(userUpdate&&method==='PATCH'){
  if(!permissionMaster(s,res))return;
  const u=q.userById.get(userUpdate[1]);if(!u||u.role==='master')return error(res,403,'Conta protegida ou inexistente');
  const v=await readBody(req,10000),name=String(v.name??u.name).trim(),email=String(v.email??u.email).trim().toLowerCase(),role=v.role||u.role,active=v.active===undefined?u.active:(v.active?1:0),storeId=role==='gerente'?String(v.storeId??u.store_id??''):null;
  if(!validName(name)||!validEmail(email)||!ROLE_SET.has(role)||(role==='gerente'&&!q.storeById.get(storeId)))return error(res,400,'Dados de usuário inválidos');
  if(v.password!==undefined&&(typeof v.password!=='string'||v.password.length<12||v.password.length>128))return error(res,400,'Nova senha deve ter no mínimo 12 caracteres');
  db.prepare('UPDATE users SET name=?,email=?,role=?,store_id=?,active=?,password_hash=?,updated_at=? WHERE id=?').run(name,email,role,storeId,active,v.password?passHash(v.password):u.password_hash,now(),u.id);
  if(!active)db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);
  return json(res,200,{user:{id:u.id,name,email,role,storeId,active:!!active}})
 }
 const forecast=pathname.match(/^\/api\/stores\/([a-f0-9-]{36})\/forecast$/);
 if(forecast){const st=checkStore(s,forecast[1],res);if(!st)return;const period=url.searchParams.get('period');if(!validPeriod(period))return error(res,400,'Período inválido');
  if(method==='GET'){const row=q.forecast.get(st.id,period);return json(res,200,{snapshot:row?JSON.parse(row.snapshot):null,updatedAt:row?.updated_at||null,store:st})}
  if(method==='PUT'){const v=await readBody(req),snapshot=sanitizeSnapshot(v.snapshot,st,period);db.prepare('INSERT INTO forecasts (store_id,period,snapshot,updated_by,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(store_id,period) DO UPDATE SET snapshot=excluded.snapshot,updated_by=excluded.updated_by,updated_at=excluded.updated_at').run(st.id,period,JSON.stringify(snapshot),s.user_id,now());return json(res,200,{ok:true,updatedAt:now()})}
 }
 const archiveList=pathname.match(/^\/api\/stores\/([a-f0-9-]{36})\/archives$/);
 if(archiveList&&method==='GET'){const st=checkStore(s,archiveList[1],res);if(!st)return;return json(res,200,{records:q.archives.all(st.id).map(x=>JSON.parse(x.record))})}
 const archiveOne=pathname.match(/^\/api\/stores\/([a-f0-9-]{36})\/archives\/([^/]+)$/);
 if(archiveOne){const st=checkStore(s,archiveOne[1],res);if(!st)return;const archiveId=decodeURIComponent(archiveOne[2]);if(archiveId.length>180||!/^[-a-zA-Z0-9_]+$/.test(archiveId))return error(res,400,'ID inválido');
  if(method==='GET'){const r=q.archive.get(st.id,archiveId);return r?json(res,200,JSON.parse(r.record)):error(res,404,'Arquivo não encontrado')}
  if(method==='PUT'){const v=await readBody(req);if(v.id!==archiveId)return error(res,400,'ID divergente');const record=archiveSanitize(v,st);db.prepare('INSERT INTO archives (store_id,archive_id,period,title,record,updated_by,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(store_id,archive_id) DO UPDATE SET period=excluded.period,title=excluded.title,record=excluded.record,updated_by=excluded.updated_by,updated_at=excluded.updated_at').run(st.id,archiveId,record.period,record.title,JSON.stringify(record),s.user_id,now());return json(res,200,{ok:true})}
  if(method==='DELETE'){db.prepare('DELETE FROM archives WHERE store_id=? AND archive_id=?').run(st.id,archiveId);return json(res,200,{ok:true})}
 }
 return error(res,404,'Rota não encontrada');
}
const server=http.createServer((req,res)=>handler(req,res).catch(err=>{console.error('API:',err?.message);const known=err.status||(/UNIQUE constraint failed/.test(err.message||'')?409:500);error(res,known,known===409?'Já existe um cadastro com este nome ou e-mail':known===500?'Erro interno do servidor':err.message)}));
if(require.main===module)server.listen(PORT,HOST,()=>console.log(`Prognóstico SaaS ativo na porta ${PORT}; banco em ${dbFile}`));
module.exports={server,db};
