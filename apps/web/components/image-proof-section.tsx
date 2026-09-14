import Link from "next/link";
import { SeamCompareLogo } from "@/components/seam-compare-logo";
import { SeamComparePhoto } from "@/components/seam-compare";
import { COMPANIES, type Company } from "@/lib/logos/companies";
import { PHOTOS, type Photo } from "@/lib/photos/catalog";

type Props = {
  logos: readonly Company[];
  photos: readonly Photo[];
};

export function ImageProofSection({ logos, photos }: Props) {
  return (
    <section className="border-t border-[var(--border)] pt-12 space-y-16">

      {/* Brand logos */}
      <div>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold">
            {COMPANIES.length} brand logos
          </h2>
          <Link
            href="/logos"
            className="text-sm font-medium text-[var(--accent)] transition hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Browse all {COMPANIES.length} logos →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {logos.map((company) => (
            <SeamCompareLogo
              key={company.slug}
              company={company}
              width="100%"
              className="aspect-square"
              sizes="(max-width: 640px) 100vw, 33vw"
              lazy
              defer
            />
          ))}
        </div>
      </div>

      {/* Photographs */}
      <div>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold">
            {PHOTOS.length} photographs
          </h2>
          <Link
            href="/photos"
            className="text-sm font-medium text-[var(--accent)] transition hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Browse all {PHOTOS.length} photos →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {photos.map((p) => (
            <figure key={p.id} className="m-0 grid gap-2">
              <SeamComparePhoto
                photo={p}
                width="100%"
                className="aspect-video"
                sizes="(min-width: 640px) 33vw, 100vw"
                deferStandard
                deferUltra
                lazy
              />
              <figcaption className="truncate text-xs text-[var(--muted)]">
                <a
                  href={`/photos/${p.slug}`}
                  className="transition hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  {p.alt}
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
