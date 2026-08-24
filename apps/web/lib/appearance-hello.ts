/**
 * One Ultra surface for the appearance lab: HDR field + hello glyph.
 * Light Ultra lifts the page wash; dark Ultra lifts the glyph. Blacks stay black.
 */

export type HelloState = {
  ultra: boolean;
  resolved: "light" | "dark";
  scale: number;
};

type Session = {
  poke: () => void;
  stop: () => void;
};

type Rgb = { r: number; g: number; b: number };

const UNIFORM_FLOATS = 12;
const LABEL = "Ultra";
const FONT = "700 64px ui-sans-serif, system-ui, sans-serif";

function srgb8ToLinear(channel: number) {
  const x = channel / 255;
  if (x <= 0.04045) return x / 12.92;
  return Math.pow((x + 0.055) / 1.055, 2.4);
}

function readState(lab: HTMLElement): HelloState {
  const ultra = lab.dataset.ultra === "on";
  const resolved = lab.dataset.resolved === "light" ? "light" : "dark";
  const raw = Number(lab.style.getPropertyValue("--ultra-scale") || "1");
  const scale = Number.isFinite(raw) && raw > 0 ? raw : 1;
  return { ultra, resolved, scale };
}

/** Page wash — light Ultra is pigment × intensity; dark stays true black. */
function fieldRgb(state: HelloState): Rgb {
  if (state.resolved === "dark") return { r: 0, g: 0, b: 0 };
  const base = srgb8ToLinear(0xf2);
  const gain = state.ultra && state.scale > 1 ? state.scale : 1;
  return { r: base * gain, g: base * gain, b: base * gain };
}

/** Glyph ink — dark Ultra is HDR white; light stays near-black for contrast. */
function inkRgb(state: HelloState): Rgb {
  if (state.resolved === "light") {
    return { r: srgb8ToLinear(0x1c), g: srgb8ToLinear(0x1c), b: srgb8ToLinear(0x1e) };
  }
  return { r: 1, g: 1, b: 1 };
}

function inkScale(state: HelloState) {
  if (state.resolved === "dark" && state.ultra && state.scale > 1) return state.scale;
  return 1;
}

function syncCanvasSize(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.floor(width * dpr));
  const h = Math.max(1, Math.floor(height * dpr));
  if (canvas.width === w && canvas.height === h) return false;
  canvas.width = w;
  canvas.height = h;
  return true;
}

function paintMask(
  pixelW: number,
  pixelH: number,
  cssW: number,
  cssH: number,
  helloY: number,
) {
  const bitmap = document.createElement("canvas");
  bitmap.width = pixelW;
  bitmap.height = pixelH;
  const ctx = bitmap.getContext("2d");
  if (!ctx) return bitmap;
  ctx.setTransform(pixelW / cssW, 0, 0, pixelH / cssH, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = "#ffffff";
  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(LABEL, cssW / 2, helloY);
  return bitmap;
}

function packUniform(
  width: number,
  height: number,
  glyphScale: number,
  field: Rgb,
  ink: Rgb,
) {
  const data = new Float32Array(UNIFORM_FLOATS);
  data[0] = width;
  data[1] = height;
  data[2] = glyphScale;
  data[3] = 0;
  data[4] = field.r;
  data[5] = field.g;
  data[6] = field.b;
  data[7] = 1;
  data[8] = ink.r;
  data[9] = ink.g;
  data[10] = ink.b;
  data[11] = 0;
  return data;
}

function helloCenterY(lab: HTMLElement, cssH: number) {
  const main = lab.querySelector(".appearance-main");
  if (!main) return cssH / 2;
  const labRect = lab.getBoundingClientRect();
  const mainRect = main.getBoundingClientRect();
  return mainRect.top - labRect.top + mainRect.height / 2;
}

function paintHello2d(canvas: HTMLCanvasElement, lab: HTMLElement) {
  const cssW = Math.max(1, lab.clientWidth);
  const cssH = Math.max(1, lab.clientHeight);
  syncCanvasSize(canvas, cssW, cssH);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const state = readState(lab);
  const field = fieldRgb(state);
  const dpr = canvas.width / cssW;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle =
    state.resolved === "dark"
      ? "#000000"
      : `rgb(${Math.round(field.r * 255)} ${Math.round(field.g * 255)} ${Math.round(field.b * 255)})`;
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.font = FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = state.resolved === "light" ? "#1c1c1e" : "#ffffff";
  ctx.fillText(LABEL, cssW / 2, helloCenterY(lab, cssH));
}

export function startAppearanceHello(
  canvas: HTMLCanvasElement,
  lab: HTMLElement,
): Session {
  const control = {
    running: false,
    stopGpu: null as null | (() => void),
    pending: false,
    raf2d: 0,
  };

  function stop2d() {
    cancelAnimationFrame(control.raf2d);
    control.raf2d = 0;
  }

  function start2d() {
    stop2d();
    const tick = () => {
      paintHello2d(canvas, lab);
      control.raf2d = requestAnimationFrame(tick);
    };
    tick();
  }

  async function bootGpu() {
    if (control.running) return;
    if (!navigator.gpu) {
      start2d();
      return;
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      start2d();
      return;
    }

    const device = await adapter.requestDevice();
    const maybeContext = canvas.getContext("webgpu");
    if (!maybeContext) {
      device.destroy();
      start2d();
      return;
    }
    const surface: GPUCanvasContext = maybeContext;
    stop2d();

    function configureSurface() {
      surface.configure({
        device,
        format: "rgba16float",
        colorSpace: "srgb",
        toneMapping: { mode: "extended" },
        alphaMode: "premultiplied",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
    }

    const module = device.createShaderModule({
      code: `
        struct Frame {
          viewport: vec2f,
          glyphScale: f32,
          _pad: f32,
          field: vec4f,
          ink: vec4f,
        };

        @group(0) @binding(0) var<uniform> frame: Frame;
        @group(0) @binding(1) var textMap: texture_2d<f32>;
        @group(0) @binding(2) var textSamp: sampler;

        struct VsOut {
          @builtin(position) pos: vec4f,
          @location(0) uv: vec2f,
        };

        @vertex fn vs(@builtin(vertex_index) i: u32) -> VsOut {
          var p = array<vec2f, 3>(
            vec2f(-1.0, -1.0),
            vec2f( 3.0, -1.0),
            vec2f(-1.0,  3.0)
          );
          var out: VsOut;
          out.pos = vec4f(p[i], 0.0, 1.0);
          out.uv = p[i] * vec2f(0.5, -0.5) + vec2f(0.5, 0.5);
          return out;
        }

        @fragment fn fs(in: VsOut) -> @location(0) vec4f {
          let a = textureSample(textMap, textSamp, in.uv).a;
          let glyph = frame.ink.rgb * frame.glyphScale;
          let rgb = mix(frame.field.rgb, glyph, a);
          return vec4f(rgb, 1.0);
        }
      `,
    });

    const pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module, entryPoint: "vs" },
      fragment: {
        module,
        entryPoint: "fs",
        targets: [{ format: "rgba16float" }],
      },
    });

    const uniformBuffer = device.createBuffer({
      size: UNIFORM_FLOATS * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    });

    const textures = {
      current: null as null | {
        texture: { destroy: () => void };
        view: unknown;
        key: string;
      },
    };

    function ensureMask(
      pixelW: number,
      pixelH: number,
      cssW: number,
      cssH: number,
      helloY: number,
    ) {
      const key = `${pixelW}x${pixelH}:${helloY.toFixed(1)}`;
      if (textures.current?.key === key) return textures.current;
      if (textures.current) textures.current.texture.destroy();

      const bitmap = paintMask(pixelW, pixelH, cssW, cssH, helloY);
      const texture = device.createTexture({
        size: [pixelW, pixelH],
        format: "rgba8unorm",
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });
      device.queue.copyExternalImageToTexture(
        { source: bitmap },
        { texture },
        [pixelW, pixelH],
      );
      textures.current = { texture, view: texture.createView(), key };
      return textures.current;
    }

    const loop = { frameId: 0, running: true };

    function frame() {
      if (!loop.running) return;

      const cssW = Math.max(1, lab.clientWidth);
      const cssH = Math.max(1, lab.clientHeight);
      if (syncCanvasSize(canvas, cssW, cssH)) configureSurface();

      const state = readState(lab);
      const field = fieldRgb(state);
      const ink = inkRgb(state);
      const glyphScale = inkScale(state);
      const helloY = helloCenterY(lab, cssH);
      const mask = ensureMask(canvas.width, canvas.height, cssW, cssH, helloY);
      device.queue.writeBuffer(
        uniformBuffer,
        0,
        packUniform(canvas.width, canvas.height, glyphScale, field, ink),
      );

      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: mask.view },
          { binding: 2, resource: sampler },
        ],
      });

      const encoder = device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: surface.getCurrentTexture().createView(),
            clearValue: { r: field.r, g: field.g, b: field.b, a: 1 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(3);
      pass.end();
      device.queue.submit([encoder.finish()]);
      loop.frameId = requestAnimationFrame(frame);
    }

    configureSurface();
    frame();
    control.running = true;
    lab.dataset.helloSurface = "gpu";

    control.stopGpu = () => {
      loop.running = false;
      cancelAnimationFrame(loop.frameId);
      if (textures.current) textures.current.texture.destroy();
      device.destroy();
      delete lab.dataset.helloSurface;
      control.running = false;
      control.stopGpu = null;
    };
  }

  function poke() {
    if (control.running || control.raf2d) return;
    if (control.pending) return;
    control.pending = true;
    void bootGpu().finally(() => {
      control.pending = false;
    });
  }

  poke();

  return {
    poke,
    stop: () => {
      if (control.stopGpu) control.stopGpu();
      stop2d();
    },
  };
}
