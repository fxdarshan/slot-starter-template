#!/usr/bin/env node
/*
 * Monte Carlo check of the prototype maths in src/config.js.
 * Usage: node tools/simulate.js [rounds] [seed]     (default 2,000,000 rounds)
 * Targets (reference game, docs/reference-game.md): RTP 96.50%, max win 5,500x, high volatility.
 * Hit rate and free spins frequency are not published; book slots usually trigger free
 * spins about 1 in 150 to 1 in 200 spins.
 */
const CONFIG = require('../src/config.js');
if (process.env.W) Object.assign(CONFIG, JSON.parse(process.env.W));   // tuning overrides, e.g. W='{"specialBoost":2}'
const Engine = require('../src/engine.js');

const rounds = Number(process.argv[2]) || 2e6;
let seed = Number(process.argv[3]) || 12345;
const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; let t = seed ^ (seed >>> 15); t = Math.imul(t, 2246822507) >>> 0; return ((t ^ (t >>> 13)) >>> 0) / 4294967296; };
const eng = Engine.create(CONFIG, rng);

const bet = 1;
let paid = 0, basePaid = 0, fsPaid = 0, hits = 0, fsTriggers = 0, retriggers = 0, fsSpins = 0, capped = 0, maxX = 0, expands = 0;
const tiers = CONFIG.winTiers.map(() => 0), bySpecial = {}, expCount = { 2: 0, 3: 0, 4: 0, 5: 0 };
const buckets = [0, 0, 0, 0, 0];   // round wins: 0, <1x, 1-10x, 10-100x, 100x+

for (let i = 0; i < rounds; i++) {
  const base = eng.resolveSpin(eng.randomGrid(), { bet });
  let win = base.total, fsLeft = base.freeSpins;
  basePaid += base.total;
  if (base.total > 0) hits++;
  if (fsLeft) {
    fsTriggers++;
    const special = eng.pickSpecial(); let fsw = 0;
    bySpecial[special] = bySpecial[special] || { n: 0, paid: 0 }; bySpecial[special].n++;
    while (fsLeft > 0) {
      fsLeft--; fsSpins++;
      const r = eng.resolveSpin(eng.randomGrid({ fs: true, special }), { bet, inFreeSpins: true, special });
      fsw += r.total;
      const ex = r.steps.find(s => s.type === 'expand'); if (ex) { expands++; expCount[ex.count]++; }
      if (r.freeSpins) { fsLeft += r.freeSpins; retriggers++; }
      if (win + fsw >= CONFIG.maxWin * bet) break;
    }
    bySpecial[special].paid += fsw; fsPaid += fsw; win += fsw;
  }
  if (win > CONFIG.maxWin * bet) { win = CONFIG.maxWin * bet; capped++; }
  paid += win;
  maxX = Math.max(maxX, win / bet);
  const ti = eng.tierOf(win, bet); if (ti >= 0) tiers[ti]++;
  buckets[win === 0 ? 0 : win < 1 ? 1 : win < 10 ? 2 : win < 100 ? 3 : 4]++;
}

const pct = v => (v * 100).toFixed(2) + '%';
console.log(`Rounds simulated : ${rounds.toLocaleString()}`);
console.log(`RTP              : ${pct(paid / (rounds * bet))}   (reference 96.50%)  base ${pct(basePaid / rounds)}, free spins ${pct(fsPaid / rounds)}`);
console.log(`Hit frequency    : ${pct(hits / rounds)}   (base spins with any win)`);
console.log(`Free spins       : 1 in ${(rounds / Math.max(1, fsTriggers)).toFixed(0)}, average ${(fsSpins / Math.max(1, fsTriggers)).toFixed(1)} spins, average win ${(fsPaid / Math.max(1, fsTriggers)).toFixed(1)}x, retriggers ${retriggers}`);
console.log(`Expansions       : ${(expands / Math.max(1, fsSpins) * 100).toFixed(1)}% of free spins; by reels 2:${expCount[2]} 3:${expCount[3]} 4:${expCount[4]} 5:${expCount[5]}`);
console.log(`By special       : ${Object.keys(bySpecial).sort((a, b) => a - b).map(k => `${CONFIG.symbolNames[k]} ${(bySpecial[k].paid / bySpecial[k].n).toFixed(0)}x`).join(', ')}`);
console.log(`Round wins       : 0 ${pct(buckets[0] / rounds)}, <1x ${pct(buckets[1] / rounds)}, 1-10x ${pct(buckets[2] / rounds)}, 10-100x ${pct(buckets[3] / rounds)}, 100x+ ${pct(buckets[4] / rounds)}`);
console.log(`Win banners      : ${CONFIG.winTiers.map((t, i) => t.id + ' 1 in ' + (tiers[i] ? Math.round(rounds / tiers[i]) : '-')).join(', ')}`);
console.log(`Max win seen     : ${maxX.toFixed(1)}x   (cap ${CONFIG.maxWin}x, capped ${capped} times)`);
