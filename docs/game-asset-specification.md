# Starter Slot (sample game): Asset Specification

Every asset ID in `assets/manifest.js`. Name an art file after its ID, put it in `art/`, and run `python3 tools/asset-pipeline/import_art.py` (see `art/README.md`). Anything missing stays a code-drawn placeholder.

| ID | What | Size after import | Required |
| --- | --- | --- | --- |
| `bg_base_main` | base game background with the reel frame (reels empty) | 1920×1080 JPG | yes |
| `bg_freegame_main` | free spins background | 1920×1080 JPG | yes |
| `sym_00_idle` … `sym_10_idle` | 11 pay symbols, highest pay first (`sym_00` = top symbol, `sym_06`-`sym_10` = A K Q J 10) | 600 px wide WebP | yes |
| `sym_scatter_idle` | Scatter (Wild + Scatter) | 600 px wide WebP | yes |
| `sym_00_expanded` | full-reel art for the top symbol when it expands | WebP, tall | optional |
| `fx_scatter_full` | full-reel Scatter, revealed down the reel when free spins trigger | WebP, tall | optional |
| `fx_lantern` | small hanging decoration for anticipation and modals | WebP | optional |
| `banner_win_nice`, `_big`, `_mega`, `_superb`, `_sensational`, `_epic` | title art for win banners (amount drawn below) | up to 1200 px WebP | optional |
| `ui_splash_logo` | game logo for the splash screen | up to 1200 px WebP | optional |
| sounds | names in `assets/manifest.js` → `sounds` | MP3 | optional |

## Prototype implementation status
All IDs are wired; none are supplied in the template.
