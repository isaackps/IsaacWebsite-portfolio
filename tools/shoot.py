"""Screenshots + checks for every route at desktop (1440x900) and mobile (390 wide @2x).
usage: shoot.py [BASE_URL_TO_index.html] [OUT_DIR] [--widths]"""
import asyncio, sys, json
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "file:///workspace/isaackps-mockup/v4-app/dist/index.html"
OUT = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith("--") else "/workspace/isaackps-mockup/shots/final"
ROUTES = [("home", "/"), ("contact", "/contact"), ("404", "/this-page-does-not-exist")]
WIDTHS = "--widths" in sys.argv
CHECK = """() => {
  const W = document.documentElement.clientWidth, bad = [];
  document.querySelectorAll('body *').forEach(el => {
    if (el.closest('.hero, .cta-band, .sr-only, .skip-link, .toast, .cursor-dot, .cursor-ring')) return;
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > W + 0.5 || r.left < -0.5)) bad.push(el.tagName + '.' + el.className + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
  });
  const imgs = [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src);
  const fonts = [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight);
  const h1 = document.querySelectorAll('h1').length;
  return {scrollW: document.documentElement.scrollWidth, W, overflow: bad.slice(0, 8), brokenImgs: imgs, fonts, h1, title: document.title};
}"""

async def page_for(b, w, h, dsf, mobile):
    ctx = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=dsf, is_mobile=mobile, has_touch=mobile)
    p = await ctx.new_page()
    errs = []
    p.on("console", lambda m: errs.append(f"console {m.type}: {m.text}") if m.type in ("error", "warning") else None)
    p.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
    p.on("requestfailed", lambda r: errs.append(f"requestfailed: {r.url}"))
    return ctx, p, errs

async def settle(p, route):
    await p.goto(BASE + "#" + route, wait_until="load")
    await p.evaluate("document.fonts.ready")
    if route == "/":
        await p.wait_for_function("window.__heroStats && window.__heroStats.framesLoaded >= 65", timeout=20000)
    await p.wait_for_timeout(400)

async def reveal_all(p):
    await p.evaluate("document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in'))")
    await p.wait_for_timeout(1100)

async def run():
    report = {}
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        sizes = [("desktop", 1440, 900, 1, False), ("mobile", 390, 844, 2, True)]
        if WIDTHS:
            sizes = [("w375", 375, 667, 2, True), ("w768", 768, 1024, 1, True), ("w1024p", 1024, 1366, 1, True), ("w1024", 1024, 768, 1, False), ("w1280", 1280, 720, 1, False), ("w1920", 1920, 1080, 1, False), ("w2560", 2560, 1080, 1, False)]
        for label, w, h, dsf, mobile in sizes:
            for name, route in ROUTES:
                ctx, p, errs = await page_for(b, w, h, dsf, mobile)
                await settle(p, route)
                if name == "home" and not WIDTHS:
                    if label == "desktop":   # hover the Let's talk button: head looks down-left at it, ring grows
                        btn = await p.query_selector(".hero .btn-glass"); bb = await btn.bounding_box()
                        await p.mouse.move(bb["x"] + bb["width"] * 0.6, bb["y"] + bb["height"] * 0.5, steps=12)
                        await p.wait_for_timeout(900)
                    await p.screenshot(path=f"{OUT}/{label}-home-hero.png")
                    if label == "desktop":
                        await p.mouse.move(w - 5, h - 5); await p.mouse.move(-10, -10)
                await reveal_all(p)
                info = await p.evaluate(CHECK)
                info["errors"] = errs
                await p.screenshot(path=f"{OUT}/{label}-{name}.png", full_page=not WIDTHS or name != "home")
                report[f"{label}-{name}"] = info
                await ctx.close()
        await b.close()
    for k, v in report.items():
        flag = "" if (not v["overflow"] and not v["brokenImgs"] and not v["errors"] and v["scrollW"] <= v["W"] and v["h1"] == 1) else "  <-- CHECK"
        print(k, f"scrollW={v['scrollW']}/{v['W']} h1={v['h1']} fonts={sorted(set(v['fonts']))} overflow={v['overflow']} broken={v['brokenImgs']} errors={v['errors']}{flag}")
    json.dump(report, open(f"{OUT}/checks{'-widths' if WIDTHS else ''}.json", "w"), indent=1)
asyncio.run(run())
