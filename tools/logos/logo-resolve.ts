// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Resolves a seed to a downloadable premium SVG URL: api.svgl.app first
 * (hand-curated brand SVGs), then the Wikimedia file behind the brand's
 * Wikidata P154 (logo image) claim.
 */
import { USER_AGENT, chunk, mapChunked } from "./logo-pipeline.ts";
import type { LogoSeed } from "./sources.ts";

export type SvglEntry = {
  readonly title: string;
  readonly route?: string | { readonly light?: string; readonly dark?: string };
};

export type Resolved = {
  readonly seed: LogoSeed;
  readonly url: string;
  readonly source: "svgl" | "commons";
};

export function resolveSeed(
  seed: LogoSeed,
  svgl: ReadonlyMap<string, SvglEntry>,
  commons: ReadonlyMap<string, string>,
): Resolved | { seed: LogoSeed; url: null } {
  if (seed.directSvgUrl) return { seed, url: seed.directSvgUrl, source: "commons" };

  const fromSvgl = seed.svglTitle ? svglUrl(svgl.get(seed.svglTitle)) : null;
  if (fromSvgl) return { seed, url: fromSvgl, source: "svgl" };

  const file = seed.commonsFile ?? commons.get(seed.wikipedia);
  if (file && /\.svg$/i.test(file)) return { seed, url: commonsFilePath(file), source: "commons" };

  return { seed, url: null };
}

export function svglUrl(entry: SvglEntry | undefined): string | null {
  if (!entry?.route) return null;
  if (typeof entry.route === "string") return entry.route;
  return entry.route.light ?? entry.route.dark ?? null;
}

export function commonsFilePath(file: string): string {
  return `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, "_"))}`;
}

export async function fetchSvglIndex(): Promise<ReadonlyMap<string, SvglEntry>> {
  const response = await fetch("https://api.svgl.app", { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`svgl index: HTTP ${response.status}`);
  const entries = (await response.json()) as readonly SvglEntry[];
  return new Map(entries.map((entry) => [entry.title, entry]));
}

/** Wikipedia title -> Wikidata item -> P154 (logo image) -> Commons file name. */
export async function resolveCommonsFiles(seeds: readonly LogoSeed[]): Promise<ReadonlyMap<string, string>> {
  const titles = seeds.map((seed) => seed.wikipedia);
  const items = await mapChunked(chunk(titles, 20), 1, wikidataItemsForTitles);
  const byTitle = new Map(items.flatMap((group) => [...group]));

  const ids = [...new Set([...byTitle.values()])];
  const logos = await mapChunked(chunk(ids, 40), 1, logoFilesForItems);
  const byItem = new Map(logos.flatMap((group) => [...group]));

  return new Map(
    titles.flatMap((title) => {
      const item = byTitle.get(title);
      const file = item ? byItem.get(item) : undefined;
      return file ? [[title, file] as const] : [];
    }),
  );
}

async function wikidataItemsForTitles(titles: readonly string[]): Promise<ReadonlyMap<string, string>> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    redirects: "1",
    prop: "pageprops",
    ppprop: "wikibase_item",
    titles: titles.join("|"),
  }).toString();

  const data = (await getJson(url)) as {
    query: {
      normalized?: readonly { from: string; to: string }[];
      redirects?: readonly { from: string; to: string }[];
      pages?: readonly { title: string; pageprops?: { wikibase_item?: string } }[];
    };
  };

  const normalized = new Map((data.query.normalized ?? []).map((row) => [row.from, row.to]));
  const redirects = new Map((data.query.redirects ?? []).map((row) => [row.from, row.to]));
  const pages = new Map((data.query.pages ?? []).map((page) => [page.title, page.pageprops?.wikibase_item]));

  return new Map(
    titles.flatMap((title) => {
      const settled = redirects.get(normalized.get(title) ?? title) ?? normalized.get(title) ?? title;
      const item = pages.get(settled);
      return item ? [[title, item] as const] : [];
    }),
  );
}

async function logoFilesForItems(ids: readonly string[]): Promise<ReadonlyMap<string, string>> {
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.search = new URLSearchParams({
    action: "wbgetentities",
    format: "json",
    props: "claims",
    ids: ids.join("|"),
  }).toString();

  const data = (await getJson(url)) as {
    entities: Record<string, { claims?: Record<string, readonly { mainsnak?: { datavalue?: { value?: string } } }[]> }>;
  };

  return new Map(
    Object.entries(data.entities).flatMap(([id, entity]) => {
      const values = (entity.claims?.P154 ?? [])
        .map((claim) => claim.mainsnak?.datavalue?.value)
        .filter((value): value is string => typeof value === "string");
      const svg = values.find((value) => /\.svg$/i.test(value));
      return svg ? [[id, svg] as const] : [];
    }),
  );
}

async function getJson(url: URL): Promise<unknown> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!response.ok) throw new Error(`${url.host}: HTTP ${response.status}`);
  return response.json();
}
