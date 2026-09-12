import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImageProofSection } from "@/components/image-proof-section";
import { COMPANIES } from "@/lib/logos/companies";
import { PHOTOS } from "@/lib/photos/catalog";

const logos = COMPANIES.slice(0, 3);
const photos = PHOTOS.slice(0, 2);

describe("ImageProofSection", () => {
  it("renders logo section and photo section with browse-all links", () => {
    render(<ImageProofSection logos={logos} photos={photos} />);
    expect(screen.getByText(new RegExp(`${COMPANIES.length} brand logos`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${PHOTOS.length} photographs`))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(`Browse all ${COMPANIES.length} logos`) })).toHaveAttribute("href", "/logos");
    expect(screen.getByRole("link", { name: new RegExp(`Browse all ${PHOTOS.length} photos`) })).toHaveAttribute("href", "/photos");
    expect(screen.getByRole("link", { name: photos[0]!.alt })).toHaveAttribute(
      "href",
      `/photos/${photos[0]!.slug}`,
    );
  });

  it("renders one logo comparison pair per passed-in logo (SDR vs Ultra)", () => {
    render(<ImageProofSection logos={logos} photos={photos} />);
    const standardImgs = logos.map((company) => screen.getByAltText(`${company.name} logo, Standard`));
    const ultraImgs = logos.map((company) => screen.getByAltText(`${company.name} logo, Ultra`));
    expect(standardImgs.length).toBe(logos.length);
    expect(ultraImgs.length).toBe(logos.length);
    // Local's rework serves the same gainmap asset to both slots — distinguished
    // by class and alt text, not by a separate SDR asset.
    const firstStd = standardImgs[0]!;
    const firstUltra = ultraImgs[0]!;
    expect(firstStd.getAttribute("src")).toBe(firstUltra.getAttribute("src"));
    expect(firstStd).toHaveClass("preview-original");
    expect(firstUltra).toHaveClass("gainmap-image");
  });
});
