declare module "*.css";

interface GPUCanvasContext {
  configure(descriptor: Record<string, unknown>): void;
  getCurrentTexture(): { createView(): unknown };
}

interface Navigator {
  gpu?: {
    requestAdapter(): Promise<{
      requestDevice(): Promise<{
        destroy(): void;
        createShaderModule(descriptor: { code: string }): unknown;
        createRenderPipeline(descriptor: Record<string, unknown>): {
          getBindGroupLayout(index: number): unknown;
        };
        createBuffer(descriptor: Record<string, unknown>): unknown;
        createBindGroup(descriptor: Record<string, unknown>): unknown;
        createCommandEncoder(): {
          beginRenderPass(descriptor: Record<string, unknown>): {
            setPipeline(pipeline: unknown): void;
            setBindGroup(index: number, group: unknown): void;
            draw(vertexCount: number): void;
            end(): void;
          };
          finish(): unknown;
        };
        queue: {
          writeBuffer(buffer: unknown, offset: number, data: Float32Array): void;
          submit(commands: unknown[]): void;
        };
      }>;
    } | null>;
  };
}

declare const GPUTextureUsage: { RENDER_ATTACHMENT: number };
declare const GPUBufferUsage: { UNIFORM: number; COPY_DST: number };

interface HTMLCanvasElement {
  getContext(
    contextId: "webgpu",
  ): GPUCanvasContext | null;
}

declare module "heic-decode" {
  type HeicDecodeResult = {
    width: number;
    height: number;
    data: ArrayBufferLike;
  };

  export default function decodeHeic(options: {
    buffer: ArrayBuffer | Uint8Array;
  }): Promise<HeicDecodeResult>;
}

declare module "upng-js" {
  type UpngFrame = {
    delay?: number;
  };

  type UpngImage = {
    width: number;
    height: number;
    frames?: UpngFrame[];
  };

  type UpngApi = {
    decode: (buffer: ArrayBuffer) => UpngImage;
    toRGBA8: (image: UpngImage) => ArrayBuffer[];
    encode: (
      frames: ArrayBuffer[],
      width: number,
      height: number,
      colors: number,
      delays?: number[],
    ) => ArrayBuffer;
  };

  const UPNG: UpngApi;
  export default UPNG;
}
