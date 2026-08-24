import type { Metadata } from "next";

import { LogoPair } from "@/components/logo-pair";
import { PageChrome } from "@/components/page-chrome";
import { COMPANIES } from "@/lib/logos/companies";

export const metadata: Metadata = {
  title: "Logos · Gainmaps",
  description:
    "Brand logos side by side: the standard SVG next to the same mark encoded as a gain map.",
};

export default function Base() {
  return (
    <main>
      <PageChrome />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <header className="border-b border-[var(--border)] pb-10">
          <h1 className="font-display text-5xl font-bold leading-[1.03] tracking-normal sm:text-6xl">
            Logos
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            {COMPANIES.length} brand logos. Standard SVG beside the same mark encoded as an{" "}
            <strong className="font-medium text-[var(--foreground)]">Ultra</strong> HDR gain map.
            Brand colors reach past SDR white on HDR displays.
          </p>
        </header>

        <ul className="mt-10 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANIES.map((company) => (
            <li key={company.slug}>
              <a
                href={`/logos/${company.slug}`}
                className="group grid gap-3 rounded-[var(--radius)] border border-[var(--border)] p-4 transition hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                <LogoPair company={company} size="card" />
                <div className="flex items-baseline justify-between px-0.5">
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    {company.name}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--muted)]">
                    #{company.rank}
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
