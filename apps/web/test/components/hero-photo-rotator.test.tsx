import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HeroPhotoRotator } from "@/components/hero-photo-rotator";
import { PHOTOS } from "@/lib/photos/catalog";
import {
  MockIntersectionObserver,
  MockImage,
  observerCallbackRef,
  imageCountRef,
  stubMotion,
} from "@/test/helpers/hero-photo-rotator-mocks";

vi.mock("@/components/seam-compare", () => ({
  SeamComparePhoto: ({ photo }: { photo: { slug: string } }) => <div data-testid="seam-photo">{photo.slug}</div>,
}));

vi.mock("@/components/photo-pair", () => ({
  PhotoCredit: ({ photo }: { photo: { photographer: string } }) => <div data-testid="photo-credit">{photo.photographer}</div>,
}));

describe("HeroPhotoRotator", () => {
  beforeEach(() => {
    imageCountRef.count = 0;
    observerCallbackRef.callback = null;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    vi.stubGlobal("Image", MockImage);
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    stubMotion(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a no-number SVG circle loading bar", () => {
    render(<HeroPhotoRotator initialPhoto={PHOTOS[0]!} photos={PHOTOS.slice(0, 3)} />);
    const ring = screen.getByLabelText("Photo rotation progress");
    expect(ring.tagName.toLowerCase()).toBe("svg");
    expect(ring).toHaveTextContent("");
    expect(ring.querySelectorAll("circle")).toHaveLength(2);
  });

  it("does not preload the next photo until the photo area enters the viewport", () => {
    render(<HeroPhotoRotator initialPhoto={PHOTOS[0]!} photos={PHOTOS.slice(0, 3)} />);
    expect(imageCountRef.count).toBe(0);

    act(() => {
      observerCallbackRef.callback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    expect(imageCountRef.count).toBe(2);
  });

  it("does not rotate or preload when reduced motion is requested", () => {
    stubMotion(true);
    render(<HeroPhotoRotator initialPhoto={PHOTOS[0]!} photos={PHOTOS.slice(0, 3)} />);

    act(() => {
      observerCallbackRef.callback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    expect(screen.queryByLabelText("Photo rotation progress")).toBeNull();
    expect(imageCountRef.count).toBe(0);
  });

  it("falls back to the legacy addListener/removeListener API when addEventListener is unavailable", () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false,
      addListener,
      removeListener,
    })));

    const { unmount } = render(<HeroPhotoRotator initialPhoto={PHOTOS[0]!} photos={PHOTOS.slice(0, 3)} />);
    expect(addListener).toHaveBeenCalledWith(expect.any(Function));
    unmount();
    expect(removeListener).toHaveBeenCalledWith(expect.any(Function));
  });

  it("advances progress via requestAnimationFrame ticks and rotates once the next photo is ready", async () => {
    let rafCb: FrameRequestCallback | null = null;
    vi.stubGlobal("requestAnimationFrame", vi.fn((cb: FrameRequestCallback) => {
      rafCb = cb;
      return 1;
    }));

    render(<HeroPhotoRotator initialPhoto={PHOTOS[0]!} photos={PHOTOS.slice(0, 3)} />);
    act(() => {
      observerCallbackRef.callback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    // Repeatedly drive the (stubbed) animation frame forward with real waits
    // between attempts so the preload promise chain — which resolves via real
    // microtasks/effects — has a chance to mark the next photo ready.
    let now = 0;
    await waitFor(() => {
      now += 2000;
      act(() => {
        rafCb?.(now); // past ROTATION_MS eventually — progress clamps to 1 and rotates
      });
      expect(screen.getByTestId("seam-photo")).toHaveTextContent(PHOTOS[1]!.slug);
    });
  });
});
