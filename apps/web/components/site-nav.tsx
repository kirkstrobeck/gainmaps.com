"use client";

import {
  StarsIcon as AwardFilled,
  ForumIcon as CommentFilled,
  DescriptionIcon as FileFilled,
  GitHubIcon as GithubFilled,
  BoltIcon as LightningFilled,
  PaletteIcon as PaletteFilled,
  PhotoIcon as PicFilled,
  TextFieldsIcon as TextFilled,
  SwapHorizIcon as TransferFilled,
} from "@/components/icons";
import { usePathname } from "next/navigation";
import { type ComponentType, type SVGProps } from "react";

import { SiteAppearanceToggle } from "@/components/site-appearance-toggle";
import { useSiteAppearance } from "@/components/site-appearance-provider";
import { UltraIcon } from "@/components/ultra-icon";
import { cn } from "@/lib/utils";
import { appearanceHref } from "@/lib/site-appearance";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

const LINKS: readonly {
  href: string;
  label: string;
  Icon: Icon;
  /** Display class for the <a> element */
  linkCls: string;
  /** Display class for the text <span> — icon-only on narrow viewports */
  textCls: string;
}[] = [
  { href: "/convert",    label: "Convert",    Icon: TransferFilled, linkCls: "inline-flex",        textCls: "hidden sm:inline" },
  { href: "/logos",      label: "Logos",      Icon: AwardFilled,    linkCls: "hidden sm:inline-flex", textCls: "inline" },
  { href: "/photos",     label: "Photos",     Icon: PicFilled,      linkCls: "hidden sm:inline-flex", textCls: "inline" },
  { href: "/text",       label: "Text",       Icon: TextFilled,     linkCls: "hidden md:inline-flex", textCls: "inline" },
  { href: "/appearance", label: "Appearance", Icon: PaletteFilled,  linkCls: "hidden md:inline-flex", textCls: "inline" },
  { href: "/docs",       label: "Docs",       Icon: FileFilled,     linkCls: "inline-flex",        textCls: "hidden sm:inline" },
  { href: "/community",  label: "Community",  Icon: CommentFilled,  linkCls: "hidden sm:inline-flex", textCls: "inline" },
];

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";
const HOVER_BG   = "hover:bg-[color-mix(in_srgb,var(--accent)_7%,transparent)]";

export function SiteNav() {
  const appearance = useSiteAppearance();
  const pathname   = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-md">
      <nav className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand mark + wordmark */}
        <a
          className={cn(
            "font-display flex shrink-0 items-center gap-2.5 rounded-[var(--radius)] text-sm font-bold transition-opacity hover:opacity-80",
            FOCUS_RING,
          )}
          href={appearanceHref("/", appearance)}
        >
          <span className="site-mark flex size-7 items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] text-[var(--accent-foreground)] transition">
            <UltraIcon size={17}>
              <LightningFilled />
            </UltraIcon>
          </span>
          <span>Gainmaps</span>
        </a>

        {/* Links + controls */}
        <div className="flex min-w-0 items-center justify-end gap-0.5 text-sm text-[var(--muted)] sm:gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <a
                key={link.href}
                href={appearanceHref(link.href, appearance)}
                aria-current={active ? "page" : undefined}
                aria-label={link.label}
                className={cn(
                  link.linkCls,
                  "items-center gap-1.5 rounded-[var(--radius)] px-2 py-1.5 font-medium transition",
                  FOCUS_RING,
                  active
                    ? "text-[var(--accent)]"
                    : cn("hover:text-[var(--accent)]", HOVER_BG),
                )}
              >
                <UltraIcon size={15}>
                  <link.Icon />
                </UltraIcon>
                <span className={link.textCls} aria-hidden>{link.label}</span>
              </a>
            );
          })}

          <a
            className={cn(
              "inline-flex items-center rounded-[var(--radius)] p-1.5 transition hover:text-[var(--accent)]",
              HOVER_BG,
              FOCUS_RING,
            )}
            href="https://github.com/kirkstrobeck/gainmaps.com"
            aria-label="GitHub"
            target="_blank"
            rel="noopener noreferrer"
          >
            <UltraIcon size={17}>
              <GithubFilled />
            </UltraIcon>
          </a>

          <div className="ml-1 sm:ml-2">
            <SiteAppearanceToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}
