import { describe, it, expect } from "vitest";
import {
  PHOTOS,
  PAGE_SIZE,
  photoBySlug,
  photoStandardSrc,
  photoStandardSrcset,
  photoGainmapSrc,
  photoGainmapSrcset,
  withUnsplashReferral,
  photosPageCount,
  photosForPage,
  clampPhotoPage,
} from "@/lib/photos/catalog";

const FIRST = PHOTOS[0]!;

describe("PHOTOS", () => {
  it("has 100 entries", () => expect(PHOTOS.length).toBe(100));
});

describe("photoBySlug", () => {
  it("returns photo for existing slug", () => {
    expect(photoBySlug(FIRST.slug)).toBe(FIRST);
  });
  it("returns undefined for missing slug", () => {
    expect(photoBySlug("no-such-slug")).toBeUndefined();
  });
});

describe("photoStandardSrc", () => {
  it("includes unsplash photo id", () => {
    expect(photoStandardSrc(FIRST)).toContain(FIRST.unsplashPhotoId);
  });
  it("uses provided width", () => {
    expect(photoStandardSrc(FIRST, 800)).toContain("w=800");
  });
  it("defaults to width 1920", () => {
    expect(photoStandardSrc(FIRST)).toContain("w=1920");
  });
});

describe("photoStandardSrcset", () => {
  it("contains four width entries", () => {
    const parts = photoStandardSrcset(FIRST).split(", ");
    expect(parts.length).toBe(4);
  });
  it("each entry has a width descriptor", () => {
    for (const part of photoStandardSrcset(FIRST).split(", ")) {
      expect(part).toMatch(/\d+w$/);
    }
  });
});

describe("photoGainmapSrc", () => {
  it("uses slug path", () => {
    expect(photoGainmapSrc(FIRST)).toBe(`/photos/${FIRST.slug}/gainmap.jpg`);
  });
});

describe("photoGainmapSrcset", () => {
  it("has three width variants", () => {
    const parts = photoGainmapSrcset(FIRST).split(", ");
    expect(parts.length).toBe(3);
  });
  it("contains 400w 800w 1280w", () => {
    const src = photoGainmapSrcset(FIRST);
    expect(src).toContain("400w");
    expect(src).toContain("800w");
    expect(src).toContain("1280w");
  });
});

describe("withUnsplashReferral", () => {
  it("appends utm params to plain url", () => {
    const out = withUnsplashReferral("https://example.com");
    expect(out).toContain("utm_source=gainmaps");
  });
  it("uses & when url already has query params", () => {
    const out = withUnsplashReferral("https://example.com?foo=bar");
    expect(out).toContain("&utm_source");
  });
  it("uses ? when url has no query params", () => {
    const out = withUnsplashReferral("https://example.com");
    expect(out).toContain("?utm_source");
  });
});

describe("photosPageCount", () => {
  it("is 9 for 100 photos at PAGE_SIZE 12", () => {
    expect(photosPageCount()).toBe(Math.ceil(PHOTOS.length / PAGE_SIZE));
  });
});

describe("photosForPage", () => {
  it("returns first page correctly", () => {
    const page = photosForPage(1);
    expect(page.length).toBe(PAGE_SIZE);
    expect(page[0]).toBe(PHOTOS[0]);
  });
  it("clamps below 1 to page 1", () => {
    expect(photosForPage(0)[0]).toBe(PHOTOS[0]);
  });
  it("clamps above total to last page", () => {
    const lastPage = photosForPage(999);
    expect(lastPage.length).toBeGreaterThan(0);
  });
  it("last page has remaining photos", () => {
    const total = photosPageCount();
    const lastPage = photosForPage(total);
    expect(lastPage.length).toBe(PHOTOS.length - (total - 1) * PAGE_SIZE);
  });
});

describe("clampPhotoPage", () => {
  it("clamps NaN to 1", () => expect(clampPhotoPage(NaN)).toBe(1));
  it("clamps Infinity to 1", () => expect(clampPhotoPage(Infinity)).toBe(1));
  it("clamps 0 to 1", () => expect(clampPhotoPage(0)).toBe(1));
  it("clamps -5 to 1", () => expect(clampPhotoPage(-5)).toBe(1));
  it("floors 1.9 to 1", () => expect(clampPhotoPage(1.9)).toBe(1));
  it("clamps excess page to total", () => {
    const total = photosPageCount();
    expect(clampPhotoPage(999)).toBe(total);
  });
  it("returns valid page unchanged", () => expect(clampPhotoPage(2)).toBe(2));
});
