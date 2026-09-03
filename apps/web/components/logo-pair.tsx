import { SeamCompareLogo } from "@/components/seam-compare-logo";
import { type Company } from "@/lib/logos/companies";

export function LogoPair({ company, size }: { company: Company; size: "card" | "detail" }) {
  return (
    <figure className="m-0 grid gap-2">
      <SeamCompareLogo
        company={company}
        width="100%"
        className="aspect-square"
        sizes={size === "card" ? "(max-width: 640px) 128px, 256px" : "(max-width: 640px) 256px, 512px"}
      />
      <figcaption className="flex justify-between text-xs font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
        <span>SDR JPEG</span>
        <span>ULTRA HDR JPEG</span>
      </figcaption>
    </figure>
  );
}
