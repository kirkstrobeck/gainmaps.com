#!/usr/bin/env node
import { stat } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

import { flagBool, flagNumber, flagString, flagStrings, parseArgs } from "#src/args.js";
import { convertPlans, type ConvertOptions } from "#src/convert.js";
import { collectInputs, parseExtensionList } from "#src/walk.js";
import { DEFAULT_SUFFIX, planOutputs } from "#src/output-path.js";

export const USAGE = `gainmap — convert images to Ultra HDR JPEG (ISO 21496-1 gain maps)

Usage
  gainmap [options] <input...>
  gainmap convert [options] <input...>

Input is a file, a directory, or - for stdin. Directories convert matching
images in that folder. Use -R/--recursive for nested trees.

Output
  -o, --output <path>   File, directory, or - for stdout
      --suffix <str>    Default -gainmap (photo.jpg -> photo-gainmap.jpg)
  -f, --force           Overwrite existing outputs
      --no-clobber      Skip existing outputs (default)
  -n, --dry-run         Print planned paths, write nothing
      --stdout          Write one conversion to stdout
      --stdin           Read image bytes from stdin

Conversion
  -q, --quality <1-100> JPEG quality of the SDR base (default 92)
      --boost <0-1>     HDR boost (default 0.5)
      --headroom <n>    Explicit headroom; overrides --boost
      --model <name>    highlight (default) | window
      --matte <name>    white (default) | checkerboard
      --max-size <px>   Fit longest edge before encode

Walk
  -R, -r, --recursive   Recurse into directories (flat-only without this)
      --ext <list>      Comma-separated extensions
      --exclude <glob>  Skip matching paths (repeatable)

Runtime
  -j, --jobs <n>        Parallel conversions (default: CPU count, max 8)
  -v, --verbose         Log every file to stderr
      --quiet           Errors only
      --continue        Keep going after a failed file
  -h, --help            Show this help
  -V, --version         Print version

Exit codes
  0  success   1  conversion error   2  usage / missing / empty input

Examples
  gainmap photo.jpg
  gainmap photo.jpg -o hdr.jpg
  gainmap ./shots
  gainmap -R ./shots -o ./out
  gainmap -R --exclude "**/raw/**" ./shots
  cat photo.png | gainmap --stdin --stdout > photo-gainmap.jpg
  gainmap --boost 1 --matte checkerboard logo.png
  gainmap -n -R ./shots
`;

export async function run(argv: readonly string[]): Promise<number> {
  const parsed = parseArgs(argv);
  if (flagBool(parsed.flags, "help")) {
    process.stdout.write(USAGE + "
");
    return 0;
  }
  if (flagBool(parsed.flags, "version")) {
    process.stdout.write(readVersion() + "
");
    return 0;
  }
  const positionals = stripConvert(parsed.positionals);
  const stdin = flagBool(parsed.flags, "stdin") || positionals.includes("-");
  const stdout = flagBool(parsed.flags, "stdout") || flagString(parsed.flags, "output") === "-";
  const inputs = stdin ? ["-"] : positionals;
  if (inputs.length === 0) {
    process.stderr.write("error: missing input

" + USAGE + "
");
    return 2;
  }
  try {
    return await execute({ argv: parsed, inputs, stdin, stdout });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write("error: " + message + "
");
    return exitCodeFor(error);
  }
}

async function execute(state: {
  argv: ReturnType<typeof parseArgs>;
  inputs: readonly string[];
  stdin: boolean;
  stdout: boolean;
}): Promise<number> {
  const flags = state.argv.flags;
  const cwd = process.cwd();
  const files = state.stdin ? ["-"] : await collectInputs(state.inputs, {
    recursive: flagBool(flags, "recursive"),
    extensions: parseExtensionList(flagString(flags, "ext")),
    exclude: flagStrings(flags, "exclude"),
  }, cwd);
  if (files.length === 0) throw Object.assign(new Error("no matching images"), { code: "EMPTY" });
  const output = flagString(flags, "output");
  const outputIsDirectory = await isDirectory(output);
  const plans = planOutputs(files, {
    output,
    suffix: flagString(flags, "suffix") ?? DEFAULT_SUFFIX,
    stdout: state.stdout,
    outputIsDirectory,
    root: commonRoot(state.inputs, cwd),
  });
  const options = convertOptions(flags);
  const stdinBytes = state.stdin ? await readStdin() : undefined;
  const { failures } = await convertPlans(plans, options, stdinBytes);
  if (failures > 0) return 1;
  return 0;
}

function convertOptions(flags: ReturnType<typeof parseArgs>["flags"]): ConvertOptions {
  const model = flagString(flags, "model") ?? "highlight";
  if (model !== "highlight" && model !== "window") throw new Error("--model must be highlight or window");
  const matte = flagString(flags, "matte") ?? "white";
  if (matte !== "white" && matte !== "checkerboard") throw new Error("--matte must be white or checkerboard");
  const quality = flagNumber(flags, "quality");
  const boost = flagNumber(flags, "boost");
  const headroom = flagNumber(flags, "headroom");
  const maxSize = flagNumber(flags, "max-size");
  const jobs = flagNumber(flags, "jobs");
  if (quality != null && (quality < 1 || quality > 100)) throw new Error("--quality must be 1-100");
  if (boost != null && (boost < 0 || boost > 1)) throw new Error("--boost must be 0-1");
  if (maxSize != null && maxSize <= 0) throw new Error("--max-size must be positive");
  return {
    dryRun: flagBool(flags, "dry-run"),
    force: flagBool(flags, "force"),
    quiet: flagBool(flags, "quiet"),
    verbose: flagBool(flags, "verbose"),
    continueOnError: flagBool(flags, "continue"),
    jobs: clampJobs(jobs),
    quality,
    boost,
    headroom,
    maxSize,
    hdrModel: model,
    matte,
  };
}

function clampJobs(jobs: number | undefined): number {
  const cpus = Math.min(availableParallelism(), 8);
  if (jobs == null) return Math.max(1, cpus);
  return Math.max(1, Math.min(32, Math.floor(jobs)));
}

function stripConvert(positionals: readonly string[]): readonly string[] {
  if (positionals[0] === "convert") return positionals.slice(1);
  return positionals;
}

async function isDirectory(path: string | undefined): Promise<boolean> {
  if (path == null || path === "-") return false;
  if (path.endsWith("/") || path.endsWith("\")) return true;
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

function commonRoot(inputs: readonly string[], cwd: string): string {
  if (inputs.length === 1) return resolve(cwd, inputs[0]!);
  return cwd;
}

function readVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };
  void here;
  return pkg.version;
}

async function readStdin(): Promise<Uint8Array> {
  return new Uint8Array(Buffer.concat(await collect(process.stdin)));
}

async function collect(stream: AsyncIterable<Buffer>): Promise<Buffer[]> {
  const iter = stream[Symbol.asyncIterator]();
  return readNext(iter, []);
}

async function readNext(iter: AsyncIterator<Buffer>, acc: readonly Buffer[]): Promise<Buffer[]> {
  const step = await iter.next();
  if (step.done) return [...acc];
  return readNext(iter, [...acc, Buffer.from(step.value)]);
}

function exitCodeFor(error: unknown): number {
  if (typeof error === "object" && error != null && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "EMPTY" || code === "UNSUPPORTED" || code === "ENOENT") return 2;
  }
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith("missing") || message.includes("requires") || message.includes("must be")) return 2;
  if (message.includes("no matching") || message.includes("Unsupported")) return 2;
  return 1;
}

export default async function Base(): Promise<void> {
  const code = await run(process.argv.slice(2));
  if (code !== 0) process.exitCode = code;
}

const isMain = process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1]!);
if (isMain) {
  Base().catch((error: unknown) => {
    process.stderr.write("error: " + (error instanceof Error ? error.message : String(error)) + "
");
    process.exitCode = 1;
  });
}
