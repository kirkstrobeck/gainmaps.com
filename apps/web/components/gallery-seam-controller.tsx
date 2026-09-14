"use client";

import { useEffect } from "react";

function instrumentFor(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>("[data-gallery-seam]");
}

function position(inst: HTMLElement, percent: number): void {
  const bounded = Math.max(0, Math.min(100, percent));
  inst.style.setProperty("--seam-x", `${bounded.toFixed(2)}%`);
  inst.querySelector("[role=slider]")?.setAttribute("aria-valuenow", String(Math.round(bounded)));
  inst.querySelectorAll<HTMLElement>("[data-seam-snap]").forEach((button) => button.setAttribute("aria-pressed", "false"));
}

function snap(inst: HTMLElement, percent: number): void {
  inst.classList.add("inst--animating");
  position(inst, percent);
  inst.querySelector<HTMLElement>("[data-seam-snap='100']")?.setAttribute("aria-pressed", String(percent === 100));
  inst.querySelector<HTMLElement>("[data-seam-snap='0']")?.setAttribute("aria-pressed", String(percent === 0));
  window.setTimeout(() => inst.classList.remove("inst--animating"), 350);
}

const PHOTO_WIDTHS = [400, 800, 1280, 1600, 2048, 2560];

function responsiveSources(src: string, widths: readonly number[] | string): string {
  const values = typeof widths === "string" ? widths.split(",") : widths;
  const base = src.replace(/(?:-\d+)?\.jpg$/, "");
  return values.map((width) => `${base}-${width}.jpg ${width}w`).join(", ");
}

export function GallerySeamController({ photoStorageBase }: { photoStorageBase?: string }) {
  useEffect(() => {
    let active: { inst: HTMLElement; rect: DOMRect; pointer: number } | null = null;
    const deferred = document.querySelectorAll<HTMLImageElement>("img[data-seam-src]");
    const loadDeferredImage = (image: HTMLImageElement) => {
      const path = image.dataset.seamSrc!;
      const count = Number(image.dataset.seamCount);
      const photoWidths = photoStorageBase && Number.isInteger(count) && count > 0
        ? PHOTO_WIDTHS.slice(0, count) : undefined;
      const src = photoWidths ? `${photoStorageBase}/photos/${path}-400.jpg` : path;
      image.srcset = photoWidths
        ? responsiveSources(src, photoWidths)
        : image.dataset.seamWidths
          ? responsiveSources(src, image.dataset.seamWidths)
        : image.dataset.seamSrcset ?? "";
      image.src = src;
      delete image.dataset.seamSrc;
      delete image.dataset.seamCount;
      delete image.dataset.seamWidths;
      delete image.dataset.seamSrcset;
    };
    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadDeferredImage(entry.target as HTMLImageElement);
        observer?.unobserve(entry.target);
      });
    }, { rootMargin: "900px" }) : null;
    deferred.forEach((image) => {
      if (observer) observer.observe(image);
      if (!observer) loadDeferredImage(image);
    });
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest("[data-seam-snap]")) return;
      const inst = instrumentFor(event.target);
      if (!inst) return;
      active = { inst, rect: inst.getBoundingClientRect(), pointer: event.pointerId };
      inst.setPointerCapture?.(event.pointerId);
      position(inst, ((event.clientX - active.rect.left) / active.rect.width) * 100);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!active || active.pointer !== event.pointerId) return;
      position(active.inst, ((event.clientX - active.rect.left) / active.rect.width) * 100);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (active?.pointer === event.pointerId) active = null;
    };
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLElement>("[data-seam-snap]");
      const inst = instrumentFor(button);
      if (!button || !inst) return;
      snap(inst, Number(button.dataset.seamSnap));
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.target instanceof Element) || event.target.getAttribute("role") !== "slider") return;
      const delta = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -2
        : event.key === "ArrowRight" || event.key === "ArrowUp" ? 2 : 0;
      if (!delta) return;
      const inst = instrumentFor(event.target);
      if (!inst) return;
      event.preventDefault();
      position(inst, Number(event.target.getAttribute("aria-valuenow")) + delta);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      observer?.disconnect();
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerUp);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [photoStorageBase]);
  return null;
}
