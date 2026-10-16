import { DEFAULT_CATEGORIES, categories, categoryId, clampLevel, levelPercent, removeState } from './customization.js';
import { bindLauncher } from './launcher.js';
import { migrateLegacy } from './migration.js';
import { ensureBardFolder, organiseBardPlaylists } from './folders.js';
import { renderMixerUI } from './ui.js';
import { openCatalogue } from './online.js';
const ID = 'bard-academia';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const flag = d => d.getFlag(ID, 'config');
const managed = () => game.playlists.filter(p => flag(p));
let app;
let chain = Promise.resolve();
function enqueue(fn, propagate=false) {
  const job = chain.then(async () => { if (!game.user.isGM) return; await fn(); });
  chain = job.catch(e => { console.error(ID, e); ui.notifications.error(`Bard Academia : ${e.message}`); })
    .finally(() => { if (app?.rendered) app.render({force:true}); });
  return propagate ? job : chain;
}
function config(p) { return foundry.utils.deepClone(flag(p)); }
async function mix(p, cfg = config(p)) {
  const updates = p.sounds.map(s => {
    const f = flag(s);
    if (!f || f.channel === 'fx') return null;
    const level = clampLevel(cfg[f.channel],cfg);
    const low=Math.floor(level), high=Math.ceil(level), fraction=level-low;
    const gain = f.muted ? 0 : ((f.gains[low]??0)*(1-fraction)+(f.gains[high]??0)*fraction)*(f.trim??1);
    return {_id:s.id, playing:cfg.live && gain > 0, volume:gain * cfg.volume[f.channel], pausedTime:null};
  }).filter(Boolean);
  if (updates.length) await p.updateEmbeddedDocuments('PlaylistSound', updates);
}
async function stop(p) {
  await p.updateEmbeddedDocuments('PlaylistSound', p.sounds.map(s => ({_id:s.id, playing:false, pausedTime:null})));
  const c = config(p); c.live = false; await p.setFlag(ID, 'config', c);
}
class BardAcademia extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {id:ID, classes:['bard-academia'], window:{title:'Bard Academia', resizable:true}, position:{width:600,height:800}};
  selected = null;
  view = 'places';
  category = 'all';
  query = '';
  editing = false;
  async _renderHTML() {
    const all=managed();
    const selected=all.find(x=>x.id===this.selected)??all.find(x=>flag(x).live)??all[0];
    this.selected=selected?.id;
    return renderMixerUI(this,all,selected);
  }
  _replaceHTML(result, content) {
    const viewKey=`${this.view}:${this.editing}`;
    const previousScroll=this._lastView===viewKey?(content.querySelector('.ba-scroll')?.scrollTop??0):0;
    content.innerHTML = result;
    const scroller=content.querySelector('.ba-scroll');if(scroller)scroller.scrollTop=previousScroll;
    this._lastView=viewKey;
    content.onclick = e => {
      const b = e.target.closest('[data-do]'); if (!b) return;
      e.preventDefault();
      const action = b.dataset.do;
      if (action==='select') {this.selected=b.dataset.id;this.view='mix';this.editing=false;this.render({force:true});return;}
      if(action==='view'){this.view=b.dataset.view;this.editing=false;this.render({force:true});return;}
      if(action==='categories'){this.view='categories';this.editing=false;this.render({force:true});return;}
      if(action==='filter'){this.category=b.dataset.filter;this.render({force:true});return;}
      if(action==='edit'){this.editing=!this.editing;this.view='mix';this.render({force:true});return;}
      const p = game.playlists.get(this.selected);
      if(action==='online'){openCatalogue({getTargets:()=>managed(),addSound});return;}
      if(action==='cover'&&p){new foundry.applications.apps.FilePicker({type:'image',callback:path=>enqueue(async()=>{const c=config(p);c.cover=path;await p.setFlag(ID,'config',c);})}).render({force:true});return;}
      if (action==='add' && p) {
        const channel = b.dataset.channel;
        new foundry.applications.apps.FilePicker({type:'audio', callback:path => enqueue(async()=>{
          let name=path.split('/').pop(); try{name=decodeURIComponent(name);}catch{}
          await p.createEmbeddedDocuments('PlaylistSound', [{name,path,repeat:channel!=='fx',volume:0.7,fade:channel==='fx'?0:2000,flags:{[ID]:{config:{channel,gains:config(p).labels.map(()=>0.7)}}}}]);
          if (config(p).live) await mix(p);
        })}).render({force:true}); return;
      }
      enqueue(async()=>{
        if(action==='categoryAdd'||action==='categoryRename') {
          const list=foundry.utils.deepClone(categories());
          const item=list.find(x=>x.id===b.dataset.id);
          if(action==='categoryRename'&&!item)return;
          const name=await foundry.applications.api.DialogV2.prompt({window:{title:item?'Renommer la catégorie':'Nouvelle catégorie'},content:`<label>Nom <input name="name" maxlength="80" value="${esc(item?.name??'')}" placeholder="Grottes, Espace…"></label>`,ok:{label:'Enregistrer',callback:(e,b)=>b.form.elements.name.value.trim()}});
          if(!name)return;
          if(list.some(x=>x.id!==item?.id&&x.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw new Error('Cette catégorie existe déjà.');
          if(item)item.name=name;else list.push({id:foundry.utils.randomID(),name});
          await game.settings.set(ID,'categories',list);return;
        }
        if(action==='categoryRemove') {
          const list=categories(), item=list.find(x=>x.id===b.dataset.id);if(!item)return;
          const affected=managed().filter(x=>categoryId(x)===item.id);
          if(!await foundry.applications.api.DialogV2.confirm({window:{title:'Supprimer la catégorie ?'},content:`<p>Supprimer « ${esc(item.name)} » ? ${affected.length} lieu(x) seront conservés dans « Sans catégorie », avec leurs sons et réglages.</p>`}))return;
          for(const x of affected){const c=config(x);c.category='';await x.setFlag(ID,'config',c);}
          await game.settings.set(ID,'categories',list.filter(x=>x.id!==item.id));
          if(this.category===item.id)this.category='all';return;
        }
        if(action==='starter'){await installStarter();return;}
        if(action==='new') {
          const n=await foundry.applications.api.DialogV2.prompt({window:{title:'Nouvelle ambiance'},content:'<label>Nom <input name="name" value="Taverne"></label>',ok:{label:'Créer',callback:(e,b)=>b.form.elements.name.value.trim()}});
          if(!n)return;
          const folder=await ensureBardFolder();
          const created=await foundry.documents.Playlist.create({name:n,folder:folder.id,mode:-1,fade:2000,flags:{[ID]:{config:{category:categories().some(x=>x.id===this.category)?this.category:'',labels:['Calme','Animée','Agitée'],music:0,background:0,volume:{music:0.7,background:0.7},live:false}}}});
          this.selected=created.id;this.view='mix';this.editing=true;return;
        }
        if(action==='stopAll'){for(const x of managed())await stop(x);return;}
        if(!p)return;
        if(action==='stateAdd') {
          const name=await foundry.applications.api.DialogV2.prompt({window:{title:'Nouvel état'},content:'<label>Nom <input name="name" maxlength="80" placeholder="Nuit, Orage…"></label>',ok:{label:'Ajouter',callback:(e,b)=>b.form.elements.name.value.trim()}});
          if(!name)return;
          const c=config(p);
          const updates=p.sounds.filter(s=>flag(s)&&flag(s).channel!=='fx').map(s=>{
            const f=foundry.utils.deepClone(flag(s));
            f.gains=Array.from({length:c.labels.length},(_,i)=>f.gains?.[i]??0);
            f.gains.push(0);return {_id:s.id,[`flags.${ID}.config`]:f};
          });
          if(updates.length)await p.updateEmbeddedDocuments('PlaylistSound',updates);
          c.labels.push(name);await p.setFlag(ID,'config',c);return;
        }
        if(action==='stateRemove') {
          const c=config(p), index=Number(b.dataset.level);
          if(c.labels.length<=1)throw new Error('Conservez au moins un état.');
          if(!await foundry.applications.api.DialogV2.confirm({window:{title:'Supprimer cet état ?'},content:`<p>Supprimer « ${esc(c.labels[index])} » et ses niveaux ? Les pistes et les autres états seront conservés.</p>`}))return;
          const updates=removeState(c,Array.from(p.sounds),index);
          if(updates.length)await p.updateEmbeddedDocuments('PlaylistSound',updates);
          await p.setFlag(ID,'config',c);await mix(p,c);return;
        }
        if(action==='stop')return stop(p);
        if(action==='resetCover'){const c=config(p);delete c.cover;await p.setFlag(ID,'config',c);}
        if(action==='mute'){const sound=p.sounds.get(b.dataset.id),f=foundry.utils.deepClone(flag(sound));f.muted=!f.muted;await sound.setFlag(ID,'config',f);await mix(p);}
        if(action==='play') {
          if(!p.sounds.size){ui.notifications.warn('Ajoutez au moins un fichier sonore.');return;}
          for(const x of managed())if(x.id!==p.id && (config(x).live||x.sounds.some(s=>s.playing)))await stop(x);
          const c=config(p);c.live=true;await p.setFlag(ID,'config',c);await mix(p,c);
        }
        if(action==='level'){const c=config(p);c.music=c.background=clampLevel(b.dataset.level,c);await p.setFlag(ID,'config',c);await mix(p,c);}
        if(action==='remove') {
          if(await foundry.applications.api.DialogV2.confirm({window:{title:'Retirer la piste ?'},content:'<p>Le fichier audio sera conservé.</p>'}))await p.deleteEmbeddedDocuments('PlaylistSound',[b.dataset.id]);
        }
        if(action==='fx'){const s=p.sounds.get(b.dataset.id);await s.update({playing:false,pausedTime:null});await s.update({playing:true,pausedTime:null});}
      });
    };
    content.oninput=e=>{if(e.target.dataset.field==='intensity'){const out=e.target.closest('label')?.querySelector('output');if(out)out.value=levelPercent(e.target.value,config(game.playlists.get(this.selected)))+' %';}};
    content.onchange = e => {
      const el=e.target, field=el.dataset.field;if(!field)return;
      if(field==='search'){this.query=el.value;this.render({force:true});return;}
      const p=game.playlists.get(this.selected);if(!p)return;
      const value=el.value, channel=el.dataset.channel, index=Number(el.dataset.level), sid=el.closest('[data-sound]')?.dataset.sound;
      enqueue(async()=>{
        if(field==='name'){if(value.trim())await p.update({name:value.trim()});return;}
        if(field==='trim'){const s=p.sounds.get(sid),f=foundry.utils.deepClone(flag(s));f.trim=Math.max(0,Math.min(1,Number(value)||0));await s.setFlag(ID,'config',f);await mix(p);return;}
        if(field==='gain'){const s=p.sounds.get(sid),f=foundry.utils.deepClone(flag(s));f.gains[index]=Math.max(0,Math.min(100,Number(value)||0))/100;await s.setFlag(ID,'config',f);await mix(p);return;}
        const c=config(p);
        if(field==='level')c[channel]=clampLevel(value,c);
        if(field==='intensity')c.music=c.background=clampLevel(value,c);
        if(field==='category')c.category=categories().some(x=>x.id===value)?value:'';
        if(field==='volume')c.volume[channel]=Math.max(0,Math.min(1,Number(value)||0));
        if(field==='label')c.labels[index]=value.trim()||`État ${index+1}`;
        await p.setFlag(ID,'config',c);
        if(field!=='label')await mix(p,c);
      });
    };
  }
}
function toggle(){if(!game.user.isGM)return;app??=new BardAcademia();return app.rendered?app.close():app.render({force:true});}
Hooks.on('getSceneControlButtons', controls => {
  if(!game.user.isGM)return;
  controls[ID]={name:ID,title:'Bard Academia',icon:'ba-single-note',order:90,visible:true,activeTool:'mixer',tools:{mixer:{name:'mixer',title:'Ouvrir / fermer le mixeur',icon:'fa-solid fa-sliders',order:0,button:true,onChange:toggle}}};
});
// Handle only an explicit click on our note, including when its group is already active.
Hooks.on('renderSceneControls', (controls, html) => bindLauncher(html, toggle));
Hooks.once('init',()=>{
  game.settings.register(ID,'categories',{scope:'world',config:false,type:Array,default:DEFAULT_CATEGORIES,onChange:()=>{if(app?.rendered)app.render({force:true});}});
  game.keybindings.register(ID,'toggle',{name:'Ouvrir / fermer Bard Academia',editable:[{key:'KeyB',modifiers:['Alt']}],restricted:true,onDown:()=>{toggle();return true;}});
});
Hooks.once('ready',()=>{
  game.modules.get(ID).api={toggle};
  const leader=game.users.filter(u=>u.active&&u.isGM).sort((a,b)=>a.id.localeCompare(b.id))[0];
  if(game.user.isGM&&leader?.id===game.user.id)enqueue(async()=>{await migrateLegacy();await organiseBardPlaylists();});
});

async function addSound(target, {name,path,channel,credit}) {
  return enqueue(async()=>{
    const p=game.playlists.get(target);
    if(!p || !flag(p))throw new Error('Ambiance introuvable. Le fichier importé reste dans le dossier du monde.');
    await p.createEmbeddedDocuments('PlaylistSound',[{name,path,playing:false,repeat:channel!=='fx',volume:.5,fade:channel==='fx'?0:2000,flags:{[ID]:{config:{channel,gains:config(p).labels.map(()=>.5),credit}}}}]);
    if(config(p).live)await mix(p);
  }, true);
}

async function installStarter() {
  const response=await fetch(`modules/${ID}/starter.json`);
  if(!response.ok)throw new Error('Banque de départ introuvable.');
  const bank=await response.json();
  const folder=await ensureBardFolder();
  await organiseBardPlaylists();
  let count=0;
  for(const preset of bank.presets) {
    if(managed().some(p=>p.getFlag(ID,'starter')===preset.name))continue;
    await foundry.documents.Playlist.create({name:preset.name,folder:folder.id,mode:-1,fade:2000,
      flags:{[ID]:{starter:preset.name,config:{labels:preset.labels,music:0,background:0,volume:{music:.6,background:.6},live:false}}},
      sounds:preset.tracks.map(t=>{
        const a=bank.assets[t.asset];
        if(!a)throw new Error('Piste absente de la banque.');
        return {name:a.name,path:`modules/${ID}/audio/${a.file}`,playing:false,volume:.5,repeat:t.channel!=='fx',fade:t.channel==='fx'?0:2000,
          flags:{[ID]:{config:{channel:t.channel,gains:t.gains,credit:a.credit}}}};
      })});
    count++;
  }
  ui.notifications.info(`${count} nouvelle(s) ambiance(s) importée(s).`);
}
