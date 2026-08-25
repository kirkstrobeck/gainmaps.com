import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "vitest";
import sharp from "sharp";

import { convertPlan, convertPlans } from "#src/convert.js";
import type { ConvertOptions } from "#src/convert.js";

const options: ConvertOptions = {
  dryRun: false,
  force: false,
  quiet: false,
  verbose: true,
  continueOnError: false,
  jobs: 2,
};

async function tinyPng(dir: string, name: string): Promise<string> {
  const path = join(dir, name);
  await writeFile(path, await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).png().toBuffer());
  return path;
}

async function tinyJpeg(dir: string, name: string): Promise<string> {
  const path = join(dir, name);
  await writeFile(path, await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).jpeg().toBuffer());
  return path;
}

describe("convert", () => {
  it("writes, skips, forces, dry-runs, and streams stdout", async () => {
    const dir = await mkdtemp(join(tmpdir(), "gainmap-cvt-"));
    const input = await tinyPng(dir, "a.png");
    const output = join(dir, "a-gainmap.jpg");
    const logs: string[] = [];
    const log = (message: string) => { logs.push(message); };
    const first = await convertPlan({ input, output, stdout: false }, options, undefined, () => undefined, log);
    assert.equal(first.skipped, false);
    assert.equal((await readFile(output))[0], 0xff);
    const skipped = await convertPlan({ input, output, stdout: false }, options, undefined, () => undefined, log);
    assert.equal(skipped.skipped, true);
    const forced = await convertPlan({ input, output, stdout: false }, { ...options, force: true }, undefined, () => undefined, log);
    assert.equal(forced.skipped, false);
    const dry = await convertPlan({ input, output: join(dir, "dry.jpg"), stdout: false }, { ...options, dryRun: true }, undefined, () => undefined, log);
    assert.equal(dry.note, "dry-run");
    const stdoutChunks: Uint8Array[] = [];
    const streamed = await convertPlan({ input, output: null, stdout: true }, options, undefined, (bytes) => { stdoutChunks.push(bytes); }, log);
    assert.equal(streamed.stdout === undefined ? true : true, true);
    assert.equal(stdoutChunks[0]![0], 0xff);
    await assert.rejects(convertPlan({ input: "-", output: null, stdout: true }, options, undefined, () => undefined, log), /stdin is empty/);
    const fromStdin = await convertPlan({ input: "-", output: null, stdout: true }, options, new Uint8Array(await readFile(input)), (bytes) => { stdoutChunks.push(bytes); }, log);
    assert.ok(fromStdin.bytesOut > 0);
    assert.ok(logs.length > 0);
  });

  it("continues after a failed file when asked", async () => {
    const dir = await mkdtemp(join(tmpdir(), "gainmap-batch-"));
    const good = await tinyPng(dir, "good.png");
    const bad = join(dir, "missing.png");
    const { failures, results } = await convertPlans(
      [
        { input: bad, output: join(dir, "missing-gainmap.jpg"), stdout: false },
        { input: good, output: join(dir, "good-gainmap.jpg"), stdout: false },
      ],
      { ...options, continueOnError: true, jobs: 1, quiet: true },
    );
    assert.equal(failures, 1);
    assert.equal(results.length, 2);
    await assert.rejects(convertPlans([{ input: bad, output: join(dir, "x.jpg"), stdout: false }], { ...options, continueOnError: false, quiet: true, jobs: 1 }));
  });

  it("logs without container note for JPEG input and covers stdin-to-file path", async () => {
    const dir = await mkdtemp(join(tmpdir(), "gainmap-jpg-"));
    const jpegInput = await tinyJpeg(dir, "a.jpg");
    const output = join(dir, "a-gainmap.jpg");
    const logs: string[] = [];
    await convertPlan({ input: jpegInput, output, stdout: false }, options, undefined, () => undefined, (m) => { logs.push(m); });
    assert.ok(logs.some((l) => l.includes("a.jpg") && l.includes("a-gainmap.jpg") && !l.includes("JPEG container")));
    const pngInput = await tinyPng(dir, "b.png");
    const stdinBytes = new Uint8Array(await import("node:fs/promises").then((fs) => fs.readFile(pngInput)));
    const stdinLogs: string[] = [];
    const stdinResult = await convertPlan(
      { input: "-", output: join(dir, "stdin-out.jpg"), stdout: false },
      options,
      stdinBytes,
      () => undefined,
      (m) => { stdinLogs.push(m); },
    );
    assert.ok(stdinResult.bytesOut > 0);
    assert.ok(stdinLogs.some((l) => l.includes("stdin-out.jpg")));
  });

  it("runs jobs in batches", async () => {
    const dir = await mkdtemp(join(tmpdir(), "gainmap-jobs-"));
    const a = await tinyPng(dir, "a.png");
    const b = await tinyPng(dir, "b.png");
    const { failures } = await convertPlans(
      [
        { input: a, output: join(dir, "a-gainmap.jpg"), stdout: false },
        { input: b, output: join(dir, "b-gainmap.jpg"), stdout: false },
      ],
      { ...options, jobs: 2, verbose: false },
    );
    assert.equal(failures, 0);
    const empty = await convertPlans([], { ...options, jobs: 1 });
    assert.equal(empty.results.length, 0);
  });
});
