// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

/*
  Hand-written WebGPU shims, trimmed to exactly what lib/ultra-fill.ts touches:
  request an adapter, request a device, configure an rgba16float surface, and
  clear it to one extended-range colour. There is no @webgpu/types dependency
  and there should not be one — the full type package is far larger than the
  four calls this app makes.
*/

declare module "*.css";

interface GPUCanvasContext {
  configure(descriptor: Record<string, unknown>): void;
  getCurrentTexture(): { createView(): unknown };
}

interface GpuQueue {
  submit(commands: unknown[]): void;
}

interface GpuDevice {
  destroy(): void;
  createCommandEncoder(): {
    beginRenderPass(descriptor: Record<string, unknown>): {
      end(): void;
    };
    finish(): unknown;
  };
  queue: GpuQueue;
}

interface Navigator {
  gpu?: {
    requestAdapter(): Promise<{
      requestDevice(): Promise<GpuDevice>;
    } | null>;
  };
}

declare const GPUTextureUsage: {
  RENDER_ATTACHMENT: number;
};

interface HTMLCanvasElement {
  getContext(contextId: "webgpu"): GPUCanvasContext | null;
}
