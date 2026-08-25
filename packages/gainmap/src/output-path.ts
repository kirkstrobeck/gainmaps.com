import { basename, dirname, extname, join, relative } from "node:path";

export const DEFAULT_SUFFIX = "-gainmap";

export type OutputPlan = {
  readonly input: string;
  readonly output: string | null;
  readonly stdout: boolean;
};

export function stripExtension(name: string): string {
  const ext = extname(name);
  if (ext === "") return name;
  return name.slice(0, -ext.length);
}

function preservedOrJpegExt(input: string): string {
  const ext = extname(input);
  const lower = ext.toLowerCase();
  if (lower === ".jpg" || lower === ".jpeg") return ext;
  return ".jpg";
}

export function defaultOutputPath(input: string, suffix = DEFAULT_SUFFIX): string {
  return join(dirname(input), stripExtension(basename(input)) + suffix + preservedOrJpegExt(input));
}

export function planOutputs(
  inputs: readonly string[],
  options: {
    readonly output?: string;
    readonly suffix: string;
    readonly stdout: boolean;
    readonly outputIsDirectory: boolean;
    readonly root?: string;
  },
): readonly OutputPlan[] {
  if (options.stdout) {
    if (inputs.length !== 1) throw new Error("--stdout requires exactly one input");
    return [{ input: inputs[0]!, output: null, stdout: true }];
  }
  if (options.output == null) {
    return inputs.map((input) => ({ input, output: defaultOutputPath(input, options.suffix), stdout: false }));
  }
  if (options.output === "-") {
    if (inputs.length !== 1) throw new Error("-o - requires exactly one input");
    return [{ input: inputs[0]!, output: null, stdout: true }];
  }
  if (inputs.length === 1 && !options.outputIsDirectory) {
    return [{ input: inputs[0]!, output: options.output, stdout: false }];
  }
  return inputs.map((input) => ({
    input,
    output: join(options.output!, relativeOutput(input, options.root, options.suffix)),
    stdout: false,
  }));
}

function relativeOutput(input: string, root: string | undefined, suffix: string): string {
  const base = stripExtension(basename(input)) + suffix + preservedOrJpegExt(input);
  if (root == null) return base;
  const rel = relative(root, dirname(input));
  if (!rel) return base;
  return join(rel, base);
}
