import Image from "next/image";

import {
  photoGainmapSrc,
  photoGainmapSrcset,
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
 * Ultra uses a raw <img> to preserve the gain map payload (ISO 21496-1 /
 * Ultra HDR). The Next.js image optimizer re-encodes JPEGs and strips the
 * secondary gain map image.
 */
export function PhotoPair({ photo, size, priority = false }: { photo: Photo; size: PhotoPairSize; priority?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <PhotoTile
        src={photoStandardSrc(photo)}
        alt={`${photo.alt}, Standard`}
        label="Standard"
        size={size}
        optimized
        priority={priority}
      />
      <PhotoTile
        src={photoGainmapSrc(photo)}
        srcSet={photoGainmapSrcset(photo)}
        imgWidth={photo.width}
        imgHeight={photo.height}
        alt={`${photo.alt}, Ultra`}
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
  srcSet,
  imgWidth,
  imgHeight,
  alt,
  label,
  size,
  optimized,
  priority,
}: {
  src: string;
  srcSet?: string;
  imgWidth?: number;
  imgHeight?: number;
  alt: string;
  label: string;
  size: PhotoPairSize;
  optimized: boolean;
  priority?: boolean;
}) {
  return (
    <figure className="m-0 grid gap-0">
      <div
        className={`relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] ${FRAME[size]}`}
      >
        <PhotoImage src={src} srcSet={srcSet} imgWidth={imgWidth} imgHeight={imgHeight} alt={alt} size={size} optimized={optimized} priority={priority} />
      </div>
      {/* Always-visible label — accessible at both card and detail sizes */}
      <figcaption className="mt-1.5 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </figcaption>
    </figure>
  );
}

function PhotoImage({
  src,
  srcSet,
  imgWidth,
  imgHeight,
  alt,
  size,
  optimized,
  priority,
}: {
  src: string;
  srcSet?: string;
  imgWidth?: number;
  imgHeight?: number;
  alt: string;
  size: PhotoPairSize;
  optimized: boolean;
  priority?: boolean;
}) {
  if (!optimized) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        srcSet={srcSet}
        sizes={TILE_SIZES[size]}
        width={imgWidth}
        height={imgHeight}
        alt={alt}
        className="gainmap-image absolute inset-0 size-full object-cover"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
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
      quality={75}
      priority={priority}
      className="object-cover"
    />
  );
}
