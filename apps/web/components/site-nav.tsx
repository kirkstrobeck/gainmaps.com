import { IconBolt, IconBrandGithub } from "@tabler/icons-react";

import { UltraModeToggle } from "@/components/ultra-mode-toggle";

export function SiteNav() {
  return (
    <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <a className="flex shrink-0 items-center gap-2 text-sm font-semibold" href="/">
        <span className="site-mark flex size-7 items-center justify-center rounded-[var(--radius)] bg-[var(--foreground)] text-[var(--background)]">
          <IconBolt aria-hidden size={17} stroke={1.8} />
        </span>
        HDR Lab
      </a>
      <div className="flex items-center gap-3 text-sm text-[var(--muted)] sm:gap-5">
        <UltraModeToggle />
        <a className="transition hover:text-[var(--foreground)]" href="/appearance">
          Appearance
        </a>
        <a className="transition hover:text-[var(--foreground)]" href="/docs">
          Docs
        </a>
        <a className="hidden transition hover:text-[var(--foreground)] sm:inline" href="/docs#standards">
          Standards
        </a>
        <a className="transition hover:text-[var(--foreground)]" href="https://github.com" aria-label="GitHub">
          <IconBrandGithub aria-hidden size={17} stroke={1.7} />
        </a>
      </div>
    </nav>
  );
}
