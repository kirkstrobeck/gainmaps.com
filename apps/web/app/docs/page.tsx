import { IconArrowRight, IconExternalLink } from "@tabler/icons-react";

import { SiteNav } from "@/components/site-nav";

const sections = [
  ["What changes", "#what-changes"],
  ["Pipeline", "#pipeline"],
  ["Formats", "#formats"],
  ["Ultra", "#ultra"],
  ["Privacy", "#privacy"],
  ["Standards", "#standards"],
  ["Limits", "#limits"],
];

const resources = [
  ["ISO/TS 21496-1", "https://www.iso.org/standard/86775.html", "Still-image Ultra metadata standard."],
  ["Ultra HDR (Android)", "https://developer.android.com/media/grow/ultra-hdr", "Google Ultra HDR JPEG (JPEG_R)."],
  ["Apple Ultra photos", "https://developer.apple.com/documentation/appkit/applying_apple_hdr_effect_to_your_photos", "Apple’s Ultra photo model used by Photos and Preview."],
  ["MDN Service Worker API", "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API", "Documents the browser worker model used for local processing."],
  ["MDN OffscreenCanvas", "https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas", "Documents off-main-thread canvas rendering used for browser-decodable formats."],
  ["MDN createImageBitmap", "https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/createImageBitmap", "Documents worker-side image decoding for Blob and bitmap sources."],
];

export default function Base() {
  return (
    <main>
      <SiteNav />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav className="ultra-surface grid gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] p-2 text-sm">
            {sections.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="flex items-center justify-between rounded-[calc(var(--radius)-2px)] px-3 py-2 text-[var(--muted)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
              >
                {label}
                <IconArrowRight aria-hidden size={14} stroke={1.7} />
              </a>
            ))}
          </nav>
        </aside>

        <article className="min-w-0">
          <header className="border-b border-[var(--border)] pb-10">
            <p className="mb-4 text-sm font-medium text-[var(--muted)]">Technical document</p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.03] tracking-normal sm:text-6xl">
              What Ultra actually does to an image
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--muted)]">
              Ultra turns SDR photos into HDR JPEGs: an SDR base plus gain-map metadata that HDR
              displays can expand. Processing stays in your browser.
            </p>
          </header>

          <section id="what-changes" className="scroll-mt-8 border-b border-[var(--border)] py-10">
            <h2 className="text-2xl font-semibold tracking-normal">What changes</h2>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                The worker rasterizes your photo, builds linear HDR capacity from the SDR pixels using a chosen
                Ultra intensity, tone-maps an SDR base, and writes a single Ultra JPEG.
              </p>
              <p>
                This is not camera-scene reconstruction. Without original HDR capture data the tool synthesizes
                capacity from the SDR image. Compatible viewers (Preview, Photos, Ultra HDR clients) can then
                expand Ultra on HDR displays.
              </p>
            </div>
          </section>

          <section id="pipeline" className="scroll-mt-8 border-b border-[var(--border)] py-10">
            <h2 className="text-2xl font-semibold tracking-normal">Pipeline</h2>
            <ol className="mt-5 grid gap-3 text-sm leading-7 text-[var(--muted)]">
              <li>1. The page receives files through drag-and-drop or the file picker.</li>
              <li>2. Files are sent to `/hdr-service-worker.js` with `postMessage` and a `MessageChannel`.</li>
              <li>3. The service worker detects PNG, JPEG, GIF, HEIC, WebP, AVIF, or a browser-decodable bitmap path.</li>
              <li>4. Pixels are decoded to RGBA and converted to linear light.</li>
              <li>5. Linear values are scaled by Ultra intensity to create HDR capacity.</li>
              <li>6. An Ultra encoding is built against a tone-mapped SDR base (Reinhard).</li>
              <li>7. Output is written as an Ultra HDR JPEG `Blob` for download.</li>
            </ol>
          </section>

          <section id="formats" className="scroll-mt-8 border-b border-[var(--border)] py-10">
            <h2 className="text-2xl font-semibold tracking-normal">Formats</h2>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                Input: PNG, JPEG, WebP, AVIF, GIF (first frame), HEIC when the decoder can open it, and SVG
                including animated SMIL/CSS SVG (animations are frozen to a keyframe, then encoded). Output is
                always an Ultra JPEG (`*-ultra.jpg`).
              </p>
            </div>
          </section>

          <section id="ultra" className="scroll-mt-8 border-b border-[var(--border)] py-10">
            <h2 className="text-2xl font-semibold tracking-normal">Ultra</h2>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                Ultra is the maximum HDR/SDR brightness ratio encoded into the photo. The default mid
                setting targets about 3.34× — similar to many iPhone HDR stills. Lower values are subtler; higher
                values push brighter highlights on HDR displays.
              </p>
              <p>
                The nav <span className="text-[var(--foreground)]">Ultra</span> switch controls CSS{" "}
                <code className="text-[var(--foreground)]">dynamic-range-limit</code> for the whole page: Off
                clamps to SDR reference white; On unlocks Ultra photos and{" "}
                <code className="text-[var(--foreground)]">color-hdr()</code> accents on capable displays.
              </p>
            </div>
          </section>

          <section id="privacy" className="scroll-mt-8 border-b border-[var(--border)] py-10">
            <h2 className="text-2xl font-semibold tracking-normal">Privacy</h2>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                Files never leave the browser for processing. The service worker does the encode locally and returns
                a downloadable blob. Closing the tab discards in-memory results.
              </p>
            </div>
          </section>

          <section id="standards" className="scroll-mt-8 border-b border-[var(--border)] py-10">
            <h2 className="text-2xl font-semibold tracking-normal">Standards</h2>
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
                    <IconExternalLink aria-hidden size={14} stroke={1.7} />
                  </span>
                  <span className="text-sm leading-6 text-[var(--muted)]">{detail}</span>
                </a>
              ))}
            </div>
          </section>

          <section id="limits" className="scroll-mt-8 py-10">
            <h2 className="text-2xl font-semibold tracking-normal">Limits</h2>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                Very large images may be slow in-browser. Animated GIF only uses the first frame. HEIC depends on
                the local decoder. Gain-map appearance varies by viewer and display peak luminance.
              </p>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
