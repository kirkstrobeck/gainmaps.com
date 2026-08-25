import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, it, vi } from "vitest";
import sharp from "sharp";

import Base, { reportCrash, run, shouldRunMain, USAGE } from "#src/cli.js";

const logs: { stdout: string; stderr: string } = { stdout: "", stderr: "" };

function capture() {
  logs.stdout = "";
  logs.stderr = "";
  vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    logs.stdout += String(chunk);
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    logs.stderr += String(chunk);
    return true;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

async function png(dir: string, name: string) {
  const path = join(dir, name);
  await writeFile(path, await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).png().toBuffer());
  return path;
}

describe("cli", () => {
  it("prints help and version", async () => {
    capture();
    assert.equal(await run(["--help"]), 0);
    assert.ok(logs.stdout.includes("gainmap"));
    assert.ok(USAGE.includes("--recursive"));
    assert.equal(await run(["-V"]), 0);
    assert.match(logs.stdout, /gainmap 1\.0\.0/);
    assert.ok(logs.stdout.includes("github.com/kirkstrobeck/gainmaps.com") || USAGE.includes("github.com/kirkstrobeck/gainmaps.com"));
    assert.ok(USAGE.includes("Contributions welcome"));
    assert.equal(await run(["update"]), 0);
    assert.ok(logs.stderr.includes("git pull") || logs.stderr.includes("Docker") || logs.stderr.includes("Updating"));
  });

  it("rejects missing input and bad flags", async () => {
    capture();
    assert.equal(await run([]), 2);
    assert.equal(await run(["--model", "nope", "x.png"]), 2);
    assert.equal(await run(["--matte", "nope", "x.png"]), 2);
    assert.equal(await run(["--quality", "0", "x.png"]), 2);
    assert.equal(await run(["--quality", "101", "x.png"]), 2);
    assert.equal(await run(["--boost", "2", "x.png"]), 2);
    assert.equal(await run(["--max-size", "0", "x.png"]), 2);
    assert.equal(await run(["--jobs", "-3", "x.png"]), 2);
  });

  it("converts a file, convert alias, dry-run, and empty directory", async () => {
    capture();
    const dir = await mkdtemp(join(tmpdir(), "gainmap-cli-"));
    const input = await png(dir, "shot.png");
    assert.equal(await run(["convert", input, "-o", join(dir, "out.jpg"), "-v"]), 0);
    assert.equal(await run([input, "-n"]), 0);
    assert.ok(logs.stderr.includes("->"));
    const empty = join(dir, "empty");
    await mkdir(empty);
    assert.equal(await run([empty]), 2);
    assert.equal(await run([join(dir, "missing.png")]), 2);
  });

  it("handles recursive dir output, exclude, force, and quiet", async () => {
    capture();
    const dir = await mkdtemp(join(tmpdir(), "gainmap-tree-"));
    const nested = join(dir, "nested");
    await mkdir(nested);
    await png(dir, "a.png");
    await png(nested, "b.png");
    const out = join(dir, "out");
    await mkdir(out);
    assert.equal(await run(["-R", dir, "-o", out + "/", "--exclude", "**/nested/**", "--quiet", "-j", "1"]), 0);
    assert.equal(await run(["-r", dir, "-o", out, "-f", "--quality", "80", "--boost", "0.2", "--headroom", "3", "--model", "window", "--matte", "checkerboard", "--max-size", "64", "--suffix", "-hdr"]), 0);
    await writeFile(join(dir, "bad.png"), Buffer.from("not-a-png"));
    assert.equal(await run([join(dir, "bad.png"), "--continue", "-o", out, "-f"]), 1);
  });

  it("covers main helpers and Base", async () => {
    capture();
    assert.equal(shouldRunMain(undefined, import.meta.url), false);
    assert.equal(shouldRunMain("/nope.js", import.meta.url), false);
    assert.equal(shouldRunMain(fileURLToPath(import.meta.url), import.meta.url), true);
    reportCrash(new Error("boom"));
    reportCrash("boom");
    const prev = process.argv;
    process.argv = ["node", "cli", "--help"];
    await Base();
    process.argv = ["node", "cli"];
    await Base();
    process.argv = prev;
  });

  it("notices a newer version and supports auto-update", async () => {
    capture();
    const cache = await mkdtemp(join(tmpdir(), "gainmap-notice-"));
    vi.stubEnv("GAINMAP_NO_UPDATE_CHECK", "");
    vi.stubEnv("GAINMAP_CACHE_DIR", cache);
    delete process.env.GAINMAP_NO_UPDATE_CHECK;
    vi.stubGlobal("fetch", async () => ({ ok: true, json: async () => ({ version: "9.9.9" }) }));
    assert.equal(await run(["--help"]), 0);
    assert.ok(logs.stderr.includes("9.9.9"));
    assert.equal(await run(["--self-update"]), 0);
    const dir = await mkdtemp(join(tmpdir(), "gainmap-auto-"));
    const input = await png(dir, "shot.png");
    assert.equal(await run([input, "-n", "--auto-update"]), 0);
    assert.ok(logs.stderr.includes("Updated") || logs.stderr.includes("Re-run"));
    assert.equal(await run([input, "-n", "--offline"]), 0);
  });
});
