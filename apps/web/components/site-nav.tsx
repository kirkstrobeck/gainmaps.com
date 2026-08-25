"use client";

import {
  GitHubIcon,
  SwapHorizIcon as ConvertIcon,
  PhotoIcon as GalleryIcon,
  DescriptionIcon as DocsIcon,
} from "@/components/icons";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, useState } from "react";

import { NavPill } from "@/components/nav-pill";
import { UltraIcon } from "@/components/ultra-icon";
import { cn } from "@/lib/utils";
import {
  readSiteMode,
  readSiteUltra,
  readSiteIntensity,
  subscribeSiteAppearance,
  writeSiteAppearance,
  type SiteMode,
  type SiteUltra,
} from "@/lib/site-appearance";

const LINKS = [
  { href: "/convert", label: "Convert", Icon: ConvertIcon },
  { href: "/photos",  label: "Gallery",  Icon: GalleryIcon },
  { href: "/docs",    label: "Docs",    Icon: DocsIcon },
] as const;

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function useSiteMode(): SiteMode {
  return useSyncExternalStore(subscribeSiteAppearance, readSiteMode, () => "dark");
}
function useSiteUltra(): SiteUltra {
  return useSyncExternalStore(subscribeSiteAppearance, readSiteUltra, () => "on");
}

export function SiteNav() {
  const pathname = usePathname();
  const mode = useSiteMode();
  const ultra = useSiteUltra();
  const [menuOpen, setMenuOpen] = useState(false);

  function commit(next: { mode?: SiteMode; ultra?: SiteUltra }) {
    writeSiteAppearance({
      mode:      next.mode  ?? mode,
      ultra:     next.ultra ?? ultra,
      intensity: readSiteIntensity(),
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-md">
      <nav className="mx-auto flex min-h-[52px] max-w-none items-center justify-between gap-4 px-4 sm:px-8 lg:min-h-[60px] lg:px-16">

        {/* Wordmark */}
        <a
          href="/"
          className={cn("shrink-0 font-display text-[17px] font-[600] [font-variation-settings:'wdth'_100] tracking-[-0.01em] text-[var(--foreground)] transition hover:opacity-80", FOCUS)}
        >
          Gainmaps<span className="text-[var(--accent)]">.</span>
        </a>

        {/* Desktop links + controls — DARK/LIGHT comes FIRST */}
        <div className="hidden items-center gap-6 lg:flex">
          {LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <a
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-sm font-medium transition",
                  FOCUS,
                  active ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                {label}
              </a>
            );
          })}

          <div className="ml-2 h-4 w-px bg-[var(--border)]" aria-hidden />

          <NavPill
            label="Color mode"
            leftLabel="DARK" rightLabel="LIGHT"
            leftActive={mode === "dark"}
            onToggle={() => commit({ mode: mode === "dark" ? "light" : "dark" })}
          />
          <NavPill
            label="Ultra display"
            leftLabel="SDR" rightLabel="ULTRA"
            leftActive={ultra === "off"}
            onToggle={() => commit({ ultra: ultra === "off" ? "on" : "off" })}
          />

          <a
            href="https://github.com/kirkstrobeck/gainmaps.com"
            aria-label="GitHub"
            target="_blank"
            rel="noopener noreferrer"
            className={cn("text-[var(--muted)] transition hover:text-[var(--foreground)]", FOCUS)}
          >
            <UltraIcon size={18}><GitHubIcon /></UltraIcon>
          </a>
        </div>

        {/* Mobile: ULTRA pill + menu button */}
        <div className="flex items-center gap-3 lg:hidden">
          <NavPill
            label="Ultra display"
            leftLabel="SDR" rightLabel="ULTRA"
            leftActive={ultra === "off"}
            onToggle={() => commit({ ultra: ultra === "off" ? "on" : "off" })}
          />
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className={cn("p-1.5 text-[var(--muted)] transition hover:text-[var(--foreground)]", FOCUS)}
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden>
              <line x1="0" y1="2" x2="20" y2="2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="0" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--panel)] px-4 py-3 lg:hidden">
          {LINKS.map(({ href, label, Icon }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] hover:text-[var(--accent)]",
                pathname === href ? "text-[var(--accent)]" : "text-[var(--muted)]",
              )}
            >
              <UltraIcon size={16}><Icon /></UltraIcon>
              {label}
            </a>
          ))}
          <div className="mt-2 flex items-center gap-2 border-t border-[var(--border)] pt-2">
            <NavPill
              label="Color mode"
              leftLabel="DARK" rightLabel="LIGHT"
              leftActive={mode === "dark"}
              onToggle={() => commit({ mode: mode === "dark" ? "light" : "dark" })}
            />
          </div>
        </div>
      )}
    </header>
  );
}
