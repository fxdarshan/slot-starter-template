/*
 * Placeholder art, drawn in code. Used for any image in assets/manifest.js that is
 * missing, so the game always runs and art can be swapped in file by file.
 * Every function returns a canvas the same way a loaded image would be used.
 */
(function (root) {
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const TILE = ['#d4a017', '#8a2be2', '#1e6fd9', '#1aa0a0', '#1a9a3a', '#c2185b', '#d32f2f', '#1976d2', '#7b1fa2', '#388e3c', '#f57c00'];

  // a coloured tile with the symbol's name, 600 x 520 (same framing as the supplied art)
  function symbol(id, name) {
    const c = mk(600, 520), x = c.getContext('2d');
    if (id === root.CONFIG.SCATTER) {   // Scatter: red octagon
      x.fillStyle = '#ffd34a'; x.beginPath(); for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; x.lineTo(300 + 250 * Math.cos(a), 260 + 250 * Math.sin(a)); } x.fill();
      x.fillStyle = '#c8101a'; x.beginPath(); for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; x.lineTo(300 + 215 * Math.cos(a), 260 + 215 * Math.sin(a)); } x.fill();
      x.fillStyle = '#ffe27a'; x.font = 'bold 92px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('SCATTER', 300, 260); return c;
    }
    x.fillStyle = TILE[id % TILE.length]; x.beginPath(); x.roundRect(20, 30, 560, 460, 30); x.fill();
    x.lineWidth = 14; x.strokeStyle = '#ffd34a'; x.stroke();
    x.fillStyle = '#fff'; x.font = `bold ${name.length > 3 ? 70 : 200}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name, 300, 265, 520);
    return c;
  }
  function background(W, H, free) {
    const c = mk(W, H), x = c.getContext('2d'), L = root.CONFIG.window;
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, free ? '#1a2a6a' : '#3aa0e0'); g.addColorStop(1, free ? '#3a4aa0' : '#f0a060'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = '#b0181f'; x.fillRect(L.x - 40, L.y - 60, L.w + 80, L.h + 100);
    for (let i = 0; i < 5; i++) { x.fillStyle = free ? '#4a1050' : '#5a0f16'; x.fillRect(L.x + i * L.w / 5 + 4, L.y, L.w / 5 - 8, L.h); }
    x.fillStyle = '#ffd34a'; x.font = 'bold 64px sans-serif'; x.textAlign = 'center'; x.fillText(root.CONFIG.title.toUpperCase(), W / 2, 90);
    return c;
  }
  function scatterFull() {
    const c = mk(260, 620), x = c.getContext('2d');
    x.fillStyle = '#1a2a8a'; x.fillRect(0, 0, 260, 620);
    for (let i = 0; i < 18; i++) { x.fillStyle = '#d61f26'; x.fillRect(80 + (i % 2) * 50, 160 + i * 25, 48, 22); x.fillStyle = '#ffd34a'; x.fillRect(80 + (i % 2) * 50, 160 + i * 25, 6, 22); }
    x.drawImage(symbol(11, 'Scatter'), 10, 0, 240, 210); return c;
  }
  function lantern() {
    const c = mk(120, 260), x = c.getContext('2d');
    x.fillStyle = '#ffd34a'; x.fillRect(58, 0, 4, 40); x.fillStyle = '#e8202a'; x.beginPath(); x.ellipse(60, 120, 55, 75, 0, 0, 7); x.fill();
    x.fillStyle = '#ffd34a'; x.fillRect(35, 40, 50, 10); x.fillRect(35, 190, 50, 10); x.fillStyle = '#c8101a'; x.fillRect(56, 200, 8, 60); return c;
  }
  root.Placeholders = { symbol, background, scatterFull, lantern };
})(window);
