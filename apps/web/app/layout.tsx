import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ultra",
  description:
    "Batch process photos in the browser into Ultra JPEGs. Local, private, no upload.",
};

/*
  Keys must stay in sync with ULTRA_MODE_STORAGE_KEYS in lib/ultra-mode.ts —
  newest first, older ones kept so a returning visitor keeps their Off choice.
*/
const ultraBootScript = `(function(){var keys=["ultra-mode","hdr-lab-ultra-mode","hdr-lab-gainmap-mode"];var v=null;try{for(var i=0;i<keys.length&&v!=="on"&&v!=="off";i++){v=localStorage.getItem(keys[i]);}}catch(e){}document.documentElement.dataset.ultra=(v==="on"||v==="off")?v:"on";})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-ultra="on" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ultraBootScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <a
          href="https://www.linkedin.com/in/kirkstrobeck"
          className="fixed bottom-2 right-2 z-50 rounded-[var(--radius)] border border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_12%,var(--panel))] px-2 py-1 text-[11px] font-medium text-[var(--foreground)] shadow-sm transition hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_18%,var(--panel))]"
        >
          Made by Kirk Strobeck
        </a>
      </body>
    </html>
  );
}
