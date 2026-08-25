#!/usr/bin/env npx tsx
/**
 * Curate 100 landscape photographs for the gainmaps catalog.
 * Keeps verified landscape genre entries, fetches replacements from Unsplash napi.
 * Run: npx tsx tools/photos/curate-photos.ts
 */
import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../../apps/web/lib/photos/catalog.ts");
const TARGET = 100;

type Photo = {
  readonly id: string; readonly slug: string; readonly unsplashPhotoId: string;
  readonly photographer: string; readonly photographerUrl: string; readonly photoUrl: string;
  readonly width: number; readonly height: number; readonly alt: string;
};

// Verified landscape-genre entries — same ids, slugs, and metadata.
const KEPT: readonly Photo[] = [
  { id: "zmA2gYoK844", slug: "green-pine-trees", unsplashPhotoId: "photo-1562605270-3cdc52af7f5d", photographer: "Ethan Dow", photographerUrl: "https://unsplash.com/@ethandow", photoUrl: "https://unsplash.com/photos/green-pine-trees-zmA2gYoK844", width: 1900, height: 3040, alt: "green pine trees" },
  { id: "9bBEDfzbDc4", slug: "a-clear-chunk-of-ice-on-a-dark-pebble-beach-near-the-ocean", unsplashPhotoId: "photo-1787238347746-44391edcfa32", photographer: "Benjamin Chambon", photographerUrl: "https://unsplash.com/@benjamin_photo_lab", photoUrl: "https://unsplash.com/photos/ice-chunk-on-dark-pebble-beach-9bBEDfzbDc4", width: 4000, height: 6000, alt: "A clear chunk of ice on a dark pebble beach near the ocean" },
  { id: "qsdkMlbfne4", slug: "a-seal-rests-on-a-shallow-sandbar-in-calm-water", unsplashPhotoId: "photo-1784978516675-8daa424836f5", photographer: "Jeremy Hynes", photographerUrl: "https://unsplash.com/@hynesight", photoUrl: "https://unsplash.com/photos/a-seal-rests-on-a-shallow-sandbar-in-calm-water-qsdkMlbfne4", width: 7660, height: 3830, alt: "A seal rests on a shallow sandbar in calm water" },
  { id: "-PvICnpWGlc", slug: "two-people-on-a-rocky-cliff-overlooking-a-valley-under-a-low", unsplashPhotoId: "photo-1787055923390-67a2dbac36b0", photographer: "Michael Shtern", photographerUrl: "https://unsplash.com/@mic222", photoUrl: "https://unsplash.com/photos/people-on-rocky-cliff-at-valley--PvICnpWGlc", width: 6720, height: 3780, alt: "Two people on a rocky cliff overlooking a valley under a low sun" },
  { id: "-zrRKebyM8c", slug: "turquoise-river-flows-through-a-dramatic-rocky-canyon", unsplashPhotoId: "photo-1785131455100-7f15d21ebffe", photographer: "Mahyar Yeganeh", photographerUrl: "https://unsplash.com/@nvamahyar", photoUrl: "https://unsplash.com/photos/turquoise-river-flows-through-a-dramatic-rocky-canyon--zrRKebyM8c", width: 3024, height: 4032, alt: "Turquoise river flows through a dramatic, rocky canyon" },
  { id: "I8uRAuI5JF4", slug: "a-black-dog-on-a-rock-with-colorful-mountains", unsplashPhotoId: "photo-1778701985068-4561674b45d8", photographer: "Ahmed", photographerUrl: "https://unsplash.com/@mutecevvil", photoUrl: "https://unsplash.com/photos/a-black-dog-on-a-rock-with-colorful-mountains-I8uRAuI5JF4", width: 4583, height: 6874, alt: "A black dog on a rock with colorful mountains" },
  { id: "l3Pvd4M3Css", slug: "low-sun-with-lens-flare-over-a-forested-valley-and-granite-c", unsplashPhotoId: "photo-1787170426598-858e57c774dd", photographer: "Priyank Pathak", photographerUrl: "https://unsplash.com/@ppriyank", photoUrl: "https://unsplash.com/photos/low-sun-over-yosemite-valley-cliffs-l3Pvd4M3Css", width: 9459, height: 5475, alt: "Low sun with lens flare over a forested valley and granite cliffs in Yosemite" },
  { id: "maKSDW4Ucoc", slug: "a-person-walks-along-a-desert-sand-dune-at-sunset", unsplashPhotoId: "photo-1781902834540-4604713b7e1b", photographer: "Rafael Peier", photographerUrl: "https://unsplash.com/@rafaelpeier", photoUrl: "https://unsplash.com/photos/a-person-walks-along-a-desert-sand-dune-at-sunset-maKSDW4Ucoc", width: 3525, height: 5287, alt: "A person walks along a desert sand dune at sunset" },
  { id: "ygRIDv3W6Ec", slug: "zebras-in-a-golden-sunlit-grassy-field", unsplashPhotoId: "photo-1781730655215-63a2a92623e4", photographer: "Rafael Peier", photographerUrl: "https://unsplash.com/@rafaelpeier", photoUrl: "https://unsplash.com/photos/zebras-in-a-golden-sunlit-grassy-field-ygRIDv3W6Ec", width: 5713, height: 3809, alt: "Zebras in a golden, sunlit grassy field" },
  { id: "qsQNjjHjFns", slug: "striking-layered-desert-mountain-under-a-beautiful-sunset-sk", unsplashPhotoId: "photo-1785142893888-58e3954672db", photographer: "Kilic-Emre Akdag", photographerUrl: "https://unsplash.com/@kilicemre7007", photoUrl: "https://unsplash.com/photos/striking-layered-desert-mountain-under-a-beautiful-sunset-sky-qsQNjjHjFns", width: 4024, height: 3018, alt: "Striking layered desert mountain under a beautiful sunset sky" },
  { id: "i_J0c5m6yvc", slug: "a-person-in-a-red-cloak-on-a-vast-sand-dune-at-golden-hour", unsplashPhotoId: "photo-1786300412449-875316124ba1", photographer: "Rafael Peier", photographerUrl: "https://unsplash.com/@rafaelpeier", photoUrl: "https://unsplash.com/photos/person-in-red-cloak-on-sand-dune-i_J0c5m6yvc", width: 4382, height: 6573, alt: "A person in a red cloak on a vast sand dune at golden hour" },
  { id: "j0M14wYc1_A", slug: "wooden-cabin-in-a-lush-green-meadow-before-a-mountain", unsplashPhotoId: "photo-1784019226271-f89c21f7791a", photographer: "Yousef Salhamoud", photographerUrl: "https://unsplash.com/@salhamoud", photoUrl: "https://unsplash.com/photos/wooden-cabin-in-a-lush-green-meadow-before-a-mountain-j0M14wYc1_A", width: 4470, height: 6705, alt: "Wooden cabin in a lush green meadow before a mountain" },
  { id: "s2F_H5M7-Vs", slug: "yellow-house-with-wooden-shutters-and-mountain-in-background", unsplashPhotoId: "photo-1785739125961-0c316bc80d13", photographer: "Arjun Raj", photographerUrl: "https://unsplash.com/@mr_hell", photoUrl: "https://unsplash.com/photos/yellow-house-with-wooden-shutters-and-mountain-in-background-s2F_H5M7-Vs", width: 5949, height: 3347, alt: "Yellow house with wooden shutters and mountain in background" },
  { id: "ttMdFEwlayw", slug: "a-person-looking-out-over-a-lake-and-mountains-from-a-metal", unsplashPhotoId: "photo-1786813478692-b6df54dc3f6c", photographer: "Dawid Tkocz", photographerUrl: "https://unsplash.com/@dawidtkocz", photoUrl: "https://unsplash.com/photos/person-overlooking-lake-and-mountains-ttMdFEwlayw", width: 3840, height: 2560, alt: "A person looking out over a lake and mountains from a metal railing" },
  { id: "Yh3alvVRvRA", slug: "people-on-a-grassy-hillside-with-a-wooden-mountain-hut-below", unsplashPhotoId: "photo-1787224641466-9195e22b85b7", photographer: "Mattia Revelant", photographerUrl: "https://unsplash.com/@vez02", photoUrl: "https://unsplash.com/photos/people-on-grassy-mountain-hillside-Yh3alvVRvRA", width: 6240, height: 4160, alt: "People on a grassy hillside with a wooden mountain hut below rocky peaks" },
  { id: "ImKtzwJRBN0", slug: "historic-white-church-building-on-a-sandy-dune-landscape", unsplashPhotoId: "photo-1780656093756-0faf1a88159f", photographer: "Max Böhme", photographerUrl: "https://unsplash.com/@max_boehme", photoUrl: "https://unsplash.com/photos/historic-white-church-building-on-a-sandy-dune-landscape-ImKtzwJRBN0", width: 4495, height: 6743, alt: "Historic white church building on a sandy dune landscape" },
  { id: "CpVwilODVaI", slug: "a-turquoise-volcanic-crater-lake-surrounded-by-rocky-cliffs", unsplashPhotoId: "photo-1786288042250-1258f5839eaf", photographer: "Rowan Heuvel", photographerUrl: "https://unsplash.com/@insolitus", photoUrl: "https://unsplash.com/photos/turquoise-volcanic-crater-lake-CpVwilODVaI", width: 8192, height: 5464, alt: "A turquoise volcanic crater lake surrounded by rocky cliffs under a soft pink sky" },
  { id: "f8FgfDNLg2A", slug: "full-moon-in-a-clear-blue-sky-above-buildings", unsplashPhotoId: "photo-1773587040541-6d43f9ae5595", photographer: "Jones Lee", photographerUrl: "https://unsplash.com/@art0819leo", photoUrl: "https://unsplash.com/photos/full-moon-in-a-clear-blue-sky-above-buildings-f8FgfDNLg2A", width: 6000, height: 4500, alt: "Full moon in a clear blue sky above buildings" },
  { id: "nVxsqVi3hrk", slug: "a-solitary-egret-stands-in-misty-morning-light-by-reeds", unsplashPhotoId: "photo-1769257423963-36ed2d94d45b", photographer: "Bob Brewer", photographerUrl: "https://unsplash.com/@brewbottle", photoUrl: "https://unsplash.com/photos/a-solitary-egret-stands-in-misty-morning-light-by-reeds-nVxsqVi3hrk", width: 5281, height: 3213, alt: "A solitary egret stands in misty morning light by reeds" },
  { id: "Yh88Ag5d98M", slug: "silhouettes-of-people-against-a-bright-low-sun-in-a-clear-sk", unsplashPhotoId: "photo-1786962730761-cf13c9b7c360", photographer: "Oleksii Tsaryuk", photographerUrl: "https://unsplash.com/@photobyredder", photoUrl: "https://unsplash.com/photos/people-silhouettes-against-low-sun-Yh88Ag5d98M", width: 6000, height: 4000, alt: "Silhouettes of people against a bright low sun in a clear sky" },
  { id: "SJTO3-MTpBA", slug: "a-silhouette-stands-before-a-cloudy-sunset", unsplashPhotoId: "photo-1752978951972-a8f8d578046e", photographer: "Atul Pandey", photographerUrl: "https://unsplash.com/@iatulp", photoUrl: "https://unsplash.com/photos/a-silhouette-stands-before-a-cloudy-sunset-SJTO3-MTpBA", width: 2469, height: 3292, alt: "A silhouette stands before a cloudy sunset" },
  { id: "Gt_ZeRJ7ETo", slug: "a-beautiful-coastline-with-mountains-and-boats", unsplashPhotoId: "photo-1754532432708-4bf134683082", photographer: "Gatot Adri", photographerUrl: "https://unsplash.com/@garakta", photoUrl: "https://unsplash.com/photos/a-beautiful-coastline-with-mountains-and-boats-Gt_ZeRJ7ETo", width: 2688, height: 4032, alt: "A beautiful coastline with mountains and boats" },
];

const QUERIES = [
  "mountain landscape", "coastal scenery ocean", "desert dunes wilderness",
  "forest wilderness nature", "alpine lake reflection", "glacier iceland",
  "canyon landscape aerial", "aurora borealis", "fjord norway",
  "waterfall nature", "savanna africa golden", "volcanic landscape",
  "sunrise golden hour landscape", "sunset landscape panoramic",
  "rocky mountains national park", "tropical beach ocean horizon",
  "valley mist fog", "snow landscape winter",
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim()
    .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 63).replace(/-$/, "");
}

function photoIdFromRaw(rawUrl: string): string | null {
  const m = rawUrl.match(/images\.unsplash\.com\/(photo-[a-z0-9-]+)/);
  return m ? m[1] : null;
}

async function fetchPage(query: string, page: number): Promise<any[]> {
  const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=30&page=${page}&orientation=landscape`;
  const r = await fetch(url, { headers: { "User-Agent": "gainmaps-photos/1.0 (https://gainmaps.com)" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} for "${query}" p${page}`);
  return ((await r.json()) as any).results as any[];
}

async function main(): Promise<void> {
  const seenIds = new Set(KEPT.map(p => p.id));
  const seenSlugs = new Set(KEPT.map(p => p.slug));
  const fresh: Photo[] = [];
  const need = TARGET - KEPT.length;

  outer: for (const q of QUERIES) {
    for (let page = 1; page <= 3 && fresh.length < need; page++) {
      const results = await fetchPage(q, page);
      for (const r of results) {
        if (fresh.length >= need) break outer;
        if (seenIds.has(r.id)) continue;
        if (r.width <= r.height) continue;
        const photoId = photoIdFromRaw(r.urls?.raw ?? "");
        if (!photoId) continue;
        const altText = (r.alt_description ?? "").trim();
        let slug = slugify(altText || r.id);
        if (!slug) slug = r.id.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20);
        if (seenSlugs.has(slug)) slug = slugify(slug.slice(0, 50) + "-" + r.id.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8));
        if (seenSlugs.has(slug)) continue;
        seenIds.add(r.id);
        seenSlugs.add(slug);
        fresh.push({
          id: r.id, slug, unsplashPhotoId: photoId,
          photographer: (r.user?.name ?? "").trim(),
          photographerUrl: `https://unsplash.com/@${r.user?.username ?? ""}`,
          photoUrl: `https://unsplash.com/photos/${r.slug ?? r.id}`,
          width: r.width, height: r.height, alt: altText,
        });
      }
    }
  }

  const all = [...KEPT, ...fresh];
  if (all.length !== TARGET) throw new Error(`Expected ${TARGET} photos, got ${all.length}`);
  console.log(`Kept: ${KEPT.length}, new: ${fresh.length}, total: ${all.length}`);

  const entries = all.map(p =>
    `  { id: ${JSON.stringify(p.id)}, slug: ${JSON.stringify(p.slug)}, unsplashPhotoId: ${JSON.stringify(p.unsplashPhotoId)}, photographer: ${JSON.stringify(p.photographer)}, photographerUrl: ${JSON.stringify(p.photographerUrl)}, photoUrl: ${JSON.stringify(p.photoUrl)}, width: ${p.width}, height: ${p.height}, alt: ${JSON.stringify(p.alt)} },`
  ).join("\n");

  const content = `/**
 * 100 Unsplash photographs for /photos. Standard tiles hotlink the CDN;
 * Ultra tiles are local gain map JPEGs at /photos/{slug}/gainmap.jpg (boost 1.0 max).
 *
 * Rebuild Ultra files: npx tsx tools/photos/build-photos.ts
 */
export type Photo = {
  readonly id: string;
  readonly slug: string;
  /** images.unsplash.com filename, e.g. photo-1506905925346-21bda4d32df4 */
  readonly unsplashPhotoId: string;
  readonly photographer: string;
  readonly photographerUrl: string;
  readonly photoUrl: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
};

export const PAGE_SIZE = 12;

export const PHOTOS: readonly Photo[] = [
${entries}
];

export function photoBySlug(slug: string): Photo | undefined {
  return PHOTOS.find((photo) => photo.slug === slug);
}

export function photoStandardSrc(photo: Photo, width = 1920): string {
  return \`https://images.unsplash.com/\${photo.unsplashPhotoId}?auto=format&fit=crop&w=\${width}&q=90\`;
}

export function photoStandardSrcset(photo: Photo): string {
  return [1280, 1920, 2560, 3200]
    .map(w => \`https://images.unsplash.com/\${photo.unsplashPhotoId}?auto=format&fit=crop&w=\${w}&q=90 \${w}w\`)
    .join(", ");
}

export function photoGainmapSrc(photo: Photo): string {
  return \`/photos/\${photo.slug}/gainmap.jpg\`;
}

export function withUnsplashReferral(url: string): string {
  const join = url.includes("?") ? "&" : "?";
  return \`\${url}\${join}utm_source=gainmaps&utm_medium=referral\`;
}

export function photosPageCount(): number {
  return Math.ceil(PHOTOS.length / PAGE_SIZE);
}

export function photosForPage(page: number): readonly Photo[] {
  const total = photosPageCount();
  const current = Math.min(Math.max(page, 1), Math.max(total, 1));
  const start = (current - 1) * PAGE_SIZE;
  return PHOTOS.slice(start, start + PAGE_SIZE);
}

export function clampPhotoPage(page: number): number {
  const total = photosPageCount();
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.min(Math.floor(page), Math.max(total, 1));
}
`;

  await writeFile(OUT, content, "utf8");
  console.log(`Wrote ${OUT}`);
  console.log(`Landscape orientation (w>h): ${all.filter(p => p.width > p.height).length}/100`);
}

await main();
