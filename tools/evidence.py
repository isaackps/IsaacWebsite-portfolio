"""Hero evidence: 3x3 pose grid (?look=), real-pixel contrast of hero copy, render-loop stats, tracking GIF.
usage: evidence.py [poses|contrast|loop|gif|all]"""
import asyncio, sys, json, math, io
from PIL import Image, ImageDraw, ImageFont
from playwright.async_api import async_playwright

DIST = "file:///workspace/isaackps-mockup/v3-app/dist/index.html"
OUT = "/workspace/isaackps-mockup/shots/v3"
WHAT = sys.argv[1] if len(sys.argv) > 1 else "all"
GRID = [["up-left", "up", "up-right"], ["left", "center", "right"], ["down-left", "down", "down-right"]]

async def ctx_page(b, w=1440, h=900, dsf=1, mobile=False, reduced=False):
    ctx = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=dsf, is_mobile=mobile, has_touch=mobile,
                              reduced_motion="reduce" if reduced else "no-preference")
    p = await ctx.new_page(); errs = []
    p.on("console", lambda m: errs.append(m.text) if m.type in ("error", "warning") else None)
    p.on("pageerror", lambda e: errs.append(str(e)))
    return ctx, p, errs

async def ready(p, n=65):
    await p.evaluate("document.fonts.ready")
    await p.wait_for_function(f"window.__heroStats && window.__heroStats.framesLoaded >= {n}", timeout=20000)

def font(sz):
    try: return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", sz)
    except Exception: return ImageFont.load_default()

async def poses(b):
    tiles = {}
    for row in GRID:
        for d in row:
            ctx, p, errs = await ctx_page(b)
            await p.goto(f"{DIST}?look={d}#/"); await ready(p)
            await p.wait_for_timeout(900)
            st = await p.evaluate("({...window.__heroStats})")
            tiles[d] = (Image.open(io.BytesIO(await p.screenshot())), st)
            await ctx.close()
    tw, th = 640, 400
    G = Image.new("RGB", (tw * 3 + 8 * 4, th * 3 + 8 * 4), (13, 22, 32)); dr = ImageDraw.Draw(G)
    for r, row in enumerate(GRID):
        for c, d in enumerate(row):
            im, st = tiles[d]; x, y = 8 + c * (tw + 8), 8 + r * (th + 8)
            G.paste(im.resize((tw, th), Image.LANCZOS), (x, y))
            label = f"{d}  ·  {'centre.webp (deadzone)' if st['mode']=='center' else 'frame ' + str(st['index'])}"
            dr.rounded_rectangle((x + 10, y + 10, x + 22 + dr.textlength(label, font=font(18)), y + 40), 14, fill=(13, 22, 32))
            dr.text((x + 16, y + 14), label, font=font(18), fill=(238, 243, 247))
    G.save(f"{OUT}/hero-poses.png"); print("poses", {d: (t[1]["mode"], t[1]["index"]) for d, t in tiles.items()})

def lum(rgb):
    def ch(v):
        v /= 255; return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(rgb[0]) + 0.7152 * ch(rgb[1]) + 0.0722 * ch(rgb[2])
def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + 0.05) / (lb + 0.05)

async def contrast(b):
    res = {}
    for label, w, h, dsf, mobile in [("desktop", 1440, 900, 1, False), ("w1024", 1024, 768, 1, False), ("w768", 768, 1024, 1, True), ("mobile", 390, 844, 2, True), ("w375", 375, 667, 2, True)]:
        for look in ["center", "up-left", "left", "down-left", "up-right"]:
            ctx, p, _ = await ctx_page(b, w, h, dsf, mobile)
            await p.goto(f"{DIST}?look={look}#/"); await ready(p); await p.wait_for_timeout(1500)
            els = await p.evaluate("""() => [...document.querySelectorAll('.hero-copy .hero-hi, .hero-copy h1, .hero-copy p, .nav-pill a')].map(e => {
                const rg = document.createRange(); rg.selectNodeContents(e); const cs = getComputedStyle(e);
                return [...rg.getClientRects()].filter(r => r.width > 2).map((r, i) => ({sel: e.tagName + '.' + (e.className||'').toString().split(' ')[0] + ' ' + e.textContent.trim().slice(0,18), x: r.left, y: r.top, w: r.width, h: r.height, color: cs.color, size: parseFloat(cs.fontSize), weight: cs.fontWeight})) }).flat()""")
            await p.evaluate("document.querySelectorAll('.hero-copy > *, .nav-pill a, .cursor-dot, .cursor-ring').forEach(e => e.style.visibility='hidden')")
            await p.wait_for_timeout(100)
            shot = Image.open(io.BytesIO(await p.screenshot())).convert("RGB")
            for e in els:
                col = tuple(int(float(v)) for v in e["color"][e["color"].index("(") + 1:-1].split(",")[:3])
                box = (int(e["x"] * dsf), int(e["y"] * dsf), int((e["x"] + e["w"]) * dsf), int((e["y"] + e["h"]) * dsf))
                crop = shot.crop(box); px = list(crop.getdata())
                if not px: continue
                worst = min(ratio(col, q) for q in px[::3])
                px.sort(key=lum); p95 = px[int(len(px) * 0.95)]
                large = e["size"] >= 24 or (e["size"] >= 18.66 and int(e["weight"]) >= 700)
                key = e["sel"]
                prev = res.get(key)
                entry = {"worst": round(worst, 2), "p95": round(ratio(col, p95), 2), "need": 3.0 if large else 4.5, "at": f"{label}/{look}"}
                if not prev or entry["worst"] < prev["worst"]: res[key] = entry
            await ctx.close()
    for k, v in res.items(): print(f"{k:34s} worst {v['worst']:5} p95 {v['p95']:5} need {v['need']}  ({v['at']}) {'OK' if v['worst'] >= v['need'] else 'LOW'}")
    json.dump(res, open(f"{OUT}/hero-contrast.json", "w"), indent=1)

async def loop(b):
    ctx, p, errs = await ctx_page(b)
    await p.goto(DIST + "#/"); await ready(p)
    await p.evaluate("Object.assign(window.__heroStats, {ticks:0, draws:0, maxDrawsPerTick:0, switches:0, worstTickGapMs:0})")
    fx, fy = await p.evaluate("[window.__heroStats.face.x, window.__heroStats.face.y]")
    t0 = await p.evaluate("performance.now()")
    for i in range(240):           # ~4 s, cursor circles the head twice
        a = i / 120 * 2 * math.pi
        await p.mouse.move(fx + 330 * math.sin(a), fy - 300 * math.cos(a)); await p.wait_for_timeout(16)
    st = await p.evaluate("({...window.__heroStats, elapsed: performance.now() - %f})" % t0)
    # count canvas draw calls independently by wrapping drawImage for 2 s
    calls = await p.evaluate("""() => new Promise(res => {
        const ctx = document.querySelector('.hero canvas').getContext('2d'); const orig = ctx.drawImage; let n = 0, frames = 0, perFrame = [], cur = 0;
        ctx.drawImage = function(...a){ n++; cur++; return orig.apply(this, a); };
        const comp = ctx.globalCompositeOperation, alpha = ctx.globalAlpha;
        const tick = () => { perFrame.push(cur); cur = 0; frames++; if (frames < 120) requestAnimationFrame(tick); else { ctx.drawImage = orig; res({n, frames, maxPerFrame: Math.max(...perFrame), comp: ctx.globalCompositeOperation, alpha: ctx.globalAlpha}); } };
        requestAnimationFrame(tick);
        let k = 0; const iv = setInterval(() => { const a = k++ / 30 * Math.PI; window.dispatchEvent(new PointerEvent('pointermove', {clientX: %f + 330*Math.sin(a), clientY: %f - 300*Math.cos(a), pointerType: 'mouse'})); if (k > 120) clearInterval(iv); }, 16);
    })""" % (fx, fy))
    out = {k: st[k] for k in ("ticks", "draws", "maxDrawsPerTick", "switches", "worstTickGapMs", "lastTickMs", "elapsed", "deadzonePx", "face")}
    out["drawImageProbe"] = calls; out["errors"] = errs
    print(json.dumps(out, indent=1)); json.dump(out, open(f"{OUT}/hero-loop.json", "w"), indent=1)
    await ctx.close()

async def gif(b):
    W, H = 1280, 800
    ctx, p, errs = await ctx_page(b, W, H)
    await p.goto(DIST + "#/"); await ready(p)
    fx, fy = await p.evaluate("[window.__heroStats.face.x, window.__heroStats.face.y]")
    await p.mouse.move(fx, fy - 330); await p.wait_for_timeout(500)
    frames = []; N = 64
    for i in range(N + 1):
        a = i / N * 2 * math.pi
        await p.mouse.move(fx + 360 * math.sin(a), fy - 320 * math.cos(a), steps=2); await p.wait_for_timeout(45)
        if i < N: frames.append(Image.open(io.BytesIO(await p.screenshot(type="jpeg", quality=90))).convert("RGB").resize((640, 400), Image.LANCZOS))
    # include the deadzone: drift to the face centre and back out
    for t in [0.75, 0.5, 0.25, 0.05, 0.05, 0.05, 0.25, 0.6]:
        await p.mouse.move(fx + 360 * t * 0.0, fy - 320 * t, steps=3); await p.wait_for_timeout(70)
        frames.append(Image.open(io.BytesIO(await p.screenshot(type="jpeg", quality=90))).convert("RGB").resize((640, 400), Image.LANCZOS))
    import os, shutil, subprocess
    tmp = "/tmp/hero-gif-frames"; shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
    for i, f in enumerate(frames): f.save(f"{tmp}/f{i:03d}.png")
    q = frames
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "14", "-i", f"{tmp}/f%03d.png", "-vf",
                    "split[a][b];[a]palettegen=max_colors=255:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle",
                    "-loop", "0", f"{OUT}/hero-tracking.gif"], check=True)
    import os; print("gif frames", len(q), "bytes", os.path.getsize(f"{OUT}/hero-tracking.gif"), "errors", errs)
    await ctx.close()

async def main():
    async with async_playwright() as pw:
        b = await pw.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for name, fn in [("poses", poses), ("contrast", contrast), ("loop", loop), ("gif", gif)]:
            if WHAT in (name, "all"): await fn(b)
        await b.close()
asyncio.run(main())
