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

describe("HeroPhotoRotator edge cases", () => {
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

  it("does nothing for reduced-motion detection when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(() =>
      render(<HeroPhotoRotator initialPhoto={PHOTOS[0]!} photos={PHOTOS.slice(0, 3)} />),
    ).not.toThrow();
  });

  it("tolerates an image whose decode() resolves after it already reports complete", async () => {
    class CompleteImage extends MockImage {
      complete = true;
    }
    vi.stubGlobal("Image", CompleteImage);

    render(<HeroPhotoRotator initialPhoto={PHOTOS[0]!} photos={PHOTOS.slice(0, 3)} />);
    // finish() runs once synchronously (img.complete) and again once decode()'s
    // already-resolved promise settles — the `settled` guard absorbs the second call.
    await act(async () => {
      observerCallbackRef.callback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(imageCountRef.count).toBe(2);
  });

  it("treats a missing photos prop as a single-candidate rotator", () => {
    render(<HeroPhotoRotator initialPhoto={PHOTOS[0]!} />);
    expect(screen.getByTestId("seam-photo")).toHaveTextContent(PHOTOS[0]!.slug);
    expect(screen.queryByLabelText("Photo rotation progress")).toBeNull();
  });

  it("falls back to the initial photo and a null next photo once candidates shrink below the current index", async () => {
    let rafCb: FrameRequestCallback | null = null;
    vi.stubGlobal("requestAnimationFrame", vi.fn((cb: FrameRequestCallback) => {
      rafCb = cb;
      return 1;
    }));

    const { rerender } = render(
      <HeroPhotoRotator initialPhoto={PHOTOS[0]!} photos={PHOTOS.slice(0, 3)} />,
    );
    act(() => {
      observerCallbackRef.callback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    let now = 0;
    await waitFor(() => {
      now += 2000;
      act(() => { rafCb?.(now); });
      expect(screen.getByTestId("seam-photo")).toHaveTextContent(PHOTOS[1]!.slug);
    });

    // Same initialPhoto (no slug change → index does not reset), but the
    // candidate list shrinks to just the initial photo — index 1 is now out
    // of range, so both `candidates[index]` and `candidates[nextIndex]` miss.
    rerender(<HeroPhotoRotator initialPhoto={PHOTOS[0]!} />);
    expect(screen.getByTestId("seam-photo")).toHaveTextContent(PHOTOS[0]!.slug);
    expect(screen.queryByLabelText("Photo rotation progress")).toBeNull();
  });

  it("ignores a preload that resolves after the effect was cleaned up (photo changed before it settled)", async () => {
    const { rerender } = render(
      <HeroPhotoRotator initialPhoto={PHOTOS[0]!} photos={PHOTOS.slice(0, 3)} />,
    );
    act(() => {
      observerCallbackRef.callback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });
    // Change the initial photo before the in-flight preload promise settles —
    // the effect's cleanup sets `cancelled = true` before `.then` runs.
    rerender(<HeroPhotoRotator initialPhoto={PHOTOS[1]!} photos={PHOTOS.slice(0, 3)} />);
    await act(async () => {
      for (let i = 0; i < 10; i += 1) await Promise.resolve();
    });
    expect(screen.getByTestId("seam-photo")).toHaveTextContent(PHOTOS[1]!.slug);
  });
});
