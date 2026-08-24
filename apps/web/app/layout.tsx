import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { cookies, headers } from "next/headers";

import "./globals.css";
import { SiteAppearanceProvider } from "@/components/site-appearance-provider";
import { parseSiteMode, parseSiteUltra } from "@/lib/site-appearance";
import { TEXT_ULTRA_SLIDER_DEFAULT } from "@/lib/text-ultra";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.gainmaps.com"),
  title: "Gainmaps",
  description:
    "Batch process photos in the browser into gain map images. Local, private, no upload.",
};

function clampIntensity(raw: string | undefined): number {
  const n = Number(raw ?? TEXT_ULTRA_SLIDER_DEFAULT);
  if (!Number.isFinite(n)) return TEXT_ULTRA_SLIDER_DEFAULT;
  return Math.min(100, Math.max(0, Math.round(n)));
}

const ultraBootScript = `(function(){
  var cookie=function(n){var m=document.cookie.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));return m?decodeURIComponent(m[1]):""};
  var ultra=cookie("site-ultra")==="off"?"off":"on";
  var mode=cookie("site-mode")==="light"?"light":"dark";
  document.documentElement.dataset.ultra=ultra;
  document.documentElement.dataset.mode=mode;
})();`;

export default async function Base({ children }: Readonly<{ children: React.ReactNode }>) {
  const jar = await cookies();
  const headerStore = await headers();
  const mode = parseSiteMode(headerStore.get("x-site-mode") ?? jar.get("site-mode")?.value);
  const ultra = parseSiteUltra(headerStore.get("x-site-ultra") ?? jar.get("site-ultra")?.value);
  const intensity = clampIntensity(
    headerStore.get("x-site-intensity") ?? jar.get("site-intensity")?.value,
  );

  return (
    <html
      lang="en"
      data-ultra={ultra}
      data-mode={mode}
      data-intensity={intensity}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ultraBootScript }} />
      </head>
      <body className={`${syne.variable} ${dmSans.variable}`}>
        <SiteAppearanceProvider initial={{ mode, ultra }}>{children}</SiteAppearanceProvider>
        <footer className="border-t border-[var(--border)] py-4 text-center">
          <a
            href="https://www.linkedin.com/in/kirkstrobeck"
            className="text-xs text-[var(--foreground-muted,var(--foreground))] opacity-60 transition hover:opacity-100 hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Made by Kirk Strobeck
          </a>
        </footer>
      </body>
    </html>
  );
}
