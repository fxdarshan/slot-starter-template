/*
 * Asset loader. Tries every path in assets/manifest.js and falls back to the
 * placeholder art in placeholders.js when a file is missing. UI, banners and modals
 * are drawn in code unless a real file exists (check Assets.real[key]).
 */
(function (root) {
  const P = root.Placeholders;
  const Assets = { img: {}, real: {}, W: 1920, H: 1080, L: null };
  const SYM_KEYS = { 0: 'sym_00_idle', 11: 'sym_scatter_idle' };
  for (let i = 1; i <= 10; i++) SYM_KEYS[i] = 'sym_' + String(i).padStart(2, '0') + '_idle';
  Assets.SYM_KEYS = SYM_KEYS;

  function loadImage(src) {
    return new Promise(res => {
      if (!src) return res(null);
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = src;
    });
  }
  function placeholder(key) {
    const { W, H } = Assets, C = root.CONFIG;
    const id = Object.keys(SYM_KEYS).find(k => SYM_KEYS[k] === key);
    if (id != null) return P.symbol(Number(id), C.symbolNames[id]);
    switch (key) {
      case 'sym_00_expanded': return P.symbol(0, 'PIG');
      case 'bg_base_main': return P.background(W, H, false);
      case 'bg_freegame_main': return P.background(W, H, true);
      case 'fx_scatter_full': return P.scatterFull();
      case 'fx_lantern': return P.lantern();
    }
    return null;
  }

  Assets.load = async function (manifest, W, H, layout, onProgress) {
    Assets.W = W; Assets.H = H; Assets.L = layout; Assets.fits = manifest.fit || {};
    const entries = Object.entries(manifest.images || {});
    let done = 0;
    const loaded = await Promise.all(entries.map(([, src]) => loadImage(src).then(im => { if (onProgress) onProgress(++done / entries.length); return im; })));
    const missing = [];
    entries.forEach(([key], i) => {
      if (loaded[i]) { Assets.img[key] = loaded[i]; Assets.real[key] = true; }
      else { Assets.img[key] = placeholder(key); missing.push(key); }
    });
    if (missing.length) console.info('[assets] using placeholders for:', missing.join(', '));
    return { missing, loaded: entries.length - missing.length };
  };

  Assets.get = key => Assets.img[key] || null;
  Assets.symbol = id => Assets.img[SYM_KEYS[id]] || null;
  // [width, height] of the box a symbol is fitted into, as a fraction of the cell (manifest.fit)
  Assets.fit = id => Assets.fits[SYM_KEYS[id]] || Assets.fits.default || [.98, 1.06];

  root.Assets = Assets;
})(window);
