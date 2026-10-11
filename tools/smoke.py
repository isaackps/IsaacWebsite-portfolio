import asyncio, sys, json
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else "file:///workspace/isaackps-mockup/v4-app/dist/index.html"
async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        p = await ctx.new_page(); errs = []
        p.on("console", lambda m: errs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
        p.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
        p.on("requestfailed", lambda r: errs.append(f"requestfailed: {r.url}"))
        await p.goto(BASE + "#/", wait_until="load")
        await p.wait_for_function("window.__heroStats && window.__heroStats.framesLoaded >= 65", timeout=15000)
        await p.mouse.move(1300, 200); await p.wait_for_timeout(600)
        st = await p.evaluate("JSON.stringify(window.__heroStats)")
        print(st)
        await p.screenshot(path="/tmp/v4-smoke.png")
        print("errors:", errs)
        await b.close()
asyncio.run(main())
