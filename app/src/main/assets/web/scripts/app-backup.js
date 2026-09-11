/* MesHeures V17 — sauvegarde locale et JSON versionné */
(function(){
  const PREFIX=LS+'_v17_backup_';
  function snapshot(){return {format:'MesHeures Backup',version:'17.0.0',createdAt:new Date().toISOString(),data:JSON.parse(JSON.stringify(DB))};}
  function prune(){
    const keys=Object.keys(localStorage).filter(k=>k.indexOf(PREFIX)===0).sort();
    while(keys.length>5)localStorage.removeItem(keys.shift());
  }
  window.mhV17Backup=function(reason){try{const s=snapshot(),key=PREFIX+Date.now();localStorage.setItem(key,JSON.stringify(s));localStorage.setItem(LS+'_v17_last',s.createdAt);prune();return true}catch(e){console.warn('Backup V17',e);return false}};
  window.mhV17Export=function(){
    mhV17Backup('export');
    const blob=new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='MesHeures-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  };
  window.mhV17Import=function(input){
    const f=input?.files?.[0];if(!f)return;
    const r=new FileReader();r.onload=e=>{try{
      const raw=JSON.parse(e.target.result),data=raw?.format==='MesHeures Backup'?raw.data:raw;
      if(!data?.days)throw new Error('Structure JSON MesHeures non reconnue.');
      mhV17Backup('before-import');
      if(!confirm('Importer cette sauvegarde V17 ? Une copie de sécurité vient d’être créée.'))return;
      DB={...DB,...data,s:{...DEF,...(data.s||{})},per:{...DB.per,...(data.per||{})}};save();renderAll();alert('✅ Sauvegarde importée.');
    }catch(err){alert('❌ Import impossible : '+err.message)}finally{input.value=''}};r.readAsText(f);
  };
  window.mhV17ListBackups=function(){return Object.keys(localStorage).filter(k=>k.indexOf(PREFIX)===0).sort().reverse().map(k=>{try{const s=JSON.parse(localStorage.getItem(k));return {key:k,date:s.createdAt}}catch(e){return null}}).filter(Boolean)};
  window.mhV17Restore=function(key){try{const s=JSON.parse(localStorage.getItem(key));if(!s?.data?.days)throw new Error('Sauvegarde invalide');mhV17Backup('before-restore');if(!confirm('Restaurer cette sauvegarde locale ?'))return;DB={...DB,...s.data,s:{...DEF,...(s.data.s||{})}};save();renderAll();alert('✅ Restauration terminée.')}catch(e){alert('❌ Restauration impossible : '+e.message)}};
})();
