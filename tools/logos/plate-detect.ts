// Gainmaps by Kirk Strobeck – https://gainmaps.com

export type Canvas = { x: number; y: number; width: number; height: number };
export type ElementRange = { start: number; end: number };

const DRAWABLE = new Set(["rect", "path", "circle", "ellipse", "polygon"]);
const NON_RENDERING = new Set(["defs", "clippath", "mask"]);
const COMMAND = /[MmLlHhVvCcSsQqTtAaZz]/g;
const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;

type PaintState = {
  fill: string;
  stroke: string;
  fillOpacity: number;
  strokeOpacity: number;
  hidden: boolean;
  skipped: boolean;
};
type Drawable = { tag: string; attrs: string; start: number; end: number };

function attr(attrs: string, name: string): string | undefined {
  const style = attrs.match(/\bstyle\s*=\s*["']([^"']*)["']/i)?.[1] ?? "";
  const styled = style.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`, "i"))?.[1];
  if (styled !== undefined) return styled.trim().toLowerCase();
  return attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1]?.trim().toLowerCase();
}

function nextState(parent: PaintState, tag: string, attrs: string): PaintState {
  const fill = attr(attrs, "fill") ?? parent.fill;
  const stroke = attr(attrs, "stroke") ?? parent.stroke;
  const fillOpacity = Number(attr(attrs, "fill-opacity") ?? parent.fillOpacity);
  const strokeOpacity = Number(attr(attrs, "stroke-opacity") ?? parent.strokeOpacity);
  const display = attr(attrs, "display");
  const visibility = attr(attrs, "visibility");
  const opacity = Number(attr(attrs, "opacity") ?? "1");
  return {
    fill,
    stroke,
    fillOpacity,
    strokeOpacity,
    hidden: parent.hidden || display === "none" || visibility === "hidden" || opacity === 0,
    skipped: parent.skipped || NON_RENDERING.has(tag),
  };
}

function isPainted(state: PaintState, attrs: string): boolean {
  if (state.hidden || state.skipped) return false;
  const hasFill = state.fill !== "none" && state.fillOpacity !== 0;
  const hasStroke = state.stroke !== "none" && state.strokeOpacity !== 0;
  return hasFill || hasStroke;
}

function paintedDrawables(svg: string): Drawable[] {
  const drawables: Drawable[] = [];
  const root: PaintState = {
    fill: "black",
    stroke: "none",
    fillOpacity: 1,
    strokeOpacity: 1,
    hidden: false,
    skipped: false,
  };
  const stack: PaintState[] = [root];
  const tags = /<!--[\s\S]*?-->|<\/?([a-z][\w:-]*)\b([^>]*?)>/gis;
  for (const match of svg.matchAll(tags)) {
    const full = match[0];
    if (full.startsWith("<!--")) continue;
    const tag = match[1]!.toLowerCase();
    if (full.startsWith("</")) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const attrs = match[2] ?? "";
    const state = nextState(stack.at(-1)!, tag, attrs);
    if (DRAWABLE.has(tag) && isPainted(state, attrs)) {
      const close = new RegExp(`<\\/${tag}\\s*>`, "gi");
      close.lastIndex = match.index! + full.length;
      const closeMatch = full.endsWith("/>") ? null : close.exec(svg);
      const end = closeMatch ? closeMatch.index + closeMatch[0].length : match.index! + full.length;
      drawables.push({ tag, attrs, start: match.index!, end });
    }
    if (!full.endsWith("/>")) stack.push(state);
  }
  return drawables;
}

function numbers(value: string): number[] {
  return [...value.matchAll(NUMBER)].map((match) => Number(match[0]));
}

function pathBounds(d: string): [number, number, number, number] | null {
  let x = 0, y = 0;
  const points: Array<[number, number]> = [];
  const chunks = [...d.matchAll(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g)];
  for (const chunk of chunks) {
    const command = chunk[0][0]!;
    const lower = command.toLowerCase();
    const values = numbers(chunk[0].slice(1));
    const relative = command === lower;
    const sizes: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7 };
    const size = sizes[lower];
    if (!size) continue;
    for (let offset = 0; offset + size <= values.length; offset += size) {
      const part = values.slice(offset, offset + size);
      if (lower === "h") x = relative ? x + part[0]! : part[0]!;
      if (lower === "v") y = relative ? y + part[0]! : part[0]!;
      if (lower === "h" || lower === "v") {
        points.push([x, y]);
        continue;
      }
      const endpoint = lower === "a" ? 5 : size - 2;
      const baseX = x, baseY = y;
      x = relative ? baseX + part[endpoint]! : part[endpoint]!;
      y = relative ? baseY + part[endpoint + 1]! : part[endpoint + 1]!;
      points.push([x, y]);
    }
  }
  if (points.length === 0) return null;
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
}

function rectCoverage(attrs: string, canvas: Canvas): [number, number] {
  const x = Number(attr(attrs, "x") ?? "0");
  const y = Number(attr(attrs, "y") ?? "0");
  const width = Number(attr(attrs, "width") ?? "0");
  const height = Number(attr(attrs, "height") ?? "0");
  const overlapW = Math.max(0, Math.min(x + width, canvas.x + canvas.width) - Math.max(x, canvas.x));
  const overlapH = Math.max(0, Math.min(y + height, canvas.y + canvas.height) - Math.max(y, canvas.y));
  return [overlapW / canvas.width, overlapH / canvas.height];
}

function pathCoverage(attrs: string, canvas: Canvas): [number, number] | null {
  const d = attrs.match(/\bd\s*=\s*["']([^"']*)["']/i)?.[1];
  if (!d) return null;
  const commands = [...d.matchAll(COMMAND)].map((match) => match[0]!);
  if (commands.filter((command) => command.toLowerCase() === "m").length !== 1) return null;
  if (commands.length > 12) return null;
  const bounds = pathBounds(d);
  if (!bounds) return null;
  return [(bounds[1] - bounds[0]) / canvas.width, (bounds[3] - bounds[2]) / canvas.height];
}

function isSimpleCoveringPlate(drawable: Drawable, canvas: Canvas, coverage: number): boolean {
  if (drawable.tag === "rect") {
    const [width, height] = rectCoverage(drawable.attrs, canvas);
    return width >= coverage && height >= coverage;
  }
  if (drawable.tag !== "path") return false;
  const spans = pathCoverage(drawable.attrs, canvas);
  if (!spans) return false;
  return spans[0] >= coverage && spans[1] >= coverage;
}

export function detectBackgroundPlate(
  svg: string,
  canvas: Canvas,
  coverage: number,
): ElementRange | null {
  const drawables = paintedDrawables(svg);
  if (drawables.length < 2) return null;
  const first = drawables[0]!;
  if (!isSimpleCoveringPlate(first, canvas, coverage)) return null;
  return { start: first.start, end: first.end };
}
