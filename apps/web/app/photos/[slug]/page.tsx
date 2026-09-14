// Server-render on request — static prerender fails in this container due to
// a React module null issue in the server bundle during SSG.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { preload } from "react-dom";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowBackIcon as ArrowLeftFilled, ArrowForwardIcon as ArrowRightFilled } from "@/components/icons";
import { UltraWord } from "@/components/ultra-word";
import { TEXT_ULTRA_INTENSITY } from "@/lib/text-ultra";

import { PageChrome } from "@/components/page-chrome";
import { PhotoCredit } from "@/components/photo-pair";
import { SeamComparePhoto } from "@/components/seam-compare";
import { UltraIcon } from "@/components/ultra-icon";
import { PHOTOS, photoBySlug, photoGainmapSrc, photoGainmapSrcset, type Photo } from "@/lib/photos/catalog";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams(): { slug: string }[] {
  return PHOTOS.map((photo) => ({ slug: photo.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const photo = photoBySlug((await params).slug);
  if (!photo) return { title: "Photos · Gainmaps" };

  return {
    title: `${photo.alt} · Photos · Gainmaps`,
    description: `${photo.alt} by ${photo.photographer}. Standard Unsplash SDR beside an Ultra HDR gain map.`,
  };
}

export default async function Base({ params }: Params) {
  const photo = photoBySlug((await params).slug);
  if (!photo) notFound();

  preload(photoGainmapSrc(photo), {
    as: "image",
    fetchPriority: "high",
    imageSrcSet: photoGainmapSrcset(photo),
    imageSizes: "(min-width: 1024px) 1024px, 100vw",
  });

  const neighbours = surrounding(photo.slug);

  return (
    <main>
      <PageChrome />
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <Link
          className="inline-flex items-center gap-2 rounded-[var(--radius)] px-2 py-1 text-sm text-[var(--muted)] transition hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] -ml-2"
          href="/photos"
        >
          <UltraIcon size={14}>
            <ArrowLeftFilled />
          </UltraIcon>
          All photos
        </Link>

        <header className="mt-6 border-b border-[var(--border)] pb-8">
          <p className="mb-3 text-sm text-[var(--muted)]">{photo.photographer}</p>
          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-normal sm:text-5xl">
            <UltraWord text={photo.alt} typeClassName="font-display text-4xl font-bold leading-[1.08] tracking-normal sm:text-5xl" intensity={TEXT_ULTRA_INTENSITY} />
          </h1>
        </header>

        {/* Photo proof — no heavy card chrome, let images breathe */}
        <section className="mt-10">
          <SeamComparePhoto photo={photo} width="100%" priority sizes="(min-width: 1024px) 1024px, 100vw" />
          <div className="mt-4">
            <PhotoCredit photo={photo} />
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Drag the seam — left of it is the SDR base (dynamic-range-limit: standard), right of it
            is the same JPEG decoded as an Ultra HDR gain map. Both use local long-edge-capped JPEGs
            so resolution and codec match exactly.
          </p>
        </section>

        {/* File facts */}
        <dl className="mt-8 grid gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--border)] text-sm sm:grid-cols-2">
          <Fact label="Gain map" value={photoGainmapSrc(photo)} href={photoGainmapSrc(photo)} />
          <Fact label="Unsplash original" value={photo.photoUrl} href={photo.photoUrl} />
        </dl>

        {/* Neighbour navigation */}
        <nav
          className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-6 text-sm"
          aria-label="Photo navigation"
        >
          <NeighbourLink photo={neighbours.previous} direction="prev" />
          <NeighbourLink photo={neighbours.next} direction="next" />
        </nav>
      </div>
    </main>
  );
}

function Fact({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <div className="bg-[var(--panel)] px-4 py-3">
      <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1 truncate font-mono text-[12px]">
        <a
          className="transition hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        >
          {value}
        </a>
      </dd>
    </div>
  );
}

function NeighbourLink({
  photo,
  direction,
}: {
  photo: Photo | undefined;
  direction: "prev" | "next";
}) {
  if (!photo) return <span />;

  const isPrev = direction === "prev";
  return (
    <a
      href={`/photos/${photo.slug}`}
      className="group inline-flex max-w-[48%] items-center gap-2 rounded-[var(--radius)] px-2 py-1 text-[var(--muted)] transition hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
    >
      {isPrev && (
        <UltraIcon size={14} className="shrink-0">
          <ArrowLeftFilled />
        </UltraIcon>
      )}
      <span className="truncate text-xs leading-5">{photo.alt}</span>
      {!isPrev && (
        <UltraIcon size={14} className="shrink-0">
          <ArrowRightFilled />
        </UltraIcon>
      )}
    </a>
  );
}

function surrounding(slug: string) {
  const index = PHOTOS.findIndex((photo) => photo.slug === slug);
  return { previous: PHOTOS[index - 1], next: PHOTOS[index + 1] };
}
