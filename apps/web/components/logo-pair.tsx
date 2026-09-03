import { logoGainmapSrcset, type Company } from "@/lib/logos/companies";

type LogoPairSize = "card" | "detail";

const TILE_PAD: Record<LogoPairSize, string> = {
  card: "p-[4px]",
  detail: "p-[4px]",
};

const LOGO_SIZES: Record<LogoPairSize, string> = {
  card: "(max-width: 640px) 128px, 256px",
  detail: "(max-width: 640px) 256px, 512px",
};

/**
 * Both tiles stand on the same checkerboard, so what you see through a mark's
 * holes is unmistakably nothing rather than a colour someone chose.
 *
 * Standard SVG is transparent — the checkerboard shows through.
 * Ultra gain map JPEG carries a baked checkerboard matte from encode, so the
 * transparent areas are already correct in the file. No CSS mask is applied;
 * a mask-image on the JPEG kills HDR compositing by flattening the gain map
 * layer before the display pipeline sees it.
 *
 * Plain <img>, not next/image — the optimizer re-encodes JPEGs and would strip
 * the gain map that makes the right-hand tile worth showing.
 */
export function LogoPair({ company, size }: { company: Company; size: LogoPairSize }) {
  return (
    <div className="flex w-full items-start justify-center gap-3 sm:gap-4">
      <LogoTile
        src={company.svgPath}
        alt={`${company.name} logo`}
        label="Standard"
        size={size}
      />
      <LogoTile
        src={company.gainmapPath}
        srcSet={logoGainmapSrcset(company)}
        alt={`${company.name} logo as a gain map image`}
        label="Ultra"
        size={size}
        gainmap
      />
    </div>
  );
}

function LogoTile({
  src,
  srcSet,
  alt,
  label,
  size,
  gainmap = false,
}: {
  src: string;
  srcSet?: string;
  alt: string;
  label: string;
  size: LogoPairSize;
  /** Marks the gain map JPEG so it keeps display headroom no ancestor can clamp. */
  gainmap?: boolean;
}) {
  return (
    <figure className="m-0 grid flex-1 gap-2">
      <div
        className={`checkerboard grid aspect-video w-full place-items-center overflow-hidden rounded-[var(--radius)] ${TILE_PAD[size]}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          srcSet={srcSet}
          sizes={gainmap ? LOGO_SIZES[size] : undefined}
          width={gainmap ? 512 : undefined}
          height={gainmap ? 288 : undefined}
          alt={alt}
          className={`size-full object-contain${gainmap ? " gainmap-image" : ""}`}
          loading="lazy"
          decoding="async"
        />
      </div>
      <figcaption className="text-center text-xs font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
        {label}
      </figcaption>
    </figure>
  );
}
