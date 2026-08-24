"use client";

import { useCallback, useRef } from "react";

import { UltraWord } from "@/components/ultra-word";
import { TEXT_ULTRA_INTENSITY } from "@/lib/text-ultra";
import type { Photo } from "@/lib/photos/catalog";
import { photoGainmapSrc, photoStandardSrc } from "@/lib/photos/catalog";

type InstrumentProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
  sdr: React.ReactNode;
  ultra: React.ReactNode;
};

function SeamInstrument({ width, height, className, sdr, ultra }: InstrumentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const dragging = useRef(false);
  const posRef = useRef(50);

  const applyPos = useCallback((pct: number) => {
    const el = containerRef.current;
    const btn = handleRef.current;
    if (!el) return;
    posRef.current = pct;
    el.style.setProperty("--seam-x", `${pct.toFixed(2)}%`);
    if (btn) btn.setAttribute("aria-valuenow", String(Math.round(pct)));
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    applyPos(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
  }, [applyPos]);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    const delta = e.key === "ArrowLeft" || e.key === "ArrowDown" ? -2
      : e.key === "ArrowRight" || e.key === "ArrowUp" ? 2 : 0;
    if (!delta) return;
    e.preventDefault();
    applyPos(Math.max(0, Math.min(100, posRef.current + delta)));
  }, [applyPos]);

  return (
    <div
      ref={containerRef}
      className={`inst${className ? ` ${className}` : ""}`}
      style={{ width, height }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Ultra layer — always fully visible */}
      <div className="inst-layer">{ultra}</div>
      {/* SDR layer — clipped to left of seam */}
      <div className="inst-layer inst-sdr">{sdr}</div>
      {/* Seam line */}
      <div className="inst-seam" aria-hidden />
      {/* Handle */}
      <button
        ref={handleRef}
        type="button"
        className="inst-handle"
        role="slider"
        aria-label="Comparison position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={50}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
      />
      {/* Corner tags */}
      <div className="inst-tag inst-tag-std">Standard</div>
      <div className="inst-tag inst-tag-ultra">
        <span className="inst-dot" aria-hidden />
        Ultra
      </div>
    </div>
  );
}

export function SeamComparePhoto({
  photo,
  width,
  height,
  className,
}: {
  photo: Photo;
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  const stdSrc = photoStandardSrc(photo);
  const gainSrc = photoGainmapSrc(photo);

  return (
    <SeamInstrument
      width={width}
      height={height}
      className={className}
      sdr={
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stdSrc}
          alt={`${photo.alt}, Standard`}
          className="inst-img gainmap-image"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      }
      ultra={
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={gainSrc}
          alt={`${photo.alt}, Ultra`}
          className="inst-img gainmap-image"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      }
    />
  );
}

export function SeamCompareType({
  typeClassName = "font-display text-4xl font-bold",
  width,
  height,
  className,
}: {
  typeClassName?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  return (
    <SeamInstrument
      width={width}
      height={height}
      className={className}
      sdr={<span className={`${typeClassName} inst-type-std`}>Ultra</span>}
      ultra={
        <UltraWord
          word="Ultra"
          typeClassName={typeClassName}
          intensity={TEXT_ULTRA_INTENSITY}
        />
      }
    />
  );
}
