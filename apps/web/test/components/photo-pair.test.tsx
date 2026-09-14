import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhotoCredit } from "@/components/photo-pair";
import { PHOTOS } from "@/lib/photos/catalog";

const photo = PHOTOS[0]!;

describe("PhotoCredit", () => {
  it("links photographer, Unsplash, and original", () => {
    render(<PhotoCredit photo={photo} />);
    expect(screen.getByRole("link", { name: photo.photographer })).toHaveAttribute(
      "href",
      expect.stringContaining("utm_source=gainmaps"),
    );
    expect(screen.getByRole("link", { name: "Unsplash" })).toHaveAttribute("href", expect.stringContaining("unsplash.com"));
    expect(screen.getByRole("link", { name: "Original" })).toHaveAttribute("href", expect.stringContaining(photo.photoUrl.split("?")[0]!));
  });
});
