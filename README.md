# isaackps.com — personal website (v4 redesign)

Single-page portfolio for Isaac Koh: animated canvas hero, About, Roles, Recent work (TrustVC, TradeTrust, OpenCerts), Standards and Contact.

Stack: Vite 8 + React 19 + TypeScript, built to a static `dist/` folder.

## Requirements
- Node.js 26.11.1 (see `.nvmrc`; `nvm use`)

## Develop
```sh
npm ci
npm run dev        # http://localhost:5173
```

## Build and preview
```sh
npm run build      # type-check + static build into dist/
npm run preview    # serve dist/ at http://localhost:4173
npm run build:file # optional: build a dist/index.html that opens from file:// (Vite 7-era helper, see notes)
```

## Hero frames
The hero never plays the video at runtime. It draws one of 64 pre-extracted WebP frames
(`public/frames/frame-00..63.webp`, index 0 = up, clockwise, 5.625° steps) plus `center.webp`
on a canvas, one frame per animation tick. To re-extract from the source video (kept out of the repo):
```sh
pip install opencv-python numpy
npm run frames -- /path/to/source.mp4
```

## Deploy
`netlify.toml` builds with `npm run build` and publishes `dist/` on Node 26.11.1.
