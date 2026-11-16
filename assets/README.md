# Assets

The game loads only what `assets/manifest.js` lists, from `assets/images/` and `assets/audio/`. Missing files keep the code-drawn placeholder (`src/placeholders.js`) or the synthesised sound (`src/audio.js`), so art can arrive one file at a time.

- **Add art:** put it in `art/` named by asset ID and run `python3 tools/asset-pipeline/import_art.py` (see `art/README.md`). Don't edit files here by hand; re-import instead.
- **Fit:** symbol sizes are boxes in `manifest.js` → `fit`; the reel area is `CONFIG.window` in `src/config.js`.
- **Sounds:** MP3 in `assets/audio/` with the names in `manifest.js` → `sounds`; they load only when the game is served over http.
- **Delivered so far:** none (template). Each game lists its delivered art here.
