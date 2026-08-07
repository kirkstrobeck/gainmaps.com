const MIN_EDGE = 1024;
const MAX_EDGE = 4096;
const DEFAULT_SAMPLE_PROGRESS = 0.25;

export function isSvgFile(file: File): boolean {
  if (file.type === "image/svg+xml") return true;
  return /\.svg$/i.test(file.name);
}

export function isAnimatedSvg(svgText: string): boolean {
  if (/<(animate|animateTransform|animateMotion|set)\b/i.test(svgText)) return true;
  if (/@keyframes/i.test(svgText)) return true;
  if (/\banimation(?:-name)?\s*:/i.test(svgText)) return true;
  return false;
}

export async function rasterizeSvgToPng(file: File): Promise<File> {
  const svgText = await file.text();
  const size = svgRasterSize(svgText);
  const markup = isAnimatedSvg(svgText)
    ? freezeAnimatedSvgMarkup(svgText, size)
    : serializeSvgRoot(prepareSvgRoot(svgText, size));
  const png = await rasterizeStaticSvgMarkup(markup, size);
  return new File([png], `${stripExtension(file.name)}.png`, { type: "image/png" });
}

/** Sanitize user SVG for inline preview without forcing raster dimensions. */
export function previewSvgMarkup(svgText: string): string {
  const root = sanitizeSvgRoot(svgText);
  const width = parseSvgLength(root.getAttribute("width"));
  const height = parseSvgLength(root.getAttribute("height"));
  const fromViewBox = viewBoxSize(root.getAttribute("viewBox"));

  root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (!fromViewBox && width && height) {
    root.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }
  root.setAttribute("width", "100%");
  root.setAttribute("height", "100%");
  root.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return serializeSvgRoot(root);
}

export function svgRasterSize(svgText: string): { width: number; height: number } {
  const root = parseSvgRoot(svgText);
  const width = parseSvgLength(root.getAttribute("width"));
  const height = parseSvgLength(root.getAttribute("height"));
  if (width && height) return clampRasterSize(width, height);

  const fromViewBox = viewBoxSize(root.getAttribute("viewBox"));
  if (fromViewBox) return clampRasterSize(fromViewBox.width, fromViewBox.height);
  if (width) return clampRasterSize(width, width);
  if (height) return clampRasterSize(height, height);
  return { width: MIN_EDGE, height: MIN_EDGE };
}

/**
 * Bake SMIL animations to a static frame at a keyframe time, then strip animate* nodes.
 * html-to-image / XMLSerializer lose live SMIL state; baking makes rasterization reliable.
 */
export function freezeAnimatedSvgMarkup(
  svgText: string,
  size: { width: number; height: number },
  sampleSeconds?: number,
): string {
  const root = prepareSvgRoot(svgText, size);
  const seconds = sampleSeconds ?? pickSampleSeconds(root);
  freezeSmilTree(root, seconds);
  return serializeSvgRoot(root);
}

function freezeSmilTree(root: SVGSVGElement, seconds: number): void {
  for (const element of Array.from(root.querySelectorAll("animateTransform"))) {
    const parent = element.parentElement;
    const transform = transformFromAnimateTransform(element, seconds);
    if (parent && transform) parent.setAttribute("transform", transform);
    element.remove();
  }

  for (const element of Array.from(root.querySelectorAll("animate"))) {
    const parent = element.parentElement;
    const attributeName = element.getAttribute("attributeName");
    const value = valueAt(element, seconds);
    if (parent && attributeName && value != null) parent.setAttribute(attributeName, value);
    element.remove();
  }

  for (const element of Array.from(root.querySelectorAll("animateMotion, set"))) {
    element.remove();
  }
}

function pickSampleSeconds(root: SVGSVGElement): number {
  const nodes = Array.from(root.querySelectorAll("animate, animateTransform, animateMotion, set"));
  if (!nodes.length) return 0;

  const durations = nodes.map((node) => parseClock(node.getAttribute("dur"))).filter((value) => value > 0);
  const duration = durations.length ? Math.max(...durations) : 1;

  const keyTimes = nodes
    .flatMap((node) => parseList(node.getAttribute("keyTimes")).map(Number))
    .filter((value) => Number.isFinite(value) && value > 0 && value < 1);

  if (keyTimes.length) {
    return Math.min(...keyTimes) * duration;
  }

  return duration * DEFAULT_SAMPLE_PROGRESS;
}

function valueAt(element: Element, seconds: number): string | null {
  const values = parseList(element.getAttribute("values"));
  if (!values.length) {
    const to = element.getAttribute("to");
    return to;
  }
  const rawTimes = parseList(element.getAttribute("keyTimes")).map(Number);
  const keyTimes =
    rawTimes.length === values.length
      ? rawTimes
      : values.map((_, index) => index / Math.max(values.length - 1, 1));
  return values[keyframeIndex(progressAt(element, seconds), keyTimes)] ?? null;
}

function transformFromAnimateTransform(element: Element, seconds: number): string | null {
  const value = valueAt(element, seconds);
  if (!value) return null;
  const type = element.getAttribute("type") || "translate";
  const parts = value
    .trim()
    .split(/[\s,]+/)
    .map(Number);

  if (type === "translate") return `translate(${parts[0] || 0} ${parts[1] || 0})`;
  if (type === "scale") {
    if (parts.length > 1) return `scale(${parts[0]} ${parts[1]})`;
    return `scale(${parts[0] || 1})`;
  }
  if (type === "rotate") {
    if (parts.length >= 3) return `rotate(${parts[0]} ${parts[1]} ${parts[2]})`;
    return `rotate(${parts[0] || 0})`;
  }
  if (type === "skewX") return `skewX(${parts[0] || 0})`;
  if (type === "skewY") return `skewY(${parts[0] || 0})`;
  return null;
}

function progressAt(element: Element, seconds: number): number {
  const begin = parseClock(element.getAttribute("begin"));
  const duration = parseClock(element.getAttribute("dur"));
  if (duration <= 0) return 0;
  const elapsed = seconds - begin;
  const cycle =
    element.getAttribute("repeatCount") === "indefinite"
      ? ((elapsed % duration) + duration) % duration
      : Math.min(Math.max(elapsed, 0), duration);
  return Math.min(Math.max(cycle / duration, 0), 1);
}

function keyframeIndex(progress: number, keyTimes: number[]): number {
  let index = 0;
  for (let i = 0; i < keyTimes.length; i += 1) {
    if (keyTimes[i]! <= progress + 1e-9) index = i;
  }
  return index;
}

function parseClock(value: string | null): number {
  if (!value) return 0;
  const match = value.trim().match(/^([\d.]+)(ms|s)?$/i);
  if (!match) return 0;
  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric)) return 0;
  return match[2]?.toLowerCase() === "ms" ? numeric / 1000 : numeric;
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function prepareSvgRoot(
  svgText: string,
  size: { width: number; height: number },
): SVGSVGElement {
  const root = sanitizeSvgRoot(svgText);
  root.setAttribute("width", String(size.width));
  root.setAttribute("height", String(size.height));
  if (!root.getAttribute("viewBox")) {
    root.setAttribute("viewBox", `0 0 ${size.width} ${size.height}`);
  }
  root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (!root.getAttribute("xmlns:xlink")) {
    root.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  }
  return root;
}

function sanitizeSvgRoot(svgText: string): SVGSVGElement {
  const root = parseSvgRoot(svgText);
  root.querySelectorAll("script").forEach((node) => node.remove());
  for (const element of Array.from(root.querySelectorAll("*"))) {
    for (const attribute of Array.from(element.attributes)) {
      if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
    }
  }
  return root;
}

function serializeSvgRoot(root: SVGSVGElement): string {
  return new XMLSerializer().serializeToString(root);
}

function parseSvgRoot(svgText: string): SVGSVGElement {
  const parsed = new DOMParser().parseFromString(svgText, "image/svg+xml");
  const root = parsed.documentElement;
  if (root.querySelector("parsererror")) {
    throw new Error("SVG could not be parsed.");
  }
  if (root.tagName.toLowerCase() !== "svg") {
    throw new Error("File is not a valid SVG document.");
  }
  return root as unknown as SVGSVGElement;
}

function parseSvgLength(value: string | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.endsWith("%")) return null;
  const match = /^([\d.]+)/.exec(trimmed);
  if (!match) return null;
  const numeric = Number(match[1]);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric;
}

function viewBoxSize(viewBox: string | null): { width: number; height: number } | null {
  if (!viewBox) return null;
  const parts = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const width = parts[2];
  const height = parts[3];
  if (!width || !height || width <= 0 || height <= 0) return null;
  return { width, height };
}

function clampRasterSize(width: number, height: number): { width: number; height: number } {
  const minEdge = Math.min(width, height);
  const scaleUp = minEdge < MIN_EDGE ? MIN_EDGE / minEdge : 1;
  const scaledWidth = width * scaleUp;
  const scaledHeight = height * scaleUp;
  const scaledMax = Math.max(scaledWidth, scaledHeight);
  const scaleDown = scaledMax > MAX_EDGE ? MAX_EDGE / scaledMax : 1;
  return {
    width: Math.max(1, Math.round(scaledWidth * scaleDown)),
    height: Math.max(1, Math.round(scaledHeight * scaleDown)),
  };
}

async function rasterizeStaticSvgMarkup(
  markup: string,
  size: { width: number; height: number },
): Promise<Blob> {
  const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = await decodeSvgImage(url);
    return canvasFromImage(image, size.width, size.height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function decodeSvgImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Browser could not decode this SVG."));
    image.src = url;
  });
}

async function canvasFromImage(
  image: HTMLImageElement,
  width: number,
  height: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create a canvas to rasterize SVG.");
  context.clearRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvasToPng(canvas);
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("SVG rasterization failed."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}
