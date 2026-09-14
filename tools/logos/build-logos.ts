#!/usr/bin/env npx tsx
// Gainmaps by Kirk Strobeck – https://gainmaps.com

/**
 * Public logo build entry point.
 *
 * Audit first, then derive exactly that audit's deterministic KEEP set. The
 * audit measures checked-in logo.svg for shipped slugs and only normalizes a
 * fetched source for unshipped slugs, so approved encoded assets stay intact.
 */
await import("./run-audit.ts");
await import("./derive-logo-assets.ts");
