#!/usr/bin/env python3
"""Optional, for backgrounds supplied as full mockups (symbols baked into the reels).
Rebuilds one clean reel panel from the empty-panel pixels of all five reel columns, inpaints the rest,
and writes <out>_panel.png plus a background with the panel pasted into every column.
The reel window is given in the mockup's own pixels (measure it in an image editor):
Usage: clean_mockup_reels.py <mockup.png> <out.png> base|fg [x0,y0,column_width,height]
       default window 522,285,612,1597 (New Year Crackers, 4108 x 2220 mockup)
'base' keeps dark red panel pixels, 'fg' purple ones: edit the colour test below for other palettes.
Then run fix_reel_panel.py, then import_art.py.
"""
import sys, numpy as np, cv2
from PIL import Image
src, out, mode = sys.argv[1], sys.argv[2], sys.argv[3]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.uint8)
X0, Y0, CW, H = map(int, sys.argv[4].split(',')) if len(sys.argv) > 4 else (522, 285, 612, 1597)
cols = [im[Y0:Y0+H, X0+k*CW:X0+(k+1)*CW] for k in range(5)]
stack = np.stack(cols).astype(int)          # 5,H,CW,3
hsv = np.stack([cv2.cvtColor(c, cv2.COLOR_RGB2HSV) for c in cols]).astype(int)
r,g,b = stack[...,0], stack[...,1], stack[...,2]
V = hsv[...,2]
if mode == 'base':   # dark maroon panel
    ok = (r > g + 12) & (r < 125) & (g < 45) & (b < 50) & (V < 125)
else:                # purple panel
    ok = (b > g + 10) & (r > g) & (V < 150) & (g < 60) & (hsv[...,0] > 125) & (hsv[...,0] < 170)
# erode the mask so glow edges around symbols don't leak in
ok = np.stack([cv2.erode(o.astype(np.uint8), np.ones((9,9),np.uint8)) > 0 for o in ok])
cnt = ok.sum(0)
acc = (stack * ok[...,None]).sum(0) / np.maximum(cnt,1)[...,None]
# prefer the median of valid samples
med = np.zeros((H,CW,3))
for ch in range(3):
    v = np.where(ok, stack[...,ch], np.nan)
    med[...,ch] = np.nanmedian(v, axis=0) if True else 0
med = np.nan_to_num(med)
panel = med.astype(np.uint8)
hole = (cnt == 0).astype(np.uint8) * 255
print('hole fraction', hole.mean()/255)
panel = cv2.inpaint(panel, hole, 9, cv2.INPAINT_TELEA)
# mirror-symmetrise left/right to tidy the fret border (panels are symmetric)
panel = ((panel.astype(int) + panel[:, ::-1].astype(int)) // 2).astype(np.uint8)
Image.fromarray(panel).save(out.replace('.png', '_panel.png'))
clean = im.copy()
gap = clean.copy()
for k in range(5):
    clean[Y0:Y0+H, X0+k*CW:X0+(k+1)*CW] = panel
Image.fromarray(clean).save(out)
