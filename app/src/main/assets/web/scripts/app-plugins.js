/* MesHeures Extensions — V18.0.4 / Lot 5
   Format .mhplugin = JSON declaratif : manifest + html + css + script optionnel.
   Chaque extension tourne dans un iframe sandbox sans accès direct au DOM ou aux données MesHeures.
   API actuelle : snapshot, accordée uniquement si déclarée dans manifest.permissions.
*/
const MH_PLUGIN_KEY='mesheures_plugins_v1';
const MH_PLUGIN_FORMAT='MesHeures Plugin';
const MH_PLUGIN_MAX_BYTES=180000;
const MH_PLUGIN_ALLOWED_PERMISSIONS=['snapshot'];
const MH_PLUGIN_PERMISSION_LABELS={snapshot:'Lecture des statistiques du mois'};
const MH_PLUGIN_BUILTIN_VERSION='1.1.0';
const MH_BUILTIN_PLUGINS=[{
  id:'mes-droits-demo',name:'Mes Droits',version:MH_PLUGIN_BUILTIN_VERSION,author:'MesHeures',builtin:true,
  description:'Extension officielle de démonstration : consulte les statistiques autorisées et les paliers d’ancienneté.',
  permissions:['snapshot'],
  html:`<div class="mhx"><div class="eyebrow">MESHEURES · EXTENSION OFFICIELLE</div><h2>⚖️ Mes Droits</h2><p>Cette extension démontre le fonctionnement de l’API locale des plugins.</p><div id="out" class="box">Chargement…</div><button onclick="parent.postMessage({type:'mhx-request',action:'snapshot'},'*')">Actualiser</button></div>`,
  css:`body{font:15px system-ui;background:#0d1117;color:#e6edf3;margin:0;padding:18px}.mhx{max-width:600px;margin:auto}.eyebrow{font-size:10px;letter-spacing:1.5px;color:#7f8b99;font-weight:800}h2{margin:6px 0 8px}.box{background:#161b22;border:1px solid #30363d;border-radius:14px;padding:14px;margin:14px 0}.mut{color:#8b949e;font-size:12px}button{background:#238636;color:#fff;border:0;border-radius:10px;padding:10px 14px;font-weight:700}`,
  script:`window.addEventListener('message',e=>{if(e.data?.type!=='mhx-data')return;const s=e.data.snapshot||{};document.getElementById('out').innerHTML='<b>'+((s.ancPct??0)+'%')+'</b> d’ancienneté · <span class="mut">'+(s.trav??0)+' jour(s) travaillé(s) · '+(s.tte??'00h00')+' TTE ce mois</span>';});parent.postMessage({type:'mhx-request',action:'snapshot'},'*');`
}];
let MH_PLUGINS=[];
function mhLoadPlugins(){try{const x=JSON.parse(localStorage.getItem(MH_PLUGIN_KEY)||'[]');MH_PLUGINS=Array.isArray(x)?x:[]}catch(e){MH_PLUGINS=[]}}
function mhSavePlugins(){localStorage.setItem(MH_PLUGIN_KEY,JSON.stringify(MH_PLUGINS));}
function mhAllPlugins(){return [...MH_BUILTIN_PLUGINS,...MH_PLUGINS.filter(p=>!MH_BUILTIN_PLUGINS.some(b=>b.id===p.id))]}
function mhPluginSnapshot(){
  const m=mhMonthStats(curMonth||today().slice(0,7));
  const anc=calcAnc(DB.s.emb||DEF.emb);
  return {version:MH_V,month:curMonth,trav:m.trav,tte:F(m.tte),amp:F(m.amp),nuit:C2(m.nuit)+' h',alerts:m.alerts.length,ancPct:anc.pct,ancYears:anc.y,ancMonths:anc.m};
}
function mhPluginFrame(p){
  const html=p.html||'<p>Extension sans interface.</p>',css=p.css||'',script=p.script||'';
  const safeScript=script.replace(/<\/script/gi,'<\\/script');
  const src=`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'"><style>${css}</style></head><body>${html}<script>${safeScript}</script></body></html>`;
  const b64=btoa(unescape(encodeURIComponent(src)));
  return `<iframe class="mhx-frame" data-plugin-id="${esc(p.id)}" sandbox="allow-scripts" referrerpolicy="no-referrer" title="${esc(p.name)}" src="data:text/html;base64,${b64}"></iframe>`;
}
function mhPluginPerms(p){return (p.permissions||[]).map(x=>`<span title="${esc(MH_PLUGIN_PERMISSION_LABELS[x]||x)}">${esc(MH_PLUGIN_PERMISSION_LABELS[x]||x)}</span>`).join('')||'<span>Aucune donnée</span>'}
function mhRenderPlugins(){
  const host=$('mhPluginList');if(!host)return;
  const list=mhAllPlugins();
  host.innerHTML=list.map(p=>`<div class="mh-plugin-card"><div class="mh-plugin-top"><div class="mh-plugin-icon">🧩</div><div class="mh-plugin-info"><b>${esc(p.name)}</b><small>v${esc(p.version)} · ${esc(p.author||'Inconnu')}${p.builtin?' · officiel':''}</small></div><label class="mh-plugin-toggle"><input type="checkbox" ${p.enabled===false?'':'checked'} onchange="mhTogglePlugin('${esc(p.id)}',this.checked)"><span></span></label></div><p>${esc(p.description||'Aucune description.')}</p><div class="mh-plugin-perms">${mhPluginPerms(p)}</div>${p.enabled===false?'':'<div class="mh-plugin-body">'+mhPluginFrame(p)+'</div>'}${!p.builtin?`<button class="r" onclick="mhRemovePlugin('${esc(p.id)}')">Désinstaller</button>`:''}</div>`).join('');
}
function mhTogglePlugin(id,on){const p=MH_PLUGINS.find(x=>x.id===id);if(p){p.enabled=on;mhSavePlugins();mhRenderPlugins()}}
function mhRemovePlugin(id){if(!confirm('Désinstaller cette extension ?'))return;MH_PLUGINS=MH_PLUGINS.filter(x=>x.id!==id);mhSavePlugins();mhRenderPlugins()}
function mhPluginInfo(){alert('🧩 MesHeures Plugins V18.0.4\n\n• Format : .mhplugin (JSON)\n• Exécution : iframe sandboxé\n• Permission actuelle : snapshot uniquement\n• Pas d’accès direct au DOM MesHeures\n• Pas d’accès réseau depuis le cadre du plugin\n\nUne extension peut donc ajouter une fonction sans modifier le cœur de MesHeures.')}
function mhPluginExport(){
  const payload={format:MH_PLUGIN_FORMAT,exportVersion:1,appVersion:MH_V,plugins:MH_PLUGINS.map(({id,name,version,author,description,permissions,html,css,script,enabled})=>({id,name,version,author,description,permissions,html,css,script,enabled}))};
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='mesheures-plugins-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function mhImportPlugin(input){
  const f=input?.files?.[0];if(!f)return;
  const reader=new FileReader();reader.onload=()=>{try{
    if(f.size>MH_PLUGIN_MAX_BYTES)throw new Error('Extension trop volumineuse (180 Ko maximum).');
    const p=JSON.parse(reader.result);if(p.format!==MH_PLUGIN_FORMAT||!p.manifest?.id)throw new Error('Format .mhplugin invalide.');
    const m=p.manifest;if(!/^[a-z0-9._-]{3,60}$/.test(m.id))throw new Error('Identifiant d’extension invalide.');
    if(m.id.startsWith('mesheures-') && !MH_BUILTIN_PLUGINS.some(x=>x.id===m.id)) throw new Error('Préfixe mesheures- réservé aux extensions officielles.');
    if(!Array.isArray(m.permissions))m.permissions=[];
    const unknown=m.permissions.filter(x=>!MH_PLUGIN_ALLOWED_PERMISSIONS.includes(x));
    if(unknown.length)throw new Error('Permission non autorisée : '+unknown.join(', '));
    const clean={id:m.id,name:String(m.name||m.id).slice(0,80),version:String(m.version||'1.0.0').slice(0,20),author:String(m.author||'Inconnu').slice(0,80),description:String(m.description||'').slice(0,240),permissions:m.permissions,html:String(p.html||'').slice(0,50000),css:String(p.css||'').slice(0,30000),script:String(p.script||'').slice(0,50000),enabled:true};
    const permText=clean.permissions.map(x=>MH_PLUGIN_PERMISSION_LABELS[x]||x).join(', ')||'aucune donnée';
    if(!confirm(`Installer « ${clean.name} » v${clean.version} ?\n\nDonnées autorisées : ${permText}.\n\nL’extension sera exécutée dans un cadre isolé.`))return;
    MH_PLUGINS=MH_PLUGINS.filter(x=>x.id!==clean.id);MH_PLUGINS.push(clean);mhSavePlugins();mhRenderPlugins();alert('✅ Extension installée : '+clean.name);
  }catch(e){alert('❌ Extension refusée : '+e.message)}finally{input.value=''}};reader.readAsText(f);
}
window.addEventListener('message',e=>{
  if(e.data?.type!=='mhx-request' || !e.source)return;
  if(e.data.action==='snapshot'){
    const pluginFrame=e.source;
    const host=[...document.querySelectorAll('.mhx-frame')].find(x=>x.contentWindow===pluginFrame);
    if(!host)return;
    const card=host.closest('.mh-plugin-card');
    const id=host.dataset.pluginId;
    const p=MH_PLUGINS.find(x=>x.id===id) || MH_BUILTIN_PLUGINS.find(x=>x.id===id);
    if(!p || !(p.permissions||[]).includes('snapshot'))return;
    e.source.postMessage({type:'mhx-data',snapshot:mhPluginSnapshot()},'*');
  }
});
mhLoadPlugins();
window.mhPluginInfo=mhPluginInfo;window.mhPluginExport=mhPluginExport;window.mhRenderPlugins=mhRenderPlugins;
