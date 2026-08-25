/* Ultra mode by Kirk Strobeck */
import { preload } from "react-dom";
import { ThumbUpIcon } from "@/components/icons";
import { UltraDisplayCheck } from "@/components/ultra-display-check";
import { HomeDropZone } from "@/components/home-drop-zone";
import { SiteNav } from "@/components/site-nav";
import { UltraIcon } from "@/components/ultra-icon";
import { BRAND_NAMES } from "@/lib/brand-names";
import { COMPANIES } from "@/lib/logos/companies";
import { PHOTOS, photoStandardSrc, photoStandardSrcset } from "@/lib/photos/catalog";
import { HeroSection } from "@/components/hero-section";
import { ImageProofSection } from "@/components/image-proof-section";
import { InstallSwitcher } from "@/components/install-switcher";
import { UltraSkillCard } from "@/components/ultra-skill-card";

const LOGO_STRIP = COMPANIES.slice(0, 8);

type Search = { [key: string]: string | string[] | undefined };

export default async function Base({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await searchParams;
  // Pick a random hero photo per request (server-side — no hydration mismatch).
  const comparePhoto = PHOTOS[Math.floor(Math.random() * PHOTOS.length)] ?? PHOTOS[0];
  // Exclude the hero from the peek strip so the same image never appears twice.
  const PHOTO_PEEK = PHOTOS.filter((p) => p !== comparePhoto).slice(0, 3);

  const heroSrc = photoStandardSrc(comparePhoto, 1920);
  const heroSrcSet = photoStandardSrcset(comparePhoto);
  preload(heroSrc, {
    as: "image",
    imageSrcSet: heroSrcSet,
    imageSizes: "(min-width: 1280px) calc(100vw - 460px), 100vw",
    fetchPriority: "high",
  });

  return (
    <main>
      <meta name="description" content="Convert photos to HDR gain map images instantly in your browser. Local and private — no upload, no server." />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-[var(--radius)] focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-[var(--accent-foreground)]">
        Skip to content
      </a>
      <SiteNav />

      {/* ── Above the fold: Convert Images ── */}
      <section id="main-content" className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold">Convert Images</h2>
          <div className="mt-6 max-w-md">
            <HomeDropZone label="INSTANT IN BROWSER" />
          </div>
          <div className="mt-10">
            <h3 className="font-display text-xl font-semibold">From the terminal</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Batch-encode gain map images without a browser.
            </p>
            <div className="mt-4">
              <InstallSwitcher />
            </div>
          </div>

          <UltraSkillCard />
        </div>
      </section>

      {/* ── Photo instrument and type instrument ── */}
      <HeroSection comparePhoto={comparePhoto} />

      {/* Display check below the fold — not between nav and wordmark */}
      <UltraDisplayCheck />

      <div>
        <div className="mx-auto max-w-7xl space-y-20 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
          <ImageProofSection
            logoStrip={LOGO_STRIP}
            photoPeek={PHOTO_PEEK}
          />

          {/* ── HDR primer ── */}
          <section className="reveal border-t border-[var(--border)] pt-12">
            <h2 className="font-display text-2xl font-bold">
              What is a gain map image?
            </h2>
            <div className="mt-6 grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
              <div className="grid gap-4 text-sm leading-7 text-[var(--muted)]">
                <p>
                  HDR is an expanded brightness range: image highlights can sit above the SDR ceiling. A gain map image encodes a normal SDR image plus a secondary brightness map. Unsupported apps render the SDR layer and ignore the rest.
                </p>
                <p>
                  EDR is Apple&apos;s term for <em>displaying</em> brightness above SDR reference white. HDR describes the image content. They are not the same word and are often misused interchangeably.
                </p>
                <p>
                  The cross-platform technical name is <strong className="text-[var(--foreground)]">HDR gain map image</strong>. Consumer brands include Adaptive HDR (Apple) and Ultra HDR (Android/Google). This site encodes those files locally in the browser. No upload, no server.
                </p>
                <p className="text-xs leading-6">
                  Blacks do not necessarily get blacker. EDR lifts highlights, not the shadow floor.
                </p>
              </div>

              <aside
                className="self-start rounded-[var(--radius)] border px-5 py-4 text-sm leading-6"
                style={{
                  borderColor: "color-mix(in srgb, var(--accent) 22%, var(--border))",
                  background: "color-mix(in srgb, var(--accent) 6%, var(--panel))",
                }}
              >
                <p className="font-semibold text-[var(--foreground)]">Monitor note</p>
                <p className="mt-2 text-[var(--muted)]">
                  Ultra paints past SDR reference white. On an HDR display (Apple XDR, Android Ultra HDR, or Windows Advanced Color), the effect is visible. On an SDR monitor it renders as ordinary white. That is expected, not a bug.
                </p>
              </aside>
            </div>
          </section>

          {/* ── Naming fracture ── */}
          <section className="reveal border-t border-[var(--border)] pt-12">
            <h2 className="font-display text-2xl font-bold">
              Every platform named it differently
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Vendors, platforms, and standards each coined their own acronym.
            </p>
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
            <p className="mt-4 text-sm">
              <a href="/docs#names" className="text-[var(--accent)] underline underline-offset-2 transition hover:opacity-75">
                Full glossary in the docs
              </a>
            </p>
          </section>

          {/* ── Product Hunt — non-linking until URL exists ── */}
          {/* TODO: add href="https://www.producthunt.com/posts/PRODUCT_HUNT_SLUG" once launched */}
          <section className="reveal border-t border-[var(--border)] pt-12">
            <div className="flex items-start gap-4">
              <UltraIcon size={28}>
                <ThumbUpIcon />
              </UltraIcon>
              <div className="grid gap-2">
                <p className="font-display text-base font-bold text-[var(--foreground)]">
                  Upvote on Product Hunt
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Upvotes help designers and photographers find it.
                </p>
                <span
                  className="mt-1 inline-flex w-fit items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm font-medium text-[var(--muted)] cursor-default select-none"
                  aria-label="Product Hunt link coming soon"
                >
                  View on Product Hunt →
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
