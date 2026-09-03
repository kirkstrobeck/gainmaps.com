"use client";

import { UltraWord } from "@/components/ultra-word";
import { SeamInstrument } from "@/components/seam-instrument";
import { TEXT_ULTRA_INTENSITY } from "@/lib/text-ultra";
import type { Photo } from "@/lib/photos/catalog";
import { photoGainmapSrc, photoGainmapSrcset, photoStandardSrc, photoStandardSrcset } from "@/lib/photos/catalog";

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
          srcSet={photoStandardSrcset(photo)}
          sizes="(min-width: 1280px) calc(100vw - 460px), 100vw"
          alt={`${photo.alt}, Standard`}
          width={photo.width}
          height={photo.height}
          className="inst-img gainmap-image"
          loading="lazy"
          fetchPriority="low"
          decoding="async"
        />
      }
      ultra={
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={gainSrc}
          srcSet={photoGainmapSrcset(photo)}
          sizes="(min-width: 1280px) calc(100vw - 460px), 100vw"
          alt={`${photo.alt}, Ultra`}
          width={photo.width}
          height={photo.height}
          className="inst-img gainmap-image"
          loading="lazy"
          fetchPriority="low"
          decoding="async"
        />
      }
    />
  );
}

export function SeamCompareType({
  typeClassName = "font-display font-bold [font-size:clamp(3rem,28vw,8rem)]",
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
