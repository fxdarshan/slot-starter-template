/*
 * Game configuration: maths, animation timing and presentation switches.
 * The engine (engine.js) reads only this object, so the same file drives the
 * browser game and the Node simulator (tools/simulate.js).
 *
 * SAMPLE GAME. The template ships with a working book-style game so everything runs on day one:
 * the features and maths of Pragmatic Play's "John Hunter and the Book of Tut" (docs/reference-game.md):
 *   5x3, 10 fixed lines, 96.50% RTP, Scatter = Wild + Scatter (the "book"),
 *   3+ scatters = 10 free spins with one random expanding symbol, unlimited retriggers.
 * For a new game: replace the values below from docs/ (see NEW_GAME.md), mark every value that is not
 * in the specs ASSUMED or TUNED, and re-tune with tools/simulate.js.
 *
 * Sources:
 *   REF    docs/reference-game.md      (published facts of the reference game, with links)
 *   RULES  docs/official-game-rules.md (the game's rules, written from REF)
 *   PAY    docs/pay-table.md
 *   ASSUMED  not published for the reference game; chosen here and listed in the README
 *   TUNED    not published; tuned with tools/simulate.js to hit the published RTP
 */
(function (root) {
  const CONFIG = {
    title: 'Starter Slot',
    // short theme texts used by the splash screen, modals and rules screen
    texts: {
      brand: 'Starter Slot',                        // small line on the splash screen
      loading: ['Shuffling the Reels...', 'Polishing the Symbols...', 'Counting the Coins...', 'Lighting the Lights...'],
      retrigger: 'MORE FREE SPINS!',               // retrigger modal title
      expandedPanel: ['#7fd0ff', '#bfe9ff', '#ffffff']   // sky behind sym_00_expanded art (top to bottom)
    },

    // ---------------------------------------------------------------- grid (REF: 5 reels x 3 rows)
    reels: 5,
    rows: 3,

    // Symbol ids: 0 = highest paying. SCATTER is the "book": wild and scatter at once.
    regular: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    SCATTER: 11,
    symbolNames: {
      0: 'Crown', 1: 'Ruby', 2: 'Emerald', 3: 'Sapphire', 4: 'Gold Bar', 5: 'Coins',
      6: 'A', 7: 'K', 8: 'Q', 9: 'J', 10: '10', 11: 'Scatter'
    },
    // the reference game's symbol each one plays the part of
    refSymbol: { 0: 'John Hunter', 1: 'Tutankhamun mask', 2: 'Cat', 3: 'Scarab', 4: '(none: extra)', 5: '(none: extra)', 6: 'A', 7: 'K', 8: 'Q', 9: 'J', 10: '10', 11: 'Book of Tut' },

    // ------------------------------------------------------------ paylines (REF: 10 fixed lines)
    // Row index per reel: 0 Top, 1 Middle, 2 Bottom. ASSUMED: the classic 10-line book-slot layout
    // (the reference game's line shapes are not published in the sources found).
    paylines: [
      [1, 1, 1, 1, 1],  //  1 middle
      [0, 0, 0, 0, 0],  //  2 top
      [2, 2, 2, 2, 2],  //  3 bottom
      [0, 1, 2, 1, 0],  //  4 V
      [2, 1, 0, 1, 2],  //  5 inverted V
      [1, 2, 2, 2, 1],  //  6
      [1, 0, 0, 0, 1],  //  7
      [2, 2, 1, 0, 0],  //  8
      [0, 0, 1, 2, 2],  //  9
      [2, 1, 1, 1, 0]   // 10
    ],

    // ------------------------------------------------------------ paytable (REF, x TOTAL bet for one line)
    // Line wins pay left to right on adjacent reels, highest win per line.
    paytable: {
      0:  { 2: 1,   3: 10,  4: 100, 5: 500 },  // Crown    = John Hunter
      1:  { 2: 0.5, 3: 4,   4: 40,  5: 200 },  // Ruby     = Tutankhamun mask
      2:  { 2: 0.5, 3: 3,   4: 10,  5: 75 },   // Emerald  = Cat
      3:  { 2: 0.5, 3: 3,   4: 10,  5: 75 },   // Sapphire = Scarab
      4:  { 3: 1,   4: 5,   5: 25 },           // Gold Bar ASSUMED (extra symbol, no reference value)
      5:  { 3: 1,   4: 5,   5: 25 },           // Coins    ASSUMED (extra symbol, no reference value)
      6:  { 3: 0.5, 4: 4,   5: 15 },           // A
      7:  { 3: 0.5, 4: 4,   5: 15 },           // K
      8:  { 3: 0.5, 4: 2.5, 5: 10 },           // Q
      9:  { 3: 0.5, 4: 2.5, 5: 10 },           // J
      10: { 3: 0.5, 4: 2.5, 5: 10 }            // 10
    },
    scatterPays: { 3: 2, 4: 20, 5: 200 },      // REF: 3 / 4 / 5 books pay 2x / 20x / 200x total bet, anywhere

    // Symbol weights per reel for random stops (TUNED). Each cell is drawn independently.
    // Rows: reel 1..5. Columns: symbol id 0..11 (11 = Scatter).
    weights: [
      [4.6, 5.8, 7.5, 7.5, 7, 7, 10, 10, 10.5, 10.5, 10.5, 2.4],
      [4.6, 5.8, 7.5, 7.5, 7, 7, 10, 10, 10.5, 10.5, 10.5, 2.4],
      [4.6, 5.8, 7.5, 7.5, 7, 7, 10, 10, 10.5, 10.5, 10.5, 2.4],
      [4.6, 5.8, 7.5, 7.5, 7, 7, 10, 10, 10.5, 10.5, 10.5, 2.4],
      [4.6, 5.8, 7.5, 7.5, 7, 7, 10, 10, 10.5, 10.5, 10.5, 2.4]
    ],
    // Free spins use their own weights (TUNED): fewer scatters, so retriggers are rarer.
    weightsFreeSpins: null,                    // null = same as base
    specialBoost: 1.33,                         // free spins: the special symbol's weight is multiplied by this (TUNED)

    // ---------------------------------------------------------- free spins (REF)
    freeSpins: 10,                             // 3+ scatters award 10 free spins
    freeSpinsRetrigger: 10,                    // 3+ scatters during free spins add 10 more, no limit
    // Which symbol becomes the expanding symbol (TUNED weights; REF: "one regular symbol chosen at random")
    specialWeights: { 0: 6, 1: 8, 2: 9, 3: 9, 4: 9, 5: 9, 6: 10, 7: 10, 8: 10, 9: 10, 10: 10 },
    // The special symbol expands when it is on enough reels to win (2 for symbols that pay 2 of a kind,
    // else 3), anywhere on those reels, and then pays on every line regardless of adjacency (REF).
    expandPaysAllLines: true,

    maxWin: 5500,                              // REF (pragmaticplay.com): 5,500x per round. Reviews say 5,000x.

    // ---------------------------------------------------------------- money (REF: 0.10 to 100 per spin)
    bets: [0.10, 0.20, 0.50, 1, 2, 5, 9, 10, 20, 50, 100],
    defaultBetIndex: 6,                        // 9.00
    startBalance: 500,
    currency: '$',

    // ---------------------------------------------------------- big win banners (ASSUMED thresholds, x total bet)
    winTiers: [
      { id: 'nice',        min: 10,  label: 'NICE WIN!',        colors: ['#fff4d0', '#f2b632', '#a8320c'], fx: 'fountain' },
      { id: 'big',         min: 20,  label: 'BIG WIN!',         colors: ['#ffffff', '#ffd25a', '#c2281a'], fx: 'drop' },
      { id: 'mega',        min: 50,  label: 'MEGA WIN!',        colors: ['#fff4c2', '#f2b632', '#b0102a'], fx: 'cascade' },
      { id: 'superb',      min: 100, label: 'SUPERB WIN!',      colors: ['#fff2d8', '#ff9a3a', '#b0102a'], fx: 'fireworks' },
      { id: 'sensational', min: 250, label: 'SENSATIONAL WIN!', colors: ['#fff0f0', '#ff5a5a', '#e8b23a'], fx: 'lasers' },
      { id: 'epic',        min: 500, label: 'EPIC WIN!',        colors: ['#ffffff', '#ffe27a', '#d6202f'], fx: 'epic' }
    ],

    // ------------------------------------------------------- animation timing (ASSUMED, frames at 30 fps)
    splash: { enabled: true, minMs: 2600, fadeMs: 700 },
    fps: 30,
    frames: {
      bgBaseLoop: 120,                  // background breathing
      symWin: [10, 20, 15],             // winning symbol: pop, hold, settle
      lineCycle: 36,                    // each line shown on its own after the all-lines view
      scatterLand: 12,                  // scatter squash when it lands
      fuse: [24, 18, 18],               // trigger: fuse unrolls down the reel, crackers pop, settle
      pick: [90, 30],                   // special symbol pick: symbols cycle and slow down, then hold
      expand: [12, 24, 12],             // expanding symbol: flash, grow to the full reel, settle
      expandLines: 45,                  // all 10 lines shown over the expanded reels
      anticipation: 45,                 // extra spin time on each reel after 2 scatters have landed
      banner: [30, 90, 30],             // modals and big win banners
      bannerTally: [30, 105],
      summaryTally: 75,
      transToFree: [15, 45, 15],
      transToBase: 60
    },
    anticipate: true,                   // slow the remaining reels when 2 scatters are showing
    autoContinueModals: true,           // START / COLLECT continue by themselves after the hold

    spin: { first: 1.0, gap: 0.18, speed: 22, bounce: 1.2 },

    // Layout in stage pixels (1920 x 1080): where the reels sit on the background art.
    // Measure the reel area on bg_base_main (after import) and set it here; cells are w/reels x h/rows.
    stage: { landscape: [1920, 1080] },
    window: { x: 214.7, y: 138.7, w: 1488.6, h: 776.9 },
    hudTop: 944,                        // the bottom bar starts here (mockup y 1940)
    message: 'DEMO GAME IS ACTIVE'      // the message pill above the bar
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
  else root.CONFIG = CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
