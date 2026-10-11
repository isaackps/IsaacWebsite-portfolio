"""Reduced-motion, touch and keyboard checks for the hero."""
import asyncio, json
from playwright.async_api import async_playwright
D = "file:///workspace/isaackps-mockup/v3-app/dist/index.html#/"
async def main():
    out = {}
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        # reduced motion
        c = await b.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce"); p = await c.new_page()
        await p.goto(D); await p.wait_for_timeout(1500)
        s0 = await p.evaluate("({...window.__heroStats})")
        for i in range(30): await p.mouse.move(200 + i * 30, 150 + i * 10)
        await p.wait_for_timeout(600)
        s1 = await p.evaluate("({...window.__heroStats})")
        cur = await p.evaluate("({cls: document.documentElement.className, dot: !!document.querySelector('.cursor-dot') && getComputedStyle(document.querySelector('.cursor-dot')).display, copyOpacity: getComputedStyle(document.querySelector('.hero-name')).opacity})")
        await p.screenshot(path="/workspace/isaackps-mockup/shots/v3/reduced-motion-home.png")
        out["reduced"] = {"mode": s1["mode"], "index": s1["index"], "framesLoaded": s1["framesLoaded"], "ticksBefore": s0["ticks"], "ticksAfter": s1["ticks"], "switches": s1["switches"], **cur}
        await c.close()
        # touch
        c = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True); p = await c.new_page()
        await p.goto(D); await p.wait_for_function("window.__heroStats && window.__heroStats.framesLoaded >= 65")
        seen = []
        for i in range(28):
            await p.wait_for_timeout(500); st = await p.evaluate("({...window.__heroStats})"); seen.append((st["mode"], st["index"]))
        cur = await p.evaluate("({cls: document.documentElement.className, dot: document.querySelector('.cursor-dot') ? getComputedStyle(document.querySelector('.cursor-dot')).display : 'absent'})")
        await p.tap(".hero canvas", position={"x": 60, "y": 120}); await p.wait_for_timeout(500)
        tap = await p.evaluate("({...window.__heroStats})")
        out["touch"] = {"distinctIndices": sorted(set(i for m, i in seen if m == "frame")), "centreSamples": sum(1 for m, i in seen if m == "center"), "afterTapTopLeft": [tap["mode"], tap["index"]], **cur}
        await c.close()
        # keyboard focus visibility
        c = await b.new_context(viewport={"width": 1440, "height": 900}); p = await c.new_page()
        await p.goto(D); await p.wait_for_timeout(800)
        foc = []
        for i in range(7):
            await p.keyboard.press("Tab")
            foc.append(await p.evaluate("(() => { const e = document.activeElement, cs = getComputedStyle(e); return (e.textContent || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 24) + ' | outline ' + cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' | cursor ' + cs.cursor; })()"))
        await p.keyboard.press("Shift+Tab"); await p.screenshot(path="/tmp/focus.png")
        out["keyboard"] = foc
        await c.close(); await b.close()
    print(json.dumps(out, indent=1))
asyncio.run(main())
