/** Keep only this module's playlists inside its dedicated Foundry folder. */
const ID='bard-academia';
let pending;
export async function ensureBardFolder() {
  if(!game.user.isGM)throw new Error('Le rangement des ambiances est réservé au MJ.');
  if(pending)return pending;
  pending=(async()=>{
    const folders=game.folders.filter(f=>f.type==='Playlist');
    let folder=folders.find(f=>f.getFlag(ID,'ambienceRoot'))
      ??folders.find(f=>f.name==='Bard Academia'&&!f.folder);
    if(!folder)folder=await foundry.documents.Folder.create({name:'Bard Academia',type:'Playlist',color:'#b79559',sorting:'a',flags:{[ID]:{ambienceRoot:true}}});
    else if(!folder.getFlag(ID,'ambienceRoot'))await folder.setFlag(ID,'ambienceRoot',true);
    return folder;
  })();
  try{return await pending;}finally{pending=null;}
}
export async function organiseBardPlaylists() {
  if(!game.user.isGM)return;
  const playlists=game.playlists.filter(p=>p.getFlag(ID,'config'));
  if(!playlists.length)return;
  const folder=await ensureBardFolder();
  for(const playlist of playlists){
    const current=typeof playlist.folder==='string'?playlist.folder:playlist.folder?.id;
    if(current!==folder.id)await playlist.update({folder:folder.id});
  }
}
