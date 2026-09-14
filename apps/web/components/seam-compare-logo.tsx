"use client";

import { SeamInstrument } from "@/components/seam-instrument";
import { logoGainmapSrcset, type Company } from "@/lib/logos/companies";

export function SeamCompareLogo({
  company,
  width,
  height,
  className,
  sizes = "(max-width: 640px) 100vw, 512px",
  lazy = false,
}: {
  company: Company;
  width?: number | string;
  height?: number | string;
  className?: string;
  sizes?: string;
  lazy?: boolean;
}) {
  return (
    <SeamInstrument
      width={width}
      height={height}
      className={className}
      sdr={
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={company.gainmapPath}
          srcSet={logoGainmapSrcset(company)}
          sizes={sizes}
          alt={`${company.name} logo, Standard`}
          width={512}
          height={512}
          className="inst-img preview-original"
          loading={lazy ? "lazy" : "eager"}
          fetchPriority="low"
          decoding="async"
        />
      }
      ultra={
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={company.gainmapPath}
          srcSet={logoGainmapSrcset(company)}
          sizes={sizes}
          alt={`${company.name} logo, Ultra`}
          width={512}
          height={512}
          className="inst-img gainmap-image"
          loading={lazy ? "lazy" : "eager"}
          fetchPriority="low"
          decoding="async"
        />
      }
    />
  );
}
