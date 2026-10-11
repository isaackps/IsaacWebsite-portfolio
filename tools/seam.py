# Measures the hero backdrop across the frame edges in a screenshot taken with the grain overlay disabled.
import asyncio, sys, json
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright
BASE = "file:///workspace/isaackps-mockup/v3-app/dist/index.html"
async def main(w, h):
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        p = await (await b.new_context(viewport={"width": w, "height": h})).new_page()
        await p.goto(BASE + "?look=center#/", wait_until="load")
        await p.wait_for_function("window.__heroStats && window.__heroStats.framesLoaded >= 65")
        await p.add_style_tag(content="body::after,.hero-scrim,.hero-copy,.site-header{display:none!important}")
        await p.wait_for_timeout(300)
        L = await p.evaluate("(()=>{const e=window.__hero, r=e.rect(); return {r, dpr:e.layout.dpr}})()")
        await p.screenshot(path="/tmp/seam-raw.png")
        await b.close()
    im = np.array(Image.open("/tmp/seam-raw.png").convert("RGB")).astype(float)
    x, y, fw, fh = [int(v) for v in L["r"]]
    print(f"{w}x{h} frame rect", L["r"])
    # left edge: average rows in the upper backdrop band
    ys = slice(max(0, y + 120), max(0, y + 120) + 60)
    if x > 12:
        prof = im[ys, x - 12:x + 12].mean((0, 2))
        print(" left edge  (x-12..x+12):", np.round(prof, 1).tolist())
        print("  max step between neighbours:", np.abs(np.diff(prof)).max().round(2))
    tp = y + 96 * fh / 816  # video top inside the frame
    if tp > 12:
        xs = slice(x + 20, x + 160)
        prof = im[int(tp) - 12:int(tp) + 12, xs].mean((1, 2))
        print(" video-top row (+-12):", np.round(prof, 1).tolist())
        print("  max step:", np.abs(np.diff(prof)).max().round(2))
for wh in [(1440, 900), (390, 844)]:
    asyncio.run(main(*wh))
