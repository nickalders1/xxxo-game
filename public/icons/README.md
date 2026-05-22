# PWA Icons

These PNGs are referenced from [`src/app/manifest.ts`](../../src/app/manifest.ts)
and [`src/app/layout.tsx`](../../src/app/layout.tsx) (`apple-touch-icon`).

| File | Size | Purpose |
| --- | --- | --- |
| `icon-192.png` | 192×192 | Standard app icon (Android home screen, browser install) |
| `icon-512.png` | 512×512 | High-res app icon (splash, listings) |
| `icon-maskable-512.png` | 512×512 | Maskable variant — content stays in centre 80% safe zone so Android adaptive-icon masks (round, squircle, ...) don't crop the logo |
| `apple-touch-icon.png` | 180×180 | iOS home screen |

## Regenerating

The icons are rendered from
[`scripts/icons/source.svg`](../../scripts/icons/source.svg) and
[`scripts/icons/source-maskable.svg`](../../scripts/icons/source-maskable.svg)
via a one-shot Node script using `sharp`:

```bash
npm run gen:icons
```

Edit the SVG sources to change the design, then re-run.
