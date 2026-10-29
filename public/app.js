const ptMoney = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const ptNum = new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2});
const ptInt = new Intl.NumberFormat('pt-BR',{maximumFractionDigits:0});
const fmtPct = v => `${ptNum.format(Number.isFinite(Number(v))?Number(v):0)}%`;
const safeDiv=(a,b)=>Number(b)?Number(a)/Number(b):0;
const variation=(cur,prev)=>Number(prev)?((Number(cur)/Number(prev))-1)*100:(Number(cur)?100:0);
const achievement=(revenue,target)=>safeDiv(revenue,target)*100;
const conversion=(sales,attend)=>safeDiv(sales,attend)*100;
const pa=(pieces,sales)=>safeDiv(pieces,sales);
const ticket=(revenue,sales)=>safeDiv(revenue,sales);
const rep=(value,total)=>safeDiv(value,total)*100;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const monthNames=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const clone=v=>JSON.parse(JSON.stringify(v));
const escapeHtml=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const profileDefs={
  gato:{label:'Gato',icon:'🐱'},
  tubarao:{label:'Tubarão',icon:'🦈'},
  aguia:{label:'Águia',icon:'🦅'},
  lobo:{label:'Lobo',icon:'🐺'}
};
const categoryDefs=[
  {key:'solar',label:'Solar',short:'SOLAR',icon:'assets/category-solar.webp',accent:'#2e7de4',soft:'#eaf3ff'},
  {key:'watch',label:'Relógios',short:'RELÓGIO',icon:'assets/category-watch.webp',accent:'#7753db',soft:'#f0eaff'},
  {key:'degree',label:'Grau',short:'GRAU',icon:'assets/category-degree.webp',accent:'#18a66c',soft:'#e9f8f1'},
  {key:'lens',label:'Lentes',short:'LENTE',icon:'assets/category-lens.webp',accent:'#edae00',soft:'#fff4d8'},
  {key:'accessories',label:'Acessórios',short:'ACESSÓRIOS',icon:'assets/category-accessories.webp',accent:'#ef5062',soft:'#ffeaee'}
];

const opticalCategoryDefs=[
  {key:'solar',label:'Óculos de sol',short:'SOLAR',icon:'assets/category-solar.webp',accent:'#d18a0f',soft:'#fff4de'},
  {key:'degree',label:'Armações de grau',short:'ARMAÇÕES',icon:'assets/category-degree.webp',accent:'#f36d0b',soft:'#fff0e3'},
  {key:'lens',label:'Lentes de grau',short:'LENTES',icon:'assets/category-lens.webp',accent:'#ff991c',soft:'#fff4df'},
  {key:'contactLens',label:'Lentes de contato',short:'CONTATO',icon:'assets/category-contactLens.webp',accent:'#da6228',soft:'#fff0e8'},
  {key:'luxottica',label:'Luxottica (multimarca)',short:'LUXOTTICA',icon:'assets/category-luxottica.webp',accent:'#c64212',soft:'#fff0ea'},
  {key:'accessories',label:'Acessórios',short:'ACESSÓRIOS',icon:'assets/category-accessories.webp',accent:'#c48a33',soft:'#fff6e5'}
];
function isOptica(){return state.storeType==='optica'}
function activeCategoryDefs(){return isOptica()?opticalCategoryDefs:categoryDefs}
const opticalColumnKeys=['luxottica','contactLens','pml','repLuxottica'];
function priceMeanLens(amount,quantity){return safeDiv(amount,quantity)}
const defaultState={
  version:19,
  store:'Nova loja',storeType:'vermelha',activeTab:'overview',
  current:{period:'2026-10',target:0,revenue:0,watch:0,solar:0,degree:0,lens:0,degreeLens:0,accessories:0,attend:0,sales:0,pieces:0,luxottica:0,contactLens:0,categoryPieces:{solar:0,watch:0,degree:0,lens:0,accessories:0,luxottica:0,contactLens:0}},
  previous:{period:'2025-10',target:0,revenue:0,watch:0,solar:0,degree:0,lens:0,degreeLens:0,accessories:0,attend:0,sales:0,pieces:0,luxottica:0,contactLens:0,categoryPieces:{solar:0,watch:0,degree:0,lens:0,accessories:0,luxottica:0,contactLens:0}},
  sellers:[],
  visibleColumns:['name','revenue','achievement','growth','conversion','repRe','repSolar','pa','ticket','gxl','repLens','attend','sales','crm','p7030'],
  shareLens:{markupRows:[],labColors:{},types:{multifocal:{label:'Multifocal',revenue:0,qty:0},single:{label:'Visão simples',revenue:0,qty:0}},labs:{ZEISS:0,COMPROL:0,NOTLAB:0,PREMIUM:0,HOYA:0}},
  nextPlan:[],planColors:{},
  operation:{opportunity:'',execution:0,crm360:{salesBase:0,returnRate:0,generated:{amount:0,tickets:0},redeemed:{amount:0,tickets:0},lost:{amount:0,tickets:0},expiring:{amount:0,tickets:0}},oto:{revenue:0,sales:0,contacts:0,conversion:0,windowDays:0},challenges:[],wins:[],notes:'',actions:[]},
  teamRx:{engagement:0,execution:0,strengths:[],attention:[],trainings:[],notes:'',individual:{}}
};

function parseFlexibleNumber(value){
  let s=String(value??'').trim(); if(!s) return 0;
  s=s.replace(/\s/g,'').replace(/R\$/gi,'').replace(/%/g,'').replace(/[^0-9,.\-]/g,'');
  if(!s||['-',',','.'].includes(s)) return 0;
  const comma=s.lastIndexOf(','), dot=s.lastIndexOf('.');
  if(comma>-1&&dot>-1){
    if(comma>dot){s=s.replace(/\./g,''); const last=s.lastIndexOf(','); s=s.slice(0,last).replace(/,/g,'')+'.'+s.slice(last+1)}
    else{s=s.replace(/,/g,''); const last=s.lastIndexOf('.'); s=s.slice(0,last).replace(/\./g,'')+'.'+s.slice(last+1)}
  }else if(comma>-1){const last=s.lastIndexOf(',');s=s.slice(0,last).replace(/,/g,'')+'.'+s.slice(last+1)}
  else if((s.match(/\./g)||[]).length>1){const last=s.lastIndexOf('.');s=s.slice(0,last).replace(/\./g,'')+'.'+s.slice(last+1)}
  const n=Number(s); return Number.isFinite(n)?n:0;
}
function numericValue(id){return Math.max(0,parseFlexibleNumber(document.getElementById(id)?.value))}
function clampPercent(v){return clamp(parseFlexibleNumber(v),0,100)}
function normalizeDecimalField(el){if(!el)return;const raw=el.value.trim();if(!raw){el.value='';return}const n=parseFlexibleNumber(raw);el.value=String(Math.round(n*100000)/100000).replace('.',',')}
function periodData(period){const [y,m]=String(period||'').split('-').map(Number);return {month:monthNames[(m||1)-1]||'',year:y||0}}
function periodDisplay(period){const [y,m]=String(period||'').split('-');return y&&m?`${m}/${y}`:''}
function parsePeriod(value){const s=String(value||'').trim();let m=s.match(/^(0?[1-9]|1[0-2])\/(\d{4})$/);if(m)return `${m[2]}-${String(m[1]).padStart(2,'0')}`;m=s.match(/^(\d{4})-(0[1-9]|1[0-2])$/);return m?s:''}
function formatPeriodInput(el){let d=el.value.replace(/\D/g,'').slice(0,6);if(d.length>2)d=d.slice(0,2)+'/'+d.slice(2);el.value=d}
function variationClass(v){return Math.abs(Number(v))<0.005?'neutral':Number(v)>0?'positive':'negative'}
function goalClass(v){return Number(v)>=100?'positive':'negative'}
function statusClass(status){const s=String(status||'').toLowerCase();if(s.includes('concl'))return 'concluido';if(s.includes('pend'))return 'pendente';if(s.includes('planej'))return 'planejado';return 'andamento'}
function listFromText(value){return String(value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)}
function dateBR(value){if(!value)return '—';const [y,m,d]=value.split('-');return y&&m&&d?`${d}/${m}/${y}`:value}
function initials(name){return String(name||'V').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'V'}
function sellerPhotoMarkup(s,cls='avatar'){return s.photo?`<img class="${cls} avatar-img" src="${s.photo}" alt="Foto de ${escapeHtml(s.name)}">`:`<div class="${cls}">${escapeHtml(initials(s.name))}</div>`}
function profileMarkup(s,index){
  const p=profileDefs[s.profile]||{label:'Perfil',icon:'◌'};
  const options=Object.entries(profileDefs).map(([key,item])=>`<button type="button" class="profile-choice ${s.profile===key?'selected':''}" onclick="setSellerProfile(event,${index},'${key}')" title="Selecionar ${item.label}"><span>${item.icon}</span><small>${item.label}</small></button>`).join('');
  return `<div class="profile-picker-wrap"><button type="button" class="profile-seal profile-picker-trigger" onclick="toggleProfilePicker(event,${index})" title="Clique para alterar o perfil comportamental" aria-label="Alterar perfil comportamental de ${escapeHtml(s.name)}"><div class="profile-icon">${p.icon}</div><small>${p.label}</small><span class="profile-caret">⌄</span></button><div class="profile-picker-menu" data-profile-menu="${index}"><strong>Escolher perfil</strong><div class="profile-choice-grid">${options}</div></div></div>`;
}
function closeProfilePickers(except=null){document.querySelectorAll('.profile-picker-wrap.open').forEach(w=>{if(w!==except)w.classList.remove('open')})}
function toggleProfilePicker(event,index){
  event.preventDefault();event.stopPropagation();
  const trigger=event.currentTarget,wrap=trigger.closest('.profile-picker-wrap');
  if(!wrap)return;const opening=!wrap.classList.contains('open');closeProfilePickers(wrap);wrap.classList.toggle('open',opening);
}
function setSellerProfile(event,index,profile){
  event.preventDefault();event.stopPropagation();
  if(!state.sellers[index]||!profileDefs[profile])return;
  state.sellers[index].profile=profile;saveState();render();toast(`Perfil alterado para ${profileDefs[profile].label}`);
}
window.toggleProfilePicker=toggleProfilePicker;window.setSellerProfile=setSellerProfile;


function splitDegreeLens(period,total){
  const oldDegree=Number(period.degree||0),oldLens=Number(period.lens||0),oldTotal=oldDegree+oldLens;
  const degreeRatio=oldTotal?oldDegree/oldTotal:.56;
  period.degree=Number(total)*degreeRatio;
  period.lens=Number(total)-period.degree;
  period.degreeLens=Number(total);
}
function ensurePeriod(p,base){
  const out={...clone(base),...(p||{})};
  if(out.degree===undefined||out.lens===undefined){
    const total=Number(out.degreeLens||0),ratio=base.degreeLens?base.degree/base.degreeLens:.56;
    out.degree=total*ratio;out.lens=total-out.degree;
  }
  out.degreeLens=Number(out.degree||0)+Number(out.lens||0);
  const rawCp=out.categoryPieces||{};
  const cp={...(base.categoryPieces||{}),...rawCp};
  if(rawCp.degreeLens!==undefined && rawCp.degree===undefined && rawCp.lens===undefined){
    const total=Number(rawCp.degreeLens||0);const baseTotal=(base.categoryPieces.degree||0)+(base.categoryPieces.lens||0);const ratio=baseTotal?base.categoryPieces.degree/baseTotal:.6;cp.degree=Math.round(total*ratio);cp.lens=Math.max(0,total-cp.degree);
  }
  delete cp.degreeLens;out.categoryPieces=cp;
  if(out.accessories===undefined)out.accessories=Math.max(0,Number(out.revenue)-Number(out.solar)-Number(out.watch)-Number(out.degree)-Number(out.lens));
  return out;
}
function migrateSeller(s,index){
  const fallback=defaultState.sellers[index%Math.max(1,defaultState.sellers.length)]||defaultState.sellers[0]||{name:'Vendedor',role:'Vendedor',profile:'gato',chilliSeguro:0};
  const cur=s?.current||{};const prev=s?.previous||{};
  return {
    name:s?.name||fallback.name,role:s?.role||fallback.role||'Vendedor',photo:s?.photo||'',profile:s?.profile||fallback.profile||'',chilliSeguro:Number(s?.chilliSeguro??fallback.chilliSeguro??0),
    previous:{period:prev.period||'2025-08',target:Number(prev.target||0),revenue:Number(prev.revenue||0),watch:Number(prev.watch||0),solar:Number(prev.solar||0),degreeLens:Number(prev.degreeLens||0),lens:Number(prev.lens||0),luxottica:Number(prev.luxottica||0),contactLens:Number(prev.contactLens||0),lensQty:Number(prev.lensQty||0)},
    current:{period:cur.period||'2026-08',target:Number(cur.target||0),revenue:Number(cur.revenue||0),watch:Number(cur.watch||0),solar:Number(cur.solar||0),degreeLens:Number(cur.degreeLens||0),lens:Number(cur.lens||0),luxottica:Number(cur.luxottica||0),contactLens:Number(cur.contactLens||0),lensQty:Number(cur.lensQty||0)},
    attend:Number(s?.attend||0),sales:Number(s?.sales||0),pieces:Number(s?.pieces||0),crm:Number(s?.crm||0)
  };
}
function migrateState(raw){
  const base=clone(defaultState); if(!raw)return base;
  const st={...base,...raw};st.storeType=raw.storeType==='optica'?'optica':'vermelha';
  st.current=ensurePeriod(raw.current,base.current);st.previous=ensurePeriod(raw.previous,base.previous);
  st.sellers=(raw.sellers||base.sellers).map(migrateSeller);
  st.visibleColumns=[...(raw.visibleColumns||base.visibleColumns)];if(!st.visibleColumns.includes('repLens'))st.visibleColumns.splice(st.visibleColumns.indexOf('gxl')+1,0,'repLens');
  const rawShare=raw.shareLens||{};
  st.shareLens={
    ...base.shareLens,
    ...rawShare,
    types:{
      multifocal:{...base.shareLens.types.multifocal,...(rawShare.types?.multifocal||{})},
      single:{...base.shareLens.types.single,...(rawShare.types?.single||{})}
    },
    labs:rawShare.labs && typeof rawShare.labs==='object' ? {...rawShare.labs} : {...base.shareLens.labs},
    labColors:rawShare.labColors && typeof rawShare.labColors==='object'?{...rawShare.labColors}:{}
  };
  st.planColors=raw.planColors && typeof raw.planColors==='object'?{...raw.planColors}:{};
  const rawOp=raw.operation||{};
  st.operation={
    ...base.operation,
    ...rawOp,
    crm360:{
      ...base.operation.crm360,
      ...(rawOp.crm360||{}),
      generated:{...base.operation.crm360.generated,...(rawOp.crm360?.generated||{})},
      redeemed:{...base.operation.crm360.redeemed,...(rawOp.crm360?.redeemed||{})},
      lost:{...base.operation.crm360.lost,...(rawOp.crm360?.lost||{})},
      expiring:{...base.operation.crm360.expiring,...(rawOp.crm360?.expiring||{})}
    },
    oto:{...base.operation.oto,...(rawOp.oto||{})}
  };
  st.operation.actions=(rawOp.actions||base.operation.actions).map(a=>({...a}));
  st.teamRx={...base.teamRx,...(raw.teamRx||{})}; st.teamRx.trainings=(raw.teamRx?.trainings||base.teamRx.trainings).map(t=>({...t})); st.teamRx.individual={...base.teamRx.individual,...(raw.teamRx?.individual||{})};
  st.activeTab=['overview','team','categories','share','closing','ranking','operation','teamrx','database'].includes(raw.activeTab)?raw.activeTab:'overview';
  st.version=15;return st;
}
// Uma loja nova inicia vazia. Dados de demonstração NUNCA são enviados ao servidor.
function makeBlankState(storeName='Nova loja',storeType='vermelha',period){
  const base=clone(defaultState);
  const date=new Date();const month=period||`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  const lastYear=`${Number(month.slice(0,4))-1}-${month.slice(5)}`;
  for(const [key,monthValue] of [['current',month],['previous',lastYear]]){
    const p=base[key];
    for(const prop of Object.keys(p)){
      if(typeof p[prop]==='number')p[prop]=0;
      if(prop==='categoryPieces')for(const cat of Object.keys(p.categoryPieces))p.categoryPieces[cat]=0;
    }
    p.period=monthValue;
  }
  base.store=storeName;base.storeType=storeType;base.sellers=[];base.nextPlan=[];base.planColors={};
  for(const k of Object.keys(base.shareLens.types)){base.shareLens.types[k].revenue=0;base.shareLens.types[k].qty=0}
  for(const k of Object.keys(base.shareLens.labs))base.shareLens.labs[k]=0;
  base.shareLens.markupRows=[];
  const o=base.operation;o.opportunity='';o.execution=0;o.challenges=[];o.wins=[];o.notes='';o.actions=[];
  o.crm360={salesBase:0,returnRate:0,generated:{amount:0,tickets:0},redeemed:{amount:0,tickets:0},lost:{amount:0,tickets:0},expiring:{amount:0,tickets:0}};
  o.oto={revenue:0,sales:0,contacts:0,conversion:0,windowDays:0};
  base.teamRx={engagement:0,execution:0,strengths:[],attention:[],trainings:[],notes:'',individual:{}};
  base.activeTab='overview';return base;
}
window.__makeBlankForecast=makeBlankState;
function loadState(){
  try{
    const v6=localStorage.getItem('prognostico-v6');if(v6)return migrateState(JSON.parse(v6));
    const v5=localStorage.getItem('prognostico-v5');if(v5)return migrateState(JSON.parse(v5));
    const v4=localStorage.getItem('prognostico-v4');if(v4)return migrateState(JSON.parse(v4));
    const v3=localStorage.getItem('prognostico-v3');if(v3)return migrateState(JSON.parse(v3));
    const v2=localStorage.getItem('prognostico-v2');if(v2)return migrateState(JSON.parse(v2));
  }catch{}
  return clone(defaultState);
}
let state=makeBlankState();
let suppressPersistence=false;
function saveState(){if(!suppressPersistence)window.SaasBridge?.queueSnapshot?.(clone(state))}
window.__getForecastState=()=>state;
window.__setForecastState=(next)=>{state=migrateState(next||{});state.activeTab='overview';saveState();render();if(typeof renderDatabase==='function')renderDatabase();};
window.__setCloudStoreIdentity=(name,id)=>{if(name){state.store=name;saveState();render();}window.__activeCloudStoreId=id||null;};
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),1900)}

function categoryValue(period,key){return Number(period[key]||0)}
function categoryPieces(period,key){return Number(period.categoryPieces?.[key]||0)}
function gxlConversion(period){return safeDiv(categoryPieces(period,'lens'),categoryPieces(period,'degree'))*100}
function sellerCategoryValue(s,key){
  const cur=s?.current||{};
  const revenue=Number(cur.revenue||0), solar=Number(cur.solar||0), watch=Number(cur.watch||0), degreeLens=Number(cur.degreeLens||0), lens=Number(cur.lens||0), contactLens=Number(cur.contactLens||0), luxottica=Number(cur.luxottica||0);
  const degree=Math.max(0, Number(cur.degree ?? (degreeLens-lens)));
  const accessoriesBase = isOptica() ? (solar + degreeLens + contactLens + luxottica) : (solar + watch + degreeLens);
  const accessories=Math.max(0, Number(cur.accessories ?? (revenue-accessoriesBase)));
  return Number(({solar,watch,degree,lens,degreeLens,contactLens,luxottica,accessories}[key])||0);
}
function activeTeamSeriesDefs(){
  if(isOptica()) return [
    {label:'Solar', key:'solar', color:'#d18a0f'},
    {label:'Armações', key:'degree', color:'#f36d0b'},
    {label:'Lentes', key:'lens', color:'#ff991c'},
    {label:'Contato', key:'contactLens', color:'#da6228'},
    {label:'Luxottica', key:'luxottica', color:'#7b57d8'},
    {label:'Acessórios', key:'accessories', color:'#c48a33'}
  ];
  return [
    {label:'Solar', key:'solar', color:'#2e7de4'},
    {label:'Relógio', key:'watch', color:'#7753db'},
    {label:'Grau + Lente', key:'degreeLens', color:'#18a66c'},
    {label:'Acessórios', key:'accessories', color:'#ef5062'}
  ];
}
function totalSellerRevenue(which='current'){return state.sellers.reduce((sum,s)=>sum+Number(s[which]?.revenue||0),0)}
function teamConversion(){const sales=state.sellers.reduce((a,s)=>a+Number(s.sales||0),0),att=state.sellers.reduce((a,s)=>a+Number(s.attend||0),0);return conversion(sales,att)}
function teamPA(){const pieces=state.sellers.reduce((a,s)=>a+Number(s.pieces||0),0),sales=state.sellers.reduce((a,s)=>a+Number(s.sales||0),0);return pa(pieces,sales)}

function metric(label,value,cls='',bar=null){return `<div class="metric"><div class="m-label">${label}</div><div class="m-value ${cls}">${value}</div>${bar===null?'':`<div class="mini-bar"><i style="width:${clamp(bar,0,100)}%"></i></div>`}</div>`}
function renderMetrics(){
  const c=state.current,p=state.previous,growth=variation(c.revenue,p.revenue),ach=achievement(c.revenue,c.target),pAch=achievement(p.revenue,p.target);
  document.getElementById('metricsCurrent').innerHTML=[metric('META DO MÊS',ptMoney.format(c.target)),metric('VENDAS DO MÊS',ptMoney.format(c.revenue)),metric('CRESCIMENTO VS ANO ANTERIOR',`${growth>=.005?'+':''}${fmtPct(growth)}`,variationClass(growth)),metric('ATINGIMENTO DE META',fmtPct(ach),goalClass(ach),ach),metric('TX DE CONV.',fmtPct(conversion(c.sales,c.attend))),metric('P.A.',ptNum.format(pa(c.pieces,c.sales))),metric('TICKET MÉDIO',ptMoney.format(ticket(c.revenue,c.sales))),metric('ATEND.',ptInt.format(c.attend)),metric('VENDAS',ptInt.format(c.sales)),...(isOptica()?[metric('REP LUXOTTICA',fmtPct(rep(c.luxottica,c.revenue))),metric('LENTES DE CONTATO',ptMoney.format(c.contactLens)),metric('P.M.L',ptMoney.format(priceMeanLens(c.lens,categoryPieces(c,'lens'))))]:[metric('REP. RELÓGIO',fmtPct(rep(c.watch,c.revenue)))])].join('');
  document.getElementById('metricsPrevious').innerHTML=[metric('META DO MÊS',ptMoney.format(p.target)),metric('VENDAS DO MÊS',ptMoney.format(p.revenue)),metric('BASE COMPARATIVA','—','neutral'),metric('ATINGIMENTO DE META',fmtPct(pAch),goalClass(pAch),pAch),metric('TX DE CONV.',fmtPct(conversion(p.sales,p.attend))),metric('P.A.',ptNum.format(pa(p.pieces,p.sales))),metric('TICKET MÉDIO',ptMoney.format(ticket(p.revenue,p.sales))),metric('ATEND.',ptInt.format(p.attend)),metric('VENDAS',ptInt.format(p.sales)),...(isOptica()?[metric('REP LUXOTTICA',fmtPct(rep(p.luxottica,p.revenue))),metric('LENTES DE CONTATO',ptMoney.format(p.contactLens)),metric('P.M.L',ptMoney.format(priceMeanLens(p.lens,categoryPieces(p,'lens'))))]:[metric('REP. RELÓGIO',fmtPct(rep(p.watch,p.revenue)))])].join('');
}

const columns={
  name:{label:'VENDEDOR',render:(s,i)=>`<div class="seller-cell">${sellerPhotoMarkup(s)}<span>${escapeHtml(s.name)}</span><span class="row-actions"><button class="tiny" onclick="editSeller(${i})" title="Editar vendedor">✎</button><button class="tiny danger" onclick="deleteSeller(${i})" title="Excluir vendedor">×</button></span></div>`},
  revenue:{label:'FATURAMENTO',render:s=>`<span class="money ${goalClass(achievement(s.current.revenue,s.current.target))}">${ptMoney.format(s.current.revenue)}</span>`},
  achievement:{label:'ATINGIMENTO',render:s=>{const v=achievement(s.current.revenue,s.current.target);return `<span class="${goalClass(v)}">${fmtPct(v)}</span>`}},
  growth:{label:'CRESCIMENTO',render:s=>{const v=variation(s.current.revenue,s.previous.revenue);return `<span class="${variationClass(v)}">${v>=.005?'+':''}${fmtPct(v)}</span>`}},
  conversion:{label:'TX DE CONV.',render:s=>fmtPct(conversion(s.sales,s.attend))},
  repRe:{label:'REP DE RE',render:s=>fmtPct(rep(s.current.watch,s.current.revenue))},
  repSolar:{label:'REP SOLAR',render:s=>fmtPct(rep(s.current.solar,s.current.revenue))},
  pa:{label:'P.A.',render:s=>ptNum.format(pa(s.pieces,s.sales))},
  ticket:{label:'TICKET MÉDIO',render:s=>ptMoney.format(ticket(s.current.revenue,s.sales))},
  gxl:{label:'REP GRAU + LENTE',render:s=>fmtPct(rep(s.current.degreeLens,s.current.revenue))},
  repLens:{label:'REP LENTES',render:s=>fmtPct(rep(s.current.lens||0,s.current.revenue))},
  luxottica:{label:'LUXOTTICA',render:s=>ptMoney.format(s.current.luxottica||0)},
  repLuxottica:{label:'REP LUXOTTICA',render:s=>fmtPct(rep(s.current.luxottica||0,s.current.revenue))},
  contactLens:{label:'LENTES DE CONTATO',render:s=>ptMoney.format(s.current.contactLens||0)},
  pml:{label:'P.M.L',render:s=>ptMoney.format(priceMeanLens(s.current.lens||0,s.current.lensQty||0))},
  attend:{label:'ATEND.',render:s=>ptInt.format(s.attend)}, sales:{label:'VENDAS',render:s=>ptInt.format(s.sales)},
  crm:{label:'USAB. CRM 360',render:s=>`<span class="${s.crm>=70?'good':'bad'}">${fmtPct(s.crm||0)}</span>`},
  p7030:{label:'70/30',render:s=>`<span class="seller-share" title="Realizado do vendedor ÷ realizado da loja">${fmtPct(rep(s.current.revenue,state.current.revenue))}</span>`}
};
function renderOverviewSellers(){
  const cols=state.visibleColumns.filter(k=>columns[k]&&(isOptica()||!opticalColumnKeys.includes(k)));
  document.getElementById('sellerTableHead').innerHTML=cols.map(k=>`<th>${columns[k].label}</th>`).join('');
  document.getElementById('sellerTableBody').innerHTML=state.sellers.length?state.sellers.map((s,i)=>`<tr>${cols.map(k=>`<td>${columns[k].render(s,i)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${cols.length}" class="empty-row">Nenhum vendedor cadastrado.</td></tr>`;
}
function renderColumnChecks(){document.getElementById('columnChecks').innerHTML=Object.entries(columns).filter(([k])=>isOptica()||!opticalColumnKeys.includes(k)).map(([k,v])=>`<label><input type="checkbox" value="${k}" ${state.visibleColumns.includes(k)?'checked':''}> ${v.label}</label>`).join('')}

function overviewCategoryItems(){
  const p=state.previous,c=state.current;
  return [
    {key:'revenue',label:'FATURAMENTO',prev:p.revenue,cur:c.revenue,prevPieces:null,curPieces:null},
    ...activeCategoryDefs().map(d=>({key:d.key,label:d.short,prev:categoryValue(p,d.key),cur:categoryValue(c,d.key),prevPieces:categoryPieces(p,d.key),curPieces:categoryPieces(c,d.key)}))
  ];
}
function renderOverviewCategories(){
  document.getElementById('overviewCategoryGrid').innerHTML=overviewCategoryItems().map(item=>{
    const v=variation(item.cur,item.prev),pv=item.prevPieces===null?null:variation(item.curPieces,item.prevPieces);
    const def=activeCategoryDefs().find(d=>d.key===item.key);
    const titleIcon=def?`<span class="category-header-icon"><img src="${def.icon}" alt="" loading="lazy"></span>`:'';
    const repPrev=item.key==='revenue'?'':`<small>REP. ${fmtPct(rep(item.prev,state.previous.revenue))}</small>`;
    const repCur=item.key==='revenue'?'':`<small>REP. ${fmtPct(rep(item.cur,state.current.revenue))}</small>`;
    const artwork=activeCategoryDefs().find(d=>d.key===item.key);
    const image=artwork?`<div class="neon-category-photo" aria-hidden="true"><img src="${artwork.icon}" alt="" loading="lazy"></div>`:`<div class="neon-category-photo neon-revenue-photo" aria-hidden="true"><span>🌶</span></div>`;
    return `<div class="category-tile">${image}<h4>${titleIcon}<span>${item.label}</span></h4><div class="cat-year-row prev"><div class="cat-year-main"><strong>${item.prevPieces===null?ptMoney.format(item.prev):`${ptInt.format(item.prevPieces)} peças`}</strong>${item.prevPieces===null?'':`<small>${ptMoney.format(item.prev)} · ${repPrev.replace(/<\/?small>/g,'')}</small>`}</div><div class="cat-var"><span class="${variationClass(item.prevPieces===null?v:pv)}">${item.prevPieces===null?'':`${fmtPct(pv)}`}</span></div></div><div class="cat-year-row cur"><div class="cat-year-main"><strong>${item.curPieces===null?ptMoney.format(item.cur):`${ptInt.format(item.curPieces)} peças`}</strong>${item.curPieces===null?'':`<small>${ptMoney.format(item.cur)} · ${repCur.replace(/<\/?small>/g,'')}</small>`}</div><div class="cat-var"><span class="${variationClass(v)}">${v>=.005?'+':''}${fmtPct(v)}</span></div></div></div>`;
  }).join('');
}

function sellerCard(s,i){
  const ach=achievement(s.current.revenue,s.current.target),g=variation(s.current.revenue,s.previous.revenue);
  return `<article class="seller-card"><div class="seller-card-top"><span class="rank-chip">#${i+1}</span><button class="compare-edit" onclick="editSeller(${state.sellers.indexOf(s)})">✎ Editar comparadas</button></div><div class="seller-identity">${sellerPhotoMarkup(s)}<div><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.role||'Vendedor')}</small></div>${profileMarkup(s,state.sellers.indexOf(s))}</div><div class="seller-revenue">${ptMoney.format(s.current.revenue)}</div><div class="achievement-line"><span>Atingimento</span><b class="${goalClass(ach)}">${fmtPct(ach)}</b></div><div class="progress"><i style="width:${clamp(ach,0,100)}%"></i></div><div class="seller-mini-kpis"><div><small>Conversão</small><strong>${fmtPct(conversion(s.sales,s.attend))}</strong></div><div><small>P.A.</small><strong>${ptNum.format(pa(s.pieces,s.sales))}</strong></div><div><small>Ticket</small><strong>${ptMoney.format(ticket(s.current.revenue,s.sales))}</strong></div></div><div class="seller-card-footer">${isOptica()?`<div><small>REP Luxottica</small><strong>${fmtPct(rep(s.current.luxottica||0,s.current.revenue))}</strong></div><div><small>REP Lentes</small><strong>${fmtPct(rep(s.current.lens||0,s.current.revenue))}</strong></div><div><small>P.M.L</small><strong>${ptMoney.format(priceMeanLens(s.current.lens||0,s.current.lensQty||0))}</strong></div>`:`<div><small>REP Relógio</small><strong>${fmtPct(rep(s.current.watch,s.current.revenue))}</strong></div><div><small>Grau + Lentes</small><strong>${fmtPct(rep(s.current.degreeLens,s.current.revenue))}</strong></div><div><small>Chilli Seguro</small><strong>${ptInt.format(s.chilliSeguro||0)}</strong></div>`}</div><div style="text-align:center;margin-top:8px;font-size:9px" class="${variationClass(g)}">Comparada: ${g>=.005?'+':''}${fmtPct(g)}</div></article>`;
}
function renderTeam(){
  const sorted=[...state.sellers].sort((a,b)=>b.current.revenue-a.current.revenue);
  document.getElementById('sellerCardGrid').innerHTML=sorted.map((s,i)=>sellerCard(s,i)).join('')||'<div class="manager-empty">Nenhum vendedor cadastrado.</div>';
  const labels=state.sellers.map(s=>s.name.split(' ')[0]);
  renderLineChart('teamRevenueChart',labels,[{values:state.sellers.map(s=>s.current.revenue),className:'chart-series-current',pointClass:'chart-point-current',valueFormatter:v=>compactMoney(v)},{values:state.sellers.map(s=>s.previous.revenue),className:'chart-series-previous',pointClass:'chart-point-previous',valueFormatter:v=>compactMoney(v)}],compactMoney);
  const seriesDefs=activeTeamSeriesDefs();
  const teamCategorySeries=seriesDefs.map(def=>({values:state.sellers.map(s=>sellerCategoryValue(s,def.key)),color:def.color,className:''}));
  const legend=document.getElementById('teamCategoriesLegend');
  if(legend) legend.innerHTML=seriesDefs.map(def=>`<span><i class="dot" style="background:${def.color}"></i>${def.label}</span>`).join('');
  renderGroupedBarChart('teamCategoriesChart',labels,teamCategorySeries,compactMoney);
}

function categoryStyle(d){return `--accent:${d.accent};--accent-soft:${d.soft}`}
function renderCategoriesTab(){
  const c=state.current,p=state.previous;
  document.getElementById('mixCategoryCards').innerHTML=activeCategoryDefs().map(d=>{const value=categoryValue(c,d.key),pieces=categoryPieces(c,d.key),v=variation(value,categoryValue(p,d.key));return `<article class="mix-card" style="${categoryStyle(d)}"><div class="mix-icon" data-category="${d.key}"><img src="${d.icon}" alt="${escapeHtml(d.label)}" loading="lazy"></div><h4>${d.label.toUpperCase()}</h4><div class="mix-value">${ptMoney.format(value)}</div><div class="mix-rep">${fmtPct(rep(value,c.revenue))} <small>do faturamento</small></div><div class="mix-bottom"><span>${ptInt.format(pieces)} peças</span><span class="variation-chip ${variationClass(v)}">${v>=.005?'↗ +':v<-.005?'↘ ':''}${fmtPct(v)}</span></div></article>`}).join('');
  const bar=document.getElementById('compositionBar');bar.innerHTML=activeCategoryDefs().map(d=>`<span class="composition-seg" title="${d.label}: ${fmtPct(rep(categoryValue(c,d.key),c.revenue))}" style="width:${clamp(rep(categoryValue(c,d.key),c.revenue),0,100)}%;background:${d.accent}"></span>`).join('');
  document.getElementById('compositionLegend').innerHTML=activeCategoryDefs().map(d=>`<span><i class="dot" style="background:${d.accent}"></i>${d.label} <b>${fmtPct(rep(categoryValue(c,d.key),c.revenue))}</b></span>`).join('');
}


const shareTypeDefs=[
  {key:'multifocal',label:'MULTIFOCAL'},
  {key:'single',label:'VISÃO SIMPLES'}
];
const labAccent={ZEISS:'#1677e8',COMPROL:'#7047da',NOTLAB:'#18a66c',PREMIUM:'#edae00',HOYA:'#ef5062'};

function renderShareLens(){renderMarkupTable();renderLabMarkupChart();
  const share=state.shareLens||defaultState.shareLens;
  const totalLensPieces=categoryPieces(state.current,'lens');
  const typeBody=document.getElementById('shareLensTypeBody');
  const totalRevenue=shareTypeDefs.reduce((sum,d)=>sum+Number(share.types?.[d.key]?.revenue||0),0);
  const totalQty=shareTypeDefs.reduce((sum,d)=>sum+Number(share.types?.[d.key]?.qty||0),0);
  if(typeBody){
    typeBody.innerHTML=shareTypeDefs.map(d=>{
      const row=share.types?.[d.key]||{};
      const qty=Number(row.qty||0),revenue=Number(row.revenue||0);
      const pct=safeDiv(qty,totalLensPieces)*100;
      return `<tr><td><strong>${d.label}</strong></td><td><span class="share-percent">${fmtPct(pct)}</span></td><td><strong>${ptMoney.format(revenue)}</strong></td><td>${ptInt.format(qty)}</td><td><strong>${ptMoney.format(ticket(revenue,qty))}</strong></td></tr>`;
    }).join('');
  }
  const totalPiecesEl=document.getElementById('shareLensTotalPieces');if(totalPiecesEl)totalPiecesEl.textContent=ptInt.format(totalLensPieces);
  const summary=document.getElementById('shareLensSummary');
  if(summary){
    const coverage=safeDiv(totalQty,totalLensPieces)*100;
    summary.innerHTML=`<span>Faturamento informado <b>${ptMoney.format(totalRevenue)}</b></span><span>Qtd informada <b>${ptInt.format(totalQty)}</b> de ${ptInt.format(totalLensPieces)} lentes</span><span>Cobertura <b>${fmtPct(coverage)}</b></span>`;
  }

  const labs=share.labs||{};
  const labEntries=Object.entries(labs).map(([name,q])=>[name,Number(q||0)]);
  const labTotal=labEntries.reduce((a,[,q])=>a+q,0);
  const labBody=document.getElementById('shareLabBody');
  if(labBody){
    labBody.innerHTML=`<tr class="lab-total-row"><td><strong>TOTAL</strong></td><td><strong>${ptNum.format(labTotal)}</strong></td><td><strong>${labTotal?fmtPct(100):fmtPct(0)}</strong></td></tr>`+
      labEntries.map(([name,q])=>`<tr><td><strong>${name}</strong></td><td>${ptNum.format(q)}</td><td>${fmtPct(safeDiv(q,labTotal)*100)}</td></tr>`).join('');
  }
  const labTotalEl=document.getElementById('shareLabTotal');if(labTotalEl)labTotalEl.textContent=ptNum.format(labTotal);
  const bar=document.getElementById('labShareBar');
  if(bar){
    bar.innerHTML=labEntries.map(([name,q])=>`<span title="${name}: ${fmtPct(safeDiv(q,labTotal)*100)}" style="width:${clamp(safeDiv(q,labTotal)*100,0,100)}%;background:${(labAccent[name]||'#1677e8')}"></span>`).join('');
  }
  const legend=document.getElementById('labShareLegend');
  if(legend){
    legend.innerHTML=labEntries.map(([name,q])=>`<span><i style="background:${(labAccent[name]||'#1677e8')}"></i>${name} <b>${fmtPct(safeDiv(q,labTotal)*100)}</b></span>`).join('');
  }
}

function crmCard(label,amount,tickets,kind,sub=''){
  return `<article class="crm-bonus-card ${kind}"><div class="crm-card-head"><strong>${label}</strong><span>${ptInt.format(tickets)} tickets</span></div><div class="crm-amount"><small>R$</small>${ptNum.format(amount)}</div>${sub?`<div class="crm-card-sub">${sub}</div>`:''}</article>`;
}
function renderCommercialRx(){
  const op=state.operation||{},crm=op.crm360||defaultState.operation.crm360,oto=op.oto||defaultState.operation.oto;
  const crmEl=document.getElementById('crm360Cards');
  if(crmEl){
    crmEl.innerHTML=[
      crmCard('BÔNUS GERADO',crm.generated?.amount||0,crm.generated?.tickets||0,'generated',`Venda de ${ptMoney.format(crm.salesBase||0)}`),
      crmCard('BÔNUS RESGATADO',crm.redeemed?.amount||0,crm.redeemed?.tickets||0,'redeemed','Créditos efetivamente utilizados'),
      crmCard('BÔNUS PERDIDO',crm.lost?.amount||0,crm.lost?.tickets||0,'lost',`${ptNum.format(crm.returnRate||0)}% de retorno`),
      crmCard('BÔNUS A VENCER',crm.expiring?.amount||0,crm.expiring?.tickets||0,'expiring','Saldo próximo do vencimento')
    ].join('');
  }
  const rev=Number(oto.revenue||0),sales=Number(oto.sales||0),contacts=Number(oto.contacts||0);
  const kpis=[
    {label:'Receita atribuída',value:ptMoney.format(rev),sub:`${ptInt.format(sales)} vendas`,emphasis:true},
    {label:'Contatos realizados',value:ptInt.format(contacts),sub:''},
    {label:'Receita por contato',value:ptMoney.format(ticket(rev,contacts)),sub:''},
    {label:'Taxa de conversão',value:fmtPct(oto.conversion||0),sub:''},
    {label:'Ticket médio',value:ptMoney.format(ticket(rev,sales)),sub:''},
    {label:'Janela de conversão',value:`${ptNum.format(oto.windowDays||0)} dias`,sub:''}
  ];
  const otoEl=document.getElementById('otoKpis');
  if(otoEl)otoEl.innerHTML=kpis.map(k=>`<article class="oto-kpi ${k.emphasis?'emphasis':''}"><small>${k.label}</small><strong>${k.value}</strong>${k.sub?`<span>${k.sub}</span>`:''}</article>`).join('');
}

function closingRows(){return [{key:'revenue',label:'Faturamento geral',icon:'',accent:'#53657b',soft:'#f2f5f8',prev:state.previous.revenue,cur:state.current.revenue,prevPieces:null,curPieces:null},...activeCategoryDefs().map(d=>({key:d.key,label:d.label,icon:d.icon,accent:d.accent,soft:d.soft,prev:categoryValue(state.previous,d.key),cur:categoryValue(state.current,d.key),prevPieces:categoryPieces(state.previous,d.key),curPieces:categoryPieces(state.current,d.key)}))]}
function variationChip(v){return `<span class="variation-chip ${variationClass(v)}">${v>=.005?'↗ +':v<-.005?'↘ ':''}${fmtPct(v)}</span>`}
function renderClosing(){
  document.getElementById('closingTableBody').innerHTML=closingRows().map(r=>`<tr><td><div class="cat-name-cell">${r.icon?`<span class="cat-icon-sm" style="--accent:${r.accent};--soft:${r.soft}"><img src="${r.icon}" alt="" loading="lazy"></span>`:''}<strong>${r.label}</strong></div></td><td class="prev-col">${r.prevPieces===null?'—':ptInt.format(r.prevPieces)}</td><td class="prev-col"><strong>${ptMoney.format(r.prev)}</strong></td><td class="cur-col">${r.curPieces===null?'—':ptInt.format(r.curPieces)}</td><td class="cur-col"><strong>${ptMoney.format(r.cur)}</strong></td><td>${r.prevPieces===null?'—':variationChip(variation(r.curPieces,r.prevPieces))}</td><td>${variationChip(variation(r.cur,r.prev))}</td></tr>`).join('');
  const labels=activeCategoryDefs().map(d=>d.label);
  renderGroupedBarChart('closingRevenueChart',labels,[{values:activeCategoryDefs().map(d=>categoryValue(state.previous,d.key)),className:'bar-prev'},{values:activeCategoryDefs().map(d=>categoryValue(state.current,d.key)),className:'bar-cur'}],compactMoney);
  renderGroupedBarChart('closingPiecesChart',labels,[{values:activeCategoryDefs().map(d=>categoryPieces(state.previous,d.key)),className:'bar-prev'},{values:activeCategoryDefs().map(d=>categoryPieces(state.current,d.key)),className:'bar-cur'}],v=>ptInt.format(v));
}

function topSellerBy(fn){if(!state.sellers.length)return null;return [...state.sellers].sort((a,b)=>Number(fn(b))-Number(fn(a)))[0]}
function sellerPodiumCard(s,place){if(!s)return '';const cls=place===1?'first':'';const medal=place===1?'🥇':place===2?'🥈':'🥉';return `<article class="podium-card ${cls}"><span class="podium-place">${place}º LUGAR</span><span class="medal-icon">${medal}</span><div class="podium-avatar">${s.photo?`<img src="${s.photo}" alt="${escapeHtml(s.name)}">`:escapeHtml(initials(s.name))}</div><div class="podium-name">${escapeHtml(s.name)}</div><div class="podium-value">${ptMoney.format(s.current.revenue)}</div><div class="podium-ach">${fmtPct(achievement(s.current.revenue,s.current.target))} da meta</div>${place===1?'<span class="first-badge">1</span>':''}</article>`}
function highlightCard(icon,title,s,value){const iconNode=icon.startsWith('assets/')?`<img class="rank-artwork" src="${escapeHtml(icon)}" alt="" loading="lazy">`:icon;return `<article class="highlight-card"><div class="highlight-icon">${iconNode}</div><div><small>${title}</small><strong>${s?escapeHtml(s.name):'—'}</strong><b>${value}</b></div></article>`}
function renderRanking(){
  const sorted=[...state.sellers].sort((a,b)=>b.current.revenue-a.current.revenue),first=sorted[0],second=sorted[1],third=sorted[2];
  document.getElementById('podium').innerHTML=sellerPodiumCard(second,2)+sellerPodiumCard(first,1)+sellerPodiumCard(third,3);
  const bestRev=topSellerBy(s=>s.current.revenue),bestConv=topSellerBy(s=>conversion(s.sales,s.attend)),bestPA=topSellerBy(s=>pa(s.pieces,s.sales)),bestSolar=topSellerBy(s=>s.current.solar),bestGxl=topSellerBy(s=>s.current.degreeLens),bestContact=topSellerBy(s=>s.current.contactLens||0),bestLuxottica=topSellerBy(s=>s.current.luxottica||0),bestWatch=topSellerBy(s=>s.current.watch),bestSeguro=topSellerBy(s=>s.chilliSeguro||0);
  const cards = isOptica()
    ? [
        highlightCard('🏆','Maior faturamento',bestRev,bestRev?ptMoney.format(bestRev.current.revenue):'—'),
        highlightCard('assets/rank-conversion.webp','Melhor conversão',bestConv,bestConv?fmtPct(conversion(bestConv.sales,bestConv.attend)):'—'),
        highlightCard('assets/rank-pa.webp','Maior P.A.',bestPA,bestPA?ptNum.format(pa(bestPA.pieces,bestPA.sales)):'—'),
        highlightCard('assets/category-solar.webp','Maior solar',bestSolar,bestSolar?ptMoney.format(bestSolar.current.solar):'—'),
        highlightCard('assets/category-degree.webp','Maior grau + lentes',bestGxl,bestGxl?ptMoney.format(bestGxl.current.degreeLens):'—'),
        highlightCard('assets/category-contactLens.webp','Maior lente de contato',bestContact,bestContact?ptMoney.format(bestContact.current.contactLens||0):'—'),
        highlightCard('assets/category-luxottica.webp','Maior Luxottica',bestLuxottica,bestLuxottica?ptMoney.format(bestLuxottica.current.luxottica||0):'—'),
        highlightCard('assets/rank-chilli-seguro.png','Maior Chilli Seguro',bestSeguro,bestSeguro?ptInt.format(bestSeguro.chilliSeguro||0):'—')
      ]
    : [
        highlightCard('🏆','Maior faturamento',bestRev,bestRev?ptMoney.format(bestRev.current.revenue):'—'),
        highlightCard('assets/rank-conversion.webp','Melhor conversão',bestConv,bestConv?fmtPct(conversion(bestConv.sales,bestConv.attend)):'—'),
        highlightCard('assets/rank-pa.webp','Maior P.A.',bestPA,bestPA?ptNum.format(pa(bestPA.pieces,bestPA.sales)):'—'),
        highlightCard('assets/category-watch.webp','Maior relógio',bestWatch,bestWatch?ptMoney.format(bestWatch.current.watch):'—'),
        highlightCard('assets/category-solar.webp','Maior solar',bestSolar,bestSolar?ptMoney.format(bestSolar.current.solar):'—'),
        highlightCard('assets/category-degree.webp','Maior grau + lentes',bestGxl,bestGxl?ptMoney.format(bestGxl.current.degreeLens):'—'),
        highlightCard('assets/rank-chilli-seguro.png','Maior Chilli Seguro',bestSeguro,bestSeguro?ptInt.format(bestSeguro.chilliSeguro||0):'—')
      ];
  document.getElementById('highlightGrid').innerHTML=cards.join('');
}

function bulletsHtml(items){return `<ul>${(items||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`}
function renderOperation(){renderNextPlan();
  const op=state.operation;
  renderCommercialRx();
  document.getElementById('operationKpis').innerHTML=[{icon:'⚠',label:'Principais desafios',value:(op.challenges||[]).length,sub:'pontos críticos',accent:'#d93c4d',soft:'#ffeaee'},{icon:'✓',label:'Principais acertos',value:(op.wins||[]).length,sub:'pontos fortes',accent:'#15905a',soft:'#e7f7ef'},{icon:'↗',label:'Oportunidade de crescimento',value:op.opportunity||'—',sub:'potencial identificado',accent:'#6f46db',soft:'#efe9ff'},{icon:'◎',label:'Nível de execução',value:`${clamp(Number(op.execution||0),0,100)}%`,sub:'em execução do plano',accent:'#1c70d6',soft:'#e9f2ff'}].map(k=>`<article class="rx-kpi-card"><div class="rx-kpi-icon" style="--accent:${k.accent};--soft:${k.soft}">${k.icon}</div><div><small>${k.label}</small><strong>${k.value}</strong><small>${k.sub}</small></div><button class="tiny-edit" onclick="openOperationModal()">✎</button></article>`).join('');
  document.getElementById('operationChallenges').innerHTML=bulletsHtml(op.challenges);document.getElementById('operationWins').innerHTML=bulletsHtml(op.wins);document.getElementById('operationNotes').textContent=op.notes||'';
  renderGroupedBarChart('operationChart',['Ano anterior','Ano atual'],[{values:[state.previous.revenue,state.current.revenue],className:'bar-cur'},{values:[state.previous.target,state.current.target],className:'bar-prev'}],compactMoney);
}
function renderTeamRx(){
  const rx=state.teamRx;
  document.getElementById('teamRxKpis').innerHTML=[{icon:'♧',label:'Engajamento',value:`${clamp(Number(rx.engagement||0),0,100)}%`,sub:'envolvimento com metas e treinamentos'},{icon:'◎',label:'Execução',value:`${clamp(Number(rx.execution||0),0,100)}%`,sub:'disciplina e processos'},{icon:'▽',label:'Conversão média',value:fmtPct(teamConversion()),sub:'conversão média do time'},{icon:'▥',label:'P.A. médio',value:ptNum.format(teamPA()),sub:'peças por atendimento vendido'}].map((k,i)=>`<article class="rx-kpi-card"><div class="rx-kpi-icon" style="--accent:#176bd2;--soft:#eaf3ff">${k.icon}</div><div><small>${k.label}</small><strong>${k.value}</strong><small>${k.sub}</small></div><button class="tiny-edit" onclick="openTeamRxModal()">✎</button></article>`).join('');
  document.getElementById('teamStrengths').innerHTML=bulletsHtml(rx.strengths);document.getElementById('teamAttention').innerHTML=bulletsHtml(rx.attention);
  document.getElementById('trainingList').innerHTML=(rx.trainings||[]).map(t=>`<div class="training-item"><span class="training-check ${t.done?'done':''}">${t.done?'✓':''}</span><span>${escapeHtml(t.text)}</span><span>${dateBR(t.date)}</span></div>`).join('')||'<div class="manager-empty">Nenhum treinamento cadastrado.</div>';
  document.getElementById('individualEvolutionBody').innerHTML=state.sellers.map(s=>{const data=rx.individual?.[s.name]||{challenge:'Definir desafio',next:'Definir próximo passo',status:'No caminho'},g=variation(s.current.revenue,s.previous.revenue),gClass=g>.005?'change-up':g<-.005?'change-down':'change-flat';return `<tr><td><div class="evolution-person">${sellerPhotoMarkup(s)}<div><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.role||'Vendedor')}</small></div></div></td><td>${escapeHtml(data.challenge||'—')}</td><td class="${gClass}">${g>=.005?'↑ +':g<-.005?'↓ ': '→ '}${fmtPct(g)}</td><td>${escapeHtml(data.next||'—')}</td><td><span class="status-pill ${String(data.status).toLowerCase().includes('aten')?'pendente':'concluido'}">${escapeHtml(data.status||'No caminho')}</span></td></tr>`}).join('');
  document.getElementById('teamRxNotes').textContent=rx.notes||'';
  const labels=state.sellers.map(s=>s.name.split(' ')[0]);const growths=state.sellers.map(s=>variation(s.current.revenue,s.previous.revenue));renderDivergingBarChart('teamRxChart',labels,growths);
}

function compactMoney(v){const n=Number(v)||0;return Math.abs(n)>=1000000?`R$ ${ptNum.format(n/1000000)} mi`:Math.abs(n)>=1000?`R$ ${ptNum.format(n/1000)} mil`:ptMoney.format(n)}
function svgEsc(t){return escapeHtml(t)}
function renderLineChart(id,labels,series,yFormatter=v=>ptNum.format(v)){
  const el=document.getElementById(id);if(!el)return;const W=820,H=270,L=72,R=24,T=28,B=48,plotW=W-L-R,plotH=H-T-B;const all=series.flatMap(s=>s.values.map(Number));const max=Math.max(1,...all)*1.12;const x=i=>L+(labels.length===1?plotW/2:i*plotW/Math.max(1,labels.length-1));const y=v=>T+plotH-(Number(v)/max)*plotH;let svg=`<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for(let i=0;i<=4;i++){const val=max*(4-i)/4,yy=T+plotH*i/4;svg+=`<line class="chart-gridline" x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}"/><text class="chart-axis-label" x="${L-8}" y="${yy+3}" text-anchor="end">${svgEsc(yFormatter(val))}</text>`}
  labels.forEach((lab,i)=>svg+=`<text class="chart-axis-label" x="${x(i)}" y="${H-10}" text-anchor="middle">${svgEsc(lab)}</text>`);
  series.forEach(s=>{const points=s.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ');svg+=`<polyline class="${s.className}" points="${points}"/>`;s.values.forEach((v,i)=>{svg+=`<circle class="${s.pointClass}" cx="${x(i)}" cy="${y(v)}" r="3.5"/><text class="chart-value-label" x="${x(i)}" y="${Math.max(10,y(v)-8)}" text-anchor="middle">${svgEsc((s.valueFormatter||yFormatter)(v))}</text>`})});svg+='</svg>';el.innerHTML=svg;
}
function renderGroupedBarChart(id,labels,series,valueFormatter=v=>ptNum.format(v)){
  const el=document.getElementById(id);if(!el)return;const W=820,H=270,L=70,R=24,T=28,B=48,plotW=W-L-R,plotH=H-T-B;const all=series.flatMap(s=>s.values.map(Number));const max=Math.max(1,...all)*1.18;const groupW=plotW/Math.max(1,labels.length),gap=5,barW=Math.min(24,(groupW-16)/Math.max(1,series.length)-gap);let svg=`<svg viewBox="0 0 ${W} ${H}" role="img">`;
  for(let i=0;i<=4;i++){const val=max*(4-i)/4,yy=T+plotH*i/4;svg+=`<line class="chart-gridline" x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}"/><text class="chart-axis-label" x="${L-8}" y="${yy+3}" text-anchor="end">${svgEsc(valueFormatter(val))}</text>`}
  labels.forEach((lab,i)=>{const center=L+groupW*i+groupW/2;svg+=`<text class="chart-axis-label" x="${center}" y="${H-10}" text-anchor="middle">${svgEsc(lab)}</text>`;const totalW=series.length*barW+(series.length-1)*gap;series.forEach((s,j)=>{const v=Number(s.values[i]||0),h=(v/max)*plotH,x=center-totalW/2+j*(barW+gap),yy=T+plotH-h,fill=s.color?` style="fill:${s.color}"`:'';svg+=`<rect class="${s.className||''}" x="${x}" y="${yy}" width="${barW}" height="${h}" rx="3"${fill}/><text class="chart-value-label" x="${x+barW/2}" y="${Math.max(10,yy-5)}" text-anchor="middle">${svgEsc(valueFormatter(v))}</text>`})});svg+='</svg>';el.innerHTML=svg;
}
function renderDivergingBarChart(id,labels,values){
  const el=document.getElementById(id);if(!el)return;const W=720,H=260,L=56,R=20,T=18,B=48,plotW=W-L-R,plotH=H-T-B,max=Math.max(10,...values.map(v=>Math.abs(v)))*1.2,zeroY=T+plotH/2,groupW=plotW/Math.max(1,labels.length),barW=Math.min(46,groupW*.5);let svg=`<svg viewBox="0 0 ${W} ${H}">`;
  svg+=`<line class="chart-gridline" x1="${L}" y1="${zeroY}" x2="${W-R}" y2="${zeroY}"/>`;
  labels.forEach((lab,i)=>{const x=L+groupW*i+groupW/2,v=Number(values[i]||0),h=Math.abs(v)/max*(plotH/2-12),y=v>=0?zeroY-h:zeroY;svg+=`<rect class="${Math.abs(v)<.005?'bar-neutral':v>0?'bar-positive':'bar-negative'}" x="${x-barW/2}" y="${y}" width="${barW}" height="${h}" rx="4"/><text class="chart-value-label" x="${x}" y="${v>=0?Math.max(12,y-6):Math.min(H-B-4,y+h+12)}" text-anchor="middle">${svgEsc(`${v>=.005?'+':''}${fmtPct(v)}`)}</text><text class="chart-axis-label" x="${x}" y="${H-10}" text-anchor="middle">${svgEsc(lab)}</text>`});svg+='</svg>';el.innerHTML=svg;
}

// V19.2: temas independentes por perfil de loja, sempre com o tema original disponível.
const CHILLI_VISUAL_THEME_KEY='prognostico-v19-visual-vermelha'; // Compatível com a V19.1.
const CHILLI_OPTICA_THEME_KEY='prognostico-v19-visual-optica';
const SHARED_THEME_IDS=['pink-lemon','dark-chilli','neon-tokyo','vintage-sun','sun-rise','blue-ocean'];
const ALL_THEME_CLASSES=['theme-neon','theme-classico','theme-custom',...SHARED_THEME_IDS.map(id=>'theme-'+id)];
function selectedVisualTheme(storeType=state?.storeType||'vermelha'){
  const optical=storeType==='optica',fallback=optical?'original':'neon';
  try {
    const saved=localStorage.getItem(optical?CHILLI_OPTICA_THEME_KEY:CHILLI_VISUAL_THEME_KEY);
    return (optical?['original',...SHARED_THEME_IDS]:['classico','neon',...SHARED_THEME_IDS]).includes(saved)?saved:fallback;
  } catch {return fallback;}
}
function applyVisualTheme(storeType=state?.storeType||'vermelha',theme=selectedVisualTheme(storeType)){
  const selected=SHARED_THEME_IDS.includes(theme)?theme:(storeType==='optica'?'original':theme==='classico'?'classico':'neon');
  document.body.classList.remove(...ALL_THEME_CLASSES);
  document.body.classList.toggle('theme-classico',storeType==='vermelha'&&selected==='classico');
  document.body.classList.toggle('theme-neon',selected==='neon'||SHARED_THEME_IDS.includes(selected));
  document.body.classList.toggle('theme-custom',SHARED_THEME_IDS.includes(selected));
  if(SHARED_THEME_IDS.includes(selected))document.body.classList.add('theme-'+selected);
  document.body.dataset.visualTheme=selected;
  document.body.dataset.storeType=storeType;
  document.documentElement.style.colorScheme=['original','classico','pink-lemon','vintage-sun','sun-rise'].includes(selected)?'light':'dark';
  const themeMeta=document.querySelector('meta[name="theme-color"]');
  if(themeMeta){const colors={'pink-lemon':'#421d3b','dark-chilli':'#130d11','neon-tokyo':'#0b0c28','vintage-sun':'#393126','sun-rise':'#63344d','blue-ocean':'#072842',neon:'#0b0c16',classico:'#07111f',original:'#21130c'};themeMeta.content=colors[selected]||'#07111f'}
}
function themeRadioValueForStore(storeType=state?.storeType||'vermelha'){
  return storeType==='optica'?'original':'classico';
}
function showThemeChoiceFor(storeType){
  const optical=storeType==='optica';
  const original=document.querySelector('#visualThemeOriginal');
  if(original){original.value=themeRadioValueForStore(storeType);const label=original.closest('label');if(label){label.querySelector('strong').textContent=optical?'Original Ótica':'Clássico Vermelha';label.querySelector('small').textContent=optical?'Laranja e preto':'Azul e branco';}}
  document.querySelectorAll('.visual-theme-option[data-only="vermelha"]').forEach(item=>{item.hidden=optical;});
  const choice=document.querySelector('input[name="visualTheme"][value="'+selectedVisualTheme(storeType)+'"]');
  if(choice)choice.checked=true;
  const hint=document.getElementById('visualThemeHint');
  if(hint)hint.textContent=optical?'O tema Laranja original da Ótica continua disponível. Os seis temas especiais também funcionam nesta loja.':'O Clássico e o Chilli Neon continuam disponíveis, além dos seis novos temas.';
}
function saveVisualThemeChoice(storeType=state?.storeType||'vermelha'){
  const checked=document.querySelector('input[name="visualTheme"]:checked');
  const value=checked?.value||selectedVisualTheme(storeType);
  const key=storeType==='optica'?CHILLI_OPTICA_THEME_KEY:CHILLI_VISUAL_THEME_KEY;
  try{localStorage.setItem(key,value)}catch{}
  applyVisualTheme(storeType,value);
}
function applyStoreIdentity(){
  const optica=isOptica();document.body.dataset.storeType=optica?'optica':'vermelha';applyVisualTheme();
  const logo=document.getElementById('brandLogo');logo.src=optica?'assets/logo-otica.png':'assets/logo-vermelha.png';
  logo.alt=optica?'Óticas Chilli':'Chilli Beans — Loja Vermelha';
  document.getElementById('headerStoreType').textContent=optica?'Óticas Chilli':'Chilli Beans — Loja Vermelha';
  const icon=document.querySelector('link[rel="icon"]');if(icon)icon.href=optica?'assets/logo-otica.png':'assets/logo-vermelha.png';
  document.getElementById('sideRepLuxottica').textContent=fmtPct(rep(state.current.luxottica||0,state.current.revenue));
  document.getElementById('sidePml').textContent=ptMoney.format(priceMeanLens(state.current.lens,categoryPieces(state.current,'lens')));
}
function renderShell(){
  applyStoreIdentity();
  const cur=periodData(state.current.period),prev=periodData(state.previous.period);
  document.getElementById('sideStore').textContent=state.store;document.getElementById('headerStore').textContent=state.store;document.getElementById('brandStore').textContent=state.store.toUpperCase();document.getElementById('monthInput').value=state.current.period;document.getElementById('sidePeriod').textContent=`${cur.month} ${cur.year}`;document.getElementById('headerPeriod').textContent=`${cur.month} ${cur.year}`;document.getElementById('stripCurrentMonth').innerHTML=`${cur.month.toUpperCase()}<br>${cur.year}`;document.getElementById('stripPreviousMonth').innerHTML=`${prev.month.toUpperCase()}<br>${prev.year}`;document.getElementById('legendPrev').textContent=`${prev.month} ${prev.year}`;document.getElementById('legendCurrent').textContent=`${cur.month} ${cur.year}`;document.getElementById('sellerCountPill').textContent=`${state.sellers.length} de 10 vendedores`;document.getElementById('sideConversionGxl').textContent=fmtPct(gxlConversion(state.current));document.getElementById('sideRepLens').textContent=fmtPct(rep(state.current.lens,state.current.revenue));
}
function setActiveTab(tab){
  state.activeTab=tab;
  const liveShell=document.querySelector('body > .app-shell')||document;
  liveShell.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${tab}`));
  liveShell.querySelectorAll('.nav-btn[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  liveShell.querySelectorAll('.nav-menu').forEach(menu=>{
    menu.querySelector('.nav-group-trigger')?.classList.toggle('active',!!menu.querySelector(`.nav-subitem[data-tab="${tab}"]`));
  });
  closeNavMenus();
  saveState();
  requestAnimationFrame(()=>renderChartsForActive(tab));
}
function renderChartsForActive(tab){if(tab==='team')renderTeam();if(tab==='closing')renderClosing();if(tab==='operation')renderOperation();if(tab==='teamrx')renderTeamRx()}
function render(){renderShell();renderMetrics();renderOverviewSellers();renderOverviewCategories();renderCategoriesTab();renderShareLens();renderClosing();renderRanking();renderOperation();renderTeamRx();renderColumnChecks();renderSellerManager();renderTeam();renderDatabase();setActiveTab(state.activeTab||'overview');saveState()}


// ---------- Banco de Dados mensal — OneDrive/pasta do sistema + fallback IndexedDB ----------
const ARCHIVE_DB_NAME='prognostico-rede-toma-v18-offline';
const ARCHIVE_DB_VERSION=1;
const OFFLINE_ARCHIVES_KEY='prognostico-offline-archives-v1';
function offlineArchiveFallback(){try{const rows=JSON.parse(localStorage.getItem(OFFLINE_ARCHIVES_KEY)||'[]');return Array.isArray(rows)?rows:[]}catch{return []}}
const ARCHIVE_STORE='forecasts';
let archiveDbPromise=null;
let databaseRenderToken=0;
let fileArchiveApiAvailable=null;
let archiveMigrationAttempted=false;

function slugFileName(value){
  return String(value||'prognostico').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().replace(/ /g,'_').slice(0,90)||'prognostico';
}
function archiveIdFor(snapshot=state){
  const store=String(snapshot.store||'loja').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'loja';
  return `${store}__${snapshot.current?.period||'sem-periodo'}`;
}
function defaultArchiveTitle(snapshot=state){
  const d=periodData(snapshot.current?.period);
  return `Prognóstico de ${d.month||'Mês'} ${d.year||''}`.trim();
}
function formatArchiveDate(iso){
  if(!iso)return '—';
  try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso))}catch{return iso}
}

// IndexedDB permanece como fallback quando o app é aberto sem o servidor local.
function openArchiveDb(){
  if(archiveDbPromise)return archiveDbPromise;
  archiveDbPromise=new Promise((resolve,reject)=>{
    if(!('indexedDB' in window))return reject(new Error('IndexedDB indisponível'));
    const req=indexedDB.open(ARCHIVE_DB_NAME,ARCHIVE_DB_VERSION);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(ARCHIVE_STORE)){const store=db.createObjectStore(ARCHIVE_STORE,{keyPath:'id'});store.createIndex('period','period',{unique:false});store.createIndex('updatedAt','updatedAt',{unique:false})}};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('Falha ao abrir banco'));
  });
  return archiveDbPromise;
}
async function archivePutLocal(record){
  try{const db=await openArchiveDb();return await new Promise((resolve,reject)=>{const tx=db.transaction(ARCHIVE_STORE,'readwrite');tx.objectStore(ARCHIVE_STORE).put(record);tx.oncomplete=()=>resolve(record);tx.onerror=()=>reject(tx.error)})}
  catch(err){const rows=offlineArchiveFallback();const i=rows.findIndex(r=>r.id===record.id);if(i>=0)rows[i]=record;else rows.push(record);localStorage.setItem(OFFLINE_ARCHIVES_KEY,JSON.stringify(rows));return record}
}
async function archiveGetLocal(id){try{const db=await openArchiveDb();return await new Promise((resolve,reject)=>{const req=db.transaction(ARCHIVE_STORE,'readonly').objectStore(ARCHIVE_STORE).get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}catch{return offlineArchiveFallback().find(r=>r.id===id)||null}}
async function archiveDeleteLocal(id){try{const db=await openArchiveDb();await new Promise((resolve,reject)=>{const tx=db.transaction(ARCHIVE_STORE,'readwrite');tx.objectStore(ARCHIVE_STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}catch{}localStorage.setItem(OFFLINE_ARCHIVES_KEY,JSON.stringify(offlineArchiveFallback().filter(r=>r.id!==id)))}
async function archiveAllLocal(){try{const db=await openArchiveDb();const dbRows=await new Promise((resolve,reject)=>{const req=db.transaction(ARCHIVE_STORE,'readonly').objectStore(ARCHIVE_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)});return [...new Map([...offlineArchiveFallback(),...dbRows].map(r=>[r.id,r])).values()]}catch{return offlineArchiveFallback()}}

function utf8ToBase64(text){
  const bytes=new TextEncoder().encode(String(text));let binary='';const step=0x8000;
  for(let i=0;i<bytes.length;i+=step)binary+=String.fromCharCode(...bytes.subarray(i,i+step));
  return btoa(binary);
}
async function checkFileArchiveApi(force=false){
  if(window.CloudForecast){fileArchiveApiAvailable=false;updateDatabaseStorageUi();return false;}
  if(fileArchiveApiAvailable!==null&&!force)return fileArchiveApiAvailable;
  if(location.protocol==='file:'){fileArchiveApiAvailable=false;return false}
  try{
    const r=await fetch('./api/storage-info',{cache:'no-store'});
    if(!r.ok)throw new Error('API indisponível');
    const info=await r.json();
    fileArchiveApiAvailable=info?.mode==='folder'&&info?.writable===true;
    window.__prognosticoStorageInfo=info;
  }catch{fileArchiveApiAvailable=false}
  updateDatabaseStorageUi();
  return fileArchiveApiAvailable;
}
async function archivePutFile(record){
  const body=utf8ToBase64(JSON.stringify(record));
  const r=await fetch('./api/archive',{method:'POST',headers:{'Content-Type':'text/plain;charset=us-ascii'},body,cache:'no-store'});
  if(!r.ok)throw new Error('Falha ao gravar na pasta do sistema');
  return r.json();
}
async function archiveGetFile(id){
  const r=await fetch(`./api/archive?id=${encodeURIComponent(id)}`,{cache:'no-store'});
  if(r.status===404)return null;if(!r.ok)throw new Error('Falha ao ler banco da pasta');return r.json();
}
async function archiveDeleteFile(id){
  const r=await fetch(`./api/archive?id=${encodeURIComponent(id)}`,{method:'DELETE',cache:'no-store'});
  if(!r.ok)throw new Error('Falha ao excluir no banco da pasta');
}
async function archiveAllFile(){
  const r=await fetch('./api/archives',{cache:'no-store'});if(!r.ok)throw new Error('Falha ao listar banco da pasta');
  const rows=await r.json();if(!Array.isArray(rows))return [];
  const latest=new Map();for(const row of rows){if(!row?.id)continue;const old=latest.get(row.id);if(!old||String(row.updatedAt||'')>=String(old.updatedAt||''))latest.set(row.id,row)}
  return [...latest.values()];
}

async function archivePut(record){
  if(window.CloudForecast){if(!window.CloudForecast.ready())throw new Error('Entre no Prognóstico Cloud antes de salvar.');return window.CloudForecast.archivePut(record);}
  // Offline: salvar somente no dispositivo.
  return archivePutLocal(record);
}
async function archiveGet(id){
  if(window.CloudForecast){if(!window.CloudForecast.ready())return null;return window.CloudForecast.archiveGet(id);}
  // Offline: ler somente do dispositivo.
  return archiveGetLocal(id);
}
async function archiveDelete(id){
  if(window.CloudForecast){if(!window.CloudForecast.ready())throw new Error('Entre no Prognóstico Cloud.');return window.CloudForecast.archiveDelete(id);}
  // Offline: excluir somente neste dispositivo.
  return archiveDeleteLocal(id);
}
async function archiveAll(){
  if(window.CloudForecast){if(!window.CloudForecast.ready())return [];const rows=await window.CloudForecast.archiveAll();return (rows||[]).sort((a,b)=>String(b.period||'').localeCompare(String(a.period||''))||String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));}
  const rows=await archiveAllLocal();
  return (rows||[]).sort((a,b)=>String(b.period||'').localeCompare(String(a.period||''))||String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
}

async function migrateBrowserArchiveToFolder(){
  if(window.CloudForecast)return;
  if(archiveMigrationAttempted)return;
  archiveMigrationAttempted=true;
  if(!(await checkFileArchiveApi()))return;
  try{
    const local=await archiveAllLocal();
    if(!local.length)return;
    const remote=await archiveAllFile();
    const byId=new Map(remote.map(r=>[r.id,r]));
    let copied=0;
    for(const row of local){
      const old=byId.get(row.id);
      if(!old||String(row.updatedAt||'')>String(old.updatedAt||'')){await archivePutFile(row);copied++}
    }
    if(copied)toast(`${copied} prognóstico(s) antigo(s) migrado(s) para a pasta sincronizada.`);
  }catch(err){console.warn('Migração do banco local ignorada',err)}
}

function updateDatabaseStorageUi(){
  const mode=document.getElementById('dbStorageMode'),detail=document.getElementById('dbStorageDetail'),note=document.getElementById('databaseStorageNote');
  if(!mode)return;
  if(window.CloudForecast){
    mode.textContent='Banco Online';
    if(detail)detail.textContent=window.CloudForecast.describeStorage?.()||'Dados locais de testes';
    if(note)note.innerHTML='<strong>Teste offline:</strong> os dados são separados por loja e mês apenas neste navegador. Sem segurança de produção; exporte backups regularmente.';
    return;
  }
  const folder=fileArchiveApiAvailable===true;
  mode.textContent='Banco Online';
  if(detail)detail.textContent='Registros protegidos por loja e usuário';
  if(note)note.innerHTML='<strong>Banco online:</strong> dados centralizados e separados por loja. Gerentes acessam somente a loja vinculada; Supervisor e Franqueado visualizam todas.';
}

async function saveForecastSnapshot(options={}){
  saveState();
  const now=new Date().toISOString(),id=archiveIdFor(state);
  const existing=await archiveGet(id).catch(()=>null);
  const snapshot=clone(state);snapshot.activeTab='overview';snapshot.version=15;
  const cloudStore=window.CloudForecast?.ready()?window.CloudForecast.cloudStoreName():snapshot.store;snapshot.store=cloudStore||snapshot.store;const record={id,title:existing?.title||defaultArchiveTitle(snapshot),store:snapshot.store,period:snapshot.current.period,createdAt:existing?.createdAt||now,updatedAt:now,snapshot};
  await archivePut(record);
  renderDatabase();
  if(!options.silent)toast(`${record.title} salvo no Banco de Dados`);
  return record;
}

async function renderDatabase(){
  const body=document.getElementById('databaseTableBody');if(!body)return;
  const token=++databaseRenderToken;
  try{
    const records=await archiveAll();if(token!==databaseRenderToken)return;
    const search=(document.getElementById('databaseSearch')?.value||'').trim().toLowerCase();
    const filtered=records.filter(r=>!search||`${r.title} ${r.store} ${periodDisplay(r.period)} ${periodData(r.period).month}`.toLowerCase().includes(search));
    document.getElementById('dbTotalRecords').textContent=ptInt.format(records.length);
    const latest=[...records].sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))[0];
    document.getElementById('dbLatestTitle').textContent=latest?.title||'—';document.getElementById('dbLatestDate').textContent=latest?formatArchiveDate(latest.updatedAt):'Nenhum salvamento';
    const cur=periodData(state.current.period);document.getElementById('dbCurrentPeriod').textContent=`${cur.month} ${cur.year}`;document.getElementById('dbCurrentStore').textContent=state.store;
    body.innerHTML=filtered.map(r=>{const s=r.snapshot||{},cur=s.current||{},prev=s.previous||{},ach=achievement(cur.revenue,cur.target),growth=variation(cur.revenue,prev.revenue);return `<tr><td><div class="db-file-name"><span class="db-file-icon">▤</span><div><strong>${escapeHtml(r.title)}</strong><small>ID: ${escapeHtml(r.id)}</small></div></div></td><td><strong>${escapeHtml(periodDisplay(r.period))}</strong><small>${escapeHtml(periodData(r.period).month)} ${periodData(r.period).year}</small></td><td>${escapeHtml(r.store||'')}</td><td>${ptMoney.format(cur.target||0)}</td><td><strong>${ptMoney.format(cur.revenue||0)}</strong><small class="${variationClass(growth)}">${growth>=.005?'+':''}${fmtPct(growth)} vs ano anterior</small></td><td><span class="db-achievement ${goalClass(ach)}">${fmtPct(ach)}</span></td><td>${formatArchiveDate(r.updatedAt)}</td><td><div class="db-actions"><button onclick="openArchiveRecord('${r.id}')" class="db-action primary">Abrir</button><button onclick="renameArchiveRecord('${r.id}')" class="db-action">Renomear</button><button onclick="exportArchiveExcel('${r.id}')" class="db-action excel">Excel</button><button onclick="openPdfExportOptions('${r.id}')" class="db-action pdf">PDF</button><button onclick="deleteArchiveRecord('${r.id}')" class="db-action danger">Excluir</button></div></td></tr>`}).join('');
    document.getElementById('databaseEmpty').style.display=filtered.length?'none':'grid';
    document.querySelector('.database-table-wrap').style.display=filtered.length?'block':'none';
  }catch(err){body.innerHTML='<tr><td colspan="8" class="empty-row">Não foi possível abrir o banco da pasta. No Mac, abra pelo INICIAR_PROGNOSTICO_MAC.command.</td></tr>';console.error(err)}
}

async function openArchiveRecord(id){
  const record=await archiveGet(id);if(!record)return toast('Arquivo não encontrado');
  if(!confirm(`Abrir "${record.title}"? Os dados atuais da tela serão substituídos pela versão salva.`))return;
  state=migrateState(record.snapshot);state.activeTab='overview';saveState();render();toast(`${record.title} carregado`);
}
async function renameArchiveRecord(id){
  const record=await archiveGet(id);if(!record)return;
  const title=prompt('Novo nome do arquivo salvo:',record.title);if(title===null)return;
  const clean=title.trim().replace(/\s+/g,' ');if(!clean)return toast('Informe um nome para o arquivo');
  record.title=clean;record.updatedAt=new Date().toISOString();await archivePut(record);renderDatabase();toast(`Arquivo renomeado para ${clean}`);
}
async function deleteArchiveRecord(id){
  const record=await archiveGet(id);if(!record)return;
  if(!confirm(`Excluir definitivamente "${record.title}" do Banco de Dados?`))return;
  await archiveDelete(id);renderDatabase();toast('Arquivo excluído do Banco de Dados');
}
window.openArchiveRecord=openArchiveRecord;window.renameArchiveRecord=renameArchiveRecord;window.deleteArchiveRecord=deleteArchiveRecord;

// ---------- Exportação Excel (.xlsx) sem dependências externas ----------
const utf8Encoder=new TextEncoder();
function xmlEscapeValue(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function colLetter(n){let s='';for(n++;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s}
function xlsxCell(v,row,col,style=0){const ref=`${colLetter(col)}${row}`;if(typeof v==='number'&&Number.isFinite(v))return `<c r="${ref}" s="${style}"><v>${v}</v></c>`;return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEscapeValue(v)}</t></is></c>`}
function xlsxSheetXml(rows,widths=[]){let body='';rows.forEach((row,i)=>{body+=`<row r="${i+1}">`;row.forEach((cell,j)=>{const c=(cell&&typeof cell==='object'&&!Array.isArray(cell))?cell:{v:cell};body+=xlsxCell(c.v,i+1,j,c.s||0)});body+='</row>'});const cols=widths.length?`<cols>${widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')}</cols>`:'';return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>${body}</sheetData></worksheet>`}
function crc32(bytes){if(!crc32.table){crc32.table=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0})}let c=0xffffffff;for(const b of bytes)c=crc32.table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function u16(n){return new Uint8Array([n&255,(n>>>8)&255])}function u32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}
function concatBytes(parts){const len=parts.reduce((a,p)=>a+p.length,0),out=new Uint8Array(len);let off=0;parts.forEach(p=>{out.set(p,off);off+=p.length});return out}
function zipStore(files){const locals=[],centrals=[];let offset=0;const now=new Date(),dosTime=((now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1))&0xffff,dosDate=(((now.getFullYear()-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate())&0xffff;for(const [name,dataValue] of Object.entries(files)){const nameB=utf8Encoder.encode(name),data=dataValue instanceof Uint8Array?dataValue:utf8Encoder.encode(dataValue),crc=crc32(data);const local=concatBytes([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(dosTime),u16(dosDate),u32(crc),u32(data.length),u32(data.length),u16(nameB.length),u16(0),nameB,data]);locals.push(local);const central=concatBytes([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(dosTime),u16(dosDate),u32(crc),u32(data.length),u32(data.length),u16(nameB.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nameB]);centrals.push(central);offset+=local.length}const centralBytes=concatBytes(centrals),end=concatBytes([u32(0x06054b50),u16(0),u16(0),u16(centrals.length),u16(centrals.length),u32(centralBytes.length),u32(offset),u16(0)]);return concatBytes([...locals,centralBytes,end])}
function xlsxRowsForRecord(record){const s=record.snapshot,c=s.current,p=s.previous;const rowsResumo=[[{v:record.title,s:1}],['Loja',s.store],['Período',periodDisplay(c.period)],['Última alteração',formatArchiveDate(record.updatedAt)],[],[{v:'RESUMO EXECUTIVO',s:2},'Valor'],['Meta', {v:c.target,s:3}],['Realizado',{v:c.revenue,s:3}],['Crescimento vs ano anterior',{v:variation(c.revenue,p.revenue)/100,s:4}],['Atingimento da meta',{v:achievement(c.revenue,c.target)/100,s:4}],['Conversão',{v:conversion(c.sales,c.attend)/100,s:4}],['P.A.',{v:pa(c.pieces,c.sales),s:6}],['Ticket médio',{v:ticket(c.revenue,c.sales),s:3}],['Atendimentos',c.attend],['Vendas',c.sales],['REP Relógio',{v:rep(c.watch,c.revenue)/100,s:4}],['REP Lentes',{v:rep(c.lens,c.revenue)/100,s:4}],[],[{v:'CATEGORIAS',s:2},'Peças','Valor','Representatividade','Variação vs ano anterior']];activeCategoryDefs().forEach(d=>rowsResumo.push([d.label,categoryPieces(c,d.key),{v:categoryValue(c,d.key),s:3},{v:rep(categoryValue(c,d.key),c.revenue)/100,s:4},{v:variation(categoryValue(c,d.key),categoryValue(p,d.key))/100,s:4}]));
 const equipe=[[{v:'EQUIPE',s:1}],[{v:'Vendedor',s:2},{v:'Perfil',s:2},{v:'Faturamento',s:2},{v:'Meta',s:2},{v:'Atingimento',s:2},{v:'Crescimento',s:2},{v:'Conversão',s:2},{v:'P.A.',s:2},{v:'Ticket',s:2},{v:'REP Relógio',s:2},{v:'REP Solar',s:2},{v:'Grau + Lente',s:2},{v:'Chilli Seguro',s:2},{v:'70/30',s:2}]];s.sellers.forEach(v=>equipe.push([v.name,profileDefs[v.profile]?.label||'',{v:v.current.revenue,s:3},{v:v.current.target,s:3},{v:achievement(v.current.revenue,v.current.target)/100,s:4},{v:variation(v.current.revenue,v.previous.revenue)/100,s:4},{v:conversion(v.sales,v.attend)/100,s:4},{v:pa(v.pieces,v.sales),s:6},{v:ticket(v.current.revenue,v.sales),s:3},{v:rep(v.current.watch,v.current.revenue)/100,s:4},{v:rep(v.current.solar,v.current.revenue)/100,s:4},{v:v.current.degreeLens,s:3},v.chilliSeguro,{v:rep(v.current.revenue,c.revenue)/100,s:4}]));
 const categorias=[[{v:'FECHAMENTO POR CATEGORIA',s:1}],[{v:'Categoria',s:2},{v:'Peças anterior',s:2},{v:'Valor anterior',s:2},{v:'Peças atual',s:2},{v:'Valor atual',s:2},{v:'Var. peças',s:2},{v:'Var. faturamento',s:2},{v:'REP atual',s:2}]];activeCategoryDefs().forEach(d=>categorias.push([d.label,categoryPieces(p,d.key),{v:categoryValue(p,d.key),s:3},categoryPieces(c,d.key),{v:categoryValue(c,d.key),s:3},{v:variation(categoryPieces(c,d.key),categoryPieces(p,d.key))/100,s:4},{v:variation(categoryValue(c,d.key),categoryValue(p,d.key))/100,s:4},{v:rep(categoryValue(c,d.key),c.revenue)/100,s:4}]));
 const share=s.shareLens||defaultState.shareLens,totalLens=categoryPieces(c,'lens'),shareRows=[[{v:'SHARE DE LENTE',s:1}],[{v:'Tipo',s:2},{v:'Qtd',s:2},{v:'Faturamento',s:2},{v:'% das lentes',s:2},{v:'Preço médio',s:2}]];[['Multifocal',share.types?.multifocal],['Visão simples',share.types?.single]].forEach(([label,r])=>{const q=Number(r?.qty||0),rev=Number(r?.revenue||0);shareRows.push([label,q,{v:rev,s:3},{v:safeDiv(q,totalLens),s:4},{v:ticket(rev,q),s:3}])});shareRows.push([], [{v:'SHARE POR LABORATÓRIO',s:2}],[{v:'Laboratório',s:2},{v:'Qtd',s:2},{v:'%',s:2}]);const labs=share.labs||{},labTotal=Object.values(labs).reduce((a,b)=>a+Number(b||0),0);Object.entries(labs).forEach(([name,q])=>shareRows.push([name,Number(q||0),{v:safeDiv(q,labTotal),s:4}]));
 const op=s.operation||defaultState.operation,crm=op.crm360||defaultState.operation.crm360,oto=op.oto||defaultState.operation.oto;const raio=[[{v:'RAIO X DA OPERAÇÃO',s:1}],[{v:'CRM360',s:2},'Valor','Tickets'],['Bônus gerado',{v:crm.generated?.amount||0,s:3},crm.generated?.tickets||0],['Bônus resgatado',{v:crm.redeemed?.amount||0,s:3},crm.redeemed?.tickets||0],['Bônus perdido',{v:crm.lost?.amount||0,s:3},crm.lost?.tickets||0],['Bônus a vencer',{v:crm.expiring?.amount||0,s:3},crm.expiring?.tickets||0],['Venda base',{v:crm.salesBase||0,s:3}],['Taxa retorno',{v:Number(crm.returnRate||0)/100,s:4}],[],[{v:'OTO',s:2},'Valor'],['Receita atribuída',{v:oto.revenue||0,s:3}],['Vendas atribuídas',oto.sales||0],['Contatos realizados',oto.contacts||0],['Receita por contato',{v:ticket(oto.revenue,oto.contacts),s:3}],['Taxa de conversão',{v:Number(oto.conversion||0)/100,s:4}],['Ticket médio',{v:ticket(oto.revenue,oto.sales),s:3}],['Janela de conversão (dias)',oto.windowDays||0],[],[{v:'DESAFIOS',s:2}],...((op.challenges||[]).map(x=>[x])),[],[{v:'ACERTOS',s:2}],...((op.wins||[]).map(x=>[x])),[],[{v:'OBSERVAÇÕES DO GESTOR',s:2}],[op.notes||'']];
 const team=s.teamRx||defaultState.teamRx,teamRows=[[{v:'RAIO X DO TIME',s:1}],['Engajamento',{v:Number(team.engagement||0)/100,s:4}],['Execução',{v:Number(team.execution||0)/100,s:4}],['Conversão média',{v:teamConversionSnapshot(s)/100,s:4}],['P.A. médio',{v:teamPASnapshot(s),s:6}],[],[{v:'PONTOS FORTES',s:2}],...((team.strengths||[]).map(x=>[x])),[],[{v:'PONTOS DE ATENÇÃO',s:2}],...((team.attention||[]).map(x=>[x])),[],[{v:'TREINAMENTOS',s:2},'Data','Concluído'],...((team.trainings||[]).map(t=>[t.text,t.date||'',t.done?'Sim':'Não'])),[],[{v:'EVOLUÇÃO INDIVIDUAL',s:2},'Desafio','Próximo passo','Status']];s.sellers.forEach(v=>{const i=team.individual?.[v.name]||{};teamRows.push([v.name,i.challenge||'',i.next||'',i.status||''])});teamRows.push([], [{v:'OBSERVAÇÕES DO GESTOR',s:2}],[team.notes||'']);
 return [{name:'Resumo',rows:rowsResumo,widths:[30,22,20,20,22]},{name:'Equipe',rows:equipe,widths:[22,14,18,18,16,16,16,12,18,16,16,18,14,14]},{name:'Categorias',rows:categorias,widths:[20,16,20,16,20,16,18,16]},{name:'Share de Lente',rows:shareRows,widths:[28,14,20,16,20]},{name:'Raio X Operação',rows:raio,widths:[46,22,16]},{name:'Raio X Time',rows:teamRows,widths:[42,28,42,18]}]}
function teamConversionSnapshot(s){const sales=(s.sellers||[]).reduce((a,v)=>a+Number(v.sales||0),0),att=(s.sellers||[]).reduce((a,v)=>a+Number(v.attend||0),0);return conversion(sales,att)}
function teamPASnapshot(s){const pieces=(s.sellers||[]).reduce((a,v)=>a+Number(v.pieces||0),0),sales=(s.sellers||[]).reduce((a,v)=>a+Number(v.sales||0),0);return pa(pieces,sales)}
function buildXlsxBytes(record){const sheets=xlsxRowsForRecord(record);const files={};files['[Content_Types].xml']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;files['_rels/.rels']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;files['xl/workbook.xml']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((sh,i)=>`<sheet name="${xmlEscapeValue(sh.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets></workbook>`;files['xl/_rels/workbook.xml.rels']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;files['xl/styles.xml']=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="R$ #,##0.00"/><numFmt numFmtId="165" formatCode="0.00%"/></numFmts><fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="12"/><name val="Calibri"/></font><font><b/><color rgb="FF0B1F35"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B1F35"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDDEBFF"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFD7E1EC"/></left><right style="thin"><color rgb="FFD7E1EC"/></right><top style="thin"><color rgb="FFD7E1EC"/></top><bottom style="thin"><color rgb="FFD7E1EC"/></bottom></border></borders><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="3" borderId="1" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="1" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="1" applyNumberFormat="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1"/><xf numFmtId="2" fontId="0" fillId="0" borderId="1" applyNumberFormat="1"/></cellXfs></styleSheet>`;sheets.forEach((sh,i)=>files[`xl/worksheets/sheet${i+1}.xml`]=xlsxSheetXml(sh.rows,sh.widths));return zipStore(files)}
function downloadBytes(bytes,filename,type){const blob=new Blob([bytes],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
async function exportArchiveExcel(id){const record=await archiveGet(id);if(!record)return;try{downloadBytes(buildXlsxBytes(record),`${slugFileName(record.title)}.xlsx`,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');toast('Excel editável gerado')}catch(err){console.error(err);toast('Não foi possível gerar o Excel')}}
window.exportArchiveExcel=exportArchiveExcel;

// ---------- Exportação PDF ----------
function pdfClean(v){return String(v??'').replace(/[–—]/g,'-').replace(/“|”/g,'"').replace(/’/g,"'").replace(/[^\x00-\xFF]/g,'?')}
function pdfEscape(v){return pdfClean(v).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')}
function pdfWrap(text,max=88){const words=pdfClean(text).split(/\s+/),out=[];let line='';for(const w of words){const n=line?`${line} ${w}`:w;if(n.length>max&&line){out.push(line);line=w}else line=n}if(line)out.push(line);return out.length?out:['']}
function buildPdfLines(record){const s=record.snapshot,c=s.current,p=s.previous,op=s.operation||{},crm=op.crm360||{},oto=op.oto||{},team=s.teamRx||{};const L=[];const title=t=>L.push({t,kind:'section'}),line=t=>pdfWrap(t).forEach(x=>L.push({t:x,kind:'line'}));L.push({t:record.title,kind:'title'});line(`Loja: ${s.store} | Periodo: ${periodDisplay(c.period)} | Salvo em: ${formatArchiveDate(record.updatedAt)}`);title('RESUMO EXECUTIVO');line(`Meta: ${ptMoney.format(c.target)} | Realizado: ${ptMoney.format(c.revenue)} | Atingimento: ${fmtPct(achievement(c.revenue,c.target))}`);line(`Crescimento vs ano anterior: ${variation(c.revenue,p.revenue)>=.005?'+':''}${fmtPct(variation(c.revenue,p.revenue))} | Ticket medio: ${ptMoney.format(ticket(c.revenue,c.sales))} | P.A.: ${ptNum.format(pa(c.pieces,c.sales))}`);line(`Conversao: ${fmtPct(conversion(c.sales,c.attend))} | REP Relogio: ${fmtPct(rep(c.watch,c.revenue))} | REP Lentes: ${fmtPct(rep(c.lens,c.revenue))}`);title('CATEGORIAS');activeCategoryDefs().forEach(d=>line(`${d.label}: ${ptInt.format(categoryPieces(c,d.key))} pecas | ${ptMoney.format(categoryValue(c,d.key))} | REP ${fmtPct(rep(categoryValue(c,d.key),c.revenue))} | Var. ${variation(categoryValue(c,d.key),categoryValue(p,d.key))>=.005?'+':''}${fmtPct(variation(categoryValue(c,d.key),categoryValue(p,d.key)))}`));title('EQUIPE');(s.sellers||[]).forEach(v=>line(`${v.name} - ${ptMoney.format(v.current.revenue)} | Meta ${fmtPct(achievement(v.current.revenue,v.current.target))} | 70/30 ${fmtPct(rep(v.current.revenue,c.revenue))} | Relogio ${fmtPct(rep(v.current.watch,v.current.revenue))} | G+L ${fmtPct(rep(v.current.degreeLens,v.current.revenue))}`));title('SHARE DE LENTE');const share=s.shareLens||{};Object.entries(share.types||{}).forEach(([_,r])=>line(`${r.label}: ${r.qty||0} un. | ${ptMoney.format(r.revenue||0)} | Preco medio ${ptMoney.format(ticket(r.revenue,r.qty))}`));line(`Laboratorios: ${Object.entries(share.labs||{}).map(([n,q])=>`${n} ${q}`).join(' | ')}`);title('CRM360');line(`Bonus gerado: ${ptMoney.format(crm.generated?.amount||0)} (${crm.generated?.tickets||0} tickets) | Resgatado: ${ptMoney.format(crm.redeemed?.amount||0)} (${crm.redeemed?.tickets||0})`);line(`Bonus perdido: ${ptMoney.format(crm.lost?.amount||0)} (${crm.lost?.tickets||0}) | A vencer: ${ptMoney.format(crm.expiring?.amount||0)} (${crm.expiring?.tickets||0})`);title('RAIO X OTO');line(`Receita atribuida: ${ptMoney.format(oto.revenue||0)} | Vendas: ${oto.sales||0} | Contatos: ${oto.contacts||0} | Conversao: ${fmtPct(oto.conversion||0)} | Ticket medio: ${ptMoney.format(ticket(oto.revenue,oto.sales))}`);title('DIAGNOSTICO DA OPERACAO');line(`Oportunidade: ${op.opportunity||''} | Nivel de execucao: ${fmtPct(op.execution||0)}`);(op.challenges||[]).forEach(x=>line(`Desafio: ${x}`));(op.wins||[]).forEach(x=>line(`Acerto: ${x}`));if(op.notes)line(`Observacoes: ${op.notes}`);title('RAIO X DO TIME');line(`Engajamento: ${fmtPct(team.engagement||0)} | Execucao: ${fmtPct(team.execution||0)}`);(team.strengths||[]).forEach(x=>line(`Ponto forte: ${x}`));(team.attention||[]).forEach(x=>line(`Ponto de atencao: ${x}`));if(team.notes)line(`Observacoes do gestor: ${team.notes}`);return L}
function latin1Bytes(str){const out=new Uint8Array(str.length);for(let i=0;i<str.length;i++)out[i]=str.charCodeAt(i)&255;return out}
function buildForecastPdfBytes(record){const lines=buildPdfLines(record),pages=[];let current=[];let y=790;for(const item of lines){const need=item.kind==='title'?32:item.kind==='section'?24:14;if(y-need<55){pages.push(current);current=[];y=790}current.push({...item,y});y-=need}if(current.length)pages.push(current);const objs=[];objs[1]='<< /Type /Catalog /Pages 2 0 R >>';const pageIds=[];let next=5;pages.forEach(()=>{pageIds.push(next);next+=2});objs[2]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;objs[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';objs[4]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';pages.forEach((page,idx)=>{const pageId=pageIds[idx],contentId=pageId+1;let stream='0.06 0.13 0.23 rg 0 810 595 32 re f\n';stream+=`BT /F2 9 Tf 1 1 1 rg 40 821 Td (PROGNOSTICO MENSAL REDE TOMA - ${pdfEscape(periodDisplay(record.period))}) Tj ET\n`;page.forEach(item=>{const isTitle=item.kind==='title',isSection=item.kind==='section',font=isTitle?'/F2 18':isSection?'/F2 11':'/F1 9',color=isTitle?'0.04 0.12 0.22':isSection?'0.05 0.36 0.78':'0.15 0.20 0.28';if(isSection)stream+=`0.88 0.93 0.99 rg 36 ${item.y-5} 523 19 re f\n`;stream+=`BT ${font} Tf ${color} rg 40 ${item.y} Td (${pdfEscape(item.t)}) Tj ET\n`});stream+=`BT /F1 7 Tf 0.45 0.5 0.58 rg 40 28 Td (Gerado pelo Banco de Dados do Prognostico Mensal Rede Toma - pagina ${idx+1}/${pages.length}) Tj ET`;objs[pageId]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;objs[contentId]=`<< /Length ${latin1Bytes(stream).length} >>\nstream\n${stream}\nendstream`});let pdf='%PDF-1.4\n%âãÏÓ\n',offsets=[0];for(let i=1;i<objs.length;i++){offsets[i]=latin1Bytes(pdf).length;pdf+=`${i} 0 obj\n${objs[i]}\nendobj\n`}const xref=latin1Bytes(pdf).length;pdf+=`xref\n0 ${objs.length}\n0000000000 65535 f \n`;for(let i=1;i<objs.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;pdf+=`trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return latin1Bytes(pdf)}
async function exportArchivePdf(id){const record=await archiveGet(id);if(!record)return;try{downloadBytes(buildForecastPdfBytes(record),`${slugFileName(record.title)}.pdf`,'application/pdf');toast('PDF do prognóstico gerado')}catch(err){console.error(err);toast('Não foi possível gerar o PDF')}}

// ---------- PDF Espelho das telas ----------
const mirrorTabOrder=['overview','team','categories','share','closing','ranking','operation','teamrx'];
const mirrorTabLabels={overview:'Visão Geral',team:'Equipe',categories:'Categorias',share:'Share de Lente',closing:'Fechamento',ranking:'Ranking',operation:'Raio X da Operação',teamrx:'Raio X do Time'};
let pendingPdfArchiveId=null;
let mirrorCleanupTimer=null;
const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
function syncCloneFormState(source,clone){
  const sourceFields=source.querySelectorAll('input,textarea,select');
  const cloneFields=clone.querySelectorAll('input,textarea,select');
  sourceFields.forEach((el,i)=>{const c=cloneFields[i];if(!c)return;if(el instanceof HTMLInputElement){c.value=el.value;c.setAttribute('value',el.value);if(el.type==='checkbox'||el.type==='radio'){c.checked=el.checked;if(el.checked)c.setAttribute('checked','checked');else c.removeAttribute('checked')}}else if(el instanceof HTMLTextAreaElement){c.value=el.value;c.textContent=el.value}else if(el instanceof HTMLSelectElement){c.value=el.value;Array.from(c.options).forEach(o=>{if(o.value===el.value)o.setAttribute('selected','selected');else o.removeAttribute('selected')})}});
}
function cleanupMirrorPrint(){
  if(mirrorCleanupTimer){clearTimeout(mirrorCleanupTimer);mirrorCleanupTimer=null}
  document.body.classList.remove('mirror-print-mode');
  const root=document.getElementById('mirrorPrintRoot');if(root){root.innerHTML='';root.setAttribute('aria-hidden','true')}
}
async function buildMirrorPagesForRecord(record){
  const root=document.getElementById('mirrorPrintRoot');
  const originalState=clone(state);
  const originalTitle=document.title;
  const originalScroll={x:window.scrollX,y:window.scrollY};
  root.innerHTML='';root.setAttribute('aria-hidden','false');
  suppressPersistence=true;
  try{
    state=migrateState(record.snapshot);state.activeTab='overview';render();
    await nextFrame();
    if(document.fonts?.ready)try{await document.fonts.ready}catch{}
    const shell=document.querySelector('body > .app-shell');
    const mirrorFragment=document.createDocumentFragment();
    for(let i=0;i<mirrorTabOrder.length;i++){
      const tab=mirrorTabOrder[i];
      setActiveTab(tab);
      await nextFrame();
      await new Promise(r=>setTimeout(r,120));
      const pendingImages=[...shell.querySelectorAll('img')].filter(img=>!img.complete);
      if(pendingImages.length)await Promise.race([Promise.all(pendingImages.map(img=>new Promise(res=>{img.addEventListener('load',res,{once:true});img.addEventListener('error',res,{once:true})}))),new Promise(res=>setTimeout(res,1500))]);
      const width=Math.ceil(Math.max(shell.getBoundingClientRect().width,shell.scrollWidth,1280));
      const height=Math.ceil(Math.max(shell.getBoundingClientRect().height,shell.scrollHeight,720));
      const cloneShell=shell.cloneNode(true);
      cloneShell.classList.add('mirror-clone-shell');
      syncCloneFormState(shell,cloneShell);
      cloneShell.querySelectorAll('.view').forEach(v=>{if(!v.classList.contains('active'))v.remove()});
      cloneShell.querySelectorAll('dialog,.toast').forEach(el=>el.remove());
      cloneShell.style.width=`${width}px`;cloneShell.style.minWidth=`${width}px`;cloneShell.style.minHeight=`${height}px`;cloneShell.style.height='auto';
      const page=document.createElement('section');
      page.className='mirror-print-page';
      page.dataset.tab=tab;
      page.dataset.label=mirrorTabLabels[tab]||tab;
      page.style.setProperty('--mirror-source-width',String(width));
      page.style.setProperty('--mirror-source-height',String(height));
      const targetW=1536,targetH=864;
      const scale=Math.min(targetW/width,targetH/height);
      const stage=document.createElement('div');stage.className='mirror-print-stage';stage.style.width=`${width}px`;stage.style.height=`${height}px`;stage.style.transform=`scale(${scale})`;
      stage.appendChild(cloneShell);page.appendChild(stage);mirrorFragment.appendChild(page);
      toast(`Preparando PDF Espelho ${i+1}/${mirrorTabOrder.length}: ${mirrorTabLabels[tab]}`);
    }
    state=originalState;render();await nextFrame();
    root.appendChild(mirrorFragment);
    document.title=`${record.title} - Espelho das Telas`;
    document.body.classList.add('mirror-print-mode');
    window.scrollTo(0,0);
    const restore=()=>{document.title=originalTitle;window.scrollTo(originalScroll.x,originalScroll.y);cleanupMirrorPrint();window.removeEventListener('afterprint',restore)};
    window.addEventListener('afterprint',restore);
    mirrorCleanupTimer=setTimeout(restore,120000);
    await new Promise(r=>setTimeout(r,120));
    window.print();
  }catch(err){
    state=originalState;render();document.title=originalTitle;window.scrollTo(originalScroll.x,originalScroll.y);cleanupMirrorPrint();throw err;
  }finally{suppressPersistence=false}
}
async function exportArchiveMirrorPdf(id){
  const record=await archiveGet(id);if(!record)return;
  try{await buildMirrorPagesForRecord(record);toast('PDF Espelho preparado. Escolha Salvar como PDF na janela de impressão.')}catch(err){console.error(err);toast('Não foi possível preparar o PDF Espelho')}
}
window.openPdfExportOptions=id=>{pendingPdfArchiveId=id;document.getElementById('pdfExportModal').showModal()};

window.exportArchivePdf=exportArchivePdf;

// ---------- Dados gerais ----------
const dataModal=document.getElementById('dataModal');
function fillMainDataModal(){
  const p=state.previous,c=state.current;
  const map=[['fPrevPeriod',periodDisplay(p.period)],['fPrevTarget',p.target],['fPrevRevenue',p.revenue],['fPrevWatch',p.watch],['fPrevSolar',p.solar],['fPrevDegreeLens',p.degreeLens],['fPrevLens',p.lens],['fPrevLuxottica',p.luxottica||0],['fPrevContactLens',p.contactLens||0],['fPrevAttend',p.attend],['fPrevSales',p.sales],['fPrevPieces',p.pieces],['fCurrentPeriod',periodDisplay(c.period)],['fCurrentTarget',c.target],['fCurrentRevenue',c.revenue],['fCurrentWatch',c.watch],['fCurrentSolar',c.solar],['fCurrentDegreeLens',c.degreeLens],['fCurrentLens',c.lens],['fCurrentLuxottica',c.luxottica||0],['fCurrentContactLens',c.contactLens||0],['fCurrentAttend',c.attend],['fCurrentSales',c.sales],['fCurrentPieces',c.pieces]];map.forEach(([id,v])=>document.getElementById(id).value=String(v??'').replace('.',','));updateMainDataPreview();dataModal.showModal();
}
function modalPeriod(prefix){return {period:parsePeriod(document.getElementById(`${prefix}Period`).value),target:numericValue(`${prefix}Target`),revenue:numericValue(`${prefix}Revenue`),watch:numericValue(`${prefix}Watch`),solar:numericValue(`${prefix}Solar`),degreeLens:numericValue(`${prefix}DegreeLens`),lens:numericValue(`${prefix}Lens`),luxottica:numericValue(`${prefix}Luxottica`),contactLens:numericValue(`${prefix}ContactLens`)}}
function calcSummary(p){return `<span>Meta: <b>${fmtPct(achievement(p.revenue,p.target))}</b></span><span>Relógio: <b>${fmtPct(rep(p.watch,p.revenue))}</b></span><span>Solar: <b>${fmtPct(rep(p.solar,p.revenue))}</b></span><span>Grau + Lente: <b>${fmtPct(rep(p.degreeLens,p.revenue))}</b></span><span>Lentes: <b>${fmtPct(rep(p.lens,p.revenue))}</b></span>${isOptica()?`<span>Luxottica: <b>${fmtPct(rep(p.luxottica,p.revenue))}</b></span><span>Contato: <b>${ptMoney.format(p.contactLens)}</b></span>`:''}`}
function updateMainDataPreview(){const p=modalPeriod('fPrev'),c=modalPeriod('fCurrent');document.getElementById('prevAutoSummary').innerHTML=calcSummary(p);document.getElementById('currentAutoSummary').innerHTML=calcSummary(c);const g=variation(c.revenue,p.revenue);document.getElementById('growthPreview').innerHTML=`Crescimento/queda do período: <strong class="${variationClass(g)}">${g>=.005?'+':''}${fmtPct(g)}</strong>`}
async function saveMainData(){const p=modalPeriod('fPrev'),c=modalPeriod('fCurrent');if(!p.period||!c.period)return toast('Informe os períodos no formato MM/AAAA');if(p.lens>p.degreeLens||c.lens>c.degreeLens)return toast('O valor de Lentes não pode ser maior que Grau + Lente');Object.assign(state.previous,{period:p.period,target:p.target,revenue:p.revenue,watch:p.watch,solar:p.solar,degreeLens:p.degreeLens,lens:p.lens,degree:Math.max(0,p.degreeLens-p.lens),luxottica:p.luxottica,contactLens:p.contactLens,attend:numericValue('fPrevAttend'),sales:numericValue('fPrevSales'),pieces:numericValue('fPrevPieces')});Object.assign(state.current,{period:c.period,target:c.target,revenue:c.revenue,watch:c.watch,solar:c.solar,degreeLens:c.degreeLens,lens:c.lens,degree:Math.max(0,c.degreeLens-c.lens),luxottica:c.luxottica,contactLens:c.contactLens,attend:numericValue('fCurrentAttend'),sales:numericValue('fCurrentSales'),pieces:numericValue('fCurrentPieces')});dataModal.close();render();try{await saveForecastSnapshot({silent:true});toast('Prognóstico atualizado e salvo no Banco de Dados')}catch{toast('Dados atualizados. Use o botão Salvar para arquivar no Banco de Dados')}}

// ---------- Vendedores ----------
const sellerModal=document.getElementById('sellerModal'),sellerManagerModal=document.getElementById('sellerManagerModal');let pendingSellerPhoto='';
function setPhotoPreview(data,name){const el=document.getElementById('sPhotoPreview');el.innerHTML=data?`<img src="${data}" alt="Foto">`:escapeHtml(initials(name||'+'))}
function sellerModalPeriod(prefix){return {period:parsePeriod(document.getElementById(`${prefix}Period`).value),target:numericValue(`${prefix}Target`),revenue:numericValue(`${prefix}Revenue`),watch:numericValue(`${prefix}Watch`),solar:numericValue(`${prefix}Solar`),degreeLens:numericValue(`${prefix}DegreeLens`),lens:numericValue(`${prefix}Lens`),luxottica:numericValue(`${prefix}Luxottica`),contactLens:numericValue(`${prefix}ContactLens`),lensQty:numericValue(`${prefix}LensQty`)}}
function updateSellerPreview(){const p=sellerModalPeriod('sPrev'),c=sellerModalPeriod('sCurrent');document.getElementById('sellerPrevSummary').innerHTML=calcSummary(p);document.getElementById('sellerCurrentSummary').innerHTML=calcSummary(c);const g=variation(c.revenue,p.revenue),share=rep(c.revenue,state.current.revenue);document.getElementById('s7030Auto').textContent=fmtPct(share);document.getElementById('sellerGrowthPreview').innerHTML=`Crescimento/queda do vendedor: <strong class="${variationClass(g)}">${g>=.005?'+':''}${fmtPct(g)}</strong> · 70/30: <strong>${fmtPct(share)}</strong> do faturamento realizado da loja`}
function openSellerEditor(index=-1){
  if(index<0&&state.sellers.length>=10)return toast('Limite de 10 vendedores atingido');const s=index>=0?state.sellers[index]:{name:'',role:'Vendedor',photo:'',profile:'',chilliSeguro:0,previous:{period:state.previous.period,target:0,revenue:0,watch:0,solar:0,degreeLens:0},current:{period:state.current.period,target:0,revenue:0,watch:0,solar:0,degreeLens:0},attend:0,sales:0,pieces:0,crm:0};document.getElementById('sellerModalTitle').textContent=index>=0?`Editar ${s.name}`:'Cadastrar vendedor';document.getElementById('sEditIndex').value=index;document.getElementById('sName').value=s.name;document.getElementById('sRole').value=s.role||'Vendedor';document.getElementById('sProfile').value=s.profile||'';document.getElementById('sChilliSeguro').value=s.chilliSeguro||0;pendingSellerPhoto=s.photo||'';setPhotoPreview(pendingSellerPhoto,s.name);
  [['sPrevPeriod',periodDisplay(s.previous.period)],['sPrevTarget',s.previous.target],['sPrevRevenue',s.previous.revenue],['sPrevWatch',s.previous.watch],['sPrevSolar',s.previous.solar],['sPrevDegreeLens',s.previous.degreeLens],['sPrevLens',s.previous.lens||0],['sPrevLensQty',s.previous.lensQty||0],['sPrevLuxottica',s.previous.luxottica||0],['sPrevContactLens',s.previous.contactLens||0],['sCurrentPeriod',periodDisplay(s.current.period)],['sCurrentTarget',s.current.target],['sCurrentRevenue',s.current.revenue],['sCurrentWatch',s.current.watch],['sCurrentSolar',s.current.solar],['sCurrentDegreeLens',s.current.degreeLens],['sCurrentLens',s.current.lens||0],['sCurrentLensQty',s.current.lensQty||0],['sCurrentLuxottica',s.current.luxottica||0],['sCurrentContactLens',s.current.contactLens||0],['sAttend',s.attend],['sSales',s.sales],['sPieces',s.pieces],['sCrm',s.crm]].forEach(([id,v])=>document.getElementById(id).value=String(v??'').replace('.',','));document.getElementById('sPhoto').value='';updateSellerPreview();sellerModal.showModal();
}
window.editSeller=i=>openSellerEditor(i);window.deleteSeller=i=>{if(!confirm(`Remover ${state.sellers[i]?.name}?`))return;state.sellers.splice(i,1);render();toast('Vendedor removido')};
function renderSellerManager(){const el=document.getElementById('sellerManagerList');document.getElementById('sellerManagerCount').textContent=`${state.sellers.length} de 10 vendedores`;el.innerHTML=state.sellers.length?state.sellers.map((s,i)=>{const g=variation(s.current.revenue,s.previous.revenue);return `<div class="seller-manager-row">${sellerPhotoMarkup(s)}<div class="seller-manager-main"><strong>${escapeHtml(s.name)} ${s.profile&&profileDefs[s.profile]?`· ${profileDefs[s.profile].icon} ${profileDefs[s.profile].label}`:''}</strong><small>${ptMoney.format(s.current.revenue)} · Chilli Seguro ${ptInt.format(s.chilliSeguro||0)} · 70/30 ${fmtPct(rep(s.current.revenue,state.current.revenue))}</small></div><span class="manager-growth ${variationClass(g)}">${g>=.005?'+':''}${fmtPct(g)}</span><button type="button" class="secondary-btn manager-edit" onclick="editSeller(${i})">✎ Editar comparadas</button></div>`}).join(''):'<div class="manager-empty">Nenhum vendedor cadastrado.</div>'}
function resizeImage(file,maxW,maxH){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>{const img=new Image();img.onerror=reject;img.onload=()=>{const scale=Math.min(1,maxW/img.width,maxH/img.height),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.82))};img.src=reader.result};reader.readAsDataURL(file)})}

// ---------- Editor de categorias ----------
const categoryModal=document.getElementById('categoryModal');
function categoryEditorRows(which){const p=state[which],prefix=which==='previous'?'catPrev':'catCurrent';return activeCategoryDefs().map(d=>`<div class="category-editor-row"><strong>${d.label}</strong><label>Peças<input type="number" min="0" step="1" id="${prefix}_${d.key}_pieces" value="${categoryPieces(p,d.key)}"></label><label>Valor realizado (R$)<input type="text" inputmode="decimal" class="decimal-input" id="${prefix}_${d.key}_value" value="${String(categoryValue(p,d.key)).replace('.',',')}"></label><span class="category-live-rep" id="${prefix}_${d.key}_rep">REP. ${fmtPct(rep(categoryValue(p,d.key),p.revenue))}</span></div>`).join('')}
function categoryEditorSnapshot(which){const p=state[which],prefix=which==='previous'?'catPrev':'catCurrent',values={},pieces={};activeCategoryDefs().forEach(d=>{values[d.key]=numericValue(`${prefix}_${d.key}_value`);pieces[d.key]=numericValue(`${prefix}_${d.key}_pieces`)});return {period:p,values,pieces}}
function updateCategoryEditorPreview(){['previous','current'].forEach(which=>{const {period,values,pieces}=categoryEditorSnapshot(which),prefix=which==='previous'?'catPrev':'catCurrent';activeCategoryDefs().forEach(d=>{const el=document.getElementById(`${prefix}_${d.key}_rep`);if(el)el.textContent=`REP. ${fmtPct(rep(values[d.key],period.revenue))}`});const sumValue=Object.values(values).reduce((a,b)=>a+b,0),sumPieces=Object.values(pieces).reduce((a,b)=>a+b,0),diff=period.revenue-sumValue;document.getElementById(`${prefix}Total`).innerHTML=`<span><b>${ptInt.format(sumPieces)}</b> peças informadas</span><span>Soma das categorias: <b>${ptMoney.format(sumValue)}</b></span><span class="${Math.abs(diff)<.01?'neutral':diff>0?'warning':'negative'}">Diferença p/ realizado: <b>${ptMoney.format(diff)}</b></span>`})}
function openCategoryEditor(){const p=periodData(state.previous.period),c=periodData(state.current.period);document.getElementById('catPrevTitle').textContent=`${p.month} ${p.year} — ano anterior`;document.getElementById('catCurrentTitle').textContent=`${c.month} ${c.year} — ano atual`;document.getElementById('catPrevFields').innerHTML=categoryEditorRows('previous');document.getElementById('catCurrentFields').innerHTML=categoryEditorRows('current');document.querySelectorAll('#categoryModal .decimal-input').forEach(el=>{el.addEventListener('input',updateCategoryEditorPreview);el.addEventListener('blur',()=>{normalizeDecimalField(el);updateCategoryEditorPreview()})});document.querySelectorAll('#categoryModal input[type=number]').forEach(el=>el.addEventListener('input',updateCategoryEditorPreview));updateCategoryEditorPreview();categoryModal.showModal()}


// ---------- Share de Lente ----------
const shareLensModal=document.getElementById('shareLensModal');
function fillShareLensModal(){
  const share=state.shareLens||defaultState.shareLens;
  document.getElementById('shareMultifocalRevenue').value=String(share.types?.multifocal?.revenue||0).replace('.',',');
  document.getElementById('shareMultifocalQty').value=share.types?.multifocal?.qty||0;
  document.getElementById('shareSingleRevenue').value=String(share.types?.single?.revenue||0).replace('.',',');
  document.getElementById('shareSingleQty').value=share.types?.single?.qty||0;
  renderLabEditor(share.labs||{});
  updateShareLensPreview();
  shareLensModal.showModal();
}
function updateShareLensPreview(){
  const totalLensPieces=categoryPieces(state.current,'lens');
  const mRev=numericValue('shareMultifocalRevenue'),mQty=numericValue('shareMultifocalQty');
  const sRev=numericValue('shareSingleRevenue'),sQty=numericValue('shareSingleQty');
  const setAuto=(id,qty,rev)=>{const el=document.getElementById(id);if(el)el.innerHTML=`<b>${fmtPct(safeDiv(qty,totalLensPieces)*100)}</b><small>${ptMoney.format(ticket(rev,qty))} / peça</small>`};
  setAuto('shareMultifocalAuto',mQty,mRev);setAuto('shareSingleAuto',sQty,sRev);
  const totalQty=mQty+sQty,totalRev=mRev+sRev;
  document.getElementById('shareTypePreview').innerHTML=`Qtd informada: <strong>${ptInt.format(totalQty)}</strong> de ${ptInt.format(totalLensPieces)} lentes · Cobertura: <strong>${fmtPct(safeDiv(totalQty,totalLensPieces)*100)}</strong> · Faturamento: <strong>${ptMoney.format(totalRev)}</strong>`;
  const labs=[...document.querySelectorAll('.lab-qty')].map(el=>Number(el.value)||0);
  const labTotal=labs.reduce((a,b)=>a+b,0);
  document.getElementById('shareLabPreview').innerHTML=`Total identificado por laboratório: <strong>${ptInt.format(labTotal)}</strong> lentes`;
}
function saveShareLens(){
  state.shareLens={
    types:{
      multifocal:{label:'Multifocal',revenue:numericValue('shareMultifocalRevenue'),qty:numericValue('shareMultifocalQty')},
      single:{label:'Visão simples',revenue:numericValue('shareSingleRevenue'),qty:numericValue('shareSingleQty')}
    },
    labs:Object.fromEntries([...document.querySelectorAll('.lab-edit-row')].filter(el=>el.querySelector('.lab-name').value.trim()).map(el=>[el.querySelector('.lab-name').value.trim().toUpperCase(),Number(el.querySelector('.lab-qty').value)||0])),markupRows:state.shareLens?.markupRows||[]
  };
  shareLensModal.close();render();toast('Share de Lente atualizado');
}

// ---------- Raio X Operação ----------
const operationModal=document.getElementById('operationModal');
function openOperationModal(){const op=state.operation;document.getElementById('opOpportunity').value=op.opportunity||'Alta';document.getElementById('opExecution').value=op.execution||0;document.getElementById('opChallenges').value=(op.challenges||[]).join('\n');document.getElementById('opWins').value=(op.wins||[]).join('\n');document.getElementById('opNotes').value=op.notes||'';operationModal.showModal()}
const commercialRxModal=document.getElementById('commercialRxModal');
function fillCommercialRxModal(){
  const crm=state.operation.crm360||defaultState.operation.crm360,oto=state.operation.oto||defaultState.operation.oto;
  const map=[
    ['crmSalesBase',crm.salesBase],['crmReturnRate',crm.returnRate],
    ['crmGeneratedAmount',crm.generated?.amount],['crmGeneratedTickets',crm.generated?.tickets],
    ['crmRedeemedAmount',crm.redeemed?.amount],['crmRedeemedTickets',crm.redeemed?.tickets],
    ['crmLostAmount',crm.lost?.amount],['crmLostTickets',crm.lost?.tickets],
    ['crmExpiringAmount',crm.expiring?.amount],['crmExpiringTickets',crm.expiring?.tickets],
    ['otoRevenue',oto.revenue],['otoSales',oto.sales],['otoContacts',oto.contacts],['otoConversion',oto.conversion],['otoWindowDays',oto.windowDays]
  ];
  map.forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.value=String(v??0).replace('.',',')});
  updateOtoPreview();
  commercialRxModal.showModal();
}
function updateOtoPreview(){
  const revenue=numericValue('otoRevenue'),sales=numericValue('otoSales'),contacts=numericValue('otoContacts');
  const el=document.getElementById('otoAutoPreview');
  if(el)el.innerHTML=`Receita por contato: <strong>${ptMoney.format(ticket(revenue,contacts))}</strong> · Ticket médio: <strong>${ptMoney.format(ticket(revenue,sales))}</strong>`;
}
function saveCommercialRx(){
  state.operation.crm360={
    salesBase:numericValue('crmSalesBase'),
    returnRate:numericValue('crmReturnRate'),
    generated:{amount:numericValue('crmGeneratedAmount'),tickets:numericValue('crmGeneratedTickets')},
    redeemed:{amount:numericValue('crmRedeemedAmount'),tickets:numericValue('crmRedeemedTickets')},
    lost:{amount:numericValue('crmLostAmount'),tickets:numericValue('crmLostTickets')},
    expiring:{amount:numericValue('crmExpiringAmount'),tickets:numericValue('crmExpiringTickets')}
  };
  state.operation.oto={
    revenue:numericValue('otoRevenue'),
    sales:numericValue('otoSales'),
    contacts:numericValue('otoContacts'),
    conversion:numericValue('otoConversion'),
    windowDays:numericValue('otoWindowDays')
  };
  commercialRxModal.close();render();toast('CRM360 e Oto atualizados');
}


// ---------- Raio X Time ----------
const teamRxModal=document.getElementById('teamRxModal');let tempTrainings=[];
function renderTrainingEditor(){const el=document.getElementById('trainingEditorRows');el.innerHTML=tempTrainings.map((t,i)=>`<div class="action-editor-row training-editor-row"><label>Treinamento<input data-training-field="text" data-i="${i}" value="${escapeHtml(t.text)}"></label><label>Data<input type="date" data-training-field="date" data-i="${i}" value="${escapeHtml(t.date||'')}"></label><label>Concluído<select data-training-field="done" data-i="${i}"><option value="true" ${t.done?'selected':''}>Sim</option><option value="false" ${!t.done?'selected':''}>Não</option></select></label><button type="button" class="remove-row" onclick="removeTrainingRow(${i})">×</button></div>`).join('')||'<div class="manager-empty">Nenhum treinamento.</div>';el.querySelectorAll('[data-training-field]').forEach(input=>input.addEventListener('input',()=>{tempTrainings[+input.dataset.i][input.dataset.trainingField]=input.dataset.trainingField==='done'?input.value==='true':input.value}))}
function renderIndividualEditor(){const rx=state.teamRx,el=document.getElementById('individualEditorRows');el.innerHTML=state.sellers.map(s=>{const d=rx.individual?.[s.name]||{challenge:'',next:'',status:'No caminho'};return `<div class="individual-editor-row" data-name="${escapeHtml(s.name)}"><div class="individual-editor-name">${escapeHtml(s.name)}</div><label>Desafio principal<input data-individual="challenge" value="${escapeHtml(d.challenge||'')}"></label><label>Próximo passo<input data-individual="next" value="${escapeHtml(d.next||'')}"></label><label>Status<select data-individual="status"><option ${d.status==='No caminho'?'selected':''}>No caminho</option><option ${d.status==='Atenção'?'selected':''}>Atenção</option></select></label></div>`}).join('')}
function openTeamRxModal(){const rx=state.teamRx;document.getElementById('teamEngagement').value=rx.engagement||0;document.getElementById('teamExecution').value=rx.execution||0;document.getElementById('teamStrengthsInput').value=(rx.strengths||[]).join('\n');document.getElementById('teamAttentionInput').value=(rx.attention||[]).join('\n');document.getElementById('teamNotesInput').value=rx.notes||'';tempTrainings=clone(rx.trainings||[]);renderTrainingEditor();renderIndividualEditor();teamRxModal.showModal()}
window.removeTrainingRow=i=>{tempTrainings.splice(i,1);renderTrainingEditor()};

// ---------- Exportação ----------
function csvEscape(v){return `"${String(v??'').replaceAll('"','""')}"`}
function downloadCsv(filename,rows){const csv='\uFEFF'+rows.map(r=>r.map(csvEscape).join(';')).join('\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),200)}
function exportSellers(){const h=['Vendedor','Perfil','Chilli Seguro','Período anterior','Meta anterior','Realizado anterior','Relógios anterior','Solar anterior','Grau + Lente anterior','Período atual','Meta atual','Realizado atual','Relógios atual','Solar atual','Grau + Lente atual','Atingimento %','Crescimento %','Conversão %','P.A.','Ticket Médio','CRM 360 %','70/30 %'];const rows=[h,...state.sellers.map(s=>[s.name,profileDefs[s.profile]?.label||'',s.chilliSeguro,periodDisplay(s.previous.period),s.previous.target,s.previous.revenue,s.previous.watch,s.previous.solar,s.previous.degreeLens,periodDisplay(s.current.period),s.current.target,s.current.revenue,s.current.watch,s.current.solar,s.current.degreeLens,achievement(s.current.revenue,s.current.target),variation(s.current.revenue,s.previous.revenue),conversion(s.sales,s.attend),pa(s.pieces,s.sales),ticket(s.current.revenue,s.sales),s.crm,rep(s.current.revenue,state.current.revenue)])];downloadCsv(`prognostico-equipe-${state.current.period}.csv`,rows);toast('CSV da equipe exportado')}
function exportClosing(){const rows=[['Categoria','Peças anterior','Valor anterior','Peças atual','Valor atual','Variação peças %','Variação faturamento %'],...closingRows().map(r=>[r.label,r.prevPieces??'',r.prev,r.curPieces??'',r.cur,r.prevPieces===null?'':variation(r.curPieces,r.prevPieces),variation(r.cur,r.prev)])];downloadCsv(`prognostico-fechamento-${state.current.period}.csv`,rows);toast('CSV do fechamento exportado')}

const pdfExportModal=document.getElementById('pdfExportModal');
document.getElementById('pdfReportBtn').onclick=async()=>{const id=pendingPdfArchiveId;pdfExportModal.close();if(id)await exportArchivePdf(id)};
document.getElementById('pdfMirrorBtn').onclick=async()=>{const id=pendingPdfArchiveId;pdfExportModal.close();if(id)await exportArchiveMirrorPdf(id)};


// V18: Laboratórios configuráveis e controle de markup
function renderLabEditor(labs){const box=document.querySelector('#shareLensModal .lab-editor-grid');box.innerHTML=Object.entries(labs).map(([name,qty])=>labEditorRow(name,qty)).join('');box.querySelectorAll('input').forEach(x=>x.addEventListener('input',updateShareLensPreview))}
function labEditorRow(name='',qty=0){return `<div class="lab-edit-row"><label>Laboratório<input class="lab-name" value="${escapeHtml(name)}" maxlength="60"></label><label>Qtd<input class="lab-qty" type="number" min="0" step="1" value="${Number(qty)||0}"></label><button type="button" class="secondary-btn lab-remove">×</button></div>`}
document.getElementById('addLabBtn').onclick=()=>{const box=document.querySelector('#shareLensModal .lab-editor-grid');box.insertAdjacentHTML('beforeend',labEditorRow());box.lastElementChild.querySelectorAll('input').forEach(x=>x.addEventListener('input',updateShareLensPreview))};
document.querySelector('#shareLensModal .lab-editor-grid').addEventListener('click',e=>{if(e.target.closest('.lab-remove')){e.target.closest('.lab-edit-row').remove();updateShareLensPreview()}});
function markupCalc(r){const qty=Math.max(0,Number(r.qty)||0),sale=Number(r.sale)||0,cost=Number(r.cost)||0,assembly=Number(r.assembly)||0;return {qty,sale,cost,assembly,totalCost:cost+assembly,markup:safeDiv(sale,cost+assembly)}}
function renderMarkupTable(){const rows=state.shareLens?.markupRows||[],body=document.getElementById('markupBody');if(!body)return;let sales=0,costs=0,qty=0;body.innerHTML=rows.map((r,i)=>{const v=markupCalc(r);sales+=v.sale;costs+=v.totalCost;qty+=v.qty;return `<tr><td>${escapeHtml(r.date||'—')}</td><td>${escapeHtml(r.lab||'—')}</td><td>${escapeHtml(r.type||'—')}</td><td>${v.qty}</td><td>${ptMoney.format(v.sale)}</td><td>${ptMoney.format(v.cost)}</td><td>${ptMoney.format(v.assembly)}</td><td><strong>${ptNum.format(v.markup)}×</strong></td><td><button class="tiny" onclick="editMarkup(${i})">✎</button> <button class="tiny danger" onclick="deleteMarkup(${i})">×</button></td></tr>`}).join('')||'<tr><td colspan="9">Nenhuma venda de lentes cadastrada.</td></tr>';document.getElementById('markupTotals').textContent=`${qty} pares · Vendas ${ptMoney.format(sales)} · Custos ${ptMoney.format(costs)} · Markup consolidado ${ptNum.format(safeDiv(sales,costs))}×`}
window.editMarkup=i=>{const r=(state.shareLens.markupRows||[])[i]||{};document.getElementById('markupIndex').value=i;for(const k of ['date','type','qty','sale','cost','assembly'])document.getElementById('mk_'+k).value=r[k]??(k==='type'?'Visão simples':'');document.getElementById('mk_lab').innerHTML=Object.keys(state.shareLens.labs||{}).map(n=>`<option value="${escapeHtml(n)}" ${r.lab===n?'selected':''}>${escapeHtml(n)}</option>`).join('');document.getElementById('markupModal').showModal();updateMarkupPreview()};
window.deleteMarkup=i=>{if(!confirm('Excluir este lançamento?'))return;state.shareLens.markupRows.splice(i,1);render()};
function updateMarkupPreview(){const r=Object.fromEntries(['qty','sale','cost','assembly'].map(k=>[k,Number(document.getElementById('mk_'+k).value)||0]));document.getElementById('markupPreview').textContent=`Markup: ${ptNum.format(markupCalc(r).markup)}×`}
document.getElementById('addMarkupBtn').onclick=()=>editMarkup(-1);
document.getElementById('saveMarkupBtn').onclick=()=>{const r={date:document.getElementById('mk_date').value,lab:document.getElementById('mk_lab').value,type:document.getElementById('mk_type').value};for(const k of ['qty','sale','cost','assembly'])r[k]=Math.max(0,Number(document.getElementById('mk_'+k).value)||0);if(!r.lab)return toast('Cadastre um laboratório antes');if(!r.date)return toast('Informe a data');const i=Number(document.getElementById('markupIndex').value);state.shareLens.markupRows??=[];if(i<0)state.shareLens.markupRows.push(r);else state.shareLens.markupRows[i]=r;document.getElementById('markupModal').close();render();toast('Lançamento salvo')};
document.querySelectorAll('#markupModal input').forEach(x=>x.addEventListener('input',updateMarkupPreview));
const planGroups=['EQUIPE','VISUAL','ESTOQUE','RESULTADO','CORRIDAS'];
// Dez cores pré-selecionadas, compartilhadas entre cabeçalhos e colunas dos laboratórios.
const editorPalette=['#BDD9F1','#F7D769','#F4B18E','#A8D779','#8EC8FF','#B7A1F6','#FFACBB','#8DD9CF','#F2C4E5','#CBD5E1','#E53935','#174EA6','#173D32','#F97316','#6D28D9','#111827','#C9A227','#AEB8C2','#B87333','#10B981'];
const chartPalette=['#247EC1','#DC9942','#19A873','#7757DD','#EA627C','#1AA7AB','#7F91AA','#B16CBB','#B68B27','#4E8D6C','#E53935','#174EA6','#173D32','#F97316','#6D28D9','#111827','#C9A227','#AEB8C2','#B87333','#10B981'];
const defaultPlanColors={'EQUIPE':'#BDD9F1','VISUAL':'#F7D769','ESTOQUE':'#F4B18E','RESULTADO':'#A8D779','CORRIDAS':'#A8D779'};
function safePaletteColor(input,palette,defaultColor){return palette.includes(input)?input:defaultColor}
function paletteText(hex){if(!/^#[0-9a-f]{6}$/i.test(hex))return '#102037';const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722<.28?'#ffffff':'#102037'}
function palettePaint(hex){const metals={'#C9A227':'linear-gradient(115deg,#866014 0%,#F4D772 35%,#B38B19 65%,#EEC54C 100%)','#AEB8C2':'linear-gradient(115deg,#75808B 0%,#F2F6FA 38%,#8995A3 68%,#CED5DC 100%)','#B87333':'linear-gradient(115deg,#85421C 0%,#F2B780 38%,#A65A26 69%,#D68B56 100%)'};return metals[hex]||hex}
function paletteMarkup(area,key,color,palette){return `<div class="color-picker" data-color-area="${area}" data-color-key="${escapeHtml(key)}"><button type="button" class="color-picker-trigger" aria-label="Escolher cor" aria-expanded="false" title="Alterar cor">🎨 <span>Cor</span></button><div class="color-palette" aria-label="20 opções de cor">${palette.map((hex,i)=>`<button type="button" class="palette-swatch ${hex===color?'selected':''}" data-hex="${hex}" style="--swatch:${hex};--swatch-paint:${palettePaint(hex)}" title="Cor ${i+1}" aria-label="Cor ${i+1}" aria-pressed="${hex===color}"></button>`).join('')}</div></div>`}
function renderNextPlan(){
  const el=document.getElementById('nextPlanContent');if(!el)return;
  const rows=state.nextPlan||[];
  el.innerHTML=planGroups.map((group,i)=>{
    const color=safePaletteColor(state.planColors?.[group],editorPalette,defaultPlanColors[group]);
    const groupRows=rows.map((r,j)=>({...r,j})).filter(r=>r.group===group);
    return `<div class="plan-group plan-group-${i}"><div class="plan-group-header" style="--group-color:${color};--group-paint:${palettePaint(color)};--group-text:${paletteText(color)}"><h4>${group}</h4>${paletteMarkup('plan',group,color,editorPalette)}</div><div class="plan-actions">${groupRows.map(r=>`<div class="plan-action-row"><div class="plan-action-text">${escapeHtml(r.action||'')}</div><div class="plan-action-buttons"><button type="button" class="tiny" aria-label="Editar ação" onclick="editNextPlan(${r.j})">✎</button><button type="button" class="tiny danger" aria-label="Excluir ação" onclick="deleteNextPlan(${r.j})">×</button></div></div>`).join('')||'<p class="plan-empty">Nenhuma ação cadastrada nesta categoria.</p>'}</div><button type="button" class="outline-add plan-add-btn" onclick="editNextPlan(-1,'${group}')">＋ Adicionar ação</button></div>`;
  }).join('');
}
window.editNextPlan=(i,group='EQUIPE')=>{
  const r=(state.nextPlan||[])[i]||{group,action:''};
  document.getElementById('npIndex').value=i;
  document.getElementById('np_group').value=planGroups.includes(r.group)?r.group:'EQUIPE';
  document.getElementById('np_action').value=r.action||'';
  document.getElementById('nextPlanModal').showModal();
};
window.deleteNextPlan=i=>{if(!confirm('Excluir ação?'))return;state.nextPlan.splice(i,1);render()};
document.getElementById('saveNextPlanBtn').onclick=()=>{
  const r={group:document.getElementById('np_group').value,action:document.getElementById('np_action').value.trim()};
  if(!r.action)return toast('Descreva a ação');
  const i=Number(document.getElementById('npIndex').value);state.nextPlan??=[];
  if(i<0)state.nextPlan.push(r);else state.nextPlan[i]={...state.nextPlan[i],...r};
  document.getElementById('nextPlanModal').close();render();toast('Ação salva');
};
function renderLabMarkupChart(){
  const el=document.getElementById('labMarkupChart');if(!el)return;
  const known=Object.keys(state.shareLens?.labs||{});
  const rows=state.shareLens?.markupRows||[];
  const labs=[...new Set([...known,...rows.map(r=>r.lab).filter(Boolean)])];
  if(!labs.length){el.innerHTML='<p class="plan-empty">Cadastre um laboratório para ver o gráfico.</p>';return}
  const stats=labs.map((lab,i)=>{
    const entries=rows.filter(r=>r.lab===lab),qtyFromSales=entries.reduce((s,r)=>s+markupCalc(r).qty,0);
    // Na ausência de lançamentos, usar apenas a quantidade do Share de Lentes.
    const qtyInShare=Math.max(0,Number(state.shareLens.labs?.[lab])||0);
    const qty=qtyInShare>0?qtyInShare:qtyFromSales;
    const sold=entries.reduce((s,r)=>s+markupCalc(r).sale,0),cost=entries.reduce((s,r)=>s+markupCalc(r).totalCost,0);
    const markup=cost>0?sold/cost:0;
    const color=safePaletteColor(state.shareLens.labColors?.[lab],chartPalette,chartPalette[i%chartPalette.length]);
    return {lab,qty,markup,color,hasSales:entries.length>0};
  });
  const maxQty=Math.max(1,...stats.map(r=>r.qty)),maxMarkup=Math.max(1,...stats.map(r=>r.markup));
  const bar=(value,max,color)=>`<div class="lab-chart-track"><div class="lab-chart-fill" style="width:${Math.max(0,Math.min(100,100*value/max))}%;background:${palettePaint(color)}"></div></div>`;
  el.innerHTML=`<div class="lab-chart-summary"><span><strong>${stats.reduce((s,r)=>s+r.qty,0)}</strong> pares identificados</span><span><strong>${stats.filter(r=>r.hasSales).length}</strong> laboratórios com custos lançados</span></div><div class="lab-chart-head"><span>LABORATÓRIO</span><span>QTD. DE LENTES (PARES)</span><span>MARKUP (×)</span><span>COR</span></div>${stats.map(r=>`<div class="lab-chart-row"><strong title="${escapeHtml(r.lab)}">${escapeHtml(r.lab)}</strong><div class="lab-chart-cell">${bar(r.qty,maxQty,r.color)}<b>${ptInt.format(r.qty)}</b></div><div class="lab-chart-cell">${bar(r.markup,maxMarkup,r.color)}<b>${r.hasSales&&r.markup>0?`${ptNum.format(r.markup)}×`:'—'}</b></div>${paletteMarkup('lab',r.lab,r.color,chartPalette)}</div>`).join('')}<p class="lab-chart-hint">Quantidade: utiliza os pares informados no Share de Lentes e, quando não há quantidade cadastrada para o laboratório, usa os lançamentos de vendas. Markup = total vendido ÷ (custo das lentes + montagem). Sem custos lançados, o markup fica em branco.</p>`;
}
for(const id of ['nextPlanContent','labMarkupChart']){
  document.getElementById(id).addEventListener('click',e=>{
    const trigger=e.target.closest('.color-picker-trigger');
    if(trigger){const wrap=trigger.closest('.color-picker'),open=wrap.classList.contains('open');document.querySelectorAll('.color-picker.open').forEach(x=>{x.classList.remove('open');x.querySelector('.color-picker-trigger')?.setAttribute('aria-expanded','false')});if(!open){wrap.classList.add('open');trigger.setAttribute('aria-expanded','true')}return}
    const btn=e.target.closest('.palette-swatch');if(!btn)return;
    const wrap=btn.closest('.color-picker'),hex=btn.dataset.hex,key=wrap.dataset.colorKey;
    if(wrap.dataset.colorArea==='plan'){if(!planGroups.includes(key)||!editorPalette.includes(hex))return;state.planColors??={};state.planColors[key]=hex}
    else{if(!chartPalette.includes(hex))return;state.shareLens.labColors??={};state.shareLens.labColors[key]=hex}
    render();
  });
}
document.addEventListener('click',e=>{if(e.target.closest('.color-picker'))return;document.querySelectorAll('.color-picker.open').forEach(w=>{w.classList.remove('open');w.querySelector('.color-picker-trigger')?.setAttribute('aria-expanded','false')})});
// Preferência local por navegador; não altera dados de outras lojas.
function applyFontScale(v){document.documentElement.style.setProperty('--user-font-scale',v);localStorage.setItem('prognostico-font-scale',v);document.getElementById('fontScale').value=v}
document.getElementById('fontToggle').onclick=()=>document.getElementById('fontPanel').classList.toggle('visible');document.getElementById('fontScale').oninput=e=>applyFontScale(e.target.value);applyFontScale(localStorage.getItem('prognostico-font-scale')||'1');

// ---------- Eventos ----------
function closeNavMenus(except=null){
  document.querySelectorAll('body > .app-shell .nav-menu').forEach(menu=>{
    const opened=menu===except;
    menu.classList.toggle('open',opened);
    menu.querySelector('.nav-group-trigger')?.setAttribute('aria-expanded',String(opened));
  });
}
document.querySelectorAll('body > .app-shell .nav-group-trigger').forEach(trigger=>{
  trigger.addEventListener('click',()=>{
    const menu=trigger.closest('.nav-menu');
    closeNavMenus(menu.classList.contains('open')?null:menu);
  });
  trigger.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'||e.key==='Enter'&&e.repeat){
      e.preventDefault();
      closeNavMenus(trigger.closest('.nav-menu'));
      trigger.closest('.nav-menu').querySelector('.nav-subitem')?.focus();
    }
  });
});
document.querySelectorAll('body > .app-shell .nav-btn[data-tab]').forEach(btn=>btn.addEventListener('click',()=>setActiveTab(btn.dataset.tab)));
document.addEventListener('click',e=>{if(!e.target.closest('body > .app-shell .grouped-nav'))closeNavMenus();});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closeNavMenus();
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    const subitem=e.target.closest('.nav-subitem');if(!subitem)return;
    const buttons=[...subitem.closest('.nav-submenu').querySelectorAll('.nav-subitem')];
    const index=buttons.indexOf(subitem);
    e.preventDefault();buttons[(index+(e.key==='ArrowDown'?1:buttons.length-1))%buttons.length]?.focus();
  }
});
document.getElementById('databaseSaveCurrentBtn').onclick=async()=>{try{await saveForecastSnapshot()}catch(err){console.error(err);toast('Não foi possível salvar no Banco de Dados')}};document.getElementById('databaseSearch').addEventListener('input',renderDatabase);
document.getElementById('headerEditBtn').onclick=fillMainDataModal;document.getElementById('helpBtn').onclick=()=>toast('Use Editar dados, Editar categorias, Share de Lente, CRM360, Oto e Editar comparadas para alimentar o sistema.');
document.getElementById('saveForecastBtn').onclick=async()=>{
  const btn=document.getElementById('saveForecastBtn');
  if(btn.disabled)return;
  btn.disabled=true;
  btn.classList.remove('saved');
  btn.classList.add('saving');
  btn.title='Salvando prognóstico…';
  btn.setAttribute('aria-label','Salvando prognóstico');
  try{
    await saveForecastSnapshot();
    btn.classList.remove('saving');
    btn.classList.add('saved');
    btn.title='Prognóstico salvo';
    btn.setAttribute('aria-label','Prognóstico salvo');
  }catch(err){
    console.error(err);
    btn.classList.remove('saving');
    btn.title='Não foi possível salvar; tente novamente';
    btn.setAttribute('aria-label','Não foi possível salvar; tente novamente');
    toast('Não foi possível salvar no Banco de Dados');
  }finally{
    setTimeout(()=>{
      btn.classList.remove('saved','saving');
      btn.disabled=false;
      btn.title='Salvar prognóstico no Banco de Dados';
      btn.setAttribute('aria-label','Salvar prognóstico');
    },1300);
  }
};
const settingsModal=document.getElementById('settingsModal'),settingsStoreName=document.getElementById('settingsStoreName'),settingsStorePreview=document.getElementById('settingsStorePreview'),settingsStoreType=document.getElementById('settingsStoreType');
function openSettingsModal(){settingsStoreName.value=state.store||'';settingsStoreType.value=state.storeType||'vermelha';const canEditStore=!(window.CloudForecast?.authenticated())||window.SaasBridge?.user?.role==='master';settingsStoreName.disabled=!canEditStore;settingsStoreType.disabled=!canEditStore;settingsStorePreview.textContent=state.store||'—';showThemeChoiceFor(settingsStoreType.value);updateTypePreview();updateVisualThemeVisibility();settingsModal.showModal();setTimeout(()=>canEditStore?settingsStoreName.focus():document.querySelector('input[name="visualTheme"]:checked')?.focus(),30)}
function updateTypePreview(){const o=settingsStoreType.value==='optica';document.getElementById('settingsTypeLogo').src=o?'assets/logo-otica.png':'assets/logo-vermelha.png';document.getElementById('settingsTypeLabel').textContent=o?'Ótica Chilli Beans':'Loja Vermelha';document.getElementById('settingsTypeDescription').textContent=o?'Armações, lentes, contato e Luxottica':'Relógios, Solar e Grau + Lentes'}
function updateVisualThemeVisibility(){
  const box=document.getElementById('visualThemeSetting');
  if(box)box.hidden=false;
}
settingsStoreType.addEventListener('change',()=>{updateTypePreview();showThemeChoiceFor(settingsStoreType.value);updateVisualThemeVisibility();const preview=document.querySelector('input[name="visualTheme"]:checked');if(preview)applyVisualTheme(settingsStoreType.value,preview.value)});
// Prévia imediata, sem gravar: Cancelar restaura a escolha persistida.
document.querySelectorAll('input[name="visualTheme"]').forEach(radio=>radio.addEventListener('change',()=>applyVisualTheme(settingsStoreType.value,radio.value)));
settingsModal.addEventListener('close',()=>{applyStoreIdentity()});
function updateSettingsPreview(){settingsStorePreview.textContent=settingsStoreName.value.trim()||'—'}
document.getElementById('settingsBtn').onclick=openSettingsModal;document.getElementById('openStoreSettingsBtn').onclick=openSettingsModal;settingsStoreName.addEventListener('input',updateSettingsPreview);document.getElementById('saveSettingsBtn').onclick=()=>{const chosenType=settingsStoreType.value==='optica'?'optica':'vermelha';saveVisualThemeChoice(chosenType);if(window.CloudForecast?.authenticated()){if(window.SaasBridge?.user?.role!=='master'){settingsModal.close();applyStoreIdentity();toast('Tema visual salvo neste navegador');return;}window.SaasBridge?.saveSettings?.(settingsStoreName.value.trim(),settingsStoreType.value);return;}const name=settingsStoreName.value.trim().replace(/\s+/g,' ');if(!name)return toast('Informe o nome da loja');const oldType=state.storeType;state.store=name;state.storeType=settingsStoreType.value==='optica'?'optica':'vermelha';if(oldType!==state.storeType&&state.storeType==='optica'){for(const k of ['luxottica','contactLens','pml','repLuxottica'])if(!state.visibleColumns.includes(k))state.visibleColumns.push(k)}settingsModal.close();render();toast('Tipo e identificação da loja atualizados')};
document.getElementById('monthInput').addEventListener('change',e=>{if(!e.target.value)return;if(window.SaasBridge?.selectPeriod){window.SaasBridge.selectPeriod(e.target.value);return;}state.current.period=e.target.value;const [y,m]=e.target.value.split('-').map(Number);state.previous.period=`${y-1}-${String(m).padStart(2,'0')}`;render()});
document.getElementById('resetDemoBtn').onclick=()=>toast('Restaurar base indisponível neste teste. Use um backup para recuperar os dados.');

document.getElementById('saveDataBtn').onclick=saveMainData;['fPrevPeriod','fCurrentPeriod','sPrevPeriod','sCurrentPeriod'].forEach(id=>document.getElementById(id).addEventListener('input',e=>formatPeriodInput(e.target)));
['fPrevTarget','fPrevRevenue','fPrevWatch','fPrevSolar','fPrevDegreeLens','fPrevLens','fPrevLuxottica','fPrevContactLens','fCurrentTarget','fCurrentRevenue','fCurrentWatch','fCurrentSolar','fCurrentDegreeLens','fCurrentLens','fCurrentLuxottica','fCurrentContactLens'].forEach(id=>document.getElementById(id).addEventListener('input',updateMainDataPreview));

document.getElementById('addSellerBtn').onclick=()=>openSellerEditor(-1);document.getElementById('teamAddSellerBtn').onclick=()=>openSellerEditor(-1);document.getElementById('managerAddSellerBtn').onclick=()=>openSellerEditor(-1);document.getElementById('editSellerDataBtn').onclick=()=>{renderSellerManager();sellerManagerModal.showModal()};document.getElementById('teamEditSellerBtn').onclick=()=>{renderSellerManager();sellerManagerModal.showModal()};
['sPrevTarget','sPrevRevenue','sPrevWatch','sPrevSolar','sPrevDegreeLens','sPrevLens','sPrevLuxottica','sPrevContactLens','sPrevLensQty','sCurrentTarget','sCurrentRevenue','sCurrentWatch','sCurrentSolar','sCurrentDegreeLens','sCurrentLens','sCurrentLuxottica','sCurrentContactLens','sCurrentLensQty'].forEach(id=>document.getElementById(id).addEventListener('input',updateSellerPreview));document.getElementById('sName').addEventListener('input',e=>{if(!pendingSellerPhoto)setPhotoPreview('',e.target.value)});document.getElementById('sPhoto').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/'))return toast('Selecione um arquivo de imagem');try{pendingSellerPhoto=await resizeImage(file,256,256);setPhotoPreview(pendingSellerPhoto,document.getElementById('sName').value)}catch{toast('Não foi possível carregar a foto')}});
document.getElementById('saveSellerBtn').onclick=()=>{const name=document.getElementById('sName').value.trim();if(!name)return toast('Informe o nome do vendedor');const previous=sellerModalPeriod('sPrev'),current=sellerModalPeriod('sCurrent');if(!previous.period||!current.period)return toast('Informe os períodos no formato MM/AAAA');const seller={name,role:document.getElementById('sRole').value,photo:pendingSellerPhoto,profile:document.getElementById('sProfile').value,chilliSeguro:numericValue('sChilliSeguro'),previous,current,attend:numericValue('sAttend'),sales:numericValue('sSales'),pieces:numericValue('sPieces'),crm:clampPercent(document.getElementById('sCrm').value)};const i=+document.getElementById('sEditIndex').value;if(i>=0)state.sellers[i]=seller;else if(state.sellers.length<10)state.sellers.push(seller);sellerModal.close();render();toast('Vendedor salvo com comparadas e 70/30 recalculados')};

document.querySelectorAll('[data-open-categories]').forEach(b=>b.onclick=openCategoryEditor);document.getElementById('saveCategoriesBtn').onclick=()=>{const p=categoryEditorSnapshot('previous'),c=categoryEditorSnapshot('current');activeCategoryDefs().forEach(d=>{state.previous[d.key]=p.values[d.key];state.current[d.key]=c.values[d.key]});state.previous.degreeLens=state.previous.degree+state.previous.lens;state.current.degreeLens=state.current.degree+state.current.lens;state.previous.categoryPieces={...state.previous.categoryPieces,...p.pieces};state.current.categoryPieces={...state.current.categoryPieces,...c.pieces};categoryModal.close();render();toast('Categorias atualizadas: peças, valores e representatividade recalculados')};

document.getElementById('editShareLensBtn').onclick=fillShareLensModal;document.getElementById('saveShareLensBtn').onclick=saveShareLens;['shareMultifocalRevenue','shareMultifocalQty','shareSingleRevenue','shareSingleQty'].forEach(id=>document.getElementById(id)?.addEventListener('input',updateShareLensPreview));

document.getElementById('configureColumns').onclick=()=>{renderColumnChecks();document.getElementById('columnsModal').showModal()};document.getElementById('saveColumnsBtn').onclick=()=>{const checked=[...document.querySelectorAll('#columnChecks input:checked')].map(x=>x.value);if(!checked.length)return toast('Selecione ao menos uma coluna');state.visibleColumns=isOptica()?checked:[...checked,...state.visibleColumns.filter(k=>opticalColumnKeys.includes(k))];document.getElementById('columnsModal').close();render();toast('Colunas atualizadas')};document.getElementById('exportBtn').onclick=exportSellers;document.getElementById('closingExportBtn').onclick=exportClosing;

document.getElementById('editCrm360Btn').onclick=fillCommercialRxModal;document.getElementById('editOtoBtn').onclick=fillCommercialRxModal;document.getElementById('saveCommercialRxBtn').onclick=saveCommercialRx;['otoRevenue','otoSales','otoContacts'].forEach(id=>document.getElementById(id).addEventListener('input',updateOtoPreview));

document.getElementById('editOperationBtn').onclick=openOperationModal;document.querySelectorAll('[data-edit-operation]').forEach(b=>b.onclick=openOperationModal);document.getElementById('saveOperationShortcut').onclick=()=>toast('Raio X da operação já está salvo automaticamente neste navegador.');document.getElementById('saveOperationBtn').onclick=()=>{state.operation.opportunity=document.getElementById('opOpportunity').value;state.operation.execution=clamp(Number(document.getElementById('opExecution').value||0),0,100);state.operation.challenges=listFromText(document.getElementById('opChallenges').value);state.operation.wins=listFromText(document.getElementById('opWins').value);state.operation.notes=document.getElementById('opNotes').value.trim();operationModal.close();render();toast('Raio X da operação salvo')};

document.getElementById('editTeamRxBtn').onclick=openTeamRxModal;document.querySelectorAll('[data-edit-teamrx]').forEach(b=>b.onclick=openTeamRxModal);document.getElementById('saveTeamRxShortcut').onclick=()=>toast('Raio X do time já está salvo automaticamente neste navegador.');document.getElementById('addTrainingRowBtn').onclick=()=>{tempTrainings.push({text:'Novo treinamento',date:'',done:false});renderTrainingEditor()};document.getElementById('saveTeamRxBtn').onclick=()=>{state.teamRx.engagement=clamp(Number(document.getElementById('teamEngagement').value||0),0,100);state.teamRx.execution=clamp(Number(document.getElementById('teamExecution').value||0),0,100);state.teamRx.strengths=listFromText(document.getElementById('teamStrengthsInput').value);state.teamRx.attention=listFromText(document.getElementById('teamAttentionInput').value);state.teamRx.notes=document.getElementById('teamNotesInput').value.trim();state.teamRx.trainings=tempTrainings.map(t=>({...t}));const individual={...state.teamRx.individual};document.querySelectorAll('.individual-editor-row').forEach(row=>{const name=row.dataset.name;individual[name]={challenge:row.querySelector('[data-individual="challenge"]').value.trim(),next:row.querySelector('[data-individual="next"]').value.trim(),status:row.querySelector('[data-individual="status"]').value}});state.teamRx.individual=individual;teamRxModal.close();render();toast('Raio X do time salvo')};

document.addEventListener('click',e=>{if(!e.target.closest('.profile-picker-wrap'))closeProfilePickers()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeProfilePickers()});

// Normalização dos campos decimais ao sair.
document.addEventListener('blur',e=>{if(e.target.classList?.contains('decimal-input'))normalizeDecimalField(e.target)},true);
window.addEventListener('resize',()=>renderChartsForActive(state.activeTab));

window.renderDatabase=renderDatabase;window.toast=toast;
render();
fileArchiveApiAvailable=false;updateDatabaseStorageUi();renderDatabase();

// V10 — instalação fica exclusivamente dentro de Configurações.
function removeHeaderInstallButton(){
  document.querySelectorAll('#installAppBtn, .topbar .header-install-btn, .header-actions [data-install-app], .header-actions .pwa-install-btn').forEach(el=>el.remove());
}
removeHeaderInstallButton();

// V8 — instalação como PWA (Chrome/Edge)
let deferredInstallPrompt = null;
const settingsInstallBtn = document.getElementById('settingsInstallBtn');

function isStandaloneMode(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function refreshInstallButtons(){
  const installed = isStandaloneMode();
  if(settingsInstallBtn){
    settingsInstallBtn.disabled = installed;
    settingsInstallBtn.textContent = installed ? '✓ App instalado' : '⇩ Instalar app';
    settingsInstallBtn.title = installed ? 'Aplicativo já instalado' : (deferredInstallPrompt ? 'Instalar agora' : 'Preparando instalação');
  }
}

async function requestPwaInstall(){
  if(isStandaloneMode()) return toast('O Prognóstico já está instalado como aplicativo.');
  if(location.protocol === 'file:'){
    alert('No Mac, abra o sistema pelo arquivo INICIAR_PROGNOSTICO_MAC.command. No Chrome, use o botão Instalar em Configurações. No Safari 17 ou superior, use Arquivo > Adicionar ao Dock.');
    return;
  }
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    refreshInstallButtons();
    toast(choice.outcome === 'accepted' ? 'Instalação iniciada' : 'Instalação cancelada');
    return;
  }
  toast('Para instalar, use a opção Instalar aplicativo no menu do navegador.');
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  refreshInstallButtons();
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  refreshInstallButtons();
  toast('Prognóstico Mensal Rede Toma instalado com sucesso.');
});
if(settingsInstallBtn) settingsInstallBtn.addEventListener('click', requestPwaInstall);

if(false && 'serviceWorker' in navigator && location.protocol !== 'file:'){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js?v=17-cloud', {scope:'./', updateViaCache:'none'})
      .then(() => refreshInstallButtons())
      .catch(() => toast('Não foi possível ativar o modo instalável neste navegador.'));
  });
}
refreshInstallButtons();


// Offline V18: backup portável de estado, fotos e prognósticos arquivados.
const offlineBackupExportButton=document.getElementById('exportOfflineBackupBtn');
const offlineBackupImportButton=document.getElementById('importOfflineBackupBtn');
const offlineBackupFile=document.getElementById('offlineBackupFile');
if(offlineBackupExportButton)offlineBackupExportButton.addEventListener('click',async()=>{
  try{
    const data={format:'prognostico-v18-offline-backup',exportedAt:new Date().toISOString(),current:clone(state),archives:await archiveAll(),fontScale:localStorage.getItem('prognostico-font-scale')||'1'};
    downloadBytes(new TextEncoder().encode(JSON.stringify(data,null,2)),`prognostico-backup-${new Date().toISOString().slice(0,10)}.json`,'application/json;charset=utf-8');
    toast('Backup completo exportado');
  }catch(e){console.error(e);toast('Falha ao exportar backup')}
});
if(offlineBackupImportButton)offlineBackupImportButton.addEventListener('click',()=>offlineBackupFile?.click());
if(offlineBackupFile)offlineBackupFile.addEventListener('change',async()=>{
  const file=offlineBackupFile.files?.[0];if(!file)return;
  try{
    if(file.size>30*1024*1024)throw new Error('Backup excede 30 MB');
    const data=JSON.parse(await file.text());
    if(data?.format!=='prognostico-v18-offline-backup'||!data.current||!Array.isArray(data.archives))throw new Error('Formato de backup inválido');
    if(!confirm(`Importar backup de ${data.exportedAt||'data desconhecida'}? Os dados atuais em tela serão substituídos. Faça um backup antes de continuar.`))return;
    if(window.SaasBridge?.importBackup){await window.SaasBridge.importBackup(data);settingsModal.close();toast('Backup importado para a loja atual');return;}
    const cleanState=migrateState(data.current);
    for(const record of data.archives){
      if(typeof record?.id!=='string'||!record.snapshot||typeof record.period!=='string')continue;
      await archivePutLocal(record);
    }
    state=cleanState;saveState();
    if(data.fontScale!==undefined)applyFontScale(String(Math.min(1.3,Math.max(0.85,Number(data.fontScale)||1))));
    settingsModal.close();render();toast('Backup importado');
  }catch(e){console.error(e);alert(`Não foi possível importar: ${e.message}`)}
  finally{offlineBackupFile.value=''}
});
const offlineAccountBtn=document.getElementById('cloudAccountBtn');
if(offlineAccountBtn)offlineAccountBtn.onclick=()=>window.SaasBridge?.openAccount?.();
