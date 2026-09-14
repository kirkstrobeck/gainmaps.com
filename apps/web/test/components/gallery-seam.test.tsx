import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GallerySeamLogo, GallerySeamPhoto } from "@/components/gallery-seam";
import { COMPANIES } from "@/lib/logos/companies";
import { PHOTOS, PHOTO_GALLERY_SIZES } from "@/lib/photos/catalog";

vi.mock("@/components/gallery-seam-controller", () => ({ GallerySeamController: () => null }));

describe("gallery seam markup", () => {
  it("renders an eager, high-priority photo pair", () => {
    render(<GallerySeamPhoto photo={PHOTOS[0]!} priority sizes={PHOTO_GALLERY_SIZES} />);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    images.forEach((image) => {
      expect(image).toHaveAttribute("loading", "eager");
      expect(image).toHaveAttribute("fetchpriority", "high");
      expect(image).not.toHaveAttribute("data-seam-src");
    });
  });

  it("keeps the standard photo native-lazy and defers the Ultra request", () => {
    render(<GallerySeamPhoto photo={PHOTOS[1]!} priority={false} sizes={PHOTO_GALLERY_SIZES} />);
    const standard = screen.getByRole("img", { name: /Standard$/ });
    const ultra = screen.getByRole("img", { name: /Ultra$/ });
    expect(standard).toHaveAttribute("loading", "lazy");
    expect(standard).toHaveAttribute("fetchpriority", "low");
    expect(ultra).not.toHaveAttribute("src");
    expect(ultra).toHaveAttribute("data-seam-src", expect.stringContaining("gainmap-400.jpg"));
  });

  it("renders eager and native-lazy logo pairs", () => {
    const { rerender } = render(<GallerySeamLogo company={COMPANIES[0]!} priority />);
    expect(screen.getAllByRole("img")[0]).toHaveAttribute("loading", "eager");
    rerender(<GallerySeamLogo company={COMPANIES[0]!} priority={false} />);
    screen.getAllByRole("img").forEach((image) => expect(image).toHaveAttribute("loading", "lazy"));
  });
});
