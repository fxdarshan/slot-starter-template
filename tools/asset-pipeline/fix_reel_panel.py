#!/usr/bin/env python3
"""Optional step 2 after clean_mockup_reels.py: replace the middle of the rebuilt panel (faint symbol shadows)
with a smooth fill and fine grain, keep the panel's side borders, and cover symbol bits poking above the window
with a clean strip of the frame. Geometry and the clean patches below are New Year Crackers values: adjust them.
Usage: fix_reel_panel.py <mockup.png> <out_panel.png> <clean_background.png> [x0,y0,column_width]
"""
import sys, numpy as np, cv2
from PIL import Image
srcmock, panelf, outclean = sys.argv[1], sys.argv[2], sys.argv[3]
P = np.asarray(Image.open(panelf).convert('RGB')).astype(float)
H, W = P.shape[:2]
L, R = 84, W - 84
# clean texture patch from the mockup (empty panel above the coins tile on reel 2)
M = np.asarray(Image.open(srcmock).convert('RGB')).astype(float)
patch = M[300:420, 1200:1680]
hp = patch - cv2.GaussianBlur(patch, (0, 0), 6)         # fine grain only
# horizontal profile from clean top rows, vertical profile from bright percentile per row
hprof = P[15:110, L:R].mean(0)                          # (R-L,3)
v = np.percentile(P[:, L+60:R-60], 80, axis=1)          # (H,3) ignores dark shadows
v = cv2.GaussianBlur(v[:, None, :], (0, 0), sigmaX=0.1, sigmaY=60)[:, 0, :]
vnorm = v / v.mean(0)
fill = hprof[None, :, :] * vnorm[:, None, :]
# tile the grain
ty = int(np.ceil(H / hp.shape[0])) + 1; tx = int(np.ceil((R - L) / hp.shape[1])) + 1
grain = np.tile(hp, (ty, tx, 1))[:H, :R - L]
rng=np.random.default_rng(1)
fill = fill + cv2.GaussianBlur(rng.normal(0,3.2,fill.shape),(0,0),0.8)
out = P.copy()
# feather the seam with the fret borders
blend = np.ones(R - L); f = 12
blend[:f] = np.linspace(0, 1, f); blend[-f:] = np.linspace(1, 0, f)
out[:, L:R] = P[:, L:R] * (1 - blend[None, :, None]) + fill * blend[None, :, None]
# symmetric borders
out = np.clip(out, 0, 255).astype(np.uint8)
Image.fromarray(out).save(panelf.replace('.png', '_fixed.png'))
# rebuild the clean background: window panels + remove symbol bits poking above the window
clean = M.astype(np.uint8).copy()
X0, Y0, CW = map(int, sys.argv[4].split(',')) if len(sys.argv) > 4 else (522, 285, 612)
for k in range(5): clean[Y0:Y0+H, X0+k*CW:X0+(k+1)*CW] = out
# beam strip above the window: symbols poking up (scatter top, pig hat) are covered with clean beam from x 1000-1600
beam = clean[240:Y0, 1000:1600].copy()
for xa, xb in [(600, 960), (1600, 2260)]:
    for x in range(xa, xb, 600):
        w = min(600, xb - x); clean[240:Y0, x:x+w] = beam[:, :w]
Image.fromarray(clean).save(outclean)
