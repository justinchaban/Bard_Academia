const ID = 'bard-academia';
export const DEFAULT_CATEGORIES = [
  {id:'tavern',name:'Intérieurs'}, {id:'dungeon',name:'Souterrains'},
  {id:'sea',name:'Littoral'}, {id:'wild',name:'Nature'}
];
export const categories = () => game.settings.get(ID, 'categories');
export function legacyTheme(p) {
  const c=p.getFlag(ID,'config');
  if (['tavern','dungeon','sea','wild'].includes(c?.theme)) return c.theme;
  const n=p.name.toLocaleLowerCase();
  return /taverne|refuge|auberge/.test(n)?'tavern':/donjon|grotte|danger/.test(n)?'dungeon':/port|mer|côte/.test(n)?'sea':'wild';
}
export function categoryId(p) {
  const c=p.getFlag(ID,'config');
  const id=c.category ?? legacyTheme(p);
  return categories().some(x=>x.id===id)?id:'';
}
export const categoryName = p => categories().find(x=>x.id===categoryId(p))?.name ?? 'Sans catégorie';
export const maxLevel = c => Math.max(0,c.labels.length-1);
export const clampLevel = (value,c) => Math.max(0,Math.min(maxLevel(c),Number(value)||0));
export const levelPercent = (value,c) => maxLevel(c)?Math.round(clampLevel(value,c)/maxLevel(c)*100):0;
// Preserve surviving states and remap a fractional position around the removed state.
export function removeState(c, sounds, index) {
  if(c.labels.length<=1)throw new Error('Conservez au moins un état.');
  if(!Number.isInteger(index)||index<0||index>=c.labels.length)throw new Error('État introuvable.');
  const count=c.labels.length;
  const mapIndex=i=>i<index?i:i>index?i-1:Math.min(index,count-2);
  for(const channel of ['music','background']) {
    const v=clampLevel(c[channel],c), lo=Math.floor(v), hi=Math.ceil(v);
    c[channel]=mapIndex(lo)+(mapIndex(hi)-mapIndex(lo))*(v-lo);
  }
  c.labels.splice(index,1);
  return sounds.filter(s=>s.getFlag(ID,'config')?.channel!=='fx'&&s.getFlag(ID,'config')).map(s=>{
    const f=structuredClone(s.getFlag(ID,'config'));
    f.gains=Array.from({length:count},(_,i)=>f.gains?.[i]??0);
    f.gains.splice(index,1);
    return {_id:s.id,[`flags.${ID}.config`]:f};
  });
}
