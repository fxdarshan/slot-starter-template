/*
 * ASSET MANIFEST
 * ---------------------------------------------------------------------------
 * Every image and sound, keyed by asset ID. Paths follow one rule:
 *   assets/images/<folder>/<asset id>.<webp|jpg>
 * so art dropped into art/ with the asset ID as its file name is imported by
 * tools/asset-pipeline/import_art.py with no edits here. Missing files keep the
 * code-drawn placeholder (src/placeholders.js), so art can arrive one file at a time.
 *
 * Sizes (after import_art.py):
 *   bg_*_main ........ 1920 x 1080 JPG; the reel window is CONFIG.window (default x 215-1703, y 139-916)
 *   sym_*_idle ....... about 600 px wide, transparent, trimmed; fitted into the cell with the box in `fit`
 *   sym_00_expanded .. optional full-reel art for symbol 0 when it expands (else the symbol is stacked)
 *   fx_scatter_full .. full-reel Scatter, revealed down the reel when free spins trigger
 *   fx_lantern ....... small hanging decoration for anticipation and modals (any themed object)
 *   banner_win_* ..... title art above the amount (code-drawn ribbon when missing)
 *
 * Sounds: MP3 or WAV. They only load when the game is served over http(s). Without files,
 * synthesised placeholder sounds play.
 */
window.ASSET_MANIFEST = {
  // fitting box per symbol, [width, height] as a fraction of the cell; art may overflow the cell a little
  fit: {
    default:          [0.98, 1.06],
    sym_scatter_idle: [1.00, 1.08],
    sym_06_idle: [0.80, 0.86], sym_07_idle: [0.80, 0.86], sym_08_idle: [0.80, 0.86], sym_09_idle: [0.80, 0.86], sym_10_idle: [0.86, 0.80]
  },

  images: {
    bg_base_main:           'assets/images/environment/bg_base_main.jpg',
    bg_freegame_main:       'assets/images/environment/bg_freegame_main.jpg',

    sym_00_idle:            'assets/images/symbols/sym_00_idle.webp',
    sym_00_expanded:        'assets/images/symbols/sym_00_expanded.webp',
    sym_01_idle:            'assets/images/symbols/sym_01_idle.webp',
    sym_02_idle:            'assets/images/symbols/sym_02_idle.webp',
    sym_03_idle:            'assets/images/symbols/sym_03_idle.webp',
    sym_04_idle:            'assets/images/symbols/sym_04_idle.webp',
    sym_05_idle:            'assets/images/symbols/sym_05_idle.webp',
    sym_06_idle:            'assets/images/symbols/sym_06_idle.webp',
    sym_07_idle:            'assets/images/symbols/sym_07_idle.webp',
    sym_08_idle:            'assets/images/symbols/sym_08_idle.webp',
    sym_09_idle:            'assets/images/symbols/sym_09_idle.webp',
    sym_10_idle:            'assets/images/symbols/sym_10_idle.webp',
    sym_scatter_idle:       'assets/images/symbols/sym_scatter_idle.webp',

    fx_scatter_full:        'assets/images/fx/fx_scatter_full.webp',
    fx_lantern:             'assets/images/fx/fx_lantern.webp',

    banner_win_nice:        'assets/images/banners/banner_win_nice.webp',
    banner_win_big:         'assets/images/banners/banner_win_big.webp',
    banner_win_mega:        'assets/images/banners/banner_win_mega.webp',
    banner_win_superb:      'assets/images/banners/banner_win_superb.webp',
    banner_win_sensational: 'assets/images/banners/banner_win_sensational.webp',
    banner_win_epic:        'assets/images/banners/banner_win_epic.webp',

    ui_splash_logo:         'assets/images/ui/ui_splash_logo.webp'
  },

  sounds: {
    bgm_basegame_loop:      'assets/audio/bgm_basegame_loop.mp3',
    bgm_freegame_loop:      'assets/audio/bgm_freegame_loop.mp3',
    sfx_spin_button_click:  'assets/audio/sfx_spin_button_click.mp3',
    sfx_reel_spin:          'assets/audio/sfx_reel_spin.mp3',
    sfx_reel_stop_01:       'assets/audio/sfx_reel_stop_01.mp3',
    sfx_reel_stop_02:       'assets/audio/sfx_reel_stop_02.mp3',
    sfx_reel_stop_03:       'assets/audio/sfx_reel_stop_03.mp3',
    sfx_reel_stop_04:       'assets/audio/sfx_reel_stop_04.mp3',
    sfx_reel_stop_05:       'assets/audio/sfx_reel_stop_05.mp3',
    sfx_scatter_land:       'assets/audio/sfx_scatter_land.mp3',
    sfx_scatter_win:        'assets/audio/sfx_scatter_win.mp3',
    sfx_fuse:               'assets/audio/sfx_fuse.mp3',
    sfx_cracker_pop:        'assets/audio/sfx_cracker_pop.mp3',
    sfx_pick_tick:          'assets/audio/sfx_pick_tick.mp3',
    sfx_pick_stop:          'assets/audio/sfx_pick_stop.mp3',
    sfx_expand_flash:       'assets/audio/sfx_expand_flash.mp3',
    sfx_expand:             'assets/audio/sfx_expand.mp3',
    sfx_symbol_win_line:    'assets/audio/sfx_symbol_win_line.mp3',
    sfx_countup_loop:       'assets/audio/sfx_countup_loop.mp3',
    sfx_countup_end:        'assets/audio/sfx_countup_end.mp3',
    banner_hit:             'assets/audio/banner_hit.mp3'
  }
};
