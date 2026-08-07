"use client";

import {
  IconDeviceDesktop,
  IconMoon,
  IconSun,
  IconSunHigh,
} from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Theme = "dark" | "system" | "light";
type Resolved = "dark" | "light";

const ULTRA_MAX = 4;
const DEFAULT_INTENSITY = 0.55;

const PHOTOS = [
  {
    id: "alps",
    caption: "Alpine light",
    sdr: "/appearance/alps.jpg",
    hdr: "/appearance/alps-ultrahdr.jpg",
  },
  {
    id: "coast",
    caption: "Coastal haze",
    sdr: "/appearance/coast.jpg",
    hdr: "/appearance/coast-ultrahdr.jpg",
  },
  {
    id: "peaks",
    caption: "Night peaks",
    sdr: "/appearance/peaks.jpg",
    hdr: "/appearance/peaks-ultrahdr.jpg",
  },
] as const;

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function scaleFromAmount(amount: number) {
  if (amount <= 0) return 1;
  return 1 + amount * (ULTRA_MAX - 1);
}

function resolveTheme(theme: Theme, prefersDark: boolean): Resolved {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return prefersDark ? "dark" : "light";
}

function srgb8ToLinear(channel: number) {
  const x = channel / 255;
  if (x <= 0.04045) return x / 12.92;
  return Math.pow((x + 0.055) / 1.055, 2.4);
}

type Pigment = { sdr: string; r: number; g: number; b: number };

/** Same pigment, SDR leg unchanged; Ultra leg is that pigment × intensity. */
function ultraColor(pigment: Pigment, scale: number) {
  if (!(scale > 1)) return pigment.sdr;
  const r = srgb8ToLinear(pigment.r) * scale;
  const g = srgb8ToLinear(pigment.g) * scale;
  const b = srgb8ToLinear(pigment.b) * scale;
  return `color-hdr(${pigment.sdr} 0, color(rec2100-linear ${r} ${g} ${b}) 1)`;
}

const LIGHT_PIGMENTS = {
  "--background": { sdr: "#f2f2f7", r: 0xf2, g: 0xf2, b: 0xf7 },
  "--foreground": { sdr: "#1c1c1e", r: 0x1c, g: 0x1c, b: 0x1e },
  "--muted": { sdr: "#3a3a3c", r: 0x3a, g: 0x3a, b: 0x3c },
  "--border": { sdr: "rgb(60 60 67 / 0.18)", r: 60, g: 60, b: 67 },
  "--panel": { sdr: "#ffffff", r: 255, g: 255, b: 255 },
  "--panel-strong": { sdr: "#ebebf0", r: 0xeb, g: 0xeb, b: 0xf0 },
  "--accent": { sdr: "#007aff", r: 0x00, g: 0x7a, b: 0xff },
  "--accent-foreground": { sdr: "#ffffff", r: 255, g: 255, b: 255 },
  "--appearance-bg": { sdr: "#f2f2f7", r: 0xf2, g: 0xf2, b: 0xf7 },
  "--appearance-elevated": { sdr: "#ffffff", r: 255, g: 255, b: 255 },
  "--appearance-fill": { sdr: "rgb(120 120 128 / 0.18)", r: 120, g: 120, b: 128 },
} as const satisfies Record<string, Pigment>;

const DARK_PIGMENTS = {
  "--background": { sdr: "#000000", r: 0, g: 0, b: 0 },
  "--foreground": { sdr: "#f5f5f7", r: 0xf5, g: 0xf5, b: 0xf7 },
  "--muted": { sdr: "#aeaeb2", r: 0xae, g: 0xae, b: 0xb2 },
  "--border": { sdr: "rgb(84 84 88 / 0.65)", r: 84, g: 84, b: 88 },
  "--panel": { sdr: "#1c1c1e", r: 0x1c, g: 0x1c, b: 0x1e },
  "--panel-strong": { sdr: "#2c2c2e", r: 0x2c, g: 0x2c, b: 0x2e },
  "--accent": { sdr: "#0a84ff", r: 0x0a, g: 0x84, b: 0xff },
  "--accent-foreground": { sdr: "#ffffff", r: 255, g: 255, b: 255 },
  "--appearance-bg": { sdr: "#000000", r: 0, g: 0, b: 0 },
  "--appearance-elevated": { sdr: "#1c1c1e", r: 0x1c, g: 0x1c, b: 0x1e },
  "--appearance-fill": { sdr: "rgb(120 120 128 / 0.36)", r: 120, g: 120, b: 128 },
} as const satisfies Record<string, Pigment>;

const ULTRA_TOKEN_KEYS = Object.keys(LIGHT_PIGMENTS) as Array<keyof typeof LIGHT_PIGMENTS>;

/**
 * Ultra maps every theme pigment to color-hdr(same, × intensity).
 * White → Ultra white; no hue/style swaps.
 */
function applyUltraTokens(host: HTMLElement, resolved: Resolved, scale: number, ultraOn: boolean) {
  for (const key of ULTRA_TOKEN_KEYS) host.style.removeProperty(key);
  if (!ultraOn) return;
  const pigments = resolved === "dark" ? DARK_PIGMENTS : LIGHT_PIGMENTS;
  for (const key of ULTRA_TOKEN_KEYS) {
    host.style.setProperty(key, ultraColor(pigments[key], scale));
  }
}

function ultraFieldClear(resolved: Resolved, scale: number) {
  if (resolved === "dark") {
    const lift = 0.04 * (1 - Math.min(1, (scale - 1) / (ULTRA_MAX - 1)));
    return { r: lift, g: lift, b: lift * 1.05, a: 1 };
  }
  // Linear of #f2f2f7 — same page wash pigment × Ultra intensity.
  const base = srgb8ToLinear(0xf2);
  return { r: base * scale, g: base * scale, b: srgb8ToLinear(0xf7) * scale, a: 1 };
}

export function AppearanceLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopGpuRef = useRef<(() => void) | null>(null);
  const [theme, setTheme] = useState<Theme>("system");
  const [prefersDark, setPrefersDark] = useState(false);
  const [ultraOn, setUltraOn] = useState(false);
  const [intensity, setIntensity] = useState(DEFAULT_INTENSITY);
  const [controlsH, setControlsH] = useState(120);
  const controlsRef = useRef<HTMLElement>(null);
  const labRef = useRef<HTMLDivElement>(null);

  const resolved = resolveTheme(theme, prefersDark);
  const scale = ultraOn ? scaleFromAmount(intensity) : 1;

  const syncChrome = useCallback(() => {
    const lab = labRef.current;
    if (!lab) return;
    lab.dataset.ultra = ultraOn ? "on" : "off";
    lab.style.setProperty("--ultra-scale", String(scale));
    applyUltraTokens(lab, resolved, scale, ultraOn);
  }, [resolved, ultraOn, scale]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setPrefersDark(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    syncChrome();
  }, [syncChrome]);

  useEffect(() => {
    function measure() {
      if (!controlsRef.current) return;
      setControlsH(Math.ceil(controlsRef.current.getBoundingClientRect().height));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!ultraOn || !canvas || !navigator.gpu) {
      stopGpuRef.current?.();
      stopGpuRef.current = null;
      if (labRef.current) labRef.current.dataset.ultraField = "off";
      return;
    }

    const gate = { open: true };

    async function start() {
      const adapter = await navigator.gpu!.requestAdapter();
      if (!adapter || !gate.open || !canvas) return;
      const device = await adapter.requestDevice();
      if (!gate.open) {
        device.destroy();
        return;
      }
      const context = canvas.getContext("webgpu");
      if (!context) {
        device.destroy();
        return;
      }

      function configure() {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        canvas!.width = Math.max(1, Math.floor(innerWidth * dpr));
        canvas!.height = Math.max(1, Math.floor(innerHeight * dpr));
        context!.configure({
          device,
          format: "rgba16float",
          colorSpace: "srgb",
          toneMapping: { mode: "extended" },
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
      }

      configure();
      const module = device.createShaderModule({
        code: `
          struct Frame { viewport: vec2f; count: f32; _pad: f32; field: vec4f; }
          @group(0) @binding(0) var<uniform> frame: Frame;
          @vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
            var p = array<vec2f, 3>(vec2f(-1,-1), vec2f(3,-1), vec2f(-1,3));
            return vec4f(p[i], 0, 1);
          }
          @fragment fn fs() -> @location(0) vec4f { return frame.field; }
        `,
      });
      const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: { module, entryPoint: "vs" },
        fragment: { module, entryPoint: "fs", targets: [{ format: "rgba16float" }] },
      });
      const uniformBuffer = device.createBuffer({
        size: 32,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
      });

      const loop = { id: 0, running: true };
      function frame() {
        if (!loop.running || !canvas) return;
        configure();
        const clear = ultraFieldClear(
          labRef.current?.dataset.resolved === "dark" ? "dark" : "light",
          Number(labRef.current?.style.getPropertyValue("--ultra-scale")) || 1,
        );
        const data = new Float32Array([
          canvas.width,
          canvas.height,
          0,
          0,
          clear.r,
          clear.g,
          clear.b,
          clear.a,
        ]);
        device.queue.writeBuffer(uniformBuffer, 0, data);
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: context!.getCurrentTexture().createView(),
              clearValue: clear,
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
        loop.id = requestAnimationFrame(frame);
      }
      frame();
      if (labRef.current) labRef.current.dataset.ultraField = "on";
      stopGpuRef.current = () => {
        loop.running = false;
        cancelAnimationFrame(loop.id);
        device.destroy();
        if (labRef.current) labRef.current.dataset.ultraField = "off";
      };
    }

    void start();
    return () => {
      gate.open = false;
      stopGpuRef.current?.();
      stopGpuRef.current = null;
    };
  }, [ultraOn]);

  function onUltraChange(next: boolean) {
    setUltraOn(next);
    if (next && intensity <= 0) setIntensity(DEFAULT_INTENSITY);
  }

  return (
    <div
      ref={labRef}
      className={cn(
        "appearance-lab min-h-dvh text-[var(--foreground)]",
        resolved === "dark" ? "dark" : "light",
      )}
      data-resolved={resolved}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-0 z-0 size-full",
          ultraOn ? "block" : "hidden",
        )}
      />

      <div className="relative z-[1]">
        <header
          ref={controlsRef}
          className="fixed inset-x-0 top-0 z-[2] border-b border-[var(--border)] bg-[var(--panel)]"
        >
          <div className="mx-auto grid w-full max-w-md gap-3 px-3 py-2.5">
            <div className="grid gap-1.5">
              <Label className="text-[0.68rem] uppercase tracking-[0.04em] text-[var(--muted)]">
                Theme
              </Label>
              <ToggleGroup
                type="single"
                value={theme}
                onValueChange={(value) => {
                  if (value === "dark" || value === "system" || value === "light") {
                    setTheme(value);
                  }
                }}
                variant="outline"
                className="grid w-full grid-cols-3 gap-0 rounded-full border border-[var(--border)] bg-[var(--panel-strong)] p-0.5"
              >
                <ToggleGroupItem value="dark" aria-label="Dark" className="rounded-full">
                  <IconMoon aria-hidden />
                  Dark
                </ToggleGroupItem>
                <ToggleGroupItem value="system" aria-label="System" className="rounded-full">
                  <IconDeviceDesktop aria-hidden />
                  System
                </ToggleGroupItem>
                <ToggleGroupItem value="light" aria-label="Light" className="rounded-full">
                  <IconSun aria-hidden />
                  Light
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="grid gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <IconSunHigh aria-hidden size={16} />
                  Ultra
                </div>
                <Switch
                  checked={ultraOn}
                  onCheckedChange={onUltraChange}
                  aria-label="Enable Ultra"
                />
              </div>

              <div
                className={cn("grid gap-2", !ultraOn && "invisible")}
                aria-hidden={!ultraOn}
              >
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  disabled={!ultraOn}
                  value={[Math.round(intensity * 100)]}
                  onValueChange={(value) => setIntensity(clamp01((value[0] ?? 55) / 100))}
                  thumbLabel="Ultra"
                  aria-label="Ultra intensity"
                />
                <div className="flex justify-between text-[0.65rem] font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
                  <span>Min</span>
                  <span className="normal-case tabular-nums">
                    {ultraOn ? `${scale.toFixed(2)}×` : "Off"}
                  </span>
                  <span>Max</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main
          className="mx-auto grid w-[min(920px,calc(100%-2rem))] gap-4 pb-16"
          style={{ paddingTop: `calc(${controlsH}px + 2.25rem)` }}
        >
          <section className="grid gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--appearance-elevated,var(--panel))] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">
              Field notes
            </p>
            <h1 className="font-[family-name:var(--font-geist-sans)] text-4xl font-semibold tracking-tight sm:text-5xl">
              Theme and Ultra are independent
            </h1>
            <p className="max-w-2xl text-[var(--muted)]">
              Dark, System, and Light set the chrome. Ultra maps every pigment into
              Ultra intensity — white becomes Ultra white, same colors, no restyle.
            </p>
          </section>

          <section className="grid gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--appearance-elevated,var(--panel))] p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Photo strip</h2>
            <p className="text-sm text-[var(--muted)]">
              SDR when Ultra is off · Ultra photos when Ultra is on
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {PHOTOS.map((photo) => (
                <figure key={photo.id} className="grid gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={photo.caption}
                    src={ultraOn ? photo.hdr : photo.sdr}
                    className="aspect-[3/2] w-full rounded-[18px] object-cover shadow-sm"
                  />
                  <figcaption className="flex justify-between text-sm">
                    <span>{photo.caption}</span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                      {ultraOn ? "Ultra HDR" : "SDR"}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
