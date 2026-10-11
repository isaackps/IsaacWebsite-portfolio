"""Labelled contact sheets of every v4 route, full page, scaled (desktop + mobile)."""
from PIL import Image, ImageDraw, ImageFont
S = '/workspace/isaackps-mockup/shots/final'
PAGES = [('home', '#/ (one page)'), ('contact', '#/contact'), ('404', '#/anything-else')]
def font(sz):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'):
        try: return ImageFont.truetype(f, sz)
        except OSError: pass
    return ImageFont.load_default()
def sheet(kind, tw, out, css_w):
    f, fs = font(24), font(16)
    thumbs = []
    for p, label in PAGES:
        im = Image.open(f'{S}/{kind}-{p}.png').convert('RGB')
        sc = tw / im.width
        thumbs.append((p, label, im.resize((tw, int(im.height * sc)), Image.LANCZOS), int(im.height * css_w / im.width)))
    pad, lab, top = 32, 64, 70
    th = max(t[2].height for t in thumbs)
    W = len(thumbs) * tw + (len(thumbs) + 1) * pad; H = top + lab + th + 2 * pad
    sh = Image.new('RGB', (W, H), (17, 29, 41)); d = ImageDraw.Draw(sh)
    d.text((pad, 26), f'isaackps.com final · {kind} ({css_w}px wide) · full pages · files: shots/final/{kind}-<route>.png', fill=(238, 243, 247), font=fs)
    for i, (p, label, t, full_h) in enumerate(thumbs):
        x = pad + i * (tw + pad); y = top
        d.text((x, y), p, fill=(226, 191, 142), font=f)
        d.text((x, y + 32), f'{label} · {full_h}px tall', fill=(185, 200, 214), font=fs)
        sh.paste(t, (x, y + lab)); d.rectangle((x - 1, y + lab - 1, x + tw, y + lab + t.height), outline=(80, 98, 120))
    sh.save(out, optimize=True); print(out, sh.size)
sheet('desktop', 560, f'{S}/overview-desktop.png', 1440)
sheet('mobile', 300, f'{S}/overview-mobile.png', 390)
