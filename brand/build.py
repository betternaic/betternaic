"""Rebuild the BetterNaic logo files from brand/logo-source.png.

logo-source.png is the raster from ChatGPT image generation (gpt-image 2.5),
prompted with the default BetterLGU logo, the Naic map silhouette, and the
Naic municipal seal (fish over waves, rice stalks) as references.

    pip install vtracer pillow numpy
    python brand/build.py

Writes public/favicon.svg, public/icons/logo.svg, the PNG icons, and
favicon.ico. Needs Google Chrome to rasterize the SVG.
"""
import re
import subprocess
import tempfile
import time
from pathlib import Path

import numpy as np
import vtracer
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
TILE = (29, 38, 1220, 1221)  # light-gray tile inside the 1254 px source
PALETTE = np.array([(241, 242, 242), (0, 50, 160), (242, 201, 29), (255, 255, 255)])
N = 2048


def trace() -> str:
    src = Image.open(ROOT / 'brand/logo-source.png').convert('RGB')
    im = src.crop((TILE[0], TILE[1], TILE[2] + 1, TILE[3] + 1)).resize((N, N), Image.LANCZOS)
    a = np.asarray(im).astype(int)
    idx = ((a[:, :, None, :] - PALETTE[None, None]) ** 2).sum(3).argmin(2).astype(np.uint8)
    # Mode filter removes anti-aliasing specks before tracing.
    idx = (np.asarray(Image.fromarray(idx * 60, 'L').filter(ImageFilter.ModeFilter(9))) // 60).astype(int)
    keep = Image.new('L', (N, N), 0)  # drop the white outside the source tile's corners
    ImageDraw.Draw(keep).rounded_rectangle((6, 6, N - 7, N - 7), radius=int(N * 0.34), fill=255)
    idx[np.asarray(keep) == 0] = 0
    rgba = np.zeros((N, N, 4), dtype=np.uint8)
    for k in (1, 2, 3):  # gray tile becomes transparent; a clean <rect> replaces it
        rgba[idx == k, :3] = PALETTE[k]
        rgba[idx == k, 3] = 255

    with tempfile.TemporaryDirectory() as tmp:
        png, raw = Path(tmp, 'emblem.png'), Path(tmp, 'emblem.svg')
        Image.fromarray(rgba, 'RGBA').save(png)
        vtracer.convert_image_to_svg_py(
            str(png), str(raw), colormode='color', hierarchical='stacked', mode='spline',
            filter_speckle=40, color_precision=6, layer_difference=24, corner_threshold=60,
            length_threshold=6.0, max_iterations=10, splice_threshold=45, path_precision=1)
        paths = re.findall(r'<path[^>]*/>', raw.read_text())

    def snap(m):
        rgb = np.array([int(m.group(1)[i:i + 2], 16) for i in (0, 2, 4)])
        return 'fill="#%02X%02X%02X"' % tuple(PALETTE[((PALETTE - rgb) ** 2).sum(1).argmin()])

    body = [re.sub(r'fill="#([0-9A-Fa-f]{6})"', snap, p) for p in paths]
    body = [p for p in body if 'fill="#F1F2F2"' not in p]
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-32 -32 2112 2112">'
            '<title>BetterNaic</title>'
            '<rect width="2048" height="2048" rx="614" fill="#F1F2F2"/>' + ''.join(body) + '</svg>')


def rasterize(svg_path: Path) -> Image.Image:
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as tmp:
        html, out = Path(tmp, 'icon.html'), Path(tmp, 'icon.png')
        html.write_text(f'<html><body style="margin:0;background:transparent">'
                        f'<img src="{svg_path.as_uri()}" style="display:block;width:1024px;height:1024px"></body></html>')
        proc = subprocess.Popen([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars',
                                 f'--user-data-dir={tmp}/profile', '--default-background-color=00000000',
                                 '--window-size=1024,1024', f'--screenshot={out}', html.as_uri()])
        try:
            for _ in range(150):  # Chrome writes the file, then may linger
                if out.exists() and out.stat().st_size:
                    break
                time.sleep(0.1)
            time.sleep(0.5)
            img = Image.open(out).convert('RGBA')
        finally:
            # Kill the whole Chrome tree; on Windows, killing the launcher alone leaves children.
            subprocess.run(['taskkill', '/F', '/T', '/PID', str(proc.pid)], capture_output=True)
        return img


def main():
    svg = trace()
    for p in (PUBLIC / 'favicon.svg', PUBLIC / 'icons/logo.svg'):
        p.write_text(svg)
    big = rasterize(PUBLIC / 'favicon.svg')

    def save(size, name, opaque=False):
        im = big.resize((size, size), Image.LANCZOS)
        if opaque:
            bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
            bg.alpha_composite(im)
            im = bg.convert('RGB')
        if size >= 64:
            im = im.quantize(colors=64, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
        im.save(PUBLIC / name, optimize=True)

    save(512, 'icons/icon-512.png')
    save(192, 'icons/icon-192.png')
    save(256, 'icons/logo-256.png')
    save(180, 'apple-touch-icon.png', opaque=True)
    save(32, 'favicon-32x32.png')
    save(16, 'favicon-16x16.png')
    big.resize((256, 256), Image.LANCZOS).save(PUBLIC / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    maskable = Image.new('RGBA', (512, 512), (241, 242, 242, 255))
    maskable.alpha_composite(big.resize((410, 410), Image.LANCZOS), (51, 51))
    maskable.quantize(colors=64, method=Image.Quantize.FASTOCTREE).save(PUBLIC / 'icons/maskable-512.png', optimize=True)
    print('logo files written to public/')


if __name__ == '__main__':
    main()
