---
name: slot-asset-integration
description: Put supplied slot art or sound (files in art/, a zip, chat attachments, mockups) into this game - map to asset IDs, clean up, import, fit, test, document, push. Use whenever new art or audio arrives.
---

# Slot asset integration

Asset IDs are the keys in `assets/manifest.js`; the list with sizes is `docs/game-asset-specification.md`. Art arrives in `art/` (committed, so it reaches every session) or as attachments; save attachments into `art/` too.

## 1. Look before deciding
- Unzip archives into their own empty folder outside the repo; never run anything from inside them; run Python with `-I` on them.
- List every image (size, mode, corner pixel) and make one contact sheet; look at it.
- Read file names: they often say the intent, but may be leftovers from another game. Trust what the picture shows.

## 2. Map to asset IDs
- Rename (or copy) each file to its ID in `art/<folder>/<id>.png`. Highest pay = `sym_00`. Say the mapping in the reply so Darshan can swap.
- Flag gaps and conflicts: baked-in text or numbers, mockups with symbols baked into the reels, wrong aspect, low resolution, art from another game.

## 3. Clean up (only what is needed)
- **Mockup backgrounds with baked symbols:** `tools/asset-pipeline/clean_mockup_reels.py` then `fix_reel_panel.py` (measure the reel window in the mockup's pixels and pass it). Look at the result zoomed in.
- **Flat or studio backgrounds behind symbols:** `cut_backgrounds.py` (rembg ISNet; BiRefNet needs >7 GB memory). Glow art: `cut_glow.py`. Sprite sheets: `cut_sprite_sheet.py`, `normalize_sprite_sheet.py`, `align_sprite_sheet.py`.
- **Black-background FX:** alpha from brightness, drawn additively; don't cut out.

## 4. Import and fit
- `python3 tools/asset-pipeline/import_art.py` (backgrounds → 1920×1080 JPG, symbols → trimmed 600 px WebP, the rest → trimmed WebP up to 1200 px). It lists unmatched names and IDs still placeholder.
- Set `CONFIG.window` in `src/config.js` to the background's reel area; adjust `fit` boxes in `assets/manifest.js` if symbols look too big or small. New feature art: add an ID to the manifest (and a placeholder in `src/placeholders.js`).

## 5. Test
- Serve and screenshot in headless Chrome: idle, wins, anticipation, free spins trigger, pick, expansion, banners, summary, paytable. Force them with cheats or scenarios. Zero page errors.
- `node tools/build-single.js` and open the result from file://.

## 6. Finish
Run `slot-project-sync`. The reply has a table (file → ID → what was done), what was lost or changed in processing, and what is still placeholder.
