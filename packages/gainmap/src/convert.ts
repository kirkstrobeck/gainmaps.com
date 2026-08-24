import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { decodeImage } from "#src/decode.js";
import { encodeRgbaToUltraHdrJpeg, type GainMapEncodeOptions } from "#src/encode.js";
import type { OutputPlan } from "#src/output-path.js";

export type ConvertOptions = GainMapEncodeOptions & {
  readonly dryRun: boolean;
  readonly force: boolean;
  readonly maxSize?: number;
  readonly quiet: boolean;
  readonly verbose: boolean;
  readonly continueOnError: boolean;
  readonly jobs: number;
};

export type ConvertResult = {
  readonly input: string;
  readonly output: string | null;
  readonly skipped: boolean;
  readonly bytesOut: number;
  readonly note: string;
};

export async function convertPlans(
  plans: readonly OutputPlan[],
  options: ConvertOptions,
  stdinBytes?: Uint8Array,
  writeStdout: (bytes: Uint8Array) => void = (bytes) => { process.stdout.write(bytes); },
  log: (message: string) => void = (message) => { process.stderr.write(message + "
"); },
): Promise<{ readonly results: readonly ConvertResult[]; readonly failures: number }> {
  const batches = await mapLimit(plans, options.jobs, (plan, index) =>
    convertOne(plan, options, stdinBytes, writeStdout, (message) => {
      if (options.quiet) return;
      if (options.verbose || plans.length > 1) log(progress(index + 1, plans.length, message));
    }),
  );
  return { results: batches.map((item) => item.result), failures: batches.filter((item) => item.failed).length };
}

async function convertOne(
  plan: OutputPlan,
  options: ConvertOptions,
  stdinBytes: Uint8Array | undefined,
  writeStdout: (bytes: Uint8Array) => void,
  log: (message: string) => void,
): Promise<{ readonly result: ConvertResult; readonly failed: boolean }> {
  try {
    const result = await convertPlan(plan, options, stdinBytes, writeStdout, log);
    return { result, failed: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("error: " + plan.input + ": " + message);
    if (!options.continueOnError) throw error;
    return {
      result: { input: plan.input, output: plan.output, skipped: true, bytesOut: 0, note: message },
      failed: true,
    };
  }
}

export async function convertPlan(
  plan: OutputPlan,
  options: ConvertOptions,
  stdinBytes: Uint8Array | undefined,
  writeStdout: (bytes: Uint8Array) => void,
  log: (message: string) => void,
): Promise<ConvertResult> {
  if (plan.output != null && !options.force && !options.dryRun && (await exists(plan.output))) {
    log("skip " + plan.input + " -> " + plan.output);
    return { input: plan.input, output: plan.output, skipped: true, bytesOut: 0, note: "exists" };
  }
  if (options.dryRun) {
    const dest = plan.stdout ? "-" : plan.output;
    log(plan.input + " -> " + dest);
    return { input: plan.input, output: plan.output, skipped: false, bytesOut: 0, note: "dry-run" };
  }
  const inputBytes = await inputBytesFor(plan.input, stdinBytes);
  const raster = await decodeImage(inputBytes, plan.input, options.maxSize);
  const encoded = encodeRgbaToUltraHdrJpeg(raster.pixels, raster.width, raster.height, options);
  if (plan.stdout) {
    writeStdout(encoded.output);
    return { input: plan.input, output: null, skipped: false, bytesOut: encoded.output.byteLength, note: encoded.note };
  }
  await mkdir(dirname(plan.output!), { recursive: true });
  await writeFile(plan.output!, encoded.output);
  log(plan.input + " -> " + plan.output);
  return { input: plan.input, output: plan.output, skipped: false, bytesOut: encoded.output.byteLength, note: encoded.note };
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function inputBytesFor(input: string, stdinBytes: Uint8Array | undefined): Promise<Uint8Array> {
  if (input !== "-") return new Uint8Array(await readFile(input));
  if (stdinBytes == null) throw new Error("stdin is empty");
  return stdinBytes;
}

function progress(index: number, total: number, message: string): string {
  return index + "/" + total + " " + message;
}

async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<readonly R[]> {
  if (items.length === 0) return [];
  const concurrency = Math.max(1, limit);
  const batch = items.slice(0, concurrency);
  const rest = items.slice(concurrency);
  const done = await Promise.all(batch.map((item, index) => fn(item, index)));
  const more = await mapLimit(rest, concurrency, (item, index) => fn(item, index + batch.length));
  return [...done, ...more];
}
