"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { SeamCornerButtons } from "@/components/seam-corner-buttons";

export type InstrumentProps = {
  width?: number | string;
  height?: number | string;
  className?: string;
  sdr: React.ReactNode;
  ultra: React.ReactNode;
};

export function SeamInstrument({ width, height, className, sdr, ultra }: InstrumentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const dragging = useRef(false);
  const posRef = useRef(50);
  const rectRef = useRef<DOMRect | null>(null);
  const [seamSide, setSeamSide] = useState<"sdr" | "ultra" | null>(null);

  const applyPos = useCallback((pct: number) => {
    const el = containerRef.current;
    const btn = handleRef.current;
    if (!el) return;
    posRef.current = pct;
    el.style.setProperty("--seam-x", `${pct.toFixed(2)}%`);
    btn?.setAttribute("aria-valuenow", String(Math.round(pct)));
  }, []);

  const animateTo = useCallback((pct: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.add("inst--animating");
    applyPos(pct);
    setSeamSide(pct >= 100 ? "sdr" : pct <= 0 ? "ultra" : null);
    setTimeout(() => { el.classList.remove("inst--animating"); }, 350);
  }, [applyPos]);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    rectRef.current = containerRef.current?.getBoundingClientRect() ?? null;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    setSeamSide(null);
    if (rectRef.current) {
      applyPos(Math.max(0, Math.min(100, ((e.clientX - rectRef.current.left) / rectRef.current.width) * 100)));
    }
  }, [applyPos]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !rectRef.current) return;
    applyPos(Math.max(0, Math.min(100, ((e.clientX - rectRef.current.left) / rectRef.current.width) * 100)));
  }, [applyPos]);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    const delta = e.key === "ArrowLeft" || e.key === "ArrowDown" ? -2
      : e.key === "ArrowRight" || e.key === "ArrowUp" ? 2 : 0;
    if (!delta) return;
    e.preventDefault();
    setSeamSide(null);
    applyPos(Math.max(0, Math.min(100, posRef.current + delta)));
  }, [applyPos]);

  return (
    <div
      ref={containerRef}
      className={`inst${className ? ` ${className}` : ""}`}
      style={{ width, height }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="inst-layer">{ultra}</div>
      <div className="inst-layer inst-sdr">{sdr}</div>
      <div className="inst-seam" aria-hidden />
      <button
        ref={handleRef}
        type="button"
        className="inst-handle"
        role="slider"
        aria-label="Comparison position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={50}
        onKeyDown={onKeyDown}
      >
        <ChevronLeftIcon size={10} color="rgba(244,241,236,0.8)" aria-hidden />
        <ChevronRightIcon size={10} color="rgba(244,241,236,0.8)" aria-hidden />
      </button>
      <SeamCornerButtons seamSide={seamSide} animateTo={animateTo} />
    </div>
  );
}
