"""Bottom-of-home screenshots (from Recent work to page end) at 1440 and 390 + full pages. usage: shoot_bottom.py PREFIX [--full]"""
import asyncio, sys
from playwright.async_api import async_playwright
BASE = "file:///workspace/isaackps-mockup/v4-app/dist/index.html"
OUT = "/workspace/isaackps-mockup/shots/v4.1"
PREFIX = sys.argv[1]; FULL = "--full" in sys.argv
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for label, w, h, dsf, mob in [("desktop", 1440, 900, 1, False), ("mobile", 390, 844, 2, True)]:
            ctx = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=dsf, is_mobile=mob, has_touch=mob)
            p = await ctx.new_page(); errs = []
            p.on("console", lambda m: errs.append(m.text) if m.type in ("error", "warning") else None)
            p.on("pageerror", lambda e: errs.append(str(e)))
            await p.goto(BASE + "#/", wait_until="load"); await p.evaluate("document.fonts.ready")
            await p.wait_for_function("window.__heroStats && window.__heroStats.framesLoaded >= 65", timeout=20000)
            await p.evaluate("document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'))"); await p.wait_for_timeout(1200)
            top = await p.evaluate("document.getElementById('work').getBoundingClientRect().top + scrollY")
            H = await p.evaluate("document.documentElement.scrollHeight")
            await p.screenshot(path=f"{OUT}/{PREFIX}-bottom-{label}.png", full_page=True, clip={"x": 0, "y": top, "width": w, "height": H - top})
            if FULL: await p.screenshot(path=f"{OUT}/{label}-home.png", full_page=True)
            print(label, "bottom from", int(top), "of", H, "errors", errs)
            await ctx.close()
        await b.close()
asyncio.run(main())
