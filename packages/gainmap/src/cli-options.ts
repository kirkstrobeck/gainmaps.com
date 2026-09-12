import { availableParallelism } from "node:os";
import { flagBool, flagNumber, flagString, parseArgs } from "#src/args.js";

function parseHdrModel(raw: string | undefined): "highlight" | "window" {
  if (raw == null || raw === "highlight") return "highlight";
  if (raw === "window") return "window";
  throw new Error("--model must be highlight or window");
}

function parseMatte(raw: string | undefined): "white" | "checkerboard" {
  if (raw == null || raw === "white") return "white";
  if (raw === "checkerboard") return "checkerboard";
  throw new Error("--matte must be white or checkerboard");
}

function clampJobs(jobs: number | undefined): number {
  const cpus = Math.min(availableParallelism(), 8);
  if (jobs == null) return Math.max(1, cpus);
  return Math.max(1, Math.min(32, Math.floor(jobs)));
}

export function convertOptions(flags: ReturnType<typeof parseArgs>["flags"]) {
  const model = parseHdrModel(flagString(flags, "model"));
  const matte = parseMatte(flagString(flags, "matte"));
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
    force: flagBool(flags, "force") || flagBool(flags, "in-place"),
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
