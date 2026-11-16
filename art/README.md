# Art inbox

Drop art here, named after its **asset ID**, then run:

```bash
python3 tools/asset-pipeline/import_art.py
```

It finds every file whose name (any case, any image type) is an asset ID in `assets/manifest.js`, processes it, and writes it where the game loads it. It also lists files it didn't recognise and IDs still using placeholders.

| Folder | Files | Becomes |
| --- | --- | --- |
| `backgrounds/` | `bg_base_main`, `bg_freegame_main` | 1920×1080 JPG (cover crop, keep the reels in the middle 16:9) |
| `symbols/` | `sym_00_idle` (top pay) … `sym_10_idle`, `sym_scatter_idle`, optional `sym_00_expanded` | trimmed, 600 px wide WebP, transparent |
| `fx/` | `fx_scatter_full`, `fx_lantern` | trimmed WebP |
| `banners/` | `banner_win_nice`, `_big`, `_mega`, `_superb`, `_sensational`, `_epic` | trimmed WebP |
| `ui/` | `ui_splash_logo` | trimmed WebP |

Folders are only for tidiness; the file name decides where it goes.

## Tips
- **Transparent PNGs** for everything except backgrounds.
- **Backgrounds with empty reels.** If you only have a mockup with symbols baked in, drop it in anyway and say so: `clean_mockup_reels.py` and `fix_reel_panel.py` can rebuild the empty reel panels.
- **Under 25 MB per file** so it can be uploaded on GitHub from any computer (repo → `art/` → Add file → Upload files). Export big PSD renders at 4096 px or less.
- **Committed on purpose:** art in this folder travels through GitHub, so Claude Code at home and claude.ai chat elsewhere both see it.
