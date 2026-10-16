const OLD='ambiance-forge';
const ID='bard-academia';
// Retain old flags so migration is non-destructive and retryable.
async function copyMissing(document) {
  const old=document.flags?.[OLD];
  if(!old)return;
  for(const [key,value] of Object.entries(old)) {
    if(document.flags?.[ID]?.[key]!==undefined)continue;
    const next=foundry.utils.deepClone(value);
    if(key==='config'&&typeof next?.cover==='string')
      next.cover=next.cover.replace(/^modules\/ambiance-forge\//,'modules/bard-academia/');
    await document.setFlag(ID,key,next);
  }
}
export async function migrateLegacy() {
  if(!game.user.isGM)return;
  if(game.modules.get(OLD)?.active)throw new Error('Désactivez l’ancien module Ambiance Forge, puis rechargez le monde pour migrer vers Bard Academia.');
  for(const folder of game.folders) {
    if(folder.type==='Playlist'&&folder.flags?.[OLD]?.ambienceRoot)await copyMissing(folder);
  }
  let oldAudio=0;
  for(const playlist of game.playlists) {
    if(!playlist.flags?.[OLD]?.config)continue;
    // Copy children first, then expose the playlist in the new interface.
    for(const sound of playlist.sounds) {
      await copyMissing(sound);
      if(sound.path?.startsWith('modules/ambiance-forge/audio/'))oldAudio++;
    }
    await copyMissing(playlist);
  }
  if(oldAudio)ui.notifications.warn('Bard Academia : certaines pistes utilisent encore l’ancien dossier audio. Sélectionnez leur nouvel emplacement dans les playlists Foundry.',{permanent:true});
}
