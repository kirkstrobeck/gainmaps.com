import type { Metadata } from "next";
import { ArrowLeftFilled, ArrowRightFilled } from "@mingcute/react/core-filled";

import { PageChrome } from "@/components/page-chrome";
import { PhotoCredit, PhotoPair } from "@/components/photo-pair";
import { UltraIcon } from "@/components/ultra-icon";
import {
  clampPhotoPage,
  PAGE_SIZE,
  PHOTOS,
  photosForPage,
  photosPageCount,
  type Photo,
} from "@/lib/photos/catalog";

export const metadata: Metadata = {
  title: "Photos · Gainmaps",
  description:
    "One hundred Unsplash photographs, Standard SDR next to the same frame encoded as an Ultra HDR gain map JPEG.",
};

type Search = { page?: string | string[] };

export default async function Base({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const page = pageFromSearch(await searchParams);
  const photos = photosForPage(page);
  const totalPages = photosPageCount();

  return (
    <main>
      <PageChrome />
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <header className="border-b border-[var(--border)] pb-10">
          <h1 className="font-display text-5xl font-bold leading-[1.03] tracking-normal sm:text-6xl">
            Photos
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            {PHOTOS.length} Unsplash photographs — Standard SDR beside the same frame encoded as an{" "}
            <strong className="font-medium text-[var(--foreground)]">Ultra</strong> HDR gain map JPEG.
          </p>
        </header>

        <ul className="mt-10 grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id}>
              <PhotoCard photo={photo} />
            </li>
          ))}
        </ul>

        <Pagination page={page} totalPages={totalPages} />
      </div>
    </main>
  );
}

function PhotoCard({ photo }: { photo: Photo }) {
  return (
    <article className="grid gap-3">
      <a
        href={`/photos/${photo.slug}`}
        className="group relative block overflow-hidden rounded-[var(--radius)] border border-[var(--border)] transition hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        aria-label={photo.alt}
      >
        <PhotoPair photo={photo} size="card" />
        {/* hover label overlay */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-1 items-end bg-gradient-to-t from-[var(--background)]/80 to-transparent p-3 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="line-clamp-2 text-xs font-medium text-[var(--foreground)]">
            {photo.alt}
          </span>
        </span>
      </a>
      <PhotoCredit photo={photo} />
    </article>
  );
}

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  return (
    <nav
      aria-label="Photo pages"
      className="mt-12 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-6 text-sm"
    >
      <PageLink page={previousPage(page)} direction="Previous" icon="left" />
      <p className="text-[var(--muted)]">
        {page} <span className="text-[var(--border)]">/</span> {totalPages}
        <span className="ml-3 hidden text-xs sm:inline">
          · {PAGE_SIZE} per page
        </span>
      </p>
      <PageLink page={nextPage(page, totalPages)} direction="Next" icon="right" />
    </nav>
  );
}

function PageLink({
  page,
  direction,
  icon,
}: {
  page: number | undefined;
  direction: string;
  icon: "left" | "right";
}) {
  if (page == null) return <span className="w-24" />;

  const href = page === 1 ? "/photos" : `/photos?page=${page}`;
  const cls =
    "inline-flex items-center gap-2 rounded-[var(--radius)] px-3 py-1.5 text-[var(--muted)] transition hover:bg-[color-mix(in_srgb,var(--accent)_7%,transparent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

  if (icon === "left") {
    return (
      <a className={cls} href={href}>
        <UltraIcon size={14}>
          <ArrowLeftFilled />
        </UltraIcon>
        {direction}
      </a>
    );
  }

  return (
    <a className={cls} href={href}>
      {direction}
      <UltraIcon size={14}>
        <ArrowRightFilled />
      </UltraIcon>
    </a>
  );
}

function pageFromSearch(params: Search): number {
  const raw = Array.isArray(params.page) ? params.page[0] : params.page;
  return clampPhotoPage(Number(raw ?? "1"));
}

function previousPage(page: number): number | undefined {
  if (page <= 1) return undefined;
  return page - 1;
}

function nextPage(page: number, totalPages: number): number | undefined {
  if (page >= totalPages) return undefined;
  return page + 1;
}
