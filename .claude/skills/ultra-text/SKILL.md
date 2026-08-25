---
name: ultra-text
description: Add the Ultra HDR text effect to a site — transparent foreground text masked over a WebGPU-backed canvas that paints above SDR reference white.
---

# Ultra Text Effect

Renders display-only Ultra-white letterforms using a three-layer stack:
1. **Transparent selectable text** — real DOM text, colour `text-transparent`.
2. **SVG mask** — an `<svg>` in `defs` with a `<text>` in white that defines which pixels show through.
3. **Ultra fill canvas** — a 1×1 WebGPU `rgba16float` canvas scaled by CSS, masked to the letterforms, painting above SDR reference white.

The canvas sits on top; a plain white `ultra-backdrop` sits beneath it so the word does not blink while WebGPU initialises.

## Reference implementation

All source lives in this repo under `apps/web/`:

| File | Role |
|---|---|
| `components/ultra-word.tsx` | Three-layer component. Accepts `word`, `typeClassName`, `intensity`. |
| `components/ultra-fill-canvas.tsx` | Renders the WebGPU canvas rectangle. Restarts on appearance-change events. |
| `lib/ultra-fill.ts` | `startUltraFill(canvas, { intensity })` — WebGPU session, 1×1 `rgba16float` surface, `toneMapping: { mode: "extended" }`. |
| `lib/text-ultra.ts` | Constants: `TEXT_ULTRA_INTENSITY = 4.0` (max headroom), `TEXT_ULTRA_HEADROOM_MIN/MAX`. |
| `lib/ultra-overlay.ts` | `ultraOverlayGeometry()` — returns `position:absolute; inset:-50%; width:200%; height:200%` so ink that escapes the text box (accents, overshoot) still has mask. |
| `app/globals.css` | `html[data-ultra="on"]` gate — `.ultra-fill` is hidden when Ultra is off; `.ultra-backdrop` provides SDR fallback. |

## How the layers work

```
<span class="ultra-word relative inline-block">
  {/* Layer 1: real selectable text, invisible */}
  <span class="[typeClassName] text-transparent">{word}</span>

  {/* Layer 2: SVG mask — same box grown by ULTRA_BLEED (50%) on each side */}
  <svg aria-hidden class="pointer-events-none select-none" style={overlayGeometry}>
    <defs>
      <mask id={maskId}>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
              fill="#ffffff" class={typeClassName}>
          {word}
        </text>
      </mask>
    </defs>
  </svg>

  {/* Layer 3a: SDR-white backdrop (shows immediately, prevents blink) */}
  <span aria-hidden class="ultra-backdrop" style={{ ...overlay, mask }} />

  {/* Layer 3b: Ultra fill canvas — values above 1.0 use display headroom */}
  <UltraFillCanvas intensity={intensity}
    style={{ ...overlay, mask, WebkitMask: mask }} />
</span>
```

## Adding Ultra text to a page

### 1. Enable the `data-ultra` attribute on `<html>`

The CSS gates `ultra-fill` visibility on `html[data-ultra="on"]`. Set it with:

```ts
import { applySiteAppearance, readSiteAppearance } from "@/lib/site-appearance";
applySiteAppearance({ ...readSiteAppearance(), ultra: "on" });
```

Or set it server-side in `layout.tsx`:

```tsx
<html data-ultra="on" data-mode="dark">
```

### 2. Use `UltraWord`

```tsx
import { UltraWord } from "@/components/ultra-word";
import { TEXT_ULTRA_INTENSITY } from "@/lib/text-ultra";

<h1>
  <UltraWord
    word="Ultra"
    typeClassName="font-display text-5xl font-black tracking-tight"
    intensity={TEXT_ULTRA_INTENSITY}
  />
</h1>
```

`typeClassName` is applied to **both** the selectable `<span>` and the SVG `<text>`, so CSS font metrics drive both layers identically.

### 3. Copy the required files

Copy from `apps/web/`:
- `components/ultra-word.tsx`
- `components/ultra-fill-canvas.tsx`
- `lib/ultra-fill.ts`
- `lib/text-ultra.ts`
- `lib/ultra-overlay.ts`

Add to `globals.css`:

```css
html[data-ultra="on"] .ultra-fill { display: block; }
html[data-ultra="off"] .ultra-fill,
.ultra-fill { display: none; }

html[data-ultra="on"] .ultra-backdrop { background: white; }
.ultra-backdrop {
  position: absolute;
  pointer-events: none;
  select: none;
}
```

### 4. Intensity values

`TEXT_ULTRA_INTENSITY = 4.0` — the WebGPU canvas paints `rgba(4.0, 4.0, 4.0, 1.0)` in linear sRGB. On an HDR display this maps above SDR reference white. On SDR it clamps to white. Headroom range: 1.0 (SDR white) – 4.0 (aggressive Ultra).

## Troubleshooting

| Symptom | Fix |
|---|---|
| Word is invisible | `data-ultra` is not `"on"` on `<html>` |
| Word blinks in on load | The `ultra-backdrop` span is missing |
| Glyphs drift off the word | `typeClassName` differs between the `<span>` and `<text>` |
| WebGPU not available | Browser lacks WebGPU — canvas marks itself `data-ultra-fill="unsupported"`, backdrop remains |
| Text copied twice | The SVG `<text>` lacks `select-none` or `aria-hidden` |
