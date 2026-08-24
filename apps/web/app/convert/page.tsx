import type { Metadata } from "next";

import { HdrProcessor } from "@/components/hdr-processor";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: "Convert · Gainmaps",
  description: "Drop photos to encode gain map images. Processed 100% in your browser via a service worker. Nothing uploaded, nothing sent to a server.",
};

export default function Base() {
  return (
    <main className="h-[100dvh] overflow-hidden">
      <SiteNav />
      <HdrProcessor />
    </main>
  );
}
