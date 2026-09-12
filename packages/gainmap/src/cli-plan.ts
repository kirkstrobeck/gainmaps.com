import { stat } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { flagBool, flagString, parseArgs } from "#src/args.js";
import {
  DEFAULT_SUFFIX,
  isJpegOutputPath,
  isKnownOutputExtension,
  normalizeOutType,
  planInPlace,
  planOutputs,
  stripExtension,
} from "#src/output-path.js";

export function stripConvert(positionals: readonly string[]): readonly string[] {
  if (positionals[0] === "convert") return positionals.slice(1);
  return positionals;
}

export function assertInPlaceAllowed(
  flags: ReturnType<typeof parseArgs>["flags"],
  stdin: boolean,
  stdout: boolean,
): void {
  if (!flagBool(flags, "in-place")) return;
  if (flagString(flags, "output") != null) {
    throw new Error("--in-place must be used without --output");
  }
  if (stdout) {
    throw new Error("--in-place must be used without --stdout");
  }
  if (flagBool(flags, "no-clobber")) {
    throw new Error("--in-place must be used without --no-clobber");
  }
  if (stdin) {
    throw new Error("--in-place requires a file path, not stdin");
  }
}

function assertJpegInputsForInPlace(files: readonly string[]): void {
  const bad = files.find((file) => !isJpegOutputPath(file));
  if (bad == null) return;
  throw new Error(
    "--in-place requires a JPEG input; default copy writes " +
      stripExtension(basename(bad)) +
      "-gain.jpg, or use -o",
  );
}

function resolveSuffix(explicit: string | undefined, outputDest: boolean): string {
  if (outputDest) return explicit ?? "";
  return explicit ?? DEFAULT_SUFFIX;
}

function resolveOutType(
  flags: ReturnType<typeof parseArgs>["flags"],
  output: string | undefined,
  stdout: boolean,
): string | undefined {
  const raw = flagString(flags, "out-type");
  if (raw == null) return undefined;
  const normalized = normalizeOutType(raw);
  if (output == null || output === "-" || stdout) {
    throw new Error("--out-type requires --out/--output");
  }
  return normalized;
}

async function statOrNull(path: string): Promise<Awaited<ReturnType<typeof stat>> | null> {
  try {
    return await stat(path);
  } catch {
    return null;
  }
}

async function assertDirectoryOutput(path: string): Promise<void> {
  if (path.endsWith("/") || path.endsWith(String.fromCharCode(92))) return;
  const info = await statOrNull(path);
  if (info?.isDirectory()) return;
  if (info == null && !isKnownOutputExtension(path)) return;
  throw new Error("--output must be a directory when converting multiple files or using --recursive");
}

async function isDirectory(path: string | undefined, outType: string | undefined): Promise<boolean> {
  if (path == null || path === "-") return false;
  if (path.endsWith("/") || path.endsWith(String.fromCharCode(92))) return true;
  const info = await statOrNull(path);
  if (info?.isDirectory()) return true;
  if (info?.isFile()) return false;
  if (isKnownOutputExtension(path)) return false;
  if (outType != null) return true;
  return false;
}

function commonRoot(inputs: readonly string[], cwd: string): string {
  if (inputs.length === 1) return resolve(cwd, inputs[0]!);
  return cwd;
}

export async function plansFor(
  flags: ReturnType<typeof parseArgs>["flags"],
  files: readonly string[],
  state: { readonly inputs: readonly string[]; readonly stdout: boolean },
  cwd: string,
): Promise<ReturnType<typeof planOutputs>> {
  if (flagBool(flags, "in-place")) {
    assertJpegInputsForInPlace(files);
    return planInPlace(files);
  }
  const output = flagString(flags, "output");
  const outType = resolveOutType(flags, output, state.stdout);
  const usingOutputDest = output != null && output !== "-" && !state.stdout;
  const recursive = flagBool(flags, "recursive");
  const requireDirectory = usingOutputDest && (recursive || files.length > 1);
  if (requireDirectory) await assertDirectoryOutput(output!);
  const root = commonRoot(state.inputs, cwd);
  return planOutputs(files, {
    output,
    suffix: resolveSuffix(flagString(flags, "suffix"), usingOutputDest),
    stdout: state.stdout,
    outputIsDirectory: requireDirectory || (await isDirectory(output, outType)),
    root: recursive ? root : undefined,
    outType,
  });
}
