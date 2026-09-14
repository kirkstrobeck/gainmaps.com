import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LogosGrid } from "@/components/logos-grid";
import type { Company } from "@/lib/logos/companies";

vi.mock("@/components/gallery-seam", () => ({
  GallerySeamController: () => null,
  GallerySeamLogo: ({ company, priority }: { company: Company; priority: boolean }) => (
    <span data-testid="logo-pair" data-priority={priority ? "true" : "false"}>{company.name}</span>
  ),
}));

function makeCompanies(count: number): Company[] {
  return Array.from({ length: count }, (_, i) => ({
    slug: `company-${i}`,
    name: `Company ${i}`,
    rank: i + 1,
    svgPath: `/logos/company-${i}/logo.svg`,
    gainmapPath: `/logos/company-${i}/logo-gainmap.jpg`,
  }));
}

describe("LogosGrid", () => {
  it("renders all companies regardless of count (large list)", () => {
    const companies = makeCompanies(30);
    render(<LogosGrid companies={companies} />);
    const pairs = screen.getAllByTestId("logo-pair");
    expect(pairs.length).toBe(30);
  });

  it("renders all companies regardless of count (small list)", () => {
    const companies = makeCompanies(3);
    render(<LogosGrid companies={companies} />);
    const pairs = screen.getAllByTestId("logo-pair");
    expect(pairs.length).toBe(3);
  });

  it("never shows a 'Show more' button, small list", () => {
    const companies = makeCompanies(3);
    render(<LogosGrid companies={companies} />);
    expect(screen.queryByRole("button", { name: /show more/i })).toBeNull();
  });

  it("never shows a 'Show more' button, large list", () => {
    const companies = makeCompanies(30);
    render(<LogosGrid companies={companies} />);
    expect(screen.queryByRole("button", { name: /show more/i })).toBeNull();
  });

  it("prioritizes the first row of logo pairs (index < 3)", () => {
    const companies = makeCompanies(6);
    render(<LogosGrid companies={companies} />);
    const pairs = screen.getAllByTestId("logo-pair");
    expect(pairs.length).toBe(6);
    pairs.forEach((pair, index) => {
      expect(pair.getAttribute("data-priority")).toBe(index < 3 ? "true" : "false");
    });
  });

  it("each card links company name to detail page (no outer anchor)", () => {
    const companies = makeCompanies(3);
    render(<LogosGrid companies={companies} />);
    const link = screen.getByRole("link", { name: "Company 0" });
    expect(link).toHaveAttribute("href", "/logos/company-0");
    // The li itself should not be a link
    const listItems = document.querySelectorAll("li");
    expect(listItems[0]?.tagName).toBe("LI");
  });
});
