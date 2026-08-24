import { LightningFilled, ThumbUpFilled } from "@mingcute/react/core-filled";
import Image from "next/image";

import { BrewCopy } from "@/components/brew-copy";
import { UltraDisplayCheck } from "@/components/ultra-display-check";
import { ImageComparePair } from "@/components/compare-pair";
import { HomeDropZone } from "@/components/home-drop-zone";
import { PhotoCredit, PhotoPair } from "@/components/photo-pair";
import { SiteNav } from "@/components/site-nav";
import { UltraIcon } from "@/components/ultra-icon";
import { UltraWord } from "@/components/ultra-word";
import { BRAND_NAMES } from "@/lib/brand-names";
import { COMPANIES } from "@/lib/logos/companies";
import { PHOTOS, photoBySlug, photoGainmapSrc, photoStandardSrc } from "@/lib/photos/catalog";
import { TEXT_ULTRA_INTENSITY } from "@/lib/text-ultra";

const ULTRA_TYPE = "font-display text-5xl font-bold sm:text-6xl lg:text-7xl";
const TEXT_COMPARE_TYPE = "font-display text-4xl font-bold sm:text-5xl";

const LOGO_STRIP = COMPANIES.slice(0, 8);
const PHOTO_PEEK = PHOTOS.slice(1, 4);

export default function Base() {
  const backdropPhoto =
    photoBySlug("a-silhouette-stands-before-a-cloudy-sunset") ?? PHOTOS[0];
  const comparePhoto =
    photoBySlug("zebras-in-a-golden-sunlit-grassy-field") ?? PHOTOS[0];

  return (
    <main>
      <SiteNav />
      <UltraDisplayCheck />

      {/* Full-bleed hero wrapper */}
      <div className="relative">
        {/* Atmospheric photo plane — dual layer: SDR fallback + Ultra gainmap */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {/* SDR fallback — always rendered */}
          <Image
            src={photoStandardSrc(backdropPhoto, 1920)}
            alt=""
            fill
            sizes="100vw"
            priority
            quality={75}
            className="object-cover object-center opacity-40"
          />
          {/* Gainmap layer — passes gain map bytes through (no Next.js optimizer).
              Fades out when Ultra is off via .hero-ultra-layer in globals.css. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoGainmapSrc(backdropPhoto)}
            alt=""
            className="gainmap-image hero-ultra-layer absolute inset-0 size-full object-cover object-center opacity-40"
          />
          {/* Directional scrim — var(--background) is mode-aware; extra coverage for mobile */}
          <div className="hero-scrim absolute inset-0" />
        </div>

        <section className="hero-stage relative mx-auto flex min-h-[calc(100dvh-7rem)] max-w-4xl flex-col items-center justify-center gap-6 px-4 py-8 text-center sm:px-6 lg:px-8">
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span className="site-mark flex size-11 items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] text-[var(--accent-foreground)] transition">
              <UltraIcon size={22}>
                <LightningFilled />
              </UltraIcon>
            </span>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
              Brighter than white
            </p>
          </div>

          {/* Headline */}
          <div className="flex flex-wrap items-baseline justify-center gap-x-2">
            <UltraWord word="Gain" typeClassName={ULTRA_TYPE} intensity={TEXT_ULTRA_INTENSITY} />
            <UltraWord word="maps" typeClassName={ULTRA_TYPE} intensity={TEXT_ULTRA_INTENSITY} />
          </div>

          {/* Tagline */}
          <p className="max-w-md text-base leading-7 text-[var(--muted)] sm:text-lg">
            One file. Two renderers. Standard clips highlights. Ultra unlocks them.
          </p>

          {/* Side-by-side proofs */}
          <div className="grid w-full max-w-3xl items-start gap-8 sm:grid-cols-2">
            <div className="grid justify-items-center gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">Text</p>
              <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">Standard</p>
                  <p className={`${TEXT_COMPARE_TYPE} text-[var(--foreground)]`}>Ultra</p>
                </div>
                <div className="grid gap-2">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">Ultra</p>
                  <UltraWord word="Ultra" typeClassName={TEXT_COMPARE_TYPE} intensity={TEXT_ULTRA_INTENSITY} />
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col items-center gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">Photo</p>
              <PhotoPair photo={comparePhoto} size="card" priority />
              <PhotoCredit photo={comparePhoto} />
            </div>
          </div>
        </section>
      </div>

      {/* ── Try it — conversion CTA ── */}
      <div className="border-b border-[var(--border)] bg-[var(--panel)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold">Try it</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
            Drop a photo. Get a gain map image. Everything runs in your browser.
          </p>
          <div className="mt-6 max-w-md">
            <HomeDropZone />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-20 px-4 pb-24 pt-6 sm:px-6 lg:px-8">

        {/* ── Image proof ── */}
        <section className="reveal border-t border-[var(--border)] pt-12">
          <h2 className="font-display text-2xl font-bold">
            The same file, two renderers
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Standard clamps highlights to SDR white. Ultra unlocks the gain map layer, the same bytes parsed differently by the display pipeline.
          </p>

          <div className="mt-8 space-y-8">
            <ImageComparePair
              src="/logos/coca-cola/logo-gainmap.jpg"
              alt="Coca-Cola logo gain map image"
              caption={
                <>
                  Standard clamps to SDR reference white; Ultra keeps display headroom.{" "}
                  <a
                    href="/logos"
                    className="text-[var(--accent)] underline underline-offset-2 transition hover:opacity-75"
                  >
                    Browse all logos
                  </a>
                  .
                </>
              }
            />
            <ImageComparePair
              src="/logos/nvidia/logo-gainmap.jpg"
              alt="NVIDIA logo gain map JPEG"
            />
          </div>

          {/* Logo strip */}
          <div className="mt-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
              100 brand logos
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {LOGO_STRIP.map((company) => (
                <a
                  key={company.slug}
                  href={`/logos/${company.slug}`}
                  title={company.name}
                  className="checkerboard flex h-11 w-14 items-center justify-center overflow-hidden rounded-[var(--radius)] border border-[var(--border)] p-2 transition hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={company.svgPath}
                    alt={company.name}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              ))}
              <a
                href="/logos"
                className="ml-1 text-sm font-medium text-[var(--accent)] transition hover:opacity-75"
              >
                Browse all →
              </a>
            </div>
          </div>

          {/* Photo peek */}
          <div className="mt-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
              100 photographs
            </p>
            <div className="mt-3 flex gap-2 overflow-hidden">
              {PHOTO_PEEK.map((p) => (
                <a
                  key={p.id}
                  href={`/photos/${p.slug}`}
                  className="relative aspect-[3/2] flex-1 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] transition hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))]"
                  title={p.alt}
                >
                  <Image
                    src={photoStandardSrc(p, 400)}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 768px) 33vw, 240px"
                    quality={72}
                    className="object-cover"
                  />
                </a>
              ))}
              <a
                href="/photos"
                className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-[var(--border)] px-4 text-sm font-medium text-[var(--accent)] transition hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] hover:opacity-75 sm:min-w-[6rem]"
              >
                Browse<br />all →
              </a>
            </div>
          </div>
        </section>

        {/* ── HDR primer ── */}
        <section className="reveal border-t border-[var(--border)] pt-12">
          <h2 className="font-display text-2xl font-bold">
            What is a gain map image?
          </h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <div className="grid gap-4 text-sm leading-7 text-[var(--muted)]">
              <p>
                HDR is an expanded brightness range — image highlights can sit above the SDR ceiling. A gain map JPEG encodes a normal SDR image plus a secondary brightness map. Unsupported apps render the SDR layer and ignore the rest.
              </p>
              <p>
                EDR is Apple&apos;s term for <em>displaying</em> brightness above SDR reference white. HDR describes the image content. They are not the same word and are often misused interchangeably.
              </p>
              <p>
                The cross-platform technical name is <strong className="text-[var(--foreground)]">HDR gain map image</strong>. Consumer brands include Adaptive HDR (Apple) and Ultra HDR (Android/Google). This site encodes those files locally in the browser — no upload, no server.
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
                Ultra paints past SDR reference white. On an HDR display — Apple XDR, Android Ultra HDR, or Windows Advanced Color — the effect is visible. On an SDR monitor it renders as ordinary white. That is expected, not a bug.
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
        </section>

        {/* ── CLI ── */}
        <section className="reveal border-t border-[var(--border)] pt-12">
          <h2 className="font-display text-2xl font-bold">From the terminal</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Batch-encode gain map JPEGs without a browser.
          </p>
          <div className="mt-5 max-w-md">
            <BrewCopy />
          </div>
        </section>

        {/* ── Product Hunt ── */}
        <section className="reveal border-t border-[var(--border)] pt-12">
          <div className="flex items-start gap-4">
            <UltraIcon size={28}>
              <ThumbUpFilled />
            </UltraIcon>
            <div className="grid gap-2">
              <p className="font-display text-base font-bold text-[var(--foreground)]">
                Upvote on Product Hunt
              </p>
              <p className="text-sm text-[var(--muted)]">
                Upvotes help designers and photographers find it.
              </p>
              <a
                href="https://www.producthunt.com/posts/PLACEHOLDER"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex w-fit items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] hover:text-[var(--accent)]"
              >
                View on Product Hunt →
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
