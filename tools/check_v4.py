"""v4 behaviour checks from file://: old routes land on home sections, nav About scrolls, hero tracks."""
import asyncio, sys, json
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else "file:///workspace/isaackps-mockup/v4-app/dist/index.html"
async def main():
    out = {}
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        p = await ctx.new_page(); errs = []
        p.on("console", lambda m: errs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
        p.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
        p.on("requestfailed", lambda r: errs.append(f"requestfailed: {r.url}"))
        # hero tracking
        await p.goto(BASE + "#/", wait_until="load")
        await p.wait_for_function("window.__heroStats && window.__heroStats.framesLoaded >= 65", timeout=20000)
        looks = {}
        for name, (x, y) in {"up-right": (1300, 120), "left": (60, 450), "down-right": (1300, 860), "center": (720, 450)}.items():
            await p.mouse.move(x, y, steps=8); await p.wait_for_timeout(700)
            looks[name] = await p.evaluate("JSON.stringify(window.__heroStats)")
        out["hero"] = looks
        # nav About on home
        await p.click(".nav-pill >> text=About"); await p.wait_for_timeout(1500)
        out["navAboutOnHome"] = await p.evaluate("[location.hash, Math.round(document.getElementById('about').getBoundingClientRect().top)]")
        # old routes + nav from contact
        for r in ["/about", "/work", "/work/trustvc", "/work/opencerts"]:
            await p.goto(BASE + "#" + r, wait_until="load"); await p.wait_for_timeout(1200)
            sec = "about" if r == "/about" else "work"
            out[r] = await p.evaluate(f"[location.hash, Math.round(document.getElementById('{sec}').getBoundingClientRect().top), Math.round(scrollY)]")
        await p.goto(BASE + "#/contact", wait_until="load"); await p.wait_for_timeout(600)
        await p.click(".nav-pill >> text=About"); await p.wait_for_timeout(1500)
        out["navAboutFromContact"] = await p.evaluate("[location.hash, Math.round(document.getElementById('about').getBoundingClientRect().top)]")
        await p.goto(BASE + "#/nope", wait_until="load"); await p.wait_for_timeout(400)
        out["404"] = await p.evaluate("document.querySelector('h1').textContent")
        out["errors"] = errs
        await b.close()
    print(json.dumps(out, indent=1))
asyncio.run(main())
