/* Controle online do Prognóstico Mensal. Nenhuma senha nem chave de servidor neste arquivo. */
(()=>{
  'use strict';
  const root=document.getElementById('saasAuthRoot');
  const toolbar=document.getElementById('saasToolbar');
  const $=id=>document.getElementById(id);
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const roleName={master:'Master',gerente:'Gerente',supervisor:'Supervisor',franqueado:'Franqueado'};
  const todayMonth=()=>new Date().toISOString().slice(0,7);
  const bridge={user:null,stores:[],store:null,period:null,suspend:true,pending:null,timer:null,inflight:Promise.resolve(),isOnline:true,exampleData:false};
  window.SaasBridge=bridge;

  function status(text,err=false){const el=$('saasSaveStatus');if(el){el.textContent=text;el.style.color=err?'#ffc0c0':'#9ce3be'}}
  async function api(url,method='GET',body=null){
    const headers={Accept:'application/json'};
    if(body!==null)headers['Content-Type']='application/json';
    if(!['GET','HEAD'].includes(method))headers['X-CSRF-Token']=bridge.user?.csrf||'';
    let response;
    try{response=await fetch(url,{method,headers,credentials:'same-origin',cache:'no-store',body:body===null?undefined:JSON.stringify(body)})}
    catch{throw new Error('Sem conexão com o servidor. Verifique a internet e tente novamente.');}
    let result={};try{result=await response.json()}catch{}
    if(!response.ok){if(response.status===401&&bridge.user){bridge.user=null;bridge.suspend=true;showLogin('Sua sessão expirou. Entre novamente.')}throw new Error(result.error||'Erro ao comunicar com o servidor')}
    return result;
  }
  function hideApp(){document.body.classList.add('saas-auth-pending');toolbar.hidden=true}
  function showApp(){document.body.classList.remove('saas-auth-pending');root.innerHTML='';toolbar.hidden=false}
  function showLogin(msg=''){
    hideApp();bridge.user=null;bridge.store=null;bridge.suspend=true;
    root.innerHTML=`<div class="saas-login-wrap"><form class="saas-login" id="saasLoginForm" autocomplete="on"><img src="assets/logo-vermelha.png" alt="Chilli Beans"><h2>Entrar no Prognóstico</h2><p>Gestão online segura da sua loja ou rede. Entre com o usuário Master ou o e-mail da sua conta.</p><label for="saasLogin">Usuário ou e-mail</label><input id="saasLogin" required autocomplete="username" maxlength="254" placeholder="Usuário Master ou e-mail"><label for="saasPassword">Senha</label><input id="saasPassword" required type="password" autocomplete="current-password" placeholder="Sua senha"><button id="saasLoginButton" type="submit">Entrar no sistema</button><div class="auth-error" id="saasLoginError" role="alert">${escape(msg)}</div></form></div>`;
    $('saasLoginForm').onsubmit=async event=>{event.preventDefault();const button=$('saasLoginButton');button.disabled=true;button.textContent='Entrando...';$('saasLoginError').textContent='';try{
      const result=await api('/api/login','POST',{login:$('saasLogin').value.trim(),password:$('saasPassword').value});
      bridge.user=result.user;await afterLogin();
    }catch(e){$('saasLoginError')&&($('saasLoginError').textContent=e.message)}finally{if(button.isConnected){button.disabled=false;button.textContent='Entrar no sistema'}}};
  }
  function renderToolbar(){
    const u=bridge.user;if(!u)return;
    toolbar.innerHTML=`<strong>${escape(u.name)} · ${roleName[u.role]||escape(u.role)}</strong><label for="saasStoreSelect">Loja:</label><select id="saasStoreSelect" aria-label="Selecionar loja">${bridge.stores.map(st=>`<option value="${escape(st.id)}" ${st.id===bridge.store?.id?'selected':''}>${escape(st.name)} · ${st.type==='optica'?'Ótica':'Vermelha'}</option>`).join('')}</select>${bridge.exampleData?'<span class="saas-example-badge" title="Valores de demonstração, recuperados da V18.8">EXEMPLO AGO/2026</span>':''}<span class="saas-save-status" id="saasSaveStatus">Conectado</span>${u.role==='master'?'<button type="button" id="saasManagerBtn">⚙ Lojas e usuários</button>':''}<button type="button" id="saasPasswordBtn">Alterar senha</button><button type="button" id="saasLogoutBtn">Sair</button>`;
    $('saasStoreSelect').disabled=u.role==='gerente'||bridge.stores.length<=1;
    $('saasStoreSelect').onchange=async e=>{try{const target=bridge.stores.find(x=>x.id===e.target.value);await selectStore(e.target.value,target?.latestPeriod||todayMonth())}catch(err){alert(err.message);e.target.value=bridge.store?.id||''}};
    if(u.role==='master')$('saasManagerBtn').onclick=openManager;
    $('saasLogoutBtn').onclick=logout;
    $('saasPasswordBtn').onclick=changePassword;

  }
  async function loadStores(){const data=await api('/api/stores');bridge.stores=data.stores||[];return bridge.stores}
  async function afterLogin(){
    await loadStores();
    if(!bridge.stores.length){hideApp();showEmptyStores();return}
    const previous=bridge.store?.id;
    const first=bridge.stores.find(st=>st.id===previous)||bridge.stores[0];
    await selectStore(first.id,first.latestPeriod||todayMonth(),true);
  }
  function showEmptyStores(){
    hideApp();root.innerHTML=`<div class="saas-login-wrap"><div class="saas-login"><h2>Nenhuma loja cadastrada</h2><p>${bridge.user?.role==='master'?'Use a administração para cadastrar a primeira unidade antes de iniciar o prognóstico.':'Sua conta ainda não possui uma loja disponível. Fale com o administrador Master.'}</p><button type="button" id="saasEmptyAction">${bridge.user?.role==='master'?'Criar primeira loja':'Sair'}</button></div></div>`;
    $('saasEmptyAction').onclick=()=>bridge.user?.role==='master'?openManager():logout();
  }
  bridge.queueSnapshot=snapshot=>{
    if(bridge.suspend||!bridge.user||!bridge.store)return;
    bridge.pending={storeId:bridge.store.id,period:snapshot.current.period,snapshot};
    status('Alterações pendentes');
    clearTimeout(bridge.timer);bridge.timer=setTimeout(()=>bridge.flush().catch(e=>status(e.message,true)),900);
  };
  bridge.flush=async()=>{
    clearTimeout(bridge.timer);
    const item=bridge.pending;
    if(!item)return bridge.inflight;
    bridge.pending=null;
    bridge.inflight=bridge.inflight.catch(()=>{}).then(async()=>{
      status('Salvando...');
      try{await api(`/api/stores/${encodeURIComponent(item.storeId)}/forecast?period=${encodeURIComponent(item.period)}`,'PUT',{snapshot:item.snapshot});status('✓ Salvo na nuvem')}
      catch(e){bridge.pending=bridge.pending||item;status(e.message,true);throw e}
    });
    return bridge.inflight;
  };
  async function selectStore(id,period=todayMonth(),startup=false){
    if(!bridge.user)throw new Error('Faça login primeiro');
    const target=bridge.stores.find(x=>x.id===id);
    if(!target)throw new Error('Loja indisponível para sua conta');
    if(!startup)await bridge.flush();
    bridge.suspend=true;
    try{
      const data=await api(`/api/stores/${encodeURIComponent(id)}/forecast?period=${encodeURIComponent(period)}`);
      const raw=data.snapshot ? {...data.snapshot,store:target.name,storeType:target.type} : window.__makeBlankForecast(target.name,target.type,period);
      bridge.store=target;bridge.period=period;bridge.exampleData=Boolean(data.snapshot?.exampleData);
      window.__setForecastState(raw);
      showApp();renderToolbar();
      status(bridge.exampleData?'Exemplo de agosto (dados demonstrativos)':data.snapshot?'Prognóstico carregado':'Mês sem lançamentos');
    }finally{bridge.suspend=false}
  }
  bridge.selectPeriod=async period=>{
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))return;
    if(!bridge.store)return;
    try{await selectStore(bridge.store.id,period)}catch(e){alert(e.message);$('monthInput').value=bridge.period||todayMonth()}
  };
  window.CloudForecast={
    ready:()=>Boolean(bridge.user&&bridge.store),
    authenticated:()=>Boolean(bridge.user),
    cloudStoreName:()=>bridge.store?.name||'',
    describeStorage:()=>`Banco online · ${bridge.store?.name||''}`,
    refreshUi:renderToolbar,
    archiveAll:async()=>{if(!bridge.store)return [];return (await api(`/api/stores/${bridge.store.id}/archives`)).records||[]},
    archiveGet:async recordId=>{if(!bridge.store)return null;try{return await api(`/api/stores/${bridge.store.id}/archives/${encodeURIComponent(recordId)}`)}catch(e){if(e.message==='Arquivo não encontrado')return null;throw e}},
    archivePut:async record=>{await bridge.flush();await api(`/api/stores/${bridge.store.id}/archives/${encodeURIComponent(record.id)}`,'PUT',record);return record},
    archiveDelete:async recordId=>{await api(`/api/stores/${bridge.store.id}/archives/${encodeURIComponent(recordId)}`,'DELETE')}
  };
  bridge.saveSettings=async(name,type)=>{
    if(!bridge.store)return;
    if(bridge.user.role!=='master'){alert('Somente o usuário Master pode alterar o nome e tipo da loja.');return}
    if(name.length<2||!['vermelha','optica'].includes(type)){alert('Informe o nome da loja e o tipo.');return}
    try{await bridge.flush();await api(`/api/stores/${bridge.store.id}`,'PATCH',{name,type});await loadStores();$('settingsModal').close();await selectStore(bridge.store.id,bridge.period);}
    catch(e){alert(e.message)}
  };
  bridge.openAccount=()=>{if(bridge.user?.role==='master')openManager();else alert(`Conectado como ${bridge.user?.name||''} (${roleName[bridge.user?.role]||''}).\nLoja: ${bridge.store?.name||''}`)};
  bridge.importBackup=async backup=>{
    if(!bridge.store)throw new Error('Selecione uma loja antes de importar');
    if(!confirm(`Importar backup para ${bridge.store.name}? Isso substitui o prognóstico aberto e grava os meses no banco online.`))return;
    await bridge.flush();
    const snapshot={...backup.current,store:bridge.store.name,storeType:bridge.store.type};
    if(!snapshot.current||!/^\d{4}-(0[1-9]|1[0-2])$/.test(snapshot.current.period))throw new Error('Backup sem período válido');
    const slug=bridge.store.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'loja';
    for(const r of backup.archives||[]){
      if(!r?.snapshot||!/^\d{4}-(0[1-9]|1[0-2])$/.test(r.period))continue;
      const id=`${slug}__${r.period}`;
      const record={...r,id,store:bridge.store.name,snapshot:{...r.snapshot,store:bridge.store.name,storeType:bridge.store.type}};
      await api(`/api/stores/${bridge.store.id}/archives/${encodeURIComponent(id)}`,'PUT',record);
    }
    await selectStore(bridge.store.id,snapshot.current.period);
    bridge.suspend=true;
    try{window.__setForecastState(snapshot)}finally{bridge.suspend=false}
    bridge.queueSnapshot(window.__getForecastState());await bridge.flush();
    window.renderDatabase?.();
  };
  async function changePassword(){
    if(!bridge.user)return;
    document.getElementById('saasPasswordShade')?.remove();
    document.body.insertAdjacentHTML('beforeend',`<div class="saas-manager-shade" id="saasPasswordShade"><form class="saas-manager" style="max-width:440px" id="saasPasswordForm"><div class="saas-manager-header"><h2>Alterar minha senha</h2><button type="button" class="saas-close" id="saasPasswordClose">×</button></div><div class="saas-form-grid"><label class="full">Senha atual<input id="saasOldPassword" type="password" required autocomplete="current-password"></label><label class="full">Nova senha (12 caracteres ou mais)<input id="saasNewPassword" type="password" minlength="12" required autocomplete="new-password"></label><label class="full">Repetir nova senha<input id="saasNewPasswordConfirm" type="password" minlength="12" required autocomplete="new-password"></label><button type="submit">Atualizar senha</button></div><p class="manager-feedback" role="alert" id="saasPasswordError"></p></form></div>`);
    $('saasPasswordClose').onclick=()=>$('saasPasswordShade').remove();
    $('saasPasswordForm').onsubmit=async(e)=>{e.preventDefault();const a=$('saasNewPassword').value,b=$('saasNewPasswordConfirm').value;if(a!==b){$('saasPasswordError').textContent='As novas senhas não coincidem.';return}
      try{await api('/api/me/password','PATCH',{currentPassword:$('saasOldPassword').value,newPassword:a});$('saasPasswordShade').remove();alert('Senha atualizada.')}catch(err){$('saasPasswordError').textContent=err.message}
    };
  }
  async function logout(){
    try{await bridge.flush();await api('/api/logout','POST',{})}catch{}
    bridge.user=null;bridge.store=null;bridge.pending=null;bridge.suspend=true;
    showLogin('Você saiu da sua conta.');
  }
  // A configuração cadastral da loja é controlada pelo Master.
  const restrictSettings=()=>{
    if(bridge.user?.role!=='master'){
      $('settingsStoreName').readOnly=true;$('settingsStoreType').disabled=true;$('saveSettingsBtn').style.display='none';
    }else{
      $('settingsStoreName').readOnly=false;$('settingsStoreType').disabled=false;$('saveSettingsBtn').style.display='';
    }
  };
  document.getElementById('settingsBtn').addEventListener('click',restrictSettings);
  document.getElementById('openStoreSettingsBtn').addEventListener('click',restrictSettings);
  $('resetDemoBtn')?.remove();
  // Nenhum prognóstico aparece antes da autenticação.
  let editId=null;
  function managerHtml(){
    const opts=bridge.stores.map(st=>`<option value="${escape(st.id)}">${escape(st.name)}</option>`).join('');
    return `<div class="saas-manager-shade" id="saasManagerShade"><section class="saas-manager" role="dialog" aria-modal="true" aria-label="Administração de lojas e usuários">
      <div class="saas-manager-header"><h2>Administração Master</h2><button class="saas-close" type="button" id="saasCloseManager" aria-label="Fechar">×</button></div>
      <p class="saas-info">Cadastre as lojas antes dos gerentes. Gerente vê apenas sua loja. Supervisor e Franqueado podem consultar todas as lojas. Somente Master cria contas.</p>
      <h3>Lojas cadastradas</h3><div class="saas-form-grid"><label>Nome da loja<input id="saasNewStoreName" placeholder="Ex.: Capim Dourado" maxlength="80"></label><label>Tipo de loja<select id="saasNewStoreType"><option value="vermelha">Loja Vermelha</option><option value="optica">Ótica Chilli Beans</option></select></label><button type="button" id="saasCreateStore">＋ Criar loja</button></div>
      <div class="saas-table-wrap"><table><thead><tr><th>Nome</th><th>Tipo</th><th>Ação</th></tr></thead><tbody id="saasStoreTable">${bridge.stores.map(st=>`<tr><td>${escape(st.name)}</td><td>${st.type==='optica'?'Ótica':'Vermelha'}</td><td><button class="secondary" data-store-select="${escape(st.id)}" type="button">Abrir</button></td></tr>`).join('')}</tbody></table></div>
      <h3 id="saasUserFormTitle">Criar usuário</h3><div class="saas-form-grid">
      <label>Nome completo<input id="saasUserName" maxlength="80" placeholder="Nome e sobrenome"></label>
      <label>E-mail de login<input id="saasUserEmail" type="email" maxlength="254" placeholder="nome@empresa.com"></label>
      <label>Senha <small>(mínimo 12 caracteres; ao editar, deixe vazia para manter)</small><input id="saasUserPassword" type="password" autocomplete="new-password" placeholder="Senha segura"></label>
      <label>Tipo de conta<select id="saasUserRole"><option value="gerente">Gerente</option><option value="supervisor">Supervisor</option><option value="franqueado">Franqueado</option></select></label>
      <label class="full" id="saasUserStoreLabel">Loja do gerente<select id="saasUserStore"><option value="">Selecione a loja</option>${opts}</select></label>
      <button type="button" id="saasSaveUser">Criar usuário</button><button class="secondary" type="button" id="saasCancelUser" hidden>Cancelar edição</button>
      </div><div class="manager-feedback" id="saasManagerError" role="alert"></div>
      <h3>Usuários cadastrados</h3><div class="saas-table-wrap"><table><thead><tr><th>Nome</th><th>Conta</th><th>E-mail</th><th>Loja</th><th>Status / Ações</th></tr></thead><tbody id="saasUsersTable"></tbody></table></div></section></div>`;
  }
  async function openManager(){
    if(bridge.user?.role!=='master')return;
    document.getElementById('saasManagerShade')?.remove();
    document.body.insertAdjacentHTML('beforeend',managerHtml());
    $('saasCloseManager').onclick=()=>{$('saasManagerShade').remove();if(!bridge.stores.length)showEmptyStores()};
    $('saasUserRole').onchange=()=>{$('saasUserStoreLabel').style.display=$('saasUserRole').value==='gerente'?'flex':'none'};
    $('saasCreateStore').onclick=async()=>{
      const name=$('saasNewStoreName').value.trim(),type=$('saasNewStoreType').value;
      try{const result=await api('/api/stores','POST',{name,type});await loadStores();$('saasManagerShade').remove();await selectStore(result.store.id,todayMonth(),true);openManager()}catch(e){$('saasManagerError').textContent=e.message}
    };
    $('saasSaveUser').onclick=async()=>{
      const name=$('saasUserName').value.trim(),email=$('saasUserEmail').value.trim(),password=$('saasUserPassword').value,role=$('saasUserRole').value,storeId=$('saasUserStore').value;
      const payload={name,email,role,storeId};if(password||!editId)payload.password=password;
      try{
        await api(editId?`/api/users/${editId}`:'/api/users',editId?'PATCH':'POST',payload);
        editId=null;$('saasUserName').value='';$('saasUserEmail').value='';$('saasUserPassword').value='';$('saasUserRole').value='gerente';$('saasUserStore').value='';$('saasUserStoreLabel').style.display='flex';$('saasSaveUser').textContent='Criar usuário';$('saasCancelUser').hidden=true;$('saasUserFormTitle').textContent='Criar usuário';
        await fillUsers();$('saasManagerError').textContent='Usuário salvo com sucesso.';
      }catch(e){$('saasManagerError').textContent=e.message}
    };
    $('saasCancelUser').onclick=()=>{editId=null;$('saasUserFormTitle').textContent='Criar usuário';$('saasSaveUser').textContent='Criar usuário';$('saasCancelUser').hidden=true;$('saasUserName').value='';$('saasUserEmail').value='';$('saasUserPassword').value=''};
    document.querySelectorAll('[data-store-select]').forEach(btn=>btn.onclick=async()=>{$('saasManagerShade').remove();await selectStore(btn.dataset.storeSelect)});
    await fillUsers();
  }
  async function fillUsers(){
    const {users}=await api('/api/users');
    $('saasUsersTable').innerHTML=users.filter(u=>u.role!=='master').map(u=>{
      const store=bridge.stores.find(st=>st.id===u.storeId);
      return `<tr><td>${escape(u.name)}</td><td>${roleName[u.role]||''}</td><td>${escape(u.email||'')}</td><td>${escape(store?.name||'Todas as lojas')}</td><td>${u.active?'Ativo':'Desativado'} <button type="button" class="secondary" data-edit-user="${u.id}">Editar</button> <button class="${u.active?'warn':'secondary'}" data-toggle-user="${u.id}">${u.active?'Desativar':'Ativar'}</button></td></tr>`
    }).join('')||'<tr><td colspan="5">Nenhum usuário criado.</td></tr>';
    document.querySelectorAll('[data-edit-user]').forEach(b=>b.onclick=()=>{
      const u=users.find(x=>x.id===b.dataset.editUser);if(!u)return;
      editId=u.id;$('saasUserFormTitle').textContent='Editar usuário';$('saasSaveUser').textContent='Salvar alterações';$('saasCancelUser').hidden=false;
      $('saasUserName').value=u.name;$('saasUserEmail').value=u.email||'';$('saasUserPassword').value='';$('saasUserRole').value=u.role;$('saasUserStore').value=u.storeId||'';$('saasUserStoreLabel').style.display=u.role==='gerente'?'flex':'none';$('saasUserName').focus()
    });
    document.querySelectorAll('[data-toggle-user]').forEach(b=>b.onclick=async()=>{
      const u=users.find(x=>x.id===b.dataset.toggleUser);if(!u)return;
      if(!confirm(`${u.active?'Desativar':'Ativar'} o usuário ${u.name}?`))return;
      try{await api(`/api/users/${u.id}`,'PATCH',{active:!u.active});await fillUsers()}catch(e){$('saasManagerError').textContent=e.message}
    });
  }
  (async()=>{
    hideApp();
    try{const data=await api('/api/me');bridge.user=data.user;await afterLogin()}
    catch(e){if(!bridge.user)showLogin('')}
  })();
})();
