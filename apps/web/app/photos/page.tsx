import type { Metadata } from "next";
import { preload } from "react-dom";
import { UltraWord } from "@/components/ultra-word";
import { TEXT_ULTRA_INTENSITY } from "@/lib/text-ultra";

import { PageChrome } from "@/components/page-chrome";
import { PhotoCredit } from "@/components/photo-pair";
import { GallerySeamController, GallerySeamPhoto } from "@/components/gallery-seam";
import {
  PHOTOS,
  PHOTO_GALLERY_SIZES,
  PHOTO_STORAGE_BASE_URL,
  photoGainmapSrc,
  photoGainmapSrcset,
  photoStandardSrc,
  photoStandardSrcset,
  type Photo,
} from "@/lib/photos/catalog";

export const metadata: Metadata = {
  title: "Photos · Gainmaps",
  description: `${PHOTOS.length} Unsplash photographs, Standard SDR next to the same frame encoded as an Ultra HDR gain map.`,
  alternates: { canonical: "/photos" },
  openGraph: { type: "website", url: "/photos" },
};

// Preload above-fold photos: first 3 (one desktop row) for each format.
const PRIORITY_COUNT = 1;

export default function Base() {
  /* v8 ignore next */
  for (const photo of PHOTOS.slice(0, PRIORITY_COUNT)) {
    preload(photoStandardSrc(photo), {
      as: "image",
      fetchPriority: "high",
      imageSrcSet: photoStandardSrcset(photo),
      imageSizes: PHOTO_GALLERY_SIZES,
    });
    preload(photoGainmapSrc(photo), {
      as: "image",
      fetchPriority: "high",
      imageSrcSet: photoGainmapSrcset(photo),
      imageSizes: PHOTO_GALLERY_SIZES,
    });
  }

  return (
    <main>
      <PageChrome />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <header className="border-b border-[var(--border)] pb-10">
          <h1 className="font-display text-5xl font-bold leading-[1.03] tracking-normal sm:text-6xl">
            <UltraWord text="Photos" typeClassName="font-display text-5xl font-bold leading-[1.03] tracking-normal sm:text-6xl" intensity={TEXT_ULTRA_INTENSITY} />
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            {PHOTOS.length} Unsplash photographs. Standard SDR beside the same frame encoded as an{" "}
            <strong className="font-medium text-[var(--foreground)]">Ultra</strong> HDR gain map.
          </p>
        </header>

        <ul className="mt-10 grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {PHOTOS.map((photo, index) => (
            <li key={photo.id} className="photo-card">
              <PhotoCard photo={photo} priority={index < PRIORITY_COUNT ? true : undefined} />
            </li>
          ))}
        </ul>
        <GallerySeamController photoStorageBase={PHOTO_STORAGE_BASE_URL} />
      </div>
    </main>
  );
}

function PhotoCard({
  photo,
  priority,
}: {
  photo: Photo;
  priority?: boolean;
}) {
  return (
    <article className="grid gap-3">
      <GallerySeamPhoto photo={photo} priority={Boolean(priority)} sizes={PHOTO_GALLERY_SIZES} />
      <div className="flex items-center justify-between gap-2">
        <PhotoCredit photo={photo} />
        <a
          href={`/photos/${photo.slug}`}
          className="shrink-0 text-xs font-medium text-[var(--accent)] transition hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          aria-label={`View ${photo.alt}`}
        >
          View →
        </a>
      </div>
    </article>
  );
}
