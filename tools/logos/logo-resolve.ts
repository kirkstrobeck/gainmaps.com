// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Resolves a seed to a downloadable premium SVG URL: api.svgl.app first
 * (hand-curated brand SVGs), then the primary Wikipedia infobox image.
 */
import { USER_AGENT, mapChunked } from "./logo-pipeline.ts";
import type { LogoSeed } from "./sources.ts";

export type SvglEntry = {
  readonly title: string;
  readonly route?: string | { readonly light?: string; readonly dark?: string };
};

export type Resolved = {
  readonly seed: LogoSeed;
  readonly url: string;
  readonly source: "svgl" | "commons";
  readonly fileName: string;
};

export function resolveSeed(
  seed: LogoSeed,
  svgl: ReadonlyMap<string, SvglEntry>,
  commons: ReadonlyMap<string, string>,
): Resolved | { seed: LogoSeed; url: null } {
  if (seed.directSvgUrl) {
    return { seed, url: seed.directSvgUrl, source: "commons", fileName: fileNameFromUrl(seed.directSvgUrl) };
  }

  const fromSvgl = seed.svglTitle ? svglUrl(svgl.get(seed.svglTitle)) : null;
  if (fromSvgl) {
    return { seed, url: fromSvgl, source: "svgl", fileName: fileNameFromUrl(fromSvgl) };
  }

  const file = seed.commonsFile ?? commons.get(seed.wikipedia);
  if (file && /\.svg$/i.test(file)) {
    return { seed, url: commonsFilePath(file), source: "commons", fileName: file };
  }

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

function fileNameFromUrl(url: string): string {
  const path = new URL(url).pathname.split("/").at(-1) ?? url;
  return decodeURIComponent(path);
}

export async function fetchSvglIndex(): Promise<ReadonlyMap<string, SvglEntry>> {
  const response = await fetch("https://api.svgl.app", { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`svgl index: HTTP ${response.status}`);
  const entries = (await response.json()) as readonly SvglEntry[];
  return new Map(entries.map((entry) => [entry.title, entry]));
}

/** Resolve the first image in the article's primary infobox, never gallery/history art. */
export async function resolveCommonsFiles(seeds: readonly LogoSeed[]): Promise<ReadonlyMap<string, string>> {
  const titles = [...new Set(seeds.map((seed) => seed.wikipedia))];
  const rows = await mapChunked(titles, 4, primaryImageForTitle);
  return new Map(rows.filter((row): row is readonly [string, string] => row !== null));
}

async function primaryImageForTitle(title: string): Promise<readonly [string, string] | null> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "parse",
    format: "json",
    formatversion: "2",
    redirects: "1",
    prop: "text",
    page: title,
  }).toString();
  const data = (await getJson(url)) as { parse?: { text?: string } };
  const html = data.parse?.text ?? "";
  const start = html.search(/<table[^>]*class="[^"]*\binfobox\b/i);
  if (start < 0) return null;
  const end = matchingTableEnd(html, start);
  const image = html.slice(start, end).match(/<img\b[^>]*\bsrc="([^"]+)"/i)?.[1];
  if (!image) return null;
  const filePart = image.match(/\/([^/]+\.svg)\/[^/]+$/i)?.[1];
  if (!filePart) return null;
  const file = decodeURIComponent(filePart).replace(/&amp;.*$/, "");
  return [title, file];
}

function matchingTableEnd(html: string, start: number): number {
  const tags = html.slice(start).matchAll(/<\/?table\b[^>]*>/gi);
  let depth = 0;
  for (const match of tags) {
    if (!match[0].startsWith("</")) depth += 1;
    if (match[0].startsWith("</")) depth -= 1;
    if (depth === 0) return start + match.index + match[0].length;
  }
  return start;
}

async function getJson(url: URL): Promise<unknown> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!response.ok) throw new Error(`${url.host}: HTTP ${response.status}`);
  return response.json();
}
