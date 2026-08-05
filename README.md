# hdr-tag

Give a JPEG or PNG the "impossibly saturated" look by **assigning** a Rec.2020 PQ
ICC profile — the same trick the Ashby logo on LinkedIn is (accidentally) doing.

## What it does — and does not do

It **assigns**, it never **converts**. The stored pixel values are left exactly
as they were; only the ICC profile telling viewers how to interpret those values
is swapped. A byte that said `154, 119, 255` in sRGB still says `154, 119, 255`
— but a Rec.2020 primaries + PQ transfer curve maps it to a far wider,
brighter colour, so HDR-capable displays render it near-fluorescent.

Implementation is container surgery, never a decode/re-encode:

- **JPEG** — split into marker segments plus the entropy-coded scan, replace the
  `APP2 / ICC_PROFILE` segments, write the scan back byte-for-byte.
- **PNG** — replace the `iCCP` chunk, leaving `IDAT` untouched. Conflicting
  `sRGB` / `gAMA` / `cHRM` chunks are dropped, since the PNG spec forbids `sRGB`
  alongside `iCCP`.

`assign` hashes the compressed pixel payload before and after and aborts if it
ever differs, so a quality regression can't pass silently.

## Prefer PNG

Tagging is lossless either way, but the tag can't add resolution or undo an
earlier encode. For flat vector-style art — logos, stickers, type, QR codes —
export **PNG at the largest size you'll ever need**, then tag that. PNG has no
quantization and no chroma subsampling, so edges stay crisp and alpha survives.

`inspect` reports the numbers that decide this: pixel dimensions, chroma
sampling, and the average luma quantization value (≈1 means near-lossless).

## PQ destroys anti-aliasing — use `edges` first

The saturation pop comes from the **primaries**. The jagged edges come from the
**transfer curve**. They are separable, and that is the whole fix.

Anti-aliasing is authored against a roughly perceptual curve: the blended pixel
on a letter's edge is meant to read as a midpoint. PQ's shadow slope is far
steeper, so that midpoint collapses onto the dark side. A white-on-blue edge in
the sticker fixture, sampled at row 200:

| pixel | RGB | as sRGB | as PQ |
| --- | --- | --- | --- |
| letter | `255,253,242` | 98.1 nits | 9284 nits (92.8% of white) |
| blend | `78,93,166` | 11.7 nits | 41.0 nits (**0.41%** of white) |
| background | `53,70,155` | 7.0 nits | 21.2 nits (0.21%) |

White-to-blend contrast goes from **8.4:1 to 226:1** — a 27x expansion. The one
pixel meant to bridge the edge joins the background instead, so the soft edge
becomes a one-pixel cliff with a dark rim. That's the "bad photo effect" look.

`edges` measures this across the whole image before you commit to a profile:

```
$ npm run cli -- edges "Sticker.png" --preset pq
  anti-alias  15895 blended pixels
  authored    sits 35.7% between its neighbours
  assigned    sits 15.4% between its neighbours
  collapsed   72.8% of them lose half their blend or more
  verdict     anti-aliasing collapses 2.3x toward the dark side — ...

$ npm run cli -- edges "Sticker.png" --preset gamut
  collapsed   0.0% of them lose half their blend or more
  verdict     anti-aliasing survives — edges stay smooth
```

## Presets

| preset | profile | look | edges |
| --- | --- | --- | --- |
| `pq` (default) | Rec.2020 + PQ | the Ashby effect | destroyed on anti-aliased art |
| `gamut` | Rec.2020 + BT.2020 transfer | same wide gamut | intact |

Both profiles carry **the same Rec.2020 primaries** — verified by comparing their
`rXYZ`/`gXYZ`/`bXYZ`/`wtpt` tags, which agree to the fifth decimal — so the gamut
is identical and the saturation is identical. Only the tone curve differs, and
BT.2020's curve tracks sRGB closely. For photographs, `pq` is fine. For logos,
type, stickers, or any anti-aliased vector art, use `gamut`.

## Usage

```sh
npm install

# retag with the bundled Rec.2020 PQ profile -> Sticker-pq.png
npm run cli -- assign "Sticker.png"

npm run cli -- assign in.png --preset gamut      # -> in-rec2020.png
npm run cli -- edges in.png --preset pq          # will PQ wreck this art?

npm run cli -- assign in.png -o out.png          # explicit output
npm run cli -- assign in.jpg --profile my.icc    # a different profile
npm run cli -- assign in.jpg --from donor.jpg    # copy another image's profile

npm run cli -- inspect out.png                   # size, quality, profile
npm run cli -- extract donor.jpg -o profile.icc  # pull a profile out
```

`--profile`, `--from` and `--preset` are mutually exclusive. Verify on macOS with
`sips -g profile -g pixelWidth out.png`.

## The profiles

macOS ships no Rec.2020 PQ profile. `profiles/rec2020-pq.icc` was extracted from
the Ashby logo with this tool's own `extract` command:

```sh
npm run cli -- extract ashbyhq_logo.jpg -o profiles/rec2020-pq.icc
```

`Rec2020 Gamut with PQ Transfer`, ICC v4.4.0, 9176 bytes, `mntr` / `RGB -> XYZ`.

`profiles/rec2020.icc` is macOS's own `ITU-2020.icc` — `Rec. ITU-R BT.2020-1`,
ICC v4.0.0, 556 bytes, parametric TRC.

## Layout

| file | role |
| --- | --- |
| `src/image/codec.ts` | the format-agnostic contract |
| `src/image/registry.ts` | pick a codec from the file's magic bytes |
| `src/image/jpeg-codec.ts` · `png-codec.ts` | per-format implementations |
| `src/jpeg/markers.ts` | marker constants and classification |
| `src/jpeg/structure.ts` | parse/serialize segments, keep the scan opaque |
| `src/jpeg/icc-segments.ts` | read and rewrite `APP2 / ICC_PROFILE` chunks |
| `src/jpeg/dimensions.ts` | frame size, chroma sampling, quantization average |
| `src/png/crc32.ts` · `chunks.ts` | PNG chunk reader/writer with checksums |
| `src/png/icc-chunk.ts` | deflate/inflate the `iCCP` chunk |
| `src/png/decode.ts` | inflate `IDAT` and undo scanline filters, for analysis |
| `src/icc/tags.ts` | ICC tag table lookup |
| `src/icc/describe.ts` | ICC header + `desc`/`mluc` reader, for reporting |
| `src/icc/primaries.ts` | `XYZ ` colorant tags — proves two profiles share a gamut |
| `src/color/transfer.ts` | sRGB, BT.2020 and PQ transfer functions |
| `src/color/edge-report.ts` | how much anti-aliasing a curve destroys |
| `src/profile/presets.ts` | the bundled `pq` / `gamut` profiles |
| `src/profile/resolve.ts` | pick the profile: flag, donor image, or preset |
| `src/commands/*.ts` | `assign`, `inspect`, `extract`, `edges` |
| `src/cli.ts` | argument dispatch |

Everything is TypeScript, run through `tsx`. No Python, no shell helpers.

## Tests

```sh
npm test        # node:test via tsx
npm run typecheck
```

41 tests covering byte-exact re-serialization of both containers, pixel
preservation across assignment, profile replacement (not stacking), idempotent
re-tagging, ICC profiles larger than one JPEG segment, `iCCP` ordering before
`IDAT`, alpha preservation, CRC-32 correctness, the non-mutation guarantee of
the profile reader, PQ/sRGB/BT.2020 curve anchors, PNG scanline unfiltering
against known pixel values, preset resolution and mutual exclusion, the
shared-primaries proof, and the edge measurements above in both directions.

## Caveats

- The effect is display-dependent. It reads as a vivid pop on wide-gamut/HDR
  screens and colour-managed browsers, and can look muted or plain wrong
  elsewhere.
- Anything that re-encodes the image (most CMS pipelines, social uploads) may
  drop or convert the profile and undo the effect.
- PQ is an *absolute* luminance encoding: code 1.0 means 10,000 nits. Nothing in
  the file is wrong when edges break under it — the artwork was simply authored
  against a different curve. Re-render the art with PQ-aware anti-aliasing, or
  use `--preset gamut`.
