// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Low-level shared primitives for the logo pipeline: fetch/retry, rasterize,
 * and small array helpers.
 *
 * `tools/logos/build-logos.ts` (full-tree rebuild) and
 * `tools/logos/backfill-logo-assets.ts` (targeted per-slug backfill) both
 * need this path — resolution lives alongside it in ./logo-resolve.ts, and
 * SVG post-processing in ./logo-svg-normalize.ts, split out to keep each file
 * under this repo's 200-line limit.
 */
import sharp from "sharp";

/** Wikimedia asks automated clients to identify themselves with a contact. */
export const USER_AGENT = "gainmaps-logo-pipeline/1.0 (https://gainmaps.com; kirk@strobeck.com)";
export const CANVAS = 1024;
/**
 * The mark fills the canvas. Breathing room is the tile's job in CSS, and the
 * display mask is the same SVG contain-fitted to the same square — an inset
 * baked in here would land the mask a few percent off the ink it must cover.
 */
export const LOGO_BOX = CANVAS;
export const BOOST = 1.0;
export const MAX_SVG_BYTES = 3 * 1024 * 1024;
export const FETCH_CONCURRENCY = 4;
/**
 * en.wikipedia's Special:FilePath is served by the app servers, not the image
 * CDN, and it throttles a run this size with a 429 partway through. Backing off
 * and retrying costs a few seconds; not retrying costs the logo.
 */
export const RETRY_STATUSES = new Set([429, 503]);
export const MAX_RETRIES = 5;
export const RETRY_BASE_MS = 2000;

/**
 * librsvg renders at 72 dpi against the SVG's intrinsic size, so a 24px icon
 * would come out 24px. Scale the density instead of upscaling the bitmap.
 */
export async function rasterize(svg: Buffer): Promise<Uint8Array> {
  const probe = await sharp(svg).metadata();
  const longest = Math.max(probe.width ?? LOGO_BOX, probe.height ?? LOGO_BOX);
  const density = Math.min(2400, Math.max(72, Math.round((72 * LOGO_BOX) / Math.max(longest, 1))));

  const logo = await sharp(svg, { density })
    .resize({ width: LOGO_BOX, height: LOGO_BOX, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const { data } = await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (inkCoverage(pixels) < 0.002) throw new Error("rendered blank");
  return pixels;
}

/**
 * librsvg can silently render nothing; a logo that leaves no ink is a failure.
 * Ink is anything not transparent — a white wordmark on a transparent canvas is
 * a logo, not a blank, so colour tells us nothing here and alpha tells us all.
 */
export function inkCoverage(pixels: Uint8Array): number {
  const count = pixels.length / 4;
  const inked = Array.from({ length: count }, (_, index) => index).filter(
    (index) => pixels[index * 4 + 3]! > 8,
  ).length;
  return inked / count;
}

export async function downloadSvg(url: string, attempt = 0): Promise<Buffer> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "image/svg+xml,*/*" } });
  if (RETRY_STATUSES.has(response.status) && attempt < MAX_RETRIES) {
    await sleep(retryDelay(response, attempt));
    return downloadSvg(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > MAX_SVG_BYTES) throw new Error(`SVG too large (${bytes.byteLength} bytes)`);
  // Commons files are sometimes namespace-prefixed at the root (`<svg:svg …>`).
  if (!/<(?:[\w-]+:)?svg[\s>]/i.test(bytes.subarray(0, 4096).toString("utf8"))) {
    throw new Error("response is not an SVG");
  }
  return bytes;
}

/** Honour Retry-After when the server sends one, exponential backoff otherwise. */
export function retryDelay(response: Response, attempt: number): number {
  const header = Number(response.headers.get("retry-after"));
  if (Number.isFinite(header) && header > 0) return Math.min(header, 60) * 1000;
  return RETRY_BASE_MS * 2 ** attempt;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunk<T>(items: readonly T[], size: number): readonly (readonly T[])[] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  );
}

/** Sequential over chunks, parallel within one — polite to the upstream APIs. */
export async function mapChunked<T, R>(
  items: readonly T[],
  size: number,
  fn: (item: T) => Promise<R>,
): Promise<readonly R[]> {
  return chunk(items, size).reduce<Promise<readonly R[]>>(
    async (previous, group) => [...(await previous), ...(await Promise.all(group.map(fn)))],
    Promise.resolve([]),
  );
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
