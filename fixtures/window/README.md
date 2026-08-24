# Window gain-map fixtures

Ground-truth Ultra HDR pair from an iPhone 16e capture.

| File | Role |
|------|------|
| `window.jpeg` | SDR JPEG export — **encoder input** |
| `window-donor.jpg` | `window.jpeg` with Rec.2020 PQ assigned (CLI donor tests) |
| `window-gain.HEIC` | Apple HEIC that preserves the gain map — **HDR reference** |
| `window-gain.jpeg` | Apple JPEG gain-map export (secondary reference) |
| `calibration.json` | Point-fit transform `window.jpeg` → `window-gain.HEIC` in extended-linear Display P3 |

## Accuracy contract

`window.jpeg` is encoded with the calibrated keep-base Ultra HDR path. After
ImageIO `kCGImageSourceDecodeToHDR` expand, candidate and `window-gain.HEIC`
must match point-for-point within the mean absolute RGB threshold enforced by
`test/window-gain.test.ts`.

```sh
# Re-fit calibration (macOS)
swiftc -O tools/window-gain/calibrate.swift -o tools/window-gain/calibrate \
  -framework AppKit -framework ImageIO -framework CoreGraphics
./tools/window-gain/calibrate

# Encode + compare
pnpm exec tsx tools/window-gain/encode-window.ts
swiftc -O tools/window-gain/compare-hdr.swift -o tools/window-gain/compare-hdr \
  -framework AppKit -framework ImageIO -framework CoreGraphics
./tools/window-gain/compare-hdr \
  tmp-window-gain/window-from-jpeg-calibrated.jpg \
  fixtures/window/window-gain.HEIC
```
