import { GallerySeamController, GallerySeamLogo } from "@/components/gallery-seam";
import type { Company } from "@/lib/logos/companies";

export function LogosGrid({ companies }: { companies: readonly Company[] }) {
  return (
    <ul className="mt-10 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {companies.map((company, index) => (
        <li key={company.slug} className="grid gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] p-4 transition hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))]">
          <GallerySeamLogo company={company} priority={index < 3} />
          <div className="flex items-baseline justify-between px-0.5">
            <a
              href={`/logos/${company.slug}`}
              className="text-xs font-semibold text-[var(--foreground)] transition hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {company.name}
            </a>
            <span className="font-mono text-[10px] text-[var(--muted)]">
              #{company.rank}
            </span>
          </div>
        </li>
      ))}
      <GallerySeamController />
    </ul>
  );
}
