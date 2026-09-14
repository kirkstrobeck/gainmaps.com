import type { ReactNode } from "react";

import { GallerySeamController } from "@/components/gallery-seam-controller";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { logoGainmapSrcset, type Company } from "@/lib/logos/companies";
import {
  photoGainmapSrc, photoGainmapSrcset, photoStandardSrc, photoStandardSrcset, type Photo,
} from "@/lib/photos/catalog";
import { photoIntrinsicSize } from "@/lib/photos/photo-intrinsic";

function Instrument({ sdr, ultra, className }: { sdr: ReactNode; ultra: ReactNode; className: string }) {
  return (
    <div className={`inst ${className}`} data-gallery-seam>
      <div className="inst-layer">{ultra}</div>
      <div className="inst-layer inst-sdr">{sdr}</div>
      <div className="inst-seam" aria-hidden />
      <button type="button" className="inst-handle" role="slider" aria-label="Comparison position" aria-valuemin={0} aria-valuemax={100} aria-valuenow={50}>
        <ChevronLeftIcon size={10} color="rgba(244,241,236,0.8)" aria-hidden />
        <ChevronRightIcon size={10} color="rgba(244,241,236,0.8)" aria-hidden />
      </button>
      <div className="inst-corner inst-corner-sdr">
        <button type="button" className="inst-switch-btn" aria-pressed="false" aria-label="SDR: Show Standard" data-seam-snap="100">SDR</button>
      </div>
      <div className="inst-corner inst-corner-ultra">
        <button type="button" className="inst-switch-btn" aria-pressed="false" aria-label="Ultra: Show Ultra" data-seam-snap="0"><span className="inst-dot" aria-hidden />Ultra</button>
      </div>
    </div>
  );
}

export function GallerySeamPhoto({ photo, priority, sizes }: { photo: Photo; priority: boolean; sizes: string }) {
  const intrinsic = photoIntrinsicSize(photo);
  const loading = priority ? "eager" : "lazy";
  const fetchPriority = priority ? "high" : "low";
  const image = (src: string, srcSet: string, label: string, className: string, defer = false) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={defer ? undefined : src} srcSet={defer ? undefined : srcSet} data-seam-src={defer ? src : undefined} data-seam-srcset={defer ? srcSet : undefined} sizes={sizes} alt={`${photo.alt}, ${label}`} width={intrinsic.width} height={intrinsic.height} className={className} loading={loading} fetchPriority={fetchPriority} decoding="async" draggable={false} />
  );
  return <Instrument className="aspect-video" sdr={image(photoStandardSrc(photo, 400), photoStandardSrcset(photo), "Standard", "inst-img preview-original")} ultra={image(photoGainmapSrc(photo, 400), photoGainmapSrcset(photo), "Ultra", "inst-img gainmap-image", !priority)} />;
}

export function GallerySeamLogo({ company, priority }: { company: Company; priority: boolean }) {
  const loading = priority ? "eager" : "lazy";
  const image = (label: string, className: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={company.gainmapPath} srcSet={logoGainmapSrcset(company)} sizes="(max-width: 640px) 100vw, 384px" alt={`${company.name} logo, ${label}`} width={512} height={512} className={className} loading={loading} fetchPriority={priority ? "high" : "low"} decoding="async" />
  );
  return <Instrument className="aspect-square" sdr={image("Standard", "inst-img preview-original")} ultra={image("Ultra", "inst-img gainmap-image")} />;
}

export { GallerySeamController };
