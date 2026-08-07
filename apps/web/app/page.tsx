import { HdrProcessor } from "@/components/hdr-processor";
import { SiteNav } from "@/components/site-nav";

export default function Page() {
  return (
    <main className="h-[100dvh] overflow-hidden">
      <SiteNav />
      <HdrProcessor />
    </main>
  );
}
