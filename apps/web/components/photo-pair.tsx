import Image from "next/image";

import {
  photoGainmapSrc,
  photoStandardSrc,
  withUnsplashReferral,
  type Photo,
} from "@/lib/photos/catalog";

type PhotoPairSize = "card" | "detail";

const TILE_SIZES: Record<PhotoPairSize, string> = {
  card: "(max-width: 640px) 50vw, (max-width: 1280px) 30vw, 22vw",
  detail: "(max-width: 640px) 100vw, 50vw",
};

const FRAME: Record<PhotoPairSize, string> = {
  card: "aspect-[4/3]",
  detail: "aspect-[3/2] sm:aspect-[4/3]",
};

/**
 * Standard vs Ultra pair for a catalog photo.
 *
 * Standard goes through next/image against images.unsplash.com — the optimizer
 * may transcode to WebP/AVIF; that is fine for SDR.
 *
 * Ultra MUST set unoptimized={true}. The Next.js image optimizer re-encodes
 * JPEGs and strips the gain map (ISO 21496 / Ultra HDR) that makes the right
 * tile worth showing. unoptimized still uses next/image for layout, lazy
 * loading, and sizes; the local gainmap JPEG bytes pass through unchanged.
 */
export function PhotoPair({ photo, size, priority = false }: { photo: Photo; size: PhotoPairSize; priority?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <PhotoTile
        src={photoStandardSrc(photo)}
        alt={`${photo.alt} — Standard`}
        label="Standard"
        size={size}
        optimized
        priority={priority}
      />
      <PhotoTile
        src={photoGainmapSrc(photo)}
        alt={`${photo.alt} — Ultra`}
        label="Ultra"
        size={size}
        optimized={false}
        priority={priority}
      />
    </div>
  );
}

export function PhotoCredit({ photo }: { photo: Photo }) {
  return (
    <p className="text-xs leading-5 text-[var(--muted)]">
      Photo by{" "}
      <a
        className="text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--accent)]"
        href={withUnsplashReferral(photo.photographerUrl)}
        rel="noreferrer"
        target="_blank"
      >
        {photo.photographer}
      </a>{" "}
      on{" "}
      <a
        className="text-[var(--foreground)] underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--accent)]"
        href={withUnsplashReferral("https://unsplash.com")}
        rel="noreferrer"
        target="_blank"
      >
        Unsplash
      </a>
      {" · "}
      <a
        className="underline decoration-[var(--border)] underline-offset-2 transition hover:text-[var(--accent)]"
        href={withUnsplashReferral(photo.photoUrl)}
        rel="noreferrer"
        target="_blank"
      >
        Original
      </a>
    </p>
  );
}

function PhotoTile({
  src,
  alt,
  label,
  size,
  optimized,
}: {
  src: string;
  alt: string;
  label: string;
  size: PhotoPairSize;
  optimized: boolean;
}) {
  return (
    <figure className="group m-0 grid gap-0">
      <div
        className={`relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] ${FRAME[size]}`}
      >
        <PhotoImage src={src} alt={alt} size={size} optimized={optimized} />
        {/* hover-reveal label */}
        <figcaption
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 translate-y-0.5 bg-gradient-to-t from-[var(--background)]/70 to-transparent px-2.5 pb-2 pt-6 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--foreground)] opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100"
        >
          {label}
        </figcaption>
      </div>
      {/* visible label only on detail size */}
      {size === "detail" && (
        <p className="mt-1.5 text-center text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
          {label}
        </p>
      )}
    </figure>
  );
}

function PhotoImage({
  src,
  alt,
  size,
  optimized,
}: {
  src: string;
  alt: string;
  size: PhotoPairSize;
  optimized: boolean;
}) {
  if (!optimized) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className="gainmap-image absolute inset-0 size-full object-cover"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={TILE_SIZES[size]}
      quality={80}
      className="object-cover"
    />
  );
}
