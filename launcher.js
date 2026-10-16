const bindings = new WeakMap();
export function bindLauncher(html, toggle) {
  const root = html?.addEventListener ? html : html?.[0];
  if (!root?.addEventListener) return;
  const previous = bindings.get(root);
  if (previous) root.removeEventListener('click', previous, true);
  const handler = event => {
    if (!game.user.isGM) return;
    const button = event.target?.closest?.('[data-control="bard-academia"]');
    if (!button || !root.contains(button)) return;
    // Do not consume clicks on secondary tools or any other Foundry control.
    if (button.dataset.tool || event.target.closest('[data-tool]')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    Promise.resolve(toggle()).catch(error => {
      console.error('bard-academia', error);
      ui.notifications.error(`Bard Academia : ${error.message}`);
    });
  };
  bindings.set(root, handler);
  root.addEventListener('click', handler, true);
}
