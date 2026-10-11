#!/usr/bin/env python3
"""Pre-extract the hero's head-turn frames from Isaac's character video.

Usage:  python3 tools/extract_frames.py [video.mp4]

What it does (all offline, nothing here runs in the browser):
 1. Reads every frame with OpenCV and reports frame count / fps / timeline.
 2. Models the dusty-blue background: per-row median of the left and right edge
    columns over all 240 frames, reduced to a few piecewise-linear gradient stops.
    The same stops are written to frames.json so the canvas paints the identical
    gradient around the frame (seamless edges, padded headroom above the hat).
 3. Tracks the head with pyramidal Lucas-Kanade optical flow on a grid of face
    points (forward-backward checked), giving a head-direction vector per frame.
    Direction = atan2 of the flow displacement normalised by the head's horizontal
    and vertical travel (0 deg = UP, clockwise, 90 = viewer's right).
 4. Picks the exact source frame for each compass direction and CENTER, then fills
    64 slots evenly round the circle (5.625 deg apart), choosing for each slot the
    sharpest frame within +-2 deg of the target (nearest frame otherwise).
 5. Crops to the character, pads headroom above the hat, feathers the left / right /
    top edges into the modelled gradient, and writes WebP frames + frames.json.
"""
import json, math, sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
import argparse
_ap = argparse.ArgumentParser(description="Extract the hero's 64 WebP turn frames + center.webp from the source video.")
_ap.add_argument("video", help="path to the source MP4 (not stored in the repo)")
_ap.add_argument("--out", default=str(ROOT / "public" / "frames"), help="output folder (default: public/frames)")
_args = _ap.parse_args()
VIDEO = _args.video
OUT = Path(_args.out)
N_SLOTS = 64
TOP_PAD = 96          # px of matched background added above the hat
FEATHER = 72          # px left/right edge feather into the modelled gradient
TOP_FEATHER = 4       # rows 0-3 of the video only (the hat never comes closer than 6px to the top)
BOTTOM_FEATHER = 170  # the video cuts the shirt at the bottom edge: fade the chest into the gradient so
                      # the bust can sit above the viewport bottom on portrait screens without a hard edge
QUALITY = 80
CENTER_SRC = 0        # frame 0 = neutral, eye contact, same grin as the turn frames (matches Isaac's still)
FACE_SRC = (640, 330) # face centre (nose) in source pixels on the CENTER frame

# ---------------------------------------------------------------- 1. read
cap = cv2.VideoCapture(VIDEO)
meta = dict(frameCount=int(cap.get(cv2.CAP_PROP_FRAME_COUNT)), fps=cap.get(cv2.CAP_PROP_FPS),
            width=int(cap.get(3)), height=int(cap.get(4)))
frames = []
while True:
    ok, f = cap.read()
    if not ok:
        break
    frames.append(f)
F = np.stack(frames)
n, H, W, _ = F.shape
meta["decodedFrames"] = n
meta["duration"] = round(n / meta["fps"], 3)
print("video:", meta)

# ---------------------------------------------------------------- 2. background model
# The backdrop is a vertical gradient plus a soft horizontal vignette (centre ~12 levels brighter than the
# edges). Fit it as separable V(y) + H(x) on pixels classified as backdrop (blue: B - R > 34) over every 4th
# frame. H is later rebased to zero at the crop edges, so outside the frame the page only needs V(y).
sub = F[::4].astype(np.float32)[..., ::-1]
bgmask = ((sub[..., 2] - sub[..., 0]) > 34) & (sub[..., 2] > 95)
cnt = bgmask.sum(0)
mean = (sub * bgmask[..., None]).sum(0) / np.maximum(cnt, 1)[..., None]
valid = cnt > 3
V = np.zeros((H, 3)); Hx = np.zeros((W, 3))
for _ in range(12):
    for c in range(3):
        m = np.where(valid, mean[..., c] - Hx[None, :, c], np.nan)
        V[:, c] = np.nanmean(m, 1)
        m = np.where(valid, mean[..., c] - V[:, None, c], np.nan)
        Hx[:, c] = np.nan_to_num(np.nanmean(m, 0))
    edge = (Hx[:40].mean(0) + Hx[-40:].mean(0)) / 2
    Hx -= edge; V += edge
V = cv2.GaussianBlur(V.reshape(H, 1, 3).astype(np.float32), (1, 81), 0).reshape(H, 3)
Hx = cv2.GaussianBlur(Hx.reshape(1, W, 3).astype(np.float32), (121, 1), 0).reshape(W, 3)
fit = V[:, None, :] + Hx[None, :, :]
resid = np.abs(fit - mean)[valid]
print(f"background model: separable V(y)+H(x), residual median {np.median(resid):.2f}, p95 {np.percentile(resid, 95):.2f} levels; vignette +{Hx.max():.1f}")
# ---------------------------------------------------------------- 3. head tracking
G = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in F]
gy, gx = np.mgrid[220:420:8, 540:740:8]
p0 = np.stack([gx.ravel(), gy.ravel()], 1).astype(np.float32).reshape(-1, 1, 2)
p = p0.copy(); alive = np.ones(len(p), bool); disp = [(0.0, 0.0)]
for i in range(1, n):
    nxt, st, _ = cv2.calcOpticalFlowPyrLK(G[i - 1], G[i], p, None, winSize=(31, 31), maxLevel=3)
    back, st2, _ = cv2.calcOpticalFlowPyrLK(G[i], G[i - 1], nxt, None, winSize=(31, 31), maxLevel=3)
    fb = np.linalg.norm((back - p).reshape(-1, 2), axis=1)
    alive &= (st.ravel() == 1) & (st2.ravel() == 1) & (fb < 1.0)
    p = nxt
    d = (p - p0).reshape(-1, 2)[alive]
    disp.append(tuple(np.median(d, 0)))
D = np.array(disp)
XR = (D[:, 0].max() - D[:, 0].min()) / 2
YR = (D[:, 1].max() - D[:, 1].min()) / 2
nx, ny = D[:, 0] / XR, D[:, 1] / YR
ang = (np.degrees(np.arctan2(nx, -ny)) + 360) % 360
mag = np.hypot(nx, ny)
print(f"tracking: {alive.sum()} face points survived; head travel +-{XR:.0f}px x, +-{YR:.0f}px y")

# sharpness (motion blur check) on the head region
sharp = np.array([cv2.Laplacian(g[0:470, 280:1000], cv2.CV_64F).var() for g in G])

# 179-199 is a second pass through down-left/left (head dips again); use the main clockwise sweep only
cand = [i for i in range(n) if mag[i] >= 0.8 and 20 <= i <= 216 and not (179 <= i <= 199)]

def angdiff(a, b):
    return abs((a - b + 180) % 360 - 180)

def pick(target, tol=2.0):
    near = [i for i in cand if angdiff(ang[i], target) <= tol]
    if near:
        return max(near, key=lambda i: sharp[i])
    return min(cand, key=lambda i: angdiff(ang[i], target))

slots = []
for s in range(N_SLOTS):
    t = s * 360.0 / N_SLOTS
    i = pick(t)
    slots.append(dict(index=s, file=f"frame-{s:02d}.webp", angle=round(t, 3), sourceFrame=int(i),
                      sourceTime=round(i / meta["fps"], 3), sourceAngle=round(float(ang[i]), 1),
                      error=round(angdiff(ang[i], t), 1)))

DIRS = {"UP": 0, "UP-RIGHT": 45, "RIGHT": 90, "DOWN-RIGHT": 135, "DOWN": 180, "DOWN-LEFT": 225, "LEFT": 270, "UP-LEFT": 315}
directions = {}
for name, a in DIRS.items():
    s = int(round(a / (360 / N_SLOTS)))
    # nearest-angle frame on the whole clip (reported), and the frame actually used in the slot
    nearest = min(cand, key=lambda i: angdiff(ang[i], a))
    directions[name] = dict(angle=a, slot=s, sourceFrame=slots[s]["sourceFrame"], nearestFrame=int(nearest),
                            nearestFrameAngle=round(float(ang[nearest]), 1), sourceTime=slots[s]["sourceTime"],
                            error=slots[s]["error"])
directions["CENTER"] = dict(sourceFrame=CENTER_SRC, sourceTime=round(CENTER_SRC / meta["fps"], 3), file="center.webp")

# ---------------------------------------------------------------- 4. crop + feather + write
diff = np.zeros((H, W), bool)
used = sorted({s["sourceFrame"] for s in slots} | {CENTER_SRC, n - 1})
for i in used:
    diff |= np.abs(F[i][..., ::-1].astype(np.float32) - fit).max(-1) > 26
cols = np.nonzero(diff[: H - 2].any(0))[0]
x0 = max(0, int(cols.min()) - FEATHER - 24); x1 = min(W, int(cols.max()) + FEATHER + 24)
x0 -= (x1 - x0) % 2
OW, OH = x1 - x0, H + TOP_PAD
print(f"crop x {x0}..{x1} -> output {OW}x{OH} (top pad {TOP_PAD})")

# rebase: H' = 0 at both crop edges (linear correction), V' absorbs the edge value
Hc = Hx[x0:x1].copy()
lin = np.linspace(0, 1, OW)[:, None]
edge_l, edge_r = Hc[:24].mean(0), Hc[-24:].mean(0)
Hc -= edge_l * (1 - lin) + edge_r * lin
Hc = np.maximum(Hc, 0)
Hc[:FEATHER] *= np.linspace(0, 1, FEATHER)[:, None]; Hc[-FEATHER:] *= np.linspace(1, 0, FEATHER)[:, None]
Vp = V + (edge_l + edge_r) / 2

# piecewise-linear stops (these exact numbers drive the canvas and CSS gradients too)
ys = np.linspace(0, H - 1, 7)
stops = [(float(y), Vp[int(round(y))].tolist()) for y in ys]
slope = (Vp[100] - Vp[0]) / 100.0
slope_b = (Vp[H - 1] - Vp[H - 101]) / 100.0
stops = [(-(TOP_PAD + 420.0), np.clip(Vp[0] - slope * (TOP_PAD + 420), 0, 255).tolist())] + stops + \
        [(H - 1 + 300.0, np.clip(Vp[H - 1] + slope_b * 300, 0, 255).tolist())]
xs = np.linspace(0, OW - 1, 15)
hstops = [(float(x), Hc[int(round(x))].tolist()) for x in xs]
hstops[0] = (0.0, [0, 0, 0]); hstops[-1] = (float(OW - 1), [0, 0, 0])

def model_rows(y):
    sy = np.array([q[0] for q in stops]); sc = np.array([q[1] for q in stops])
    y = np.clip(np.asarray(y, float), sy[0], sy[-1])
    return np.stack([np.interp(y, sy, sc[:, c]) for c in range(3)], -1)

def model_cols(x):
    sx = np.array([q[0] for q in hstops]); sc = np.array([q[1] for q in hstops])
    return np.stack([np.interp(np.asarray(x, float), sx, sc[:, c]) for c in range(3)], -1)

yy = np.arange(OH) - TOP_PAD                          # source-row coordinate for every output row
bg = model_rows(yy)[:, None, :] + model_cols(np.arange(OW))[None, :, :]
chk = np.abs(bg[TOP_PAD:] - fit[:, x0:x1])[valid[:, x0:x1]]
print(f"stop model vs fitted backdrop inside the crop: median {np.median(chk):.2f}, p95 {np.percentile(chk, 95):.2f} levels")
ax = np.ones(OW); r = np.arange(FEATHER) / FEATHER
ramp = r * r * (3 - 2 * r)                           # smoothstep
ax[:FEATHER] = ramp; ax[-FEATHER:] = ramp[::-1]
ay = np.ones(OH); ay[:TOP_PAD] = 0
rt = (np.arange(TOP_FEATHER) + 1) / (TOP_FEATHER + 1); ay[TOP_PAD:TOP_PAD + TOP_FEATHER] = rt
rb = np.arange(BOTTOM_FEATHER)[::-1] / BOTTOM_FEATHER; rb = rb * rb * (3 - 2 * rb)
ay[-BOTTOM_FEATHER:] = rb
alpha = (ay[:, None] * ax[None, :])[..., None]

OUT.mkdir(parents=True, exist_ok=True)
for old in OUT.glob("*.webp"):
    old.unlink()

def compose(i):
    src = np.zeros((OH, OW, 3), np.float32)
    src[TOP_PAD:] = F[i][:, x0:x1, ::-1]
    return np.clip(alpha * src + (1 - alpha) * bg, 0, 255).round().astype(np.uint8)

total = 0
for s in slots:
    path = OUT / s["file"]
    Image.fromarray(compose(s["sourceFrame"])).save(path, "WEBP", quality=QUALITY, method=6)
    total += path.stat().st_size
for name, src in (("center.webp", CENTER_SRC), ("center-calm.webp", n - 1)):
    Image.fromarray(compose(src)).save(OUT / name, "WEBP", quality=QUALITY, method=6)
    total += (OUT / name).stat().st_size

info = dict(
    generatedBy="tools/extract_frames.py", video=meta, slots=N_SLOTS, stepDeg=360 / N_SLOTS,
    convention="index 0 = UP, increasing clockwise as seen by the viewer (16 = viewer's right, 32 = down, 48 = left)",
    frameSize=dict(w=OW, h=OH), crop=dict(x0=x0, x1=x1, topPad=TOP_PAD, feather=FEATHER, topFeather=TOP_FEATHER, bottomFeather=BOTTOM_FEATHER),
    face=dict(x=FACE_SRC[0] - x0, y=FACE_SRC[1] + TOP_PAD),
    bodyBottom="the bottom %d rows fade the chest into the gradient, so the frame can end above the viewport bottom" % BOTTOM_FEATHER,
    bgStops=[dict(y=round(y + TOP_PAD, 2), rgb=[round(c, 2) for c in col]) for y, col in stops],
    vignetteStops=[dict(x=round(x, 2), rgb=[round(c, 2) for c in col]) for x, col in hstops],
    directions=directions, center=dict(file="center.webp", sourceFrame=CENTER_SRC, alt="center-calm.webp", altSourceFrame=n - 1),
    frames=slots, totalBytes=total,
    tracking=[dict(frame=i, angle=round(float(ang[i]), 1), magnitude=round(float(mag[i]), 2)) for i in range(n)],
)
(OUT / "frames.json").write_text(json.dumps(info, indent=1))
(ROOT / "src" / "hero").mkdir(parents=True, exist_ok=True)
slim = {k: info[k] for k in ("slots", "stepDeg", "frameSize", "face", "bgStops", "vignetteStops", "directions")}
slim["sources"] = [s["sourceFrame"] for s in slots]
(ROOT / "src" / "hero" / "frames-meta.json").write_text(json.dumps(slim, indent=1))

print("directions:")
for k2, v in directions.items():
    print(f"  {k2:10s} {v}")
gaps = [s for s in slots if s["error"] > 3]
print(f"slots with >3 deg error: {[(s['index'], s['angle'], s['sourceAngle']) for s in gaps]}")
print(f"wrote {N_SLOTS} frames + center.webp + center-calm.webp, total {total/1024:.0f} KB")
