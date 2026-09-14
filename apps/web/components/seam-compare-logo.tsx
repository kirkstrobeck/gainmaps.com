"use client";

import { SeamInstrument } from "@/components/seam-instrument";
import { SeamLayerImg } from "@/components/seam-layer-img";
import { logoGainmapSrcset, type Company } from "@/lib/logos/companies";

export function SeamCompareLogo({
  company,
  width,
  height,
  className,
  sizes = "(max-width: 640px) 100vw, 512px",
  lazy = false,
  defer = false,
}: {
  company: Company;
  width?: number | string;
  height?: number | string;
  className?: string;
  sizes?: string;
  lazy?: boolean;
  defer?: boolean;
}) {
  const image = (label: string, className: string) => (
    <SeamLayerImg
      src={company.gainmapPath}
      srcSet={logoGainmapSrcset(company)}
      sizes={sizes}
      alt={`${company.name} logo, ${label}`}
      width={512}
      height={512}
      className={className}
      loading={lazy ? "lazy" : "eager"}
      fetchPriority="low"
      defer={defer}
    />
  );
  return (
    <SeamInstrument
      width={width}
      height={height}
      className={className}
      sdr={image("Standard", "inst-img preview-original")}
      ultra={image("Ultra", "inst-img gainmap-image")}
    />
  );
}
