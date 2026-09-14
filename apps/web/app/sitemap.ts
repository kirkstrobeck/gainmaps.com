import type { MetadataRoute } from "next";
import { COMPANIES } from "@/lib/logos/companies";
import { PHOTOS } from "@/lib/photos/catalog";
import { SITE_ORIGIN, staticSitemapEntries } from "@/lib/routes";

// Catalog last updated date — bump when gallery content changes.
const CATALOG_LASTMOD = "2026-09-14";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_ORIGIN;
  const statics = staticSitemapEntries(base);
  const logoRoutes: MetadataRoute.Sitemap = COMPANIES.map((c) => ({
    url: `${base}/logos/${c.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: CATALOG_LASTMOD,
  }));
  const photoRoutes: MetadataRoute.Sitemap = PHOTOS.map((p) => ({
    url: `${base}/photos/${p.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: CATALOG_LASTMOD,
  }));
  return [...statics, ...logoRoutes, ...photoRoutes];
}
