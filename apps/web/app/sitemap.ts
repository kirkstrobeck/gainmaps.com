import type { MetadataRoute } from "next";
import { COMPANIES } from "@/lib/logos/companies";
import { PHOTOS } from "@/lib/photos/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.gainmaps.com";
  const statics: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "monthly", priority: 1.0 },
    { url: `${base}/convert`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/docs`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/logos`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/photos`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/text`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/community`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/appearance`, changeFrequency: "monthly", priority: 0.7 },
  ];
  const logoRoutes: MetadataRoute.Sitemap = COMPANIES.map((c) => ({
    url: `${base}/logos/${c.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  const photoRoutes: MetadataRoute.Sitemap = PHOTOS.map((p) => ({
    url: `${base}/photos/${p.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [...statics, ...logoRoutes, ...photoRoutes];
}
