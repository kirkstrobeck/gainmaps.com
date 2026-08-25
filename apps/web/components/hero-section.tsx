"use client";

import { useCallback, useState } from "react";

import { ContentCopyIcon as CopyIcon, CheckIcon } from "@/components/icons";
import { PhotoCredit } from "@/components/photo-pair";
import { SeamComparePhoto, SeamCompareType } from "@/components/seam-compare";
import { UltraIcon } from "@/components/ultra-icon";
import { UltraWord } from "@/components/ultra-word";
import type { Photo } from "@/lib/photos/catalog";
import { TEXT_ULTRA_INTENSITY } from "@/lib/text-ultra";
import { cn } from "@/lib/utils";

const H1_CLASS = "font-display text-[46px] font-[640] leading-[0.94] tracking-[-0.02em] [font-variation-settings:'wdth'_96] lg:text-[78px]";
const TYPE_CLASS = "font-display font-bold [font-size:clamp(3rem,28vw,8rem)]";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

function NpxCopy() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    await navigator.clipboard.writeText("npx gainmap ./photos");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy npx command"
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-4 font-mono text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]",
        FOCUS,
      )}
    >
      <code>npx gainmap ./photos</code>
      <UltraIcon size={14}>
        {copied ? <CheckIcon /> : <CopyIcon />}
      </UltraIcon>
    </button>
  );
}

export function HeroSection({ comparePhoto }: { comparePhoto: Photo }) {
  return (
    <section aria-label="Hero" className="hero-stage">
      {/*
        Mobile: flex-col with order properties so photo sits between actions and type.
        Desktop: 2-col grid, left groups span 3 rows with stretch, photo col 2 spans all.
      */}
      <div className={cn(
        "flex flex-col gap-4 px-4 pt-6 sm:px-8",
        "lg:grid lg:grid-cols-[380px_1fr] lg:grid-rows-[auto_auto_1fr] lg:gap-x-[56px] lg:gap-y-8 lg:px-16 lg:pt-10",
      )}>

        {/* Group 1: eyebrow, h1, deck */}
        <div className="order-1 grid gap-4 lg:order-none lg:col-start-1 lg:row-start-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Brighter than white
          </p>
          <h1 className={`${H1_CLASS} text-balance text-[var(--foreground)]`}>
            <UltraWord word="Gain" typeClassName={H1_CLASS} intensity={TEXT_ULTRA_INTENSITY} />
            {" "}
            <UltraWord word="maps" typeClassName={H1_CLASS} intensity={TEXT_ULTRA_INTENSITY} />
          </h1>
          <p className="max-w-[31ch] text-[17px] leading-[1.55] text-[var(--muted)]">
            One file. Two renderers. Standard clips highlights. Ultra unlocks them.
          </p>
        </div>

        {/* Group 2: actions */}
        <div className="order-2 flex flex-wrap items-center gap-3 lg:order-none lg:col-start-1 lg:row-start-2 lg:self-center">
          <a
            href="/convert"
            className={cn(
              "inline-flex h-11 items-center rounded-[var(--radius)] bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] transition hover:opacity-90",
              FOCUS,
            )}
          >
            Convert an image
          </a>
          <NpxCopy />
        </div>

        {/* Photo instrument — col 2 spans all rows on desktop, order 3 on mobile */}
        <div className="order-3 grid content-start gap-2 lg:order-none lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <SeamComparePhoto
            photo={comparePhoto}
            width="100%"
            className="h-[234px] lg:h-[596px]"
          />
          <PhotoCredit photo={comparePhoto} />
        </div>

        {/* Group 3: type instrument */}
        <div className="order-4 grid gap-3 lg:order-none lg:col-start-1 lg:row-start-3 lg:self-end">
          <hr className="border-[var(--border)]" />
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
            Type
          </p>
          <SeamCompareType
            typeClassName={TYPE_CLASS}
            width="100%"
            className="h-[108px] lg:h-[132px]"
          />
          <p className="hidden text-xs text-[var(--muted)] lg:block">
            Same text, same display — left is SDR white, right is Ultra.
          </p>
        </div>
      </div>
    </section>
  );
}
