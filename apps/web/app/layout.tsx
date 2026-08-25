import type { Metadata } from "next";
import { Archivo, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { SiteAppearanceProvider } from "@/components/site-appearance-provider";
import { DEFAULT_SITE_MODE, DEFAULT_SITE_ULTRA } from "@/lib/site-appearance";
import { TEXT_ULTRA_SLIDER_DEFAULT } from "@/lib/text-ultra";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.gainmaps.com"),
  title: "Gainmaps",
  description:
    "Batch process photos in the browser into gain map images. Local, private, no upload.",
  icons: {
    // Minimal inline favicon to avoid the browser's automatic /favicon.ico 404 request.
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><rect width='16' height='16' rx='3' fill='%23c4723a'/><text x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-size='11' font-family='system-ui' fill='white'>G</text></svg>",
  },
};

const ultraBootScript = `(function(){
  var cookie=function(n){var m=document.cookie.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));return m?decodeURIComponent(m[1]):""};
  var ultra=cookie("site-ultra")==="off"?"off":"on";
  var mode=cookie("site-mode")==="light"?"light":"dark";
  document.documentElement.dataset.ultra=ultra;
  document.documentElement.dataset.mode=mode;
})();`;

export default function Base({ children }: Readonly<{ children: React.ReactNode }>) {
  // Always render SSR shell with defaults. ultraBootScript (in <head>) reads cookies
  // synchronously before CSS paint and corrects data-mode/data-ultra/data-intensity.
  // suppressHydrationWarning keeps the script-corrected DOM values during hydration.
  // Avoids calling headers()/cookies() so Next.js can serve this page without no-store.
  const mode = DEFAULT_SITE_MODE;
  const ultra = DEFAULT_SITE_ULTRA;
  const intensity = TEXT_ULTRA_SLIDER_DEFAULT;

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
      <body className={`${archivo.variable} ${bricolageGrotesque.variable} ${jetbrainsMono.variable}`}>
        <SiteAppearanceProvider initial={{ mode, ultra }}>
          {children}
        </SiteAppearanceProvider>
        <footer className="border-t border-[var(--border)] py-4 text-center">
          <a
            href="https://www.linkedin.com/in/kirkstrobeck"
            className="text-xs text-[var(--muted)] transition hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Made by Kirk Strobeck
          </a>
        </footer>
      </body>
    </html>
  );
}
