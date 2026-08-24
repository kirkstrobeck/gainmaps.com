import Image from "next/image";

import { ImageComparePair } from "@/components/compare-pair";
import type { Company } from "@/lib/logos/companies";
import type { Photo } from "@/lib/photos/catalog";
import { photoStandardSrc } from "@/lib/photos/catalog";

type Props = {
  logoStrip: readonly Company[];
  photoPeek: readonly Photo[];
};

export function ImageProofSection({ logoStrip, photoPeek }: Props) {
  return (
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
          alt="NVIDIA logo gain map image"
        />
      </div>

      {/* Logo strip */}
      <div className="mt-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
          100 brand logos
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {logoStrip.map((company) => (
            <a
              key={company.slug}
              href={`/logos/${company.slug}`}
              aria-label={company.name}
              className="checkerboard flex h-11 w-14 items-center justify-center overflow-hidden rounded-[var(--radius)] border border-[var(--border)] p-2 transition hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={company.svgPath}
                alt=""
                aria-hidden
                width={40}
                height={40}
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            </a>
          ))}
          <a
            href="/logos"
            className="ml-1 text-sm font-medium text-[var(--accent)] transition hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
          {photoPeek.map((p) => (
            <a
              key={p.id}
              href={`/photos/${p.slug}`}
              className="relative aspect-[3/2] flex-1 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] transition hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              aria-label={p.alt}
            >
              <Image
                src={photoStandardSrc(p, 400)}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 768px) 33vw, 240px"
                quality={75}
                className="object-cover"
              />
            </a>
          ))}
          <a
            href="/photos"
            aria-label="Browse all photos"
            className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-[var(--border)] px-4 text-sm font-medium text-[var(--accent)] transition hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:min-w-[6rem]"
          >
            Browse<br />all →
          </a>
        </div>
      </div>
    </section>
  );
}
