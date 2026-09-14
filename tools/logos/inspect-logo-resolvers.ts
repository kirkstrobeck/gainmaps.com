#!/usr/bin/env npx tsx
import { fetchSvglIndex, resolveCommonsFiles } from "./logo-resolve.ts";
import { LOGO_SEEDS } from "./sources.ts";
const wanted = new Set(process.argv.slice(2));
const seeds = wanted.size ? LOGO_SEEDS.filter((seed) => wanted.has(seed.slug)) : LOGO_SEEDS;
const [svgl, commons] = await Promise.all([fetchSvglIndex(), resolveCommonsFiles(seeds)]);
for (const seed of seeds) {
  const entry = seed.svglTitle ? svgl.get(seed.svglTitle) : undefined;
  console.log(JSON.stringify({ slug: seed.slug, svgl: entry?.route, commons: commons.get(seed.wikipedia), override: seed.commonsFile }));
}
