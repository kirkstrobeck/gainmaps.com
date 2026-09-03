import { SeamCompareLogo } from "@/components/seam-compare-logo";
import { SeamComparePhoto } from "@/components/seam-compare";
import { COMPANIES, type Company } from "@/lib/logos/companies";
import type { Photo } from "@/lib/photos/catalog";

type Props = {
  logoStrip: readonly Company[];
  photoPeek: readonly Photo[];
};

export function ImageProofSection({ logoStrip, photoPeek }: Props) {
  const cocaCola = COMPANIES.find((c) => c.slug === "coca-cola")!;
  const nvidia = COMPANIES.find((c) => c.slug === "nvidia")!;

  return (
    <section className="reveal border-t border-[var(--border)] pt-12">
      <h2 className="font-display text-2xl font-bold">
        The same file, two renderers
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
        Standard clamps highlights to SDR white. Ultra unlocks the gain map layer, the same bytes parsed differently by the display pipeline.
      </p>

      <div className="mt-8 space-y-8">
        <figure>
          <SeamCompareLogo company={cocaCola} width="100%" className="aspect-square max-w-sm" />
          <figcaption className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Standard clamps to SDR reference white; Ultra keeps display headroom.{" "}
            <a href="/logos" className="text-[var(--accent)] underline underline-offset-2 transition hover:opacity-75">
              Browse all logos
            </a>
            .
          </figcaption>
        </figure>
        <figure>
          <SeamCompareLogo company={nvidia} width="100%" className="aspect-square max-w-sm" />
        </figure>
      </div>

      {/* Logo strip */}
      <div className="mt-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
          {COMPANIES.length} brand logos
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {logoStrip.map((company) => (
            <a
              key={company.slug}
              href={`/logos/${company.slug}`}
              aria-label={company.name}
              className="checkerboard flex aspect-square w-14 items-center justify-center overflow-hidden rounded-[var(--radius)] border border-[var(--border)] p-[4px] transition hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
            <SeamComparePhoto
              key={p.id}
              photo={p}
              width="100%"
              className="aspect-video flex-1 min-w-0"
            />
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
