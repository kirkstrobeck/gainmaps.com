#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { flagBool, flagString, flagStrings, parseArgs } from "#src/args.js";
import { convertOptions } from "#src/cli-options.js";
import { assertInPlaceAllowed, plansFor, stripConvert } from "#src/cli-plan.js";
import { convertPlans, formatError } from "#src/convert.js";
import { collectInputs, parseExtensionList } from "#src/walk.js";
import { runExtractSdr } from "#src/extract-sdr-cmd.js";
import { checkUpdate, printUpdateNotice, selfUpdate, shouldSkipUpdateCheck } from "#src/update.js";
import { readPackageVersion } from "#src/version.js";
import { usage, USAGE } from "#src/usage.js";

export { USAGE };

export async function run(argv: readonly string[]): Promise<number> {
  try {
    return await runUnguarded(argv);
  } catch (error) {
    process.stderr.write("error: " + formatError(error) + String.fromCharCode(10));
    return exitCodeFor(error);
  }
}

async function runUnguarded(argv: readonly string[]): Promise<number> {
  const parsed = parseArgs(argv);
  const skipCheck = shouldSkipUpdateCheck(process.env, {
    quiet: flagBool(parsed.flags, "quiet"),
    offline: flagBool(parsed.flags, "offline"),
    noUpdateCheck: flagBool(parsed.flags, "no-update-check"),
  });
  const latestPromise = skipCheck ? Promise.resolve(null) : checkUpdate();
  if (flagBool(parsed.flags, "help")) {
    process.stdout.write(usage() + String.fromCharCode(10));
    return finishWithNotice(0, await latestPromise, false);
  }
  if (flagBool(parsed.flags, "version")) {
    process.stdout.write("gainmap " + readPackageVersion() + String.fromCharCode(10));
    return finishWithNotice(0, await latestPromise, false);
  }
  const isUpdateCmd =
    flagBool(parsed.flags, "update") ||
    flagBool(parsed.flags, "self-update") ||
    parsed.positionals[0] === "update";
  if (isUpdateCmd) return selfUpdate();
  const isAutoUpdate = flagBool(parsed.flags, "auto-update") || process.env.GAINMAP_AUTO_UPDATE === "1";
  if (parsed.positionals[0] === "extract-sdr") {
    return finishWithNotice(await runExtractSdr(parsed), await latestPromise, isAutoUpdate);
  }
  const positionals = stripConvert(parsed.positionals);
  const stdin = flagBool(parsed.flags, "stdin") || positionals.includes("-");
  const stdout = flagBool(parsed.flags, "stdout") || flagString(parsed.flags, "output") === "-";
  const inputs = stdin ? ["-"] : positionals;
  if (inputs.length === 0) {
    process.stderr.write("error: missing input" + String.fromCharCode(10)+String.fromCharCode(10) + usage() + String.fromCharCode(10));
    return 2;
  }
  const code = await execute({ argv: parsed, inputs, stdin, stdout });
  return finishWithNotice(code, await latestPromise, isAutoUpdate);
}

async function finishWithNotice(code: number, latest: string | null, autoUpdate: boolean): Promise<number> {
  if (latest == null) return code;
  if (autoUpdate) {
    const updated = await selfUpdate();
    process.stderr.write("Updated. Re-run your command." + String.fromCharCode(10));
    if (updated !== 0) return updated;
    return code;
  }
  printUpdateNotice(readPackageVersion(), latest);
  return code;
}

async function execute(state: {
  argv: ReturnType<typeof parseArgs>;
  inputs: readonly string[];
  stdin: boolean;
  stdout: boolean;
}): Promise<number> {
  const flags = state.argv.flags;
  assertInPlaceAllowed(flags, state.stdin, state.stdout);
  const options = convertOptions(flags);
  const cwd = process.cwd();
  const files = state.stdin ? ["-"] : await collectInputs(state.inputs, {
    recursive: flagBool(flags, "recursive"),
    extensions: parseExtensionList(flagString(flags, "ext")),
    exclude: flagStrings(flags, "exclude"),
  }, cwd);
  if (files.length === 0) throw Object.assign(new Error("no matching images"), { code: "EMPTY" });
  const plans = await plansFor(flags, files, state, cwd);
  const stdinBytes = state.stdin ? await readStdin() : undefined;
  const { failures } = await convertPlans(plans, options, stdinBytes);
  if (failures > 0) return 1;
  return 0;
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

export function exitCodeFor(error: unknown): number {
  if (typeof error === "object" && error != null && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "EMPTY" || code === "UNSUPPORTED" || code === "ENOENT") return 2;
  }
  const message = formatError(error);
  if (message.startsWith("missing") || message.includes("requires") || message.includes("must be")) return 2;
  if (message.includes("no matching") || message.toLowerCase().includes("unsupported")) return 2;
  return 1;
}

export function shouldRunMain(main: string | undefined, moduleUrl: string): boolean {
  if (main == null) return false;
  const modulePath = fileURLToPath(moduleUrl);
  const resolvedMain = resolve(main);
  try {
    return realpathSync(modulePath) === realpathSync(resolvedMain);
  } catch {
    return modulePath === resolvedMain;
  }
}

export function reportCrash(error: unknown): void {
  process.stderr.write("error: " + formatError(error) + String.fromCharCode(10));
  process.exitCode = 1;
}

export default async function Base(): Promise<void> {
  const code = await run(process.argv.slice(2));
  if (code !== 0) process.exitCode = code;
}

export function startIfMain(main: string | undefined, url: string, start: () => Promise<void> = Base): void {
  if (!shouldRunMain(main, url)) return;
  start().catch(reportCrash);
}

startIfMain(process.argv[1], import.meta.url);
