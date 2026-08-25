import type { Metadata } from "next";
import {
  ArrowForwardIcon as ArrowRightFilled,
  BookmarkIcon as BookmarkFilled,
  OpenInNewIcon as ExternalLinkFilled,
  LayersIcon as LayersFilled,
  BoltIcon as LightningFilled,
  LockIcon as LockFilled,
  PhotoIcon as PicFilled,
  VerifiedUserIcon as ShieldFilled,
  AutoAwesomeIcon as SparklesFilled,
  LightModeIcon as SunFilled,
  SwapHorizIcon as TransferFilled,
} from "@/components/icons";

import { PageChrome } from "@/components/page-chrome";
import { UltraIcon } from "@/components/ultra-icon";
import { BRAND_NAMES } from "@/lib/brand-names";

export const metadata: Metadata = {
  title: "Docs · Gainmaps",
  description:
    "How gain map images work: what changes in HDR, the encoding pipeline, formats, privacy, standards, and limits.",
};

const sections = [
  ["What changes", "#what-changes"],
  ["Pipeline", "#pipeline"],
  ["Formats", "#formats"],
  ["Gain", "#gain"],
  ["Names", "#names"],
  ["Privacy", "#privacy"],
  ["Standards", "#standards"],
  ["Limits", "#limits"],
];

const resources = [
  ["ISO/TS 21496-1", "https://www.iso.org/standard/86775.html", "Still-image gain map metadata standard."],
  ["Ultra HDR (Android)", "https://developer.android.com/media/grow/ultra-hdr", "Google Ultra HDR JPEG (JPEG_R)."],
  ["Apple HDR photos", "https://developer.apple.com/documentation/appkit/applying_apple_hdr_effect_to_your_photos", "Apple's HDR photo model used by Photos and Preview."],
  ["MDN Service Worker API", "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API", "Documents the browser worker model used for local processing."],
  ["MDN OffscreenCanvas", "https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas", "Documents off-main-thread canvas rendering used for browser-decodable formats."],
  ["MDN createImageBitmap", "https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/createImageBitmap", "Documents worker-side image decoding for Blob and bitmap sources."],
];

const PIPELINE_STEPS = [
  "Files arrive via drag-and-drop or the file picker.",
  "The page sends each file to /hdr-service-worker.js over a MessageChannel.",
  "The worker detects format: PNG, JPEG, GIF, HEIC, WebP, AVIF, or any browser-decodable bitmap.",
  "Pixels are decoded to RGBA and converted to linear light.",
  "Linear values are scaled by gain intensity, creating synthetic HDR capacity.",
  "A gain map is computed against a Reinhard-tone-mapped SDR base image.",
  "The result is encoded as an Ultra HDR JPEG Blob and returned for download.",
];

const SECTION_ICON_CLS = "flex size-8 shrink-0 items-center justify-center rounded-[calc(var(--radius)-2px)] bg-[color-mix(in_srgb,var(--accent)_10%,var(--panel))] text-[var(--accent)]";

export default function Base() {
  return (
    <main>
      <PageChrome />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:px-8">

        {/* Sidebar TOC */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav className="ultra-surface grid gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] p-2 text-sm">
            {sections.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="flex items-center justify-between rounded-[calc(var(--radius)-2px)] px-3 py-2 text-[var(--muted)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
              >
                {label}
                <ArrowRightFilled aria-hidden size={14} />
              </a>
            ))}
          </nav>

          {/* Try it links */}
          <div className="mt-4 grid gap-1 text-sm">
            <p className="px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
              Try it
            </p>
            {[
              ["/convert", "Convert a photo"],
              ["/photos", "Browse HDR photos"],
              ["/logos", "Browse logos"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="flex items-center justify-between rounded-[calc(var(--radius)-2px)] px-3 py-2 text-[var(--accent)] transition hover:bg-[color-mix(in_srgb,var(--accent)_7%,transparent)]"
              >
                {label}
                <ArrowRightFilled aria-hidden size={14} />
              </a>
            ))}
          </div>
        </aside>

        {/* Main article */}
        <article className="min-w-0">
          <header className="border-b border-[var(--border)] pb-10">
            <p className="mb-4 text-sm font-medium text-[var(--muted)]">Technical document</p>
            <h1 className="font-display max-w-4xl text-5xl font-bold leading-[1.03] tracking-normal sm:text-6xl">
              What Gainmaps actually does to an image
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--muted)]">
              A gain map image carries two things: a standard SDR baseline every app can open, and a
              secondary brightness layer (the gain map) that HDR displays use to expand highlights
              past SDR reference white. Gainmaps synthesizes that second layer locally, in your
              browser, from the pixels you give it.
            </p>
          </header>

          {/* ── What changes ── */}
          <section id="what-changes" className="scroll-mt-24 border-b border-[var(--border)] py-10">
            <div className="flex items-center gap-3">
              <span className={SECTION_ICON_CLS} aria-hidden>
                <UltraIcon size={16}><LayersFilled /></UltraIcon>
              </span>
              <h2 className="font-display text-2xl font-bold tracking-normal">What changes</h2>
            </div>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                The worker rasterizes your photo, builds linear HDR capacity from the SDR pixels using
                the chosen gain intensity, tone-maps an SDR base, and writes a single gain map image.
                The output file is larger than the input: it carries both the SDR image and the gain
                map, but opens normally in any JPEG viewer.
              </p>
              <p>
                This is not camera-scene HDR reconstruction. Without original HDR capture data, the
                tool synthesizes headroom from the SDR image. Compatible viewers (Apple Preview,
                Photos, Android Ultra HDR clients) can then expand the gain map on capable displays.
              </p>
            </div>
          </section>

          {/* ── Pipeline ── */}
          <section id="pipeline" className="scroll-mt-24 border-b border-[var(--border)] py-10">
            <div className="flex items-center gap-3">
              <span className={SECTION_ICON_CLS} aria-hidden>
                <UltraIcon size={16}><TransferFilled /></UltraIcon>
              </span>
              <h2 className="font-display text-2xl font-bold tracking-normal">Pipeline</h2>
            </div>
            <ol className="mt-5 grid gap-2">
              {PIPELINE_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel-strong)] text-[10px] font-bold tabular-nums text-[var(--muted)]">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-7 text-[var(--muted)]">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* ── Formats ── */}
          <section id="formats" className="scroll-mt-24 border-b border-[var(--border)] py-10">
            <div className="flex items-center gap-3">
              <span className={SECTION_ICON_CLS} aria-hidden>
                <UltraIcon size={16}><PicFilled /></UltraIcon>
              </span>
              <h2 className="font-display text-2xl font-bold tracking-normal">Formats</h2>
            </div>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                <span className="font-medium text-[var(--foreground)]">Input:</span>{" "}
                PNG, JPEG, WebP, AVIF, GIF (first frame only), HEIC when the browser decoder can open
                it, and SVG including animated SMIL/CSS SVG. Animations are frozen to a keyframe,
                then encoded.
              </p>
              <p>
                <span className="font-medium text-[var(--foreground)]">Output:</span>{" "}
                always a gain map image (<code className="rounded bg-[var(--panel-strong)] px-1 py-0.5 font-mono text-[var(--foreground)]">*-gainmap.jpg</code>).
                The file contains both layers and can be opened by any standard JPEG viewer.
              </p>
            </div>
          </section>

          {/* ── Gain ── */}
          <section id="gain" className="scroll-mt-24 border-b border-[var(--border)] py-10">
            <div className="flex items-center gap-3">
              <span className={SECTION_ICON_CLS} aria-hidden>
                <UltraIcon size={16}><SunFilled /></UltraIcon>
              </span>
              <h2 className="font-display text-2xl font-bold tracking-normal">Gain</h2>
            </div>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                Gain is the maximum HDR/SDR brightness ratio encoded into the photo. The default mid
                setting targets roughly 3.34×, similar to many iPhone HDR stills. Lower values are
                subtler; higher values push brighter highlights on HDR displays.
              </p>
              <p>
                The nav{" "}
                <span className="inline-flex items-center gap-1 font-medium text-[var(--foreground)]">
                  <UltraIcon size={13}><SparklesFilled /></UltraIcon>
                  Ultra
                </span>{" "}
                switch controls CSS{" "}
                <code className="rounded bg-[var(--panel-strong)] px-1 py-0.5 font-mono text-[var(--foreground)]">dynamic-range-limit</code>{" "}
                for the whole page: Off clamps to SDR reference white; On unlocks Ultra photos and{" "}
                <code className="rounded bg-[var(--panel-strong)] px-1 py-0.5 font-mono text-[var(--foreground)]">color-hdr()</code>{" "}
                accents on capable displays. See how it looks on{" "}
                <a href="/text" className="text-[var(--accent)] underline underline-offset-2 transition hover:opacity-75">
                  the Ultra text demo →
                </a>
              </p>
            </div>
          </section>

          {/* ── Names ── */}
          <section id="names" className="scroll-mt-24 border-b border-[var(--border)] py-10">
            <div className="flex items-center gap-3">
              <span className={SECTION_ICON_CLS} aria-hidden>
                <UltraIcon size={16}><BookmarkFilled /></UltraIcon>
              </span>
              <h2 className="font-display text-2xl font-bold tracking-normal">Names</h2>
            </div>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                Vendors, platforms, and standards each coined their own name for the same idea:
                brightness above SDR reference white, encoded so every app can still open the file.
              </p>
              <p>
                On a Mac, when the display raises brightness to show an HDR image, that path is
                Extended Dynamic Range (EDR). EDR is Apple&apos;s way of <em>displaying</em> brightness
                above SDR reference white. HDR describes the image content. They are not the same
                word, and they are often used interchangeably by mistake.
              </p>
              <p>
                An EDR JPEG is possible: it is usually called an HDR JPEG with a gain map. The file
                holds a normal SDR JPEG plus extra brightness data. Unsupported apps show the SDR
                layer. Editing or reexporting the image may strip the map. Apple calls the still-image
                system Adaptive HDR; Android and Google call the JPEG format Ultra HDR, the closest
                Android equivalent to an EDR JPEG. The cross-platform technical name is HDR gain map
                image.
              </p>
              <p>
                EDR lifts highlights, not the shadow floor. Blacks do not necessarily get blacker.
              </p>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[540px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="pb-2 pr-4 font-medium uppercase tracking-[0.08em] text-[var(--muted)]">Name</th>
                    <th className="pb-2 pr-4 font-medium uppercase tracking-[0.08em] text-[var(--muted)]">Full form</th>
                    <th className="pb-2 pr-4 font-medium uppercase tracking-[0.08em] text-[var(--muted)]">Platform</th>
                    <th className="pb-2 font-medium uppercase tracking-[0.08em] text-[var(--muted)]">What it means</th>
                  </tr>
                </thead>
                <tbody>
                  {BRAND_NAMES.map((row) => (
                    <tr key={row.name} className="border-b border-[var(--border)] last:border-b-0">
                      <td className="py-2.5 pr-4 font-semibold text-[var(--foreground)]">{row.name}</td>
                      <td className="py-2.5 pr-4 text-[var(--muted)]">{row.fullName}</td>
                      <td className="py-2.5 pr-4 text-[var(--muted)]">{row.platform}</td>
                      <td className="py-2.5 text-[var(--muted)]">{row.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Privacy ── */}
          <section id="privacy" className="scroll-mt-24 border-b border-[var(--border)] py-10">
            <div className="flex items-center gap-3">
              <span className={SECTION_ICON_CLS} aria-hidden>
                <UltraIcon size={16}><ShieldFilled /></UltraIcon>
              </span>
              <h2 className="font-display text-2xl font-bold tracking-normal">Privacy</h2>
            </div>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                Files never leave the browser for processing. The service worker encodes locally and
                returns a downloadable blob. No bytes travel to any server. Closing the tab discards
                all in-memory results.
              </p>
              <div
                className="flex items-start gap-3 rounded-[var(--radius)] border px-4 py-3"
                style={{
                  borderColor: "color-mix(in srgb, var(--accent) 22%, var(--border))",
                  background: "color-mix(in srgb, var(--accent) 6%, var(--panel))",
                }}
              >
                <UltraIcon size={16} className="mt-0.5 shrink-0 text-[var(--accent)]">
                  <LockFilled />
                </UltraIcon>
                <p className="text-[var(--muted)]">
                  The converter works offline after the first load. There is no backend, no analytics
                  pipeline, no upload endpoint.
                </p>
              </div>
            </div>
          </section>

          {/* ── Standards ── */}
          <section id="standards" className="scroll-mt-24 border-b border-[var(--border)] py-10">
            <div className="flex items-center gap-3">
              <span className={SECTION_ICON_CLS} aria-hidden>
                <UltraIcon size={16}><LightningFilled /></UltraIcon>
              </span>
              <h2 className="font-display text-2xl font-bold tracking-normal">Standards</h2>
            </div>
            <div className="mt-5 grid gap-3">
              {resources.map(([label, href, detail]) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="ultra-surface grid gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] px-4 py-3 transition hover:border-[var(--accent)]"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                    {label}
                    <ExternalLinkFilled aria-hidden size={14} />
                  </span>
                  <span className="text-sm leading-6 text-[var(--muted)]">{detail}</span>
                </a>
              ))}
            </div>
          </section>

          {/* ── Limits ── */}
          <section id="limits" className="scroll-mt-24 py-10">
            <h2 className="font-display text-2xl font-bold tracking-normal">Limits</h2>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                Very large images may be slow to encode in-browser; the worker is single-threaded per
                file. Animated GIF only encodes the first frame. HEIC decoding depends on platform
                support. Gain-map appearance varies by viewer software and display peak luminance:
                the same file looks different on an iPhone XDR versus an SDR monitor.
              </p>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
