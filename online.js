/** Optional online catalogue. Credentials stay in memory on the GM client. */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function httpsURL(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
export function supportedLicense(value) {
  try {
    const u = new URL(value);
    if (!['creativecommons.org','www.creativecommons.org'].includes(u.hostname)) return false;
    return /^\/(publicdomain\/zero\/1\.0|licenses\/by\/(1\.0|2\.0|2\.5|3\.0|4\.0))\/(deed(\.[a-zA-Z-]+)?\/?)?$/.test(u.pathname);
  } catch { return false; }
}
export function normaliseResults(provider, data) {
  const rows = Array.isArray(data.results) ? data.results : [];
  return rows.map(r => {
    const free = provider === 'freesound';
    const preview = httpsURL(free ? r.previews?.['preview-hq-mp3'] : r.audio);
    const download = free ? preview : (r.audiodownload_allowed === true ? httpsURL(r.audiodownload) : '');
    const license = free ? r.license : r.license_ccurl;
    const licenseURL = typeof license === 'string' ? license.replace(/^http:/,'https:') : '';
    return {id:String(r.id), provider, name:String(r.name || 'Sans titre'), author:String(free ? r.username : r.artist_name),
      source:httpsURL(r.url || r.shareurl), license:licenseURL, preview, download,
      importable:!!download && supportedLicense(licenseURL), quality:free ? 'Aperçu MP3 haute qualité (pas le fichier original)' : 'Téléchargement MP3 autorisé'};
  });
}
export async function searchCatalogue(provider, query, credential, fetcher = fetch) {
  if (!credential.trim()) throw new Error('Saisissez votre identifiant développeur pour ce service.');
  if (!query.trim()) throw new Error('Saisissez un mot-clé.');
  const free = provider === 'freesound';
  const u = new URL(free ? 'https://freesound.org/apiv2/search/text/' : 'https://api.jamendo.com/v3.0/tracks/');
  const params = free ? {query, page_size:'20', fields:'id,name,username,license,previews,url', filter:'license:"Creative Commons 0"'}
    : {client_id:credential, format:'json', limit:'20', search:query, audioformat:'mp32', vocalinstrumental:'instrumental'};
  for (const [key,value] of Object.entries(params)) u.searchParams.set(key,value);
  const response = await fetcher(u.href, {headers:free ? {Authorization:`Token ${credential}`} : {}, signal:AbortSignal.timeout(20000), credentials:'omit'});
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Identifiant refusé par le service.' : response.status === 429 ? 'Limite de requêtes atteinte. Réessayez plus tard.' : `Service indisponible (HTTP ${response.status}).`);
  const data = await response.json();
  if (!free && data.headers?.status === 'failed') throw new Error('Jamendo a refusé la recherche. Vérifiez votre Client ID.');
  return normaliseResults(provider,data);
}
let instance;
export function openCatalogue(options) {
  if (!game.user.isGM) return;
  instance ??= new OnlineCatalogue(options);
  return instance.render({force:true});
}
class OnlineCatalogue extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {id:'bard-academia-online',classes:['bard-academia'],window:{title:'Bard Academia · Bibliothèque en ligne',resizable:true},position:{width:640,height:710}};
  constructor(callbacks) { super(); this.callbacks=callbacks; }
  provider='freesound'; query='tavern'; keys={freesound:'',jamendo:''}; rows=[]; message=''; busy=false; target=''; channel='background';
  stopPreview() { this.preview?.pause(); this.preview=null; }
  async close(options) { this.stopPreview(); return super.close(options); }
  async _renderHTML() {
    const targets=this.callbacks.getTargets();
    if (!targets.some(x=>x.id===this.target)) this.target=targets[0]?.id || '';
    return `<div class="af-body"><h1>Bibliothèque en ligne</h1><p>Écoutez côté MJ, puis importez les fichiers autorisés dans votre monde.</p>
    <div class="af-toolbar"><select data-field="provider" aria-label="Service"><option value="freesound" ${this.provider==='freesound'?'selected':''}>Freesound · Bruitages CC0</option><option value="jamendo" ${this.provider==='jamendo'?'selected':''}>Jamendo · Musiques</option></select></div>
    <label>${this.provider==='freesound'?'Clé API Freesound':'Client ID Jamendo'}<input type="password" autocomplete="off" data-field="key" value="${esc(this.keys[this.provider])}"></label>
    <p>Gardé uniquement jusqu’au rechargement de cette page. <a target="_blank" rel="noopener noreferrer" href="${this.provider==='freesound'?'https://freesound.org/apiv2/apply/':'https://devportal.jamendo.com/'}">Obtenir un identifiant</a></p>
    <div class="af-toolbar"><input data-field="query" aria-label="Recherche" value="${esc(this.query)}" placeholder="tavern, forest, medieval…"><button data-online="search" ${this.busy?'disabled':''}>Rechercher</button></div>
    <div class="af-toolbar"><label>Ajouter à <select data-field="target">${targets.map(p=>`<option value="${esc(p.id)}" ${this.target===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Couche <select data-field="channel">${[['music','Musique'],['background','Fond'],['fx','Effet']].map(([v,n])=>`<option value="${v}" ${this.channel===v?'selected':''}>${n}</option>`).join('')}</select></label></div>
    <p role="status">${esc(this.message || 'Freesound : aperçus MP3 CC0. Jamendo : import limité aux fichiers téléchargeables sous CC0 ou CC BY.')}</p>
    ${!targets.length?'<p>Créez d’abord une ambiance dans le mixeur.</p>':''}
    ${this.rows.map((r,i)=>`<article><strong>${esc(r.name)}</strong><p>${esc(r.author)} · ${esc(r.quality)}</p><p>${r.source?`<a target="_blank" rel="noopener noreferrer" href="${esc(r.source)}">Source</a> · `:''}<a target="_blank" rel="noopener noreferrer" href="${esc(httpsURL(r.license))}">Licence</a></p><div class="af-toolbar"><button data-online="preview" data-index="${i}" ${!r.preview||this.busy?'disabled':''}>▷ Écouter (MJ)</button><button data-online="import" data-index="${i}" ${!r.importable||!targets.length||this.busy?'disabled':''}>＋ Importer</button></div>${!r.importable?'<small>Import désactivé : téléchargement ou licence hors sélection.</small>':''}</article>`).join('')}
    <button data-online="silence">■ Arrêter l’aperçu</button></div>`;
  }
  _replaceHTML(html, content) {
    content.innerHTML=html;
    const capture=()=>{
      this.keys[this.provider]=content.querySelector('[data-field="key"]').value.trim();
      this.query=content.querySelector('[data-field="query"]').value;
      this.target=content.querySelector('[data-field="target"]').value;
      this.channel=content.querySelector('[data-field="channel"]').value;
    };
    content.onchange=e=>{
      capture();
      if(e.target.dataset.field==='provider') {this.stopPreview();this.provider=e.target.value;this.rows=[];this.message='';this.render({force:true});}
    };
    content.onclick=async e=>{
      const b=e.target.closest('[data-online]'); if(!b||!game.user.isGM)return;
      capture();
      const action=b.dataset.online;
      if(action==='silence'){this.stopPreview();return;}
      if(this.busy)return;
      const row=this.rows[Number(b.dataset.index)];
      this.stopPreview();
      if(action==='preview') {
        if(!row?.preview)return;
        this.preview=new Audio(row.preview);this.preview.volume=.4;
        try {await this.preview.play();}catch{ui.notifications.warn('Aperçu indisponible ou bloqué par le navigateur.');}
        return;
      }
      this.busy=true;this.message=action==='search'?'Recherche en cours…':'Import en cours…';await this.render({force:true});
      try {
        if(action==='search') {this.rows=await searchCatalogue(this.provider,this.query,this.keys[this.provider]);this.message=`${this.rows.length} résultat(s). Les fichiers importés restent disponibles dans votre monde.`;}
        if(action==='import') {
          if(!row?.importable || !supportedLicense(row.license))throw new Error('Import non autorisé pour cette piste.');
          const target=this.target,channel=this.channel;
          const response=await fetch(row.download,{signal:AbortSignal.timeout(60000),credentials:'omit'});
          if(!response.ok)throw new Error(`Téléchargement refusé (HTTP ${response.status}).`);
          const max=30*1024*1024;
          if(Number(response.headers.get('content-length'))>max)throw new Error('Fichier trop volumineux (maximum 30 Mo).');
          const blob=await response.blob();
          if(!blob.size || blob.size>max)throw new Error('Fichier vide ou supérieur à 30 Mo.');
          const head=new Uint8Array(await blob.slice(0,12).arrayBuffer());
          const mp3=(head[0]===73&&head[1]===68&&head[2]===51)||(head[0]===255&&(head[1]&224)===224);
          if(!mp3)throw new Error('Le service n’a pas fourni un fichier MP3 reconnu.');
          const filename=`bard-${row.provider}-${row.id.replace(/[^a-zA-Z0-9_-]/g,'')}-${foundry.utils.randomID(8)}.mp3`;
          const upload=await foundry.applications.apps.FilePicker.upload('data',`worlds/${game.world.id}`,new File([blob],filename,{type:'audio/mpeg'}),{}, {notify:false});
          if(!upload?.path)throw new Error('Échec de l’envoi du fichier dans Foundry.');
          await this.callbacks.addSound(target,{name:row.name,path:upload.path,channel,credit:{author:row.author,source:row.source,license:row.license,provider:row.provider,quality:row.quality}});
          this.message=`« ${row.name} » ajouté. Auteur et licence conservés dans la piste.`;
        }
      } catch(e) {this.message=e.name==='TimeoutError'?'Le service met trop de temps à répondre.':e instanceof TypeError?'Connexion impossible : réseau ou accès intersite (CORS) refusé. Vous pouvez télécharger depuis le site et ajouter le fichier manuellement.':e.message;}
      finally {this.busy=false;if(this.rendered)this.render({force:true});}
    };
  }
}
