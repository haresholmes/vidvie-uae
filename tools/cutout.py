"""Cut a product off its plain white studio background.

Pixels are background if they are near-white AND connected to the image
border, so white areas inside the product are kept. The edge is feathered
and the white fringe removed by un-mixing the background colour.
usage: cutout.py in out.webp [max_side]
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

src, dst = sys.argv[1], sys.argv[2]
side = int(sys.argv[3]) if len(sys.argv) > 3 else 720
im = Image.open(src).convert('RGBA')
if im.getextrema()[3][0] < 250:  # already has transparency: flatten on white first
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im); im = bg
if len(sys.argv) > 4:  # keep only the left fraction (drops badge columns)
    im = im.crop((0, 0, int(im.width * float(sys.argv[4])), im.height))
im.thumbnail((1400, 1400), Image.LANCZOS)
rgb = np.asarray(im.convert('RGB')).astype(np.float32)
dist = 255.0 - rgb.min(axis=2)            # 0 = pure white
# Background = light pixels (white and the pale floor shadow) reachable from
# the border, plus large pure-white areas enclosed by the product (gaps).
near = dist < 52
lab, _ = ndimage.label(near)
border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
bgmask = np.isin(lab, border[border > 0])
plab, pn = ndimage.label(dist < 5)
if pn:
    sizes = ndimage.sum(np.ones_like(plab), plab, range(1, pn + 1))
    bgmask |= np.isin(plab, 1 + np.flatnonzero(sizes > 0.004 * plab.size))
# In the background the alpha follows how far a pixel is from white, so the
# floor shadow survives as a faint dark veil; everything else is opaque.
zone = ndimage.binary_dilation(bgmask, iterations=2)
soft = np.clip((dist - 8.0) / 70.0, 0, 1)
alpha = np.where(zone, soft, 1.0).astype(np.float32)
alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255
a3 = np.clip(alpha, 1e-3, 1)[..., None]
col = np.clip((rgb - (1 - a3) * 255.0) / a3, 0, 255)
out = Image.fromarray(np.dstack([col, alpha * 255]).astype(np.uint8), 'RGBA')
box = out.getchannel('A').point(lambda v: 255 if v > 12 else 0).getbbox()
out = out.crop(box)
out.thumbnail((side, side), Image.LANCZOS)
out.save(dst, 'WEBP', quality=88, method=6)
print(dst, out.size)
