#!/usr/bin/env python3
"""
Import art from the art/ inbox into the game, with no manual mapping.

Name each file after its asset ID (the keys in assets/manifest.js), in any of these folders:
    art/backgrounds/bg_base_main.png        art/symbols/sym_00_idle.png      art/fx/fx_scatter_full.png
    art/banners/banner_win_big.png          art/ui/ui_splash_logo.png
Any image type works (png, jpg, webp, psd-exported png...). Sub-folders and letter case don't matter.

What it does per asset type (by ID prefix):
    bg_*        cover-crop to 16:9, 1920 x 1080 JPG (quality 88)             -> assets/images/environment/
    sym_*       trim to the visible pixels, 600 px wide WebP (keeps alpha)    -> assets/images/symbols/
    fx_*        trim, longest side 1200 px max, WebP                          -> assets/images/fx/
    banner_*, modal_*  trim, longest side 1200 px max, WebP                   -> assets/images/banners/
    ui_*        trim, longest side 1200 px max, WebP                          -> assets/images/ui/
The manifest already points at these paths, so nothing else needs editing.

Usage:  python3 tools/asset-pipeline/import_art.py [art_dir] [repo_root]
Prints what was imported, files whose name matches no asset ID, and IDs still without art.
Run python3 with -I when the art came from a download (see README).
"""
import sys, os, re
from PIL import Image

ART = sys.argv[1] if len(sys.argv) > 1 else 'art'
ROOT = sys.argv[2] if len(sys.argv) > 2 else '.'
manifest = open(os.path.join(ROOT, 'assets/manifest.js'), encoding='utf-8').read()
images_block = manifest.split('images:', 1)[1].split('sounds:', 1)[0]
paths = dict(re.findall(r"^\s*([a-z0-9_]+)\s*:\s*'([^']+)'", images_block, re.M))

def trim(im):
    if im.mode != 'RGBA': return im
    box = im.split()[-1].point(lambda a: 255 if a > 8 else 0).getbbox()
    return im.crop(box) if box else im

def cap(im, longest):
    k = longest / max(im.size)
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS) if k < 1 else im

imported, unmatched = [], []
for dirpath, _, files in os.walk(ART):
    for f in sorted(files):
        stem, ext = os.path.splitext(f)
        if ext.lower() not in ('.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff'): continue
        key = stem.lower()
        if key not in paths: unmatched.append(os.path.join(dirpath, f)); continue
        im = Image.open(os.path.join(dirpath, f))
        dst = os.path.join(ROOT, paths[key]); os.makedirs(os.path.dirname(dst), exist_ok=True)
        if key.startswith('bg_'):
            im = im.convert('RGB'); s = max(1920 / im.width, 1080 / im.height)
            im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
            x, y = (im.width - 1920) // 2, (im.height - 1080) // 2
            im = im.crop((x, y, x + 1920, y + 1080))
            if not dst.lower().endswith(('.jpg', '.jpeg')): print(f'  note: {key} path is not .jpg, saving as its extension')
            im.save(dst, quality=88)
        else:
            im = trim(im.convert('RGBA'))
            if key.startswith('sym_'):
                w = 600 if im.width >= 600 else im.width
                im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            else:
                im = cap(im, 1200)
            im.save(dst, 'WEBP', quality=88, method=6) if dst.lower().endswith('.webp') else im.save(dst)
        imported.append((key, im.size, paths[key]))

print(f'Imported {len(imported)}:')
for k, size, p in imported: print(f'  {k:28s} {size[0]}x{size[1]}  -> {p}')
if unmatched:
    print(f'\nNo asset ID matches {len(unmatched)} file(s) (rename them to a key in assets/manifest.js):')
    for u in unmatched: print('  ' + u)
have = {k for k, _, _ in imported} | {k for k, p in paths.items() if os.path.exists(os.path.join(ROOT, p))}
missing = [k for k in paths if k not in have]
if missing: print(f'\nStill placeholder ({len(missing)}): ' + ', '.join(missing))
