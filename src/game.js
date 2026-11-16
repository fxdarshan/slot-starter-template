/*
 * Game presentation (timings in CONFIG.frames, 30 fps frame counts).
 *
 * The engine resolves a spin into steps (win, scatter, expand); this file spins the
 * reels and animates those steps, then runs the free spins flow: fuse unroll on the
 * Scatters, intro modal, special symbol pick, transition, free spins with the
 * expanding symbol, retriggers, summary and transition back. Everything is drawn on
 * one canvas (#stage) so it can be recorded to video.
 */
(function (root) {
  const C = root.CONFIG, A = root.Assets, SND = root.Audio2;
  const engine = root.Engine.create(C);
  const director = root.Director.create(C, engine);
  const cv = document.getElementById('stage'), ctx = cv.getContext('2d');
  const [W, H] = C.stage.landscape; cv.width = W; cv.height = H;
  const FR = C.frames, SC = C.SCATTER;
  const BLOCK = '"Lilita One", "Arial Black", sans-serif';
  const UIF = '"Outfit", "Arial", sans-serif';

  const now = () => performance.now() / 1000;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const ease = {
    out: u => 1 - Math.pow(1 - u, 3),
    inOut: u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
    back: (u, s = 1.7) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2),
    elastic: u => u <= 0 ? 0 : u >= 1 ? 1 : Math.pow(2, -10 * u) * Math.sin((u * 10 - .75) * (2 * Math.PI) / 3) + 1
  };
  const fmt = v => C.currency + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ------------------------------------------------------------ state */
  const G = {
    balance: C.startBalance, betIndex: C.defaultBetIndex, win: 0, winFrom: 0, winT0: 0,
    busy: false, spinning: false, autoplay: false, skip: 0, speed: 1,
    board: null, fx: null, reels: [], spinResolve: null,
    lines: null, labels: [], particles: [], dim: 0, fuses: [], expanded: {}, antic: null,
    banner: null, modal: null, trans: null, info: false,
    env: 0, envTarget: 0, camera: 1, message: null,
    fs: { active: false, left: 0, played: 0, total: 0, awarded: 0, special: null },
    queue: [], onChange: () => {}
  };
  const bet = () => C.bets[G.betIndex];
  // presentation speed changes (demo slider) wait until the next spin starts, so an animation never speeds up or slows down halfway
  const setSpeed = v => { G.speedWanted = v; if (!G.busy) G.speed = v; };
  const applySpeed = () => { if (G.speedWanted) G.speed = G.speedWanted; };
  const sec = frames => frames / C.fps / G.speed;          // frames -> seconds at current speed

  /* ------------------------------------------------------------ layout */
  const WIN = C.window, cw = WIN.w / C.reels, ch = WIN.h / C.rows, x0 = WIN.x, y0 = WIN.y, gw = WIN.w, gh = WIN.h;
  const L = { cw, ch, x0, y0, gw, gh };
  const cellCenter = (c, r) => [x0 + c * cw + cw / 2, y0 + r * ch + ch / 2];
  const hy = C.hudTop, barH = H - hy;
  // HUD positions follow the supplied mockup's bottom bar
  const btn = {
    settings: { x: 206, y: 989, r: 22 }, sound: { x: 206, y: 1036, r: 22 }, info: { x: 278, y: 1013, r: 37 },
    minus: { x: 905, y: 970, r: 24 }, plus: { x: 965, y: 970, r: 24 },
    spin: { x: 1647, y: 964, r: 78 }, auto: { x: 1647, y: 1058, r: 40 }
  };
  const pill = { x: 610, y: 881, w: 700, h: 58 };

  G.board = engine.randomGrid({ noScatter: true });
  const newFx = () => G.board.map(col => col.map(() => ({})));
  G.fx = newFx();

  /* ------------------------------------------------------------ waits */
  function wait(s, skippable = false) {
    const tok = G.skip, end = performance.now() + s * 1000;
    return new Promise(res => { const tick = () => (performance.now() >= end || (skippable && G.skip !== tok)) ? res() : setTimeout(tick, 10); tick(); });
  }
  const waitF = (frames, skippable) => wait(sec(frames), skippable);

  /* ------------------------------------------------------------ reels */
  // anticipation: once two Scatters are showing, every later reel spins FR.anticipation frames longer
  function anticipationFrom(grid) {
    if (!C.anticipate) return C.reels;
    let n = 0;
    for (let c = 0; c < C.reels; c++) { if (n >= 2) return c; if (grid[c].includes(SC)) n++; }
    return C.reels;
  }
  function startReels(grid, fs, special) {
    return new Promise(resolve => {
      const t0 = now(), sp = C.spin, R = C.rows, from = anticipationFrom(grid);
      grid.forEach((col, i) => {
        const cur = G.board[i];
        const extra = i >= from ? sec(FR.anticipation) * (i - from + 1) : 0;
        const Tstop = (sp.first + i * sp.gap) / G.speed + extra, wu = .1 / G.speed;
        const N = Math.max(R + 3, Math.round(sp.speed * (Tstop - wu)));
        const rs = () => engine.randomSymbol(i, { fs, special });
        const s = [rs(), ...col, rs()];
        for (let k = 1; k < N; k++) s.push(rs());
        s.push(rs(), ...cur, rs());
        const pStart = R + N + 2, D = pStart - 1;
        const vEff = (D - .9) / (Tstop - wu), b = sp.bounce, slope = b + 3;
        G.reels[i] = { strip: s, p: pStart, pStart, D, t0, T: Tstop, wu, vEff, b, bt: clamp(.9 * slope / vEff, .08, .6), state: 'spin', landed: false, antic: i >= from };
      });
      G.antic = from < C.reels ? { from, t0 } : null;
      G.spinGrid = grid; G.spinResolve = resolve;
    });
  }
  function updateReels(t) {
    G.reels.forEach((r, i) => {
      if (!r || r.state !== 'spin') return;
      const tau = t - r.t0; let d;
      r.blur = false;
      if (tau < r.wu) d = -.2 * Math.sin(Math.PI * tau / r.wu);
      else if (tau < r.T) { d = r.vEff * (tau - r.wu); r.blur = r.T - tau > .03; }
      else {
        const u = Math.min(1, (tau - r.T) / r.bt);
        d = (r.D - .9) + .9 * ease.back(u, r.b);
        if (!r.landed && u > .3) {
          r.landed = true; SND.play('sfx_reel_stop_0' + (i + 1));
          const sc = G.spinGrid[i];
          sc.forEach((s, rr) => { if (s === SC) { G.fx[i][rr].land = t; SND.play('sfx_scatter_land'); } });
        }
        if (u >= 1) { r.state = 'idle'; G.board[i] = G.spinGrid[i].slice(); return; }
      }
      r.p = r.pStart - d;
    });
    if (G.antic && G.reels.every(r => !r || r.state === 'idle' || !r.antic)) G.antic = null;
    if (G.spinResolve && G.reels.every(r => !r || r.state === 'idle')) { const f = G.spinResolve; G.spinResolve = null; f(); }
  }

  /* ------------------------------------------------------------ particles */
  function emit(type, x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = (o.angle ?? -Math.PI / 2) + (Math.random() - .5) * (o.spread ?? 1.6), sp = (o.speed ?? 500) * (.5 + Math.random());
      G.particles.push({ type, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.gravity ?? 900, life: 0, max: (o.life ?? 1.4) * (.8 + Math.random() * .4),
        rot: Math.random() * 6, vr: (Math.random() - .5) * 8, size: (o.size ?? 22) * (.7 + Math.random() * .6),
        color: Array.isArray(o.color) ? o.color[Math.floor(Math.random() * o.color.length)] : (o.color || '#fff'), burst: o.burst });
    }
  }
  function drawParticles(dt) {
    G.particles = G.particles.filter(p => {
      if (p.life >= p.max) { if (p.burst) emit('spark', p.x, p.y, 26, { angle: 0, spread: 7, speed: 380, gravity: 220, life: 1.1, size: 7, color: p.burst }); return false; }
      return true;
    });
    for (const p of G.particles) {
      p.life += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const a = 1 - Math.pow(p.life / p.max, 2);
      ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.translate(p.x, p.y);
      if (p.type === 'coin') {
        ctx.rotate(p.rot * .2); const w = Math.abs(Math.cos(p.rot)) * p.size + 2;
        ctx.fillStyle = '#f7c948'; ctx.beginPath(); ctx.ellipse(0, 0, w, p.size, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#a8681a'; ctx.lineWidth = 3; ctx.stroke();
        if (w > p.size * .6) { ctx.fillStyle = '#a8681a'; ctx.fillRect(-w * .22, -p.size * .22, w * .44, p.size * .44); }
      } else if (p.type === 'confetti') { ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2 * Math.abs(Math.cos(p.rot * 2))); }
      else if (p.type === 'cracker') {     // little red firecracker tube
        ctx.rotate(p.rot); ctx.fillStyle = '#d61f26'; ctx.fillRect(-p.size * .2, -p.size * .5, p.size * .4, p.size);
        ctx.fillStyle = '#ffd34a'; ctx.fillRect(-p.size * .2, -p.size * .5, p.size * .4, p.size * .14); ctx.fillRect(-p.size * .2, p.size * .36, p.size * .4, p.size * .14);
      } else if (p.type === 'rocket') { ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,200,120,.4)'; ctx.fillRect(-2, 0, 4, 30); }
      else { ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, 7); ctx.fill(); }
      ctx.restore();
    }
  }
  // a firecracker string popping: flashes, sparks and flying tubes along a reel
  function popCrackers(c, n = 10) {
    const x = x0 + c * cw + cw / 2;
    for (let i = 0; i < n; i++) setTimeout(() => {
      const y = y0 + Math.random() * gh;
      emit('spark', x + (Math.random() - .5) * cw * .5, y, 14, { angle: 0, spread: 7, speed: 420, gravity: 300, life: .6, size: 9, color: ['#fff6c8', '#ffd34a', '#ff5a3a'] });
      emit('cracker', x, y, 2, { speed: 500, gravity: 1200, life: 1, size: 28 });
      SND.play('sfx_cracker_pop');
    }, i * 70 / G.speed);
  }

  /* ------------------------------------------------------------ text helpers */
  function blockText(txt, x, y, size, o = {}) {
    ctx.save(); ctx.translate(x, y); const k = o.scale ?? 1; ctx.scale(k, k); ctx.globalAlpha = o.alpha ?? 1;
    ctx.font = `${size}px ${BLOCK}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (o.maxW) { const w = ctx.measureText(txt).width; if (w * k > o.maxW) { const s = o.maxW / (w * k); ctx.scale(s, s); } }
    const cols = o.colors || ['#fffbe0', '#ffd04a', '#e07b00'];
    const g = ctx.createLinearGradient(0, -size * .5, 0, size * .5); cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
    ctx.lineJoin = 'round';
    ctx.fillStyle = o.shadow || 'rgba(60,5,5,.85)'; ctx.fillText(txt, size * .03, size * .07);
    ctx.lineWidth = size * .14; ctx.strokeStyle = o.stroke || '#6a0a0a'; ctx.strokeText(txt, 0, 0);
    ctx.fillStyle = g; ctx.fillText(txt, 0, 0); ctx.restore();
  }
  function uiText(txt, x, y, size, col = '#fff', align = 'center', weight = 700) {
    ctx.font = `${weight} ${size}px ${UIF}`; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y);
  }

  /* ------------------------------------------------------------ environment */
  function drawEnvironment(t) {
    const breathe = .5 - .5 * Math.cos(t / (FR.bgBaseLoop / C.fps) * Math.PI * 2);
    ctx.drawImage(A.get('bg_base_main'), 0, 0, W, H);
    if (G.env > 0) { ctx.save(); ctx.globalAlpha = G.env; ctx.drawImage(A.get('bg_freegame_main'), 0, 0, W, H); ctx.restore(); }
    // warm light breathing either side of the reels (side decorations on the background)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [[90, 250], [W - 90, 250]].forEach(([lx, ly]) => {
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 150); g.addColorStop(0, `rgba(255,150,60,${.10 + .10 * breathe})`); g.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = g; ctx.fillRect(lx - 150, ly - 150, 300, 300);
    });
    ctx.restore();
    // free spins: warm sparks drift up either side
    if (G.env > .5 && Math.random() < .03) emit('spark', Math.random() < .5 ? 40 + Math.random() * 150 : W - 190 + Math.random() * 150, H * .8, 1, { angle: -Math.PI / 2, spread: .2, speed: 60, gravity: -5, life: 6, size: 12, color: ['#ffb84a', '#ffd27a'] });
  }

  /* ------------------------------------------------------------ symbols */
  // draw a symbol image fitted into its cell box (manifest.fit scales the box per symbol)
  function drawSym(id, cx, cy, o = {}) {
    const img = A.symbol(id); if (!img) return;
    const f = A.fit(id), bw = cw * f[0], bh = ch * f[1], k = Math.min(bw / img.width, bh / img.height) * (o.scale ?? 1);
    const w = img.width * k, h = img.height * k * (o.scaleY ?? 1);
    ctx.save(); ctx.globalAlpha = o.alpha ?? 1;
    ctx.drawImage(img, cx - w / 2, cy - h / 2 + (o.dy || 0) + img.height * k * (1 - (o.scaleY ?? 1)) / 2, w, h);
    ctx.restore();
  }
  // winning symbol scale curve: pop to 1.12, hold with a small bob, settle back
  function winScale(f) {
    const [a, b, c] = FR.symWin;
    if (f < a) return 1 + .12 * ease.out(f / a);
    if (f < a + b) return 1.12 + .02 * Math.sin((f - a) / b * Math.PI);
    if (f < a + b + c) return 1.12 - .12 * ease.inOut((f - a - b) / c);
    return 1;
  }
  function drawCell(c, r, s, cx, cy, t) {
    const fx = G.fx[c][r] || {}, F = x => (t - x) * C.fps * G.speed;
    let scale = 1, sy = 1, alpha = 1;
    if (fx.win != null) {
      const f = F(fx.win); scale = winScale(f);
      // glow behind a winning symbol
      const a = Math.sin(clamp(f / (FR.symWin[0] + FR.symWin[1] + FR.symWin[2]), 0, 1) * Math.PI);
      ctx.save(); ctx.globalAlpha = a * .85; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cw * .6); g.addColorStop(0, 'rgba(255,230,140,.95)'); g.addColorStop(1, 'rgba(255,200,60,0)'); ctx.fillStyle = g; ctx.fillRect(cx - cw * .6, cy - ch * .6, cw * 1.2, ch * 1.2); ctx.restore();
    } else if (G.dim && !fx.keep) alpha = 1 - .55 * G.dim;
    if (s === SC && fx.land != null) { const f = F(fx.land); if (f < FR.scatterLand) sy = .82 + .18 * ease.back(f / FR.scatterLand, 2.5); }
    if (fx.pulse != null) scale *= 1 + .06 * Math.sin((t - fx.pulse) * 9);
    drawSym(s, cx, cy, { scale, scaleY: sy, alpha });
  }
  function drawGrid(t) {
    // spinning reels are clipped to the window; stopped symbols may overflow it slightly, as in the mockup
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, gw, gh); ctx.clip();
    for (let c = 0; c < C.reels; c++) {
      const r = G.reels[c];
      if (r && r.state === 'spin') {
        const j0 = Math.floor(r.p) - 1, j1 = Math.ceil(r.p + C.rows);
        for (let j = Math.max(0, j0); j <= Math.min(r.strip.length - 1, j1); j++) {
          const cx = x0 + c * cw + cw / 2, cy = y0 + (j - r.p) * ch + ch / 2;
          if (r.blur) for (let q = -2; q <= 2; q++) drawSym(r.strip[j], cx, cy + q * ch * .06, { alpha: q ? .22 : .5 });
          else drawSym(r.strip[j], cx, cy);
        }
      }
    }
    ctx.restore();
    // draw top row last so a symbol's overflow sits under the row above it? Bottom-up keeps tile tops visible.
    for (let row = C.rows - 1; row >= 0; row--) for (let c = 0; c < C.reels; c++) {
      const r = G.reels[c]; if (r && r.state === 'spin') continue;
      if (G.expanded[c] && G.expanded[c].done) continue;
      const [cx, cy] = cellCenter(c, row); drawCell(c, row, G.board[c][row], cx, cy, t);
    }
  }

  /* ------------------------------------------------------------ fx layers */
  // anticipation: a glowing frame (and the fx_lantern decoration, if supplied) on each reel still spinning for the third Scatter
  function drawAnticipation(t) {
    if (!G.antic) return;
    const lamp = A.real.fx_lantern ? A.get('fx_lantern') : null;
    G.reels.forEach((r, c) => {
      if (!r || !r.antic || r.state !== 'spin') return;
      const x = x0 + c * cw, a = clamp((t - G.antic.t0 - (r.T - sec(FR.anticipation)) ) * 3, 0, 1);
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 8; ctx.shadowColor = '#ff8a00'; ctx.shadowBlur = 36;
      ctx.beginPath(); ctx.roundRect(x + 4, y0 - 4, cw - 8, gh + 8, 16); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, y0, 0, y0 + gh); g.addColorStop(0, 'rgba(255,150,40,.35)'); g.addColorStop(1, 'rgba(255,60,20,.05)'); ctx.fillStyle = g; ctx.fillRect(x + 6, y0, cw - 12, gh);
      ctx.globalCompositeOperation = 'source-over';
      if (lamp) { const lw = cw * .26, lh = lamp.height * lw / lamp.width; ctx.translate(x + cw / 2, y0 + 4); ctx.rotate(Math.sin(t * 3 + c) * .12); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(lamp, -lw / 2, 0, lw, lh); }
      ctx.restore();
      if (Math.random() < .5) emit('spark', x + Math.random() * cw, y0 + Math.random() * gh, 1, { angle: -Math.PI / 2, spread: 1, speed: 160, gravity: -40, life: .6, size: 8, color: ['#fff6b0', '#ffb84a'] });
    });
  }
  // fuse: the Scatter's firecracker string unrolls down its reel (fx_scatter_full), then pops
  function drawFuses(t) {
    G.fuses = G.fuses.filter(f => !f.gone);
    const img = A.get('fx_scatter_full');
    G.fuses.forEach(f => {
      const u = clamp((t - f.t0) / sec(FR.fuse[0]), 0, 1), a = f.fade ? clamp(1 - (t - f.fade) / .4, 0, 1) : 1;
      if (a <= 0) { f.gone = true; return; }
      const x = x0 + f.c * cw, reveal = ease.out(u);
      ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.rect(x - 6, y0 - 10, cw + 12, (gh + 20) * reveal); ctx.clip();
      if (img) { const k = Math.min((cw + 8) / img.width, (gh + 16) / img.height), w = img.width * k, h = img.height * k; ctx.drawImage(img, x + cw / 2 - w / 2, y0 + gh / 2 - h / 2, w, h); }
      else { ctx.fillStyle = '#b0181f'; ctx.fillRect(x, y0, cw, gh); }
      ctx.restore();
      // burning fuse tip
      if (u < 1) { const yy = y0 + gh * reveal; emit('spark', x + cw / 2, yy, 2, { angle: Math.PI / 2, spread: 3, speed: 200, gravity: 300, life: .4, size: 8, color: ['#fff6c8', '#ffb000'] }); }
    });
  }
  // expanded special symbol: grows from its cells to fill the reel
  function drawExpanded(t) {
    const bigArt = A.real.sym_00_expanded ? A.get('sym_00_expanded') : null;   // optional full-reel art for symbol 0
    Object.entries(G.expanded).forEach(([c, e]) => {
      c = Number(c);
      const x = x0 + c * cw, u = e.t1 ? ease.out(clamp((t - e.t1) / sec(FR.expand[1]), 0, 1)) : 0;
      if (u >= 1) e.done = true;
      const top = lerp(e.y0, y0 - 4, u), bot = lerp(e.y1, y0 + gh + 4, u);
      ctx.save();
      ctx.beginPath(); ctx.roundRect(x + 3, top, cw - 6, bot - top, 14); ctx.clip();
      if (e.sym === 0 && bigArt) {
        // symbol 0 has its own full-reel art (sym_00_expanded), drawn over a panel in CONFIG.texts.expandedPanel colours
        const pc = (C.texts && C.texts.expandedPanel) || ['#7fd0ff', '#bfe9ff', '#ffffff'];
        const g = ctx.createLinearGradient(0, y0, 0, y0 + gh); g.addColorStop(0, pc[0]); g.addColorStop(.7, pc[1]); g.addColorStop(1, pc[2]);
        ctx.fillStyle = g; ctx.fillRect(x, y0 - 6, cw, gh + 12);
        const k = Math.min((cw - 14) / bigArt.width, (gh - 6) / bigArt.height), w = bigArt.width * k, h = bigArt.height * k;
        ctx.drawImage(bigArt, x + cw / 2 - w / 2, y0 + gh - h + 2, w, h);
      } else {
        const g = ctx.createLinearGradient(0, y0, 0, y0 + gh); g.addColorStop(0, 'rgba(120,10,20,.92)'); g.addColorStop(1, 'rgba(70,5,15,.92)');
        ctx.fillStyle = g; ctx.fillRect(x, y0 - 6, cw, gh + 12);
        for (let r = 0; r < C.rows; r++) { const [cx, cy] = cellCenter(c, r); drawSym(e.sym, cx, cy, { scale: .96 }); }
      }
      ctx.restore();
      // gold frame with a pulse
      const pulse = .6 + .4 * Math.sin(t * 5);
      ctx.save(); ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 7; ctx.shadowColor = '#ffb000'; ctx.shadowBlur = 18 + 14 * pulse;
      ctx.beginPath(); ctx.roundRect(x + 3, top, cw - 6, bot - top, 14); ctx.stroke(); ctx.restore();
    });
  }
  // paylines: coloured paths with a number tag at both ends
  const LINE_COLORS = ['#ffd84a', '#ff5a5a', '#4ad0ff', '#7be35a', '#ff8a3a', '#c47bff', '#ff6ad5', '#3affb4', '#ffffff', '#ffb43a'];
  function linePath(li) {
    const line = C.paylines[li]; ctx.beginPath();
    line.forEach((r, c) => { const [cx, cy] = cellCenter(c, r); if (!c) { ctx.moveTo(x0 - 16, cy); } ctx.lineTo(cx, cy); });
    const [, ey] = cellCenter(C.reels - 1, line[C.reels - 1]); ctx.lineTo(x0 + gw + 16, ey);
  }
  function drawLines(t) {
    const L2 = G.lines; if (!L2) return;
    const a = L2.fade ? clamp(1 - (t - L2.fade) / .25, 0, 1) : clamp((t - L2.t0) / .15, 0, 1);
    if (a <= 0) { G.lines = null; return; }
    ctx.save(); ctx.globalAlpha = a; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    L2.lines.forEach(li => {
      const col = LINE_COLORS[li % LINE_COLORS.length];
      linePath(li); ctx.strokeStyle = 'rgba(40,5,0,.65)'; ctx.lineWidth = 15; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.stroke();
      const line = C.paylines[li];
      [[x0 - 16, line[0]], [x0 + gw + 16, line[C.reels - 1]]].forEach(([lx, r]) => {
        const ly = y0 + r * ch + ch / 2; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx, ly, 17, 0, 7); ctx.fill(); ctx.strokeStyle = '#3b0505'; ctx.lineWidth = 3; ctx.stroke();
        uiText(String(li + 1), lx, ly + 1, 19, '#3b0505', 'center', 700);
      });
    });
    ctx.restore();
    G.labels.forEach(l => blockText(l.text, l.x, l.y, l.size || 44, { scale: .6 + .4 * ease.back(clamp((t - l.t0) / .25, 0, 1)), alpha: a }));
  }

  /* ------------------------------------------------------------ HUD (follows the mockup's bottom bar) */
  function drawHUD(t) {
    // message pill above the bar, overlapping the reel ledge
    const fs = G.fs, inFS = fs.active || (G.modal && G.modal.kind === 'outro');
    ctx.save(); ctx.fillStyle = inFS ? '#14101e' : '#1e1210'; ctx.beginPath(); ctx.roundRect(pill.x - 4, pill.y - 2, pill.w + 8, pill.h + 24, 20); ctx.fill(); ctx.restore();
    let msg = G.message || C.message;
    if (inFS && !G.message) msg = `FREE SPIN ${Math.min(fs.played, fs.awarded)} OF ${fs.awarded}`;
    uiText(msg, pill.x + pill.w / 2, pill.y + pill.h / 2 + 2, 30, inFS ? '#ffd45a' : '#fff', 'center', 600);
    // bar
    const g = ctx.createLinearGradient(0, hy, 0, H); g.addColorStop(0, inFS ? '#141224' : '#2a1a14'); g.addColorStop(1, inFS ? '#0a0914' : '#160d0a'); ctx.fillStyle = g; ctx.fillRect(0, hy, W, barH);
    const ring = (b, fill = '#000') => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke(); };
    // settings, sound, info
    ring(btn.settings); ctx.save(); ctx.translate(btn.settings.x, btn.settings.y); ctx.fillStyle = '#fff';
    for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-3, -14, 6, 7); } ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill(); ctx.restore();
    ring(btn.sound); ctx.save(); ctx.translate(btn.sound.x, btn.sound.y); ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-9, -5); ctx.lineTo(-3, -5); ctx.lineTo(5, -12); ctx.lineTo(5, 12); ctx.lineTo(-3, 5); ctx.lineTo(-9, 5); ctx.closePath(); ctx.fill();
    if (SND.muted) { ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, -12); ctx.lineTo(12, 12); ctx.stroke(); } ctx.restore();
    ring(btn.info); uiText('i', btn.info.x, btn.info.y + 2, 50, '#fff', 'center', 700);
    // values and labels
    const value = (v, x, col = '#fff') => uiText(v, x, 1014, 44, col);
    const label = (v, x) => uiText(v, x, 1058, 27, '#f5b800');
    const wv = G.winFrom + (G.win - G.winFrom) * ease.out(clamp((t - G.winT0) / .6, 0, 1));
    value(fmt(G.balance), 458); label('CASH', 458);
    if (G.notice && performance.now() - G.notice.t0 < 2600) uiText(G.notice.text, 458, 966, 18, '#ffd45a', 'center', 600);
    value(String(C.paylines.length), 697); label('LINES', 697);
    value(fmt(bet() / C.paylines.length), 935); label('BET', 935);
    value(fmt(bet()), 1169); label('TOTAL BET', 1169);
    value(fmt(G.win > 0 ? wv : 0), 1431, G.win > 0 ? '#ffd45a' : '#fff'); label('WIN', 1431);
    // bet - / + (locked during a round)
    ctx.save(); ctx.globalAlpha = G.busy ? .4 : 1;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(btn.minus.x - 30, btn.minus.y - 18, 120, 36, 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(935, btn.minus.y - 16); ctx.lineTo(935, btn.minus.y + 16); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(btn.minus.x - 11, btn.minus.y - 3, 22, 6); ctx.fillRect(btn.plus.x - 11, btn.plus.y - 3, 22, 6); ctx.fillRect(btn.plus.x - 3, btn.plus.y - 11, 6, 22);
    ctx.restore();
    // spin and autoplay
    const b = btn.spin;
    ctx.save(); ctx.fillStyle = G.busy && !G.spinning ? '#333' : '#000'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = '#fff'; ctx.stroke();
    if (G.spinning) { ctx.translate(b.x, b.y); ctx.rotate(t * 8); ctx.strokeStyle = '#ffd45a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, b.r - 14, 0, 1.6); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, b.r - 14, Math.PI, Math.PI + 1.6); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.font = `50px ${BLOCK}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = G.busy && !G.spinning ? '#999' : '#fff'; ctx.fillText(G.busy && !G.spinning ? 'SKIP' : 'SPIN', b.x, b.y + 2); ctx.restore();
    const ab = btn.auto;
    ctx.save(); ctx.fillStyle = G.autoplay ? '#ffd45a' : '#000'; ctx.beginPath(); ctx.roundRect(ab.x - 70, ab.y - 17, 140, 34, 17); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
    uiText('AUTOPLAY', ab.x, ab.y + 1, 22, G.autoplay ? '#000' : '#fff', 'center', 700);
    // free spins: the special symbol card, bottom left over the clouds
    if (inFS && fs.special != null) {
      const cx = 94, cy = 780;
      ctx.save(); const gg = ctx.createLinearGradient(0, cy - 120, 0, cy + 120); gg.addColorStop(0, '#c2202a'); gg.addColorStop(1, '#6a0a12');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.roundRect(cx - 82, cy - 112, 164, 224, 18); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = '#ffd34a'; ctx.stroke(); ctx.restore();
      uiText('EXPANDING', cx, cy - 88, 20, '#ffe9a8', 'center', 700);
      const img = A.symbol(fs.special), k = Math.min(140 / img.width, 130 / img.height); ctx.drawImage(img, cx - img.width * k / 2, cy + 10 - img.height * k / 2, img.width * k, img.height * k);
      uiText('SYMBOL', cx, cy + 92, 20, '#ffe9a8', 'center', 700);
    }
  }

  /* ------------------------------------------------------------ banners & modals */
  function dimmer(a) { if (a > 0) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
  function rays(cx, cy, t, col, alpha, n = 16, R = 900) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy); ctx.rotate(t * .5);
    for (let i = 0; i < n; i++) { ctx.rotate(Math.PI * 2 / n); const g = ctx.createLinearGradient(0, 0, 0, -R); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-R * .08, -R); ctx.lineTo(R * .08, -R); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  function ribbon(cx, cy, w, h, cols) {
    ctx.save();
    const g = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2); g.addColorStop(0, cols[0]); g.addColorStop(.5, cols[1]); g.addColorStop(1, cols[2]);
    ctx.fillStyle = cols[2]; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(cx + s * w * .42, cy - h * .2); ctx.lineTo(cx + s * w * .62, cy - h * .2); ctx.lineTo(cx + s * w * .55, cy + h * .15); ctx.lineTo(cx + s * w * .62, cy + h * .5); ctx.lineTo(cx + s * w * .42, cy + h * .5); ctx.closePath(); ctx.fill(); });
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - w / 2, cy - h / 2); ctx.quadraticCurveTo(cx, cy - h * .8, cx + w / 2, cy - h / 2); ctx.lineTo(cx + w / 2, cy + h / 2); ctx.quadraticCurveTo(cx, cy + h * .2, cx - w / 2, cy + h / 2); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
  }
  function tierFx(fx, dt) {
    const p = n => Math.random() < n * dt;
    if (fx === 'fountain' || fx === 'cascade' || fx === 'fireworks') { if (p(fx === 'fountain' ? 18 : 30)) emit('coin', W / 2 + (Math.random() - .5) * 200, H + 20, 1, { spread: .7, speed: 1500, gravity: 1500, life: 2.2, size: 24 }); }
    if (fx === 'cascade') { if (p(30)) { emit('coin', W * .2, H + 20, 1, { angle: -Math.PI / 2 + .25, spread: .4, speed: 1500, gravity: 1500, life: 2.2, size: 24 }); emit('coin', W * .8, H + 20, 1, { angle: -Math.PI / 2 - .25, spread: .4, speed: 1500, gravity: 1500, life: 2.2, size: 24 }); } }
    if (fx === 'drop' || fx === 'epic' || fx === 'lasers') { if (p(fx === 'drop' ? 22 : 40)) emit('coin', Math.random() * W, -40, 1, { angle: Math.PI / 2, spread: .3, speed: 200, gravity: 900, life: 2.5, size: 24 }); }
    if (fx === 'fireworks' || fx === 'epic' || fx === 'lasers') { if (p(fx === 'epic' ? 3 : 1.8)) emit('rocket', W * (.15 + Math.random() * .7), H, 1, { spread: .25, speed: 1100, gravity: 600, life: .9 + Math.random() * .4, burst: ['#ff5a5a', '#ffd34a', '#ff9a3a', '#ffffff'][Math.floor(Math.random() * 4)] }); }
    if (fx !== 'fountain' && p(20)) emit('cracker', Math.random() < .5 ? 0 : W, H * .7, 1, { angle: -Math.PI / 2, spread: 1.2, speed: 1000, gravity: 900, life: 2.4, size: 30 });
  }
  function drawBanner(t, dt) {
    const b = G.banner; if (!b) return;
    const f = (t - b.t0) * C.fps * G.speed, [fi, fl, fo] = FR.banner, total = fi + fl + fo;
    if (G.skip !== b.tok) { b.tok = G.skip; if (f < fi + fl) b.t0 = t - sec(fi + fl); }
    const tier = C.winTiers[b.tier];
    let dim = .75, scale, alpha = 1, dy = 0;
    if (f < fi) { dim = .75 * f / fi; const u = f / fi; scale = u < .66 ? 1.2 * ease.out(u / .66) : 1.2 - .2 * ease.inOut((u - .66) / .34); }
    else if (f < fi + fl) scale = 1 + .03 * Math.sin((f - fi) / 30 * Math.PI * 2);
    else { const u = clamp((f - fi - fl) / fo, 0, 1); dim = .75 * (1 - u); scale = 1 + .3 * u; alpha = 1 - u; dy = -120 * u; }
    if (!b.hit && f >= 15) { b.hit = true; SND.play('banner_hit'); }
    const [ta, tb] = FR.bannerTally, tu = clamp((f - ta) / (tb - ta), 0, 1), shown = b.amount * ease.out(tu);
    if (tu > 0 && tu < 1 && t - (b.tick || 0) > .07) { b.tick = t; SND.play('sfx_countup_loop'); }
    if (tu >= 1 && !b.ended) { b.ended = true; SND.play('sfx_countup_end'); }
    if (f >= fi + fl && !b.snapped) { b.snapped = true; setWin(G.spinBaseWin + b.amount, true); }
    dimmer(dim);
    if (f < fi + fl) tierFx(tier.fx, dt);
    ctx.save(); ctx.globalAlpha = alpha;
    rays(W / 2, H * .42, t, 'rgba(255,200,90,.35)', alpha * .8, tier.fx === 'lasers' || tier.fx === 'epic' ? 24 : 16);
    const img = A.real['banner_win_' + tier.id] && A.get('banner_win_' + tier.id);
    const k = img ? Math.min(W * .5 / img.width, H * .6 / img.height) : 1, ih = img ? img.height * k : 190, cy = img ? H * .36 : H * .4;
    ctx.translate(W / 2, cy + dy); ctx.scale(scale, scale);
    if (img) ctx.drawImage(img, -img.width * k / 2, -ih / 2, img.width * k, ih);
    else { ribbon(0, 0, 1100, 190, ['#e8402a', '#b0101a', '#6a0a0a']); blockText(tier.label, 0, -6, 110, { colors: ['#ffffff', tier.colors[0], tier.colors[1]], maxW: 1000 }); }
    ctx.restore();
    blockText(fmt(shown), W / 2, (img ? cy + ih / 2 + 78 : H * .64) + dy, img ? 130 : 150, { alpha, scale: f < fi ? ease.out(f / fi) : 1, maxW: W * .8 });
    if (f >= total) { const r = b.resolve; G.banner = null; r(); }
  }
  function panel(w, h) {
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#c8202a'); g.addColorStop(1, '#5a060c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 36); ctx.fill(); ctx.shadowBlur = 0;
    ctx.lineWidth = 9; ctx.strokeStyle = '#ffd34a'; ctx.stroke(); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,220,120,.7)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 22, -h / 2 + 22, w - 44, h - 44, 24); ctx.stroke();
    // corner knots
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { ctx.save(); ctx.translate(sx * (w / 2 - 22), sy * (h / 2 - 22)); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#ffd34a'; ctx.fillRect(-12, -12, 24, 24); ctx.fillStyle = '#a8101a'; ctx.fillRect(-6, -6, 12, 12); ctx.restore(); });
  }
  // free spins intro (pulse + rays, START), special symbol pick, retrigger, summary (COLLECT)
  function drawModal(t, dt) {
    const m = G.modal; if (!m) return;
    const [fi, fl0, fo] = FR.banner, fl = m.kind === 'pick' ? FR.pick[0] + FR.pick[1] : fl0;
    let f = (t - m.t0) * C.fps * G.speed;
    if (f >= fi + fl && !m.release) { if (C.autoContinueModals || G.autoplay) m.release = true; else { m.t0 = t - sec(fi + fl - 1); f = fi + fl - 1; } }
    if (G.skip !== m.tok) { m.tok = G.skip; if (m.kind !== 'pick' && f > fi * .5 && f < fi + fl) { m.release = true; m.t0 = t - sec(fi + fl); f = fi + fl; } }
    const pop = m.kind !== 'outro';
    let scale = 1, alpha = 1, dy = 0, dim = .7;
    if (f < fi) { const u = f / fi; dim = .7 * u; if (pop) scale = ease.elastic(u); else dy = -H * (1 - ease.out(u)); }
    else if (f < fi + fl) scale = pop ? 1 + .03 * (.5 - .5 * Math.cos((f - fi) / 30 * Math.PI * 2)) : 1;
    else { const u = clamp((f - fi - fl) / fo, 0, 1); dim = .7 * (1 - u); alpha = 1 - u; scale = pop ? 1 + .15 * u : 1 - .2 * u; }
    dimmer(dim);
    ctx.save(); ctx.globalAlpha = alpha;
    if (pop) { rays(W / 2, H * .45, t, 'rgba(255,200,90,.45)', alpha); if (f > fi && f < fi + fl && Math.random() < .5) emit('spark', W / 2 + (Math.random() - .5) * 900, H * .45 + (Math.random() - .5) * 400, 1, { angle: 0, spread: 6, speed: 60, gravity: 0, life: .7, size: 8, color: ['#fff6c8', '#ffd34a'] }); }
    ctx.translate(W / 2, H * .45 + dy); ctx.scale(scale, scale);
    const pw = 1000, ph = m.kind === 'pick' ? 640 : 560;
    panel(pw, ph);
    const lamp = A.real.fx_lantern ? A.get('fx_lantern') : null;
    if (lamp && m.kind !== 'pick') [-1, 1].forEach(s => { const lw = 120, lh = lamp.height * lw / lamp.width; ctx.save(); ctx.translate(s * (pw / 2 - 10), -ph / 2 - 40); ctx.rotate(Math.sin(t * 2 + s) * .08); ctx.drawImage(lamp, -lw / 2, 0, lw, lh); ctx.restore(); });
    if (m.kind === 'intro') {
      blockText('CONGRATULATIONS!', 0, -170, 70, { maxW: 820 });
      blockText(m.text1, 0, -50, 60, { colors: ['#ffffff', '#fff0c8'], maxW: 860 });
      blockText(m.text2, 0, 70, 120, { maxW: 860 });
    } else if (m.kind === 'pick') {
      // the special symbol: symbols cycle fast, slow down and stop on the pick
      blockText('SPECIAL EXPANDING SYMBOL', 0, -250, 52, { maxW: 860 });
      const fp = clamp(f - fi, 0, FR.pick[0]), u = fp / FR.pick[0], n = C.regular.length;
      const steps = 3 * n + ((m.special - m.start + n) % n), idx = (m.start + Math.floor(steps * (1 - Math.pow(1 - u, 2.2)) + (u >= 1 ? 0 : 0))) % n;
      const shown = u >= 1 ? m.special : idx;
      if (shown !== m.last) { m.last = shown; SND.play(u >= 1 ? 'sfx_pick_stop' : 'sfx_pick_tick'); if (u >= 1) for (let i = 0; i < 30; i++) emit('spark', W / 2, H * .45, 1, { angle: 0, spread: 7, speed: 600, gravity: 300, life: .9, size: 10, color: ['#fff6c8', '#ffd34a', '#ff5a3a'] }); }
      ctx.save(); ctx.fillStyle = 'rgba(40,0,0,.55)'; ctx.beginPath(); ctx.roundRect(-210, -195, 420, 340, 24); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = u >= 1 ? '#fff3a0' : '#ffd34a'; if (u >= 1) { ctx.shadowColor = '#ffd34a'; ctx.shadowBlur = 30; } ctx.stroke(); ctx.restore();
      const img = A.symbol(shown), k = Math.min(380 / img.width, 300 / img.height) * (u >= 1 ? 1 + .06 * Math.sin(t * 6) : 1);
      ctx.drawImage(img, -img.width * k / 2, -25 - img.height * k / 2, img.width * k, img.height * k);
      blockText(u >= 1 ? C.symbolNames[shown].toUpperCase() : ' ', 0, 200, 54, { colors: ['#ffffff', '#ffe9a8'], maxW: 860 });
      blockText(u >= 1 ? 'EXPANDS TO FILL ITS REELS AND PAYS ON ALL LINES' : ' ', 0, 262, 28, { colors: ['#ffffff', '#ffe9a8'], maxW: 880 });
    } else if (m.kind === 'retrigger') {
      blockText((C.texts && C.texts.retrigger) || 'MORE FREE SPINS!', 0, -110, 64, { maxW: 860 });
      blockText(m.text2, 0, 30, 120, { maxW: 860 });
    } else {
      const tu = clamp((f - fi) / FR.summaryTally, 0, 1), shown = (m.amount || 0) * ease.out(tu);
      if (tu > 0 && tu < 1 && t - (m.tick || 0) > .07) { m.tick = t; SND.play('sfx_countup_loop'); }
      if (tu >= 1 && !m.ended) { m.ended = true; SND.play('sfx_countup_end'); }
      blockText('CONGRATULATIONS!', 0, -170, 70, { maxW: 820 });
      blockText('YOU HAVE WON', 0, -70, 54, { colors: ['#ffffff', '#fff0c8'] });
      blockText(fmt(shown), 0, 40, 120, { maxW: 860 });
      blockText(m.capped ? `MAX WIN ${C.maxWin}× REACHED` : `IN ${m.spins} FREE SPINS`, 0, 140, 46, { colors: ['#ffffff', '#fff0c8'], maxW: 860 });
    }
    if (m.kind !== 'pick') {
      const bl = m.kind === 'outro' ? 'COLLECT' : m.kind === 'retrigger' ? 'CONTINUE' : 'START', pulse = 1 + .04 * Math.sin(t * 6), by = ph / 2 + 20;
      ctx.save(); ctx.translate(0, by); ctx.scale(pulse, pulse); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.roundRect(-160, -40, 320, 80, 40); ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.restore();
      ctx.save(); ctx.font = `48px ${BLOCK}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(bl, 0, by + 2); ctx.restore();
    }
    ctx.restore();
    if (f >= fi + fl && !m.outroCalled) { m.outroCalled = true; if (m.onOutro) m.onOutro(); }
    if (f >= fi + fl + fo) { const r = m.resolve; G.modal = null; r(); }
  }
  // to free spins: red and gold firecracker curtain; back to base: zoom out
  function drawTransition(t) {
    const tr = G.trans; if (!tr) return;
    const f = (t - tr.t0) * C.fps * G.speed;
    if (tr.kind === 'toFree') {
      const [a, b, c] = FR.transToFree;
      const cover = f < a ? ease.out(f / a) : f < a + b ? 1 : 1 - ease.inOut((f - a - b) / c);
      if (f >= a && !tr.swapped) { tr.swapped = true; tr.onCovered && tr.onCovered(); }
      const half = W / 2 * cover, folds = 9, fw = half / folds;
      for (const side of [0, 1]) for (let i = 0; i < folds; i++) {
        const x = side === 0 ? i * fw : W - (i + 1) * fw;
        const g = ctx.createLinearGradient(x, 0, x + fw, 0), dark = (i + side) % 2;
        g.addColorStop(0, dark ? '#6a0f1e' : '#c2283a'); g.addColorStop(.5, dark ? '#9a1a2c' : '#ff4a50'); g.addColorStop(1, dark ? '#4a0812' : '#a01a2a');
        ctx.fillStyle = g; ctx.fillRect(x, 0, fw + 1, H); ctx.fillStyle = '#ffd34a'; ctx.fillRect(x, 0, 3, H);
      }
      if (cover > .95) { blockText('FREE SPINS', W / 2, H * .45, 170); if (Math.random() < .4) popAt(W / 2 + (Math.random() - .5) * 1200, H * (.2 + Math.random() * .6)); }
      if (f >= a + b + c) { G.trans = null; tr.resolve(); }
    } else {
      const u = clamp(f / FR.transToBase, 0, 1);
      G.camera = 1.08 - .08 * ease.out(u);
      if (u >= 1) { G.camera = 1; G.trans = null; tr.resolve(); }
    }
  }
  function popAt(x, y) { emit('spark', x, y, 18, { angle: 0, spread: 7, speed: 420, gravity: 250, life: .8, size: 9, color: ['#fff6c8', '#ffd34a', '#ff5a3a'] }); SND.play('sfx_cracker_pop'); }

  /* ------------------------------------------------------------ paytable / rules (info button) */
  function drawInfo() {
    if (!G.info) return;
    dimmer(.88);
    ctx.save(); ctx.fillStyle = '#3a0a0e'; ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(80, 36, W - 160, H - 72, 30); ctx.fill(); ctx.stroke(); ctx.restore();
    blockText(`${C.title.toUpperCase()}  ·  PAYTABLE`, W / 2, 86, 50, { maxW: W - 320 });
    const b = bet(), syms = [SC, ...C.regular];
    syms.forEach((s, i) => {
      const col = i % 4, row = Math.floor(i / 4), x = 150 + col * 280, y = 200 + row * 205;
      const img = A.symbol(s), k = Math.min(130 / img.width, 120 / img.height); ctx.drawImage(img, x - img.width * k / 2, y - img.height * k / 2, img.width * k, img.height * k);
      const pays = s === SC ? C.scatterPays : C.paytable[s];
      Object.keys(pays).map(Number).sort((a, b2) => b2 - a).forEach((n, j) => uiText(`${n}  ${fmt(pays[n] * b)}`, x + 76, y - 42 + j * 32, 24, '#fff', 'left', 600));
    });
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = `500 21px ${UIF}`; ctx.fillStyle = 'rgba(255,240,220,.95)';
    const rules = [
      `The ${C.symbolNames[SC]} is Wild and substitutes for all symbols. 3, 4 or 5 Scatters anywhere pay ${fmt(C.scatterPays[3] * b)}, ${fmt(C.scatterPays[4] * b)} or ${fmt(C.scatterPays[5] * b)} and award ${C.freeSpins} free spins.`,
      `Before free spins start, one symbol is picked at random as the special expanding symbol. When it lands on enough reels for a win, it expands to fill those reels and pays on all ${C.paylines.length} lines, even on reels that are not next to each other.`,
      `3 or more Scatters during free spins award ${C.freeSpinsRetrigger} more. Free spins use the bet of the spin that triggered them.`,
      `Line wins pay left to right on adjacent reels; only the highest win per line is paid. Wins on different lines and scatter wins are added. Maximum win ${C.maxWin.toLocaleString('en-US')}× the total bet per round.`
    ];
    let yy = 172; rules.forEach(r => { yy = wrap(r, 1250, yy, 560, 30) + 48; });
    // 10 payline thumbnails
    C.paylines.forEach((line, i) => {
      const bx = 1250 + (i % 5) * 112, by = 790 + Math.floor(i / 5) * 100, s = 18;
      ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(bx, by, 5 * s, 3 * s);
      line.forEach((r, c) => { ctx.fillStyle = LINE_COLORS[i]; ctx.fillRect(bx + c * s + 2, by + r * s + 2, s - 4, s - 4); });
      uiText(String(i + 1), bx + 2.5 * s, by + 3 * s + 16, 16, '#fff', 'center', 600);
    });
    uiText('Click anywhere to close', W / 2, H - 70, 20, 'rgba(255,230,200,.75)', 'center', 600);
    ctx.textBaseline = 'alphabetic';
  }
  function wrap(text, x, y, maxW, lh) {
    const words = text.split(' '); let line = '';
    for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW) { ctx.fillText(line, x, y); line = w; y += lh; } else line = test; }
    ctx.fillText(line, x, y); return y;
  }

  /* ------------------------------------------------------------ frame loop */
  let lastT = now();
  function frame() {
    const t = now(), dt = Math.min(.05, t - lastT); lastT = t;
    updateReels(t);
    G.env = clamp(G.env + (G.envTarget - G.env) * Math.min(1, dt * (G.trans && G.trans.kind === 'toBase' ? 1.6 : 6)), 0, 1);
    G.dim = clamp(G.dim + ((G.dimTarget || 0) - G.dim) * Math.min(1, dt * 8), 0, 1);
    ctx.save();
    if (G.camera !== 1) { ctx.translate(W / 2, H / 2); ctx.scale(G.camera, G.camera); ctx.translate(-W / 2, -H / 2); }
    drawEnvironment(t);
    drawGrid(t);
    drawExpanded(t);
    drawFuses(t);
    drawAnticipation(t);
    drawLines(t);
    ctx.restore();
    drawHUD(t);
    drawBanner(t, dt);
    drawModal(t, dt);
    drawParticles(dt);
    drawTransition(t);
    drawInfo();
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------ step presentation */
  function setWin(v, instant) { G.winFrom = instant ? v : G.win; G.win = Math.round(v * 100) / 100; G.winT0 = instant ? 0 : now(); }
  function clearLines() { if (G.lines) G.lines.fade = now(); G.labels = []; }
  function highlight(cells, t0) { G.dimTarget = 1; cells.forEach(([c, r]) => { G.fx[c][r].win = t0; G.fx[c][r].keep = true; }); }
  function unhighlight() { G.dimTarget = 0; G.fx.forEach(col => col.forEach(f => { f.win = null; f.keep = false; f.pulse = null; })); }
  const symWinFrames = () => FR.symWin[0] + FR.symWin[1] + FR.symWin[2];

  // all winning lines together, then each line on its own once (only when more than one line won)
  async function showWin(step) {
    clearLines(); await wait(.02);
    let t0 = now();
    G.lines = { lines: step.wins.map(w => w.line), t0 };
    const cells = []; step.wins.forEach(w => w.positions.forEach(p => cells.push(p)));
    highlight(cells, t0);
    G.labels = [{ x: x0 + gw / 2, y: y0 + gh / 2, t0, text: fmt(step.amount), size: 70 }];
    SND.play('sfx_symbol_win_line'); setWin(G.win + step.amount);
    await waitF(symWinFrames(), true);
    if (step.wins.length > 1 && !G.autoplay) {
      for (const w of step.wins) {
        if (G.skipLines) break;
        clearLines(); unhighlight(); await wait(.02);
        t0 = now(); G.lines = { lines: [w.line], t0 }; highlight(w.positions, t0);
        const [lc, lr] = w.positions[w.positions.length - 1], [cx, cy] = cellCenter(lc, lr);
        G.labels = [{ x: cx, y: cy + ch * .3, t0, text: fmt(w.amount), size: 44 }];
        const tok = G.skip; await waitF(FR.lineCycle, true); if (G.skip !== tok) break;
      }
    }
    unhighlight(); clearLines();
  }
  async function showScatter(step) {
    clearLines(); const t0 = now();
    highlight(step.positions, t0);
    step.positions.forEach(([c, r]) => { G.fx[c][r].pulse = t0; });
    SND.play('sfx_scatter_win');
    if (step.amount) { G.labels = [{ x: x0 + gw / 2, y: y0 + gh / 2, t0, text: fmt(step.amount), size: 70 }]; setWin(G.win + step.amount); }
    await waitF(symWinFrames());
    unhighlight(); clearLines();
    if (step.freeSpins) {
      // light every Scatter's fuse: the firecracker string unrolls down the reel and pops
      const reels = [...new Set(step.positions.map(p => p[0]))];
      SND.play('sfx_fuse');
      reels.forEach((c, i) => setTimeout(() => G.fuses.push({ c, t0: now() }), i * 120 / G.speed));
      await waitF(FR.fuse[0] + 4);
      reels.forEach(c => popCrackers(c, 8));
      await waitF(FR.fuse[1] + FR.fuse[2]);
    }
  }
  async function showExpand(step) {
    clearLines();
    const [fl, gr, st] = FR.expand, t0 = now();
    // 1. the special symbols flash
    highlight(step.cells, t0); SND.play('sfx_expand_flash');
    await waitF(fl + 8);
    unhighlight();
    // 2. each reel grows from its special symbols to the full reel (left to right)
    for (const c of step.reels) {
      const rows = step.cells.filter(p => p[0] === c).map(p => p[1]);
      G.expanded[c] = { sym: step.sym, y0: y0 + Math.min(...rows) * ch, y1: y0 + (Math.max(...rows) + 1) * ch, t1: now() };
      SND.play('sfx_expand');
      const [cx] = cellCenter(c, 1); emit('spark', cx, y0 + gh / 2, 22, { angle: 0, spread: 7, speed: 500, gravity: 200, life: .7, size: 10, color: ['#fff6c8', '#ffd34a'] });
      await waitF(gr * .6);
    }
    await waitF(gr * .4 + st);
    for (let c = 0; c < C.reels; c++) if (step.reels.includes(c)) for (let r = 0; r < C.rows; r++) G.board[c][r] = step.sym;
    // 3. all lines pay
    const t2 = now(); G.lines = { lines: C.paylines.map((_, i) => i), t0: t2 };
    G.labels = [{ x: x0 + gw / 2, y: y0 + gh / 2, t0: t2, text: fmt(step.amount), size: 84 }];
    SND.play('sfx_symbol_win_line'); setWin(G.win + step.amount);
    await waitF(FR.expandLines, true);
    clearLines();
  }

  async function playSteps(steps) {
    for (const s of steps) {
      if (s.type === 'win') await showWin(s);
      else if (s.type === 'scatter') await showScatter(s);
      else if (s.type === 'expand') await showExpand(s);
    }
  }

  function bigWinBanner(amount) {
    const tier = engine.tierOf(amount, bet());
    if (tier < 0) return Promise.resolve();
    return new Promise(resolve => { G.banner = { tier, amount, t0: now(), tok: G.skip, resolve }; });
  }
  function modal(o) { return new Promise(resolve => { G.modal = Object.assign({ t0: now(), tok: G.skip, resolve }, o); }); }
  function transition(kind, onCovered) { return new Promise(resolve => { G.trans = { kind, t0: now(), resolve, onCovered }; }); }

  /* ------------------------------------------------------------ spin flow */
  async function spinOnce(item, inFS) {
    const res = director.build(item || { type: 'random' }, { bet: bet(), inFreeSpins: inFS, special: G.fs.special });
    applySpeed();
    G.fx = newFx(); G.lines = null; G.labels = []; G.expanded = {}; G.fuses.forEach(f => { f.fade = f.fade || now(); });
    if (!inFS) { G.balance = Math.round((G.balance - bet()) * 100) / 100; setWin(0, true); }
    G.spinBaseWin = G.win;      // the HUD win box keeps the round total during free spins
    SND.play('sfx_spin_button_click'); SND.play('sfx_reel_spin');
    G.spinning = true; G.onChange();
    await startReels(res.start, inFS, G.fs.special);
    G.spinning = false; G.onChange();
    await wait(.12 / G.speed);
    await playSteps(res.steps);
    // the round's big win banner (free spins: per spin, the summary shows the total)
    await bigWinBanner(res.total);
    return res;
  }
  function nextItem() {
    const it = G.queue.length ? G.queue.shift() : { type: 'random' };
    G.onChange(); return it;
  }

  // a spin must be affordable: lower the bet to the highest one the balance covers, or refill the demo balance
  function ensureFunds() {
    if (G.balance >= bet() - 1e-9) return;
    if (G.balance < C.bets[0] - 1e-9) {
      G.balance = C.startBalance; G.notice = { text: 'DEMO BALANCE REFILLED', t0: performance.now() };
    } else {
      let i = G.betIndex; while (i > 0 && C.bets[i] > G.balance + 1e-9) i--;
      G.betIndex = i; G.notice = { text: 'BET LOWERED TO ' + fmt(bet()), t0: performance.now() };
    }
    G.onChange();
  }
  async function play() {
    if (G.busy || G.info) return false;
    ensureFunds();
    G.busy = true; G.onChange(); SND.init(root.ASSET_MANIFEST); SND.playMusic('bgm_basegame_loop');
    try {
      const base = await spinOnce(nextItem(), false);
      let roundWin = base.total;
      if (base.freeSpins) roundWin = await freeSpins(base.freeSpins, roundWin, base.special != null ? base.special : engine.pickSpecial());
      roundWin = Math.min(roundWin, C.maxWin * bet());
      G.balance = Math.round((G.balance + roundWin) * 100) / 100;
      setWin(roundWin, true);
    } catch (e) {
      // an error mid-round must not leave the game stuck on a banner, modal, transition or the free-spins look
      console.error(e);
      G.spinning = false; G.banner = null; G.modal = null; G.trans = null; G.antic = null; G.fuses = []; G.expanded = {};
      G.fs.active = false; G.fs.special = null; G.envTarget = 0; G.env = 0; G.autoplay = false; G.dimTarget = 0;
    }
    G.busy = false; G.onChange(); applySpeed();
    return true;
  }
  async function freeSpins(count, roundWin, special) {
    const fs = G.fs, baseWin = roundWin;
    Object.assign(fs, { left: count, played: 0, total: 0, awarded: count, capped: false, special: null });
    await modal({ kind: 'intro', text1: 'YOU HAVE WON', text2: `${count} FREE SPINS` });
    await modal({ kind: 'pick', special, start: Math.floor(Math.random() * C.regular.length) });
    await transition('toFree', () => { fs.active = true; fs.special = special; G.envTarget = 1; G.env = 1; G.fuses = []; G.fx = newFx(); SND.playMusic('bgm_freegame_loop'); });
    while (fs.left > 0) {
      fs.left--; fs.played++;
      await wait(.35 / G.speed);
      const r = await spinOnce(nextItem(), true);
      fs.total = Math.round((fs.total + r.total) * 100) / 100; roundWin += r.total;
      if (roundWin >= C.maxWin * bet()) {
        // max win cap: stop the round, the summary shows the capped amount
        roundWin = C.maxWin * bet(); fs.total = Math.round((roundWin - baseWin) * 100) / 100; fs.capped = true; fs.left = 0; break;
      }
      if (r.freeSpins) {
        await modal({ kind: 'retrigger', text2: `+${r.freeSpins} FREE SPINS` });
        fs.left += r.freeSpins; fs.awarded += r.freeSpins;
        G.fuses.forEach(f => { f.fade = f.fade || now(); });
      }
    }
    await wait(.4 / G.speed);
    await modal({ kind: 'outro', amount: fs.total, spins: fs.played, capped: fs.capped, onOutro: () => { fs.active = false; fs.special = null; G.envTarget = 0; G.expanded = {}; } });
    await transition('toBase');
    SND.playMusic('bgm_basegame_loop');
    return roundWin;
  }
  let autoLoop = 0;    // id of the running autoplay loop, so toggling AUTO off and on never runs two loops
  async function autoplayLoop() {
    G.autoplay = !G.autoplay; G.onChange();
    const me = ++autoLoop;
    while (G.autoplay && me === autoLoop) { await play(); if (G.autoplay && me === autoLoop) await wait(.5); }
  }
  async function playQueue(n) {
    G.autoplay = true; G.onChange();
    const me = ++autoLoop;
    let i = 0; const max = n ?? G.queue.length;
    // stop once the list is used up: free spins consume list items inside a single round
    while (G.autoplay && me === autoLoop && i < max && (i === 0 || G.queue.length)) { await play(); i++; if (i < max && G.queue.length) await wait(.8); }
    if (me === autoLoop) { G.autoplay = false; G.onChange(); }
  }

  /* ------------------------------------------------------------ input */
  cv.addEventListener('pointerdown', e => {
    SND.init(root.ASSET_MANIFEST);
    const rc = cv.getBoundingClientRect(), x = (e.clientX - rc.left) / rc.width * W, y = (e.clientY - rc.top) / rc.height * H;
    if (G.info) { G.info = false; return; }
    const hit = b => Math.hypot(x - b.x, y - b.y) <= b.r * 1.15;
    if (hit(btn.spin)) { if (!G.busy) play(); else G.skip++; return; }
    if (Math.abs(x - btn.auto.x) < 72 && Math.abs(y - btn.auto.y) < 20) { autoplayLoop(); return; }
    if (hit(btn.info)) { if (!G.busy) G.info = true; return; }
    if (hit(btn.sound)) { SND.setMuted(!SND.muted); return; }
    if (hit(btn.minus)) { if (!G.busy) { G.betIndex = Math.max(0, G.betIndex - 1); G.onChange(); } return; }
    if (hit(btn.plus)) { if (!G.busy) { G.betIndex = Math.min(C.bets.length - 1, G.betIndex + 1); G.onChange(); } return; }
    G.skip++;
  });
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space') return;
    const tg = e.target.tagName; if (tg === 'INPUT' || tg === 'SELECT' || tg === 'BUTTON' || tg === 'TEXTAREA') return;
    e.preventDefault(); SND.init(root.ASSET_MANIFEST); if (G.info) G.info = false; else if (G.busy) G.skip++; else play();
  });

  /* ------------------------------------------------------------ boot */
  async function boot() {
    const splash = root.Splash && C.splash && C.splash.enabled && !/[?&]nosplash\b/.test(location.search) ? root.Splash : null;
    if (splash) splash.start(C);
    try { await Promise.race([Promise.all([document.fonts.load(`80px ${BLOCK}`), document.fonts.load(`700 40px ${UIF}`)]), new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
    try { G.assetInfo = await A.load(root.ASSET_MANIFEST, W, H, L, splash && splash.progress); }
    catch (e) { console.error('asset load failed, starting with placeholders', e); G.assetInfo = G.assetInfo || { missing: [], loaded: 0 }; }
    requestAnimationFrame(frame);
    G.onChange();
    if (splash) splash.finish();
  }

  root.Game = { G, C, engine, director, setSpeed, play, playQueue, autoplayLoop, boot, canvas: cv, bet, cellCenter };
})(window);
