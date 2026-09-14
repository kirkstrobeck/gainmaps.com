import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  config: null as typeof config | null,
  rejectImport: false,
}));

const config = { token: "phc_test", api_host: "/ingest", defaults: "2026-05-30" as const };

async function loadInstrumentation(): Promise<void> {
  await import("@/instrumentation-client");
  await Promise.resolve();
}

function readyState(value: DocumentReadyState): void {
  Object.defineProperty(document, "readyState", { configurable: true, value });
}

function setIdleCallbacks(
  requestIdleCallback: typeof window.requestIdleCallback | undefined,
  cancelIdleCallback: typeof window.cancelIdleCallback | undefined,
): void {
  Object.defineProperty(window, "requestIdleCallback", { configurable: true, writable: true, value: requestIdleCallback });
  Object.defineProperty(window, "cancelIdleCallback", { configurable: true, writable: true, value: cancelIdleCallback });
}

describe("instrumentation client runtime lifecycle", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.config = config;
    mocks.rejectImport = false;
    vi.doMock("@/lib/posthog-client-config", () => ({
      posthogClientConfig: () => mocks.config,
    }));
    vi.doMock("posthog-js/dist/module.slim", async () => {
      if (mocks.rejectImport) throw new Error("module unavailable");
      return { default: { init: mocks.init, capture: mocks.capture } };
    });
    delete window.gainmapsPostHog;
    setIdleCallbacks(undefined, undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    setIdleCallbacks(undefined, undefined);
    delete window.gainmapsPostHog;
  });

  it("queues events, starts once on interaction, and flushes them after init", async () => {
    readyState("loading");
    const idle = vi.fn();
    const cancelIdle = vi.fn();
    setIdleCallbacks(idle, cancelIdle);

    await loadInstrumentation();
    window.gainmapsPostHog?.capture("early", { source: "test" });
    window.dispatchEvent(new window.Event("pointerdown"));
    window.dispatchEvent(new window.Event("keydown"));
    window.dispatchEvent(new window.Event("load"));
    await vi.waitFor(() => expect(mocks.init).toHaveBeenCalledTimes(1));

    expect(mocks.init).toHaveBeenCalledWith(config.token, expect.objectContaining({
      api_host: config.api_host,
      defaults: config.defaults,
    }));
    expect(mocks.capture).toHaveBeenCalledWith("early", { source: "test" });
    expect(idle).toHaveBeenCalledOnce();
    expect(cancelIdle).toHaveBeenCalledWith(0);

    window.gainmapsPostHog?.capture("late", { ready: true });
    expect(mocks.capture).toHaveBeenLastCalledWith("late", { ready: true });
  });

  it("starts from the load-to-idle lifecycle when there is no interaction", async () => {
    readyState("loading");
    let idleCallback: IdleRequestCallback | undefined;
    const idle = vi.fn((callback: IdleRequestCallback) => {
      idleCallback = callback;
      return 42;
    });
    setIdleCallbacks(idle, undefined);

    await loadInstrumentation();
    window.dispatchEvent(new window.Event("load"));
    expect(idle).toHaveBeenCalledWith(expect.any(Function), { timeout: 5000 });

    idleCallback?.({ didTimeout: false, timeRemaining: () => 12 });
    await vi.waitFor(() => expect(mocks.init).toHaveBeenCalledTimes(1));
  });

  it("uses the no-requestIdleCallback fallback only after document load", async () => {
    vi.useFakeTimers();
    setIdleCallbacks(undefined, undefined);
    readyState("loading");
    const timeout = vi.spyOn(window, "setTimeout");

    await loadInstrumentation();
    expect(timeout).not.toHaveBeenCalled();
    window.dispatchEvent(new window.Event("load"));
    expect(timeout).toHaveBeenCalledWith(expect.any(Function), 0);

    await vi.runAllTimersAsync();
    expect(mocks.init).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the public PostHog config is absent", async () => {
    readyState("complete");
    mocks.config = null;
    const add = vi.spyOn(window, "addEventListener");

    await loadInstrumentation();

    expect(window.gainmapsPostHog).toBeUndefined();
    expect(mocks.init).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalledWith("pointerdown", expect.any(Function), expect.anything());
  });

  it.each(["module", "init"])("cleans up the queue when %s loading fails", async (failure) => {
    readyState("complete");
    mocks.rejectImport = failure === "module";
    if (failure === "init") mocks.init.mockImplementationOnce(() => { throw new Error("init failed"); });
    let idleCallback: IdleRequestCallback | undefined;
    setIdleCallbacks((callback: IdleRequestCallback) => {
      idleCallback = callback;
      return 1;
    }, undefined);

    await loadInstrumentation();
    window.gainmapsPostHog?.capture("queued");
    idleCallback?.({ didTimeout: false, timeRemaining: () => 12 });
    await vi.waitFor(() => expect(window.gainmapsPostHog).toBeUndefined());

    expect(() => window.gainmapsPostHog?.capture("ignored")).not.toThrow();
  });
});
