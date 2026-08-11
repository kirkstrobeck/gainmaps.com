// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppearanceProvider } from "@/components/appearance-provider";
import { APPEARANCE_BOOT_SCRIPT } from "@/lib/appearance-boot";

import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://ultradarkmode.com"),
  title: "Ultra Dark Mode",
  description:
    "Dark mode with the lights on. Ultra unlocks the display headroom your screen already has.",
};

/*
  The attributes rendered here are the defaults; the boot script in <head>
  replaces them with the visitor's stored choice before the first paint.
  suppressHydrationWarning is required because of exactly that — React's markup
  and the live DOM will disagree for anyone who is not on the defaults.
*/
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-mode="dark" data-ultra="off" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  );
}
