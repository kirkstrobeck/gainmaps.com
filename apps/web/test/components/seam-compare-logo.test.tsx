import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SeamCompareLogo } from "@/components/seam-compare-logo";
import { COMPANIES } from "@/lib/logos/companies";

const company = COMPANIES[0]!;

describe("SeamCompareLogo", () => {
  it("renders a Standard-labelled tile and an Ultra-labelled tile", () => {
    render(<SeamCompareLogo company={company} />);
    const sdr = screen.getByAltText(`${company.name} logo, Standard`);
    const ultra = screen.getByAltText(`${company.name} logo, Ultra`);
    expect(sdr).toHaveClass("preview-original");
    expect(ultra).toHaveClass("gainmap-image");
  });

  it("feeds both slots from company.gainmapPath — local has no separate SDR asset", () => {
    render(<SeamCompareLogo company={company} />);
    const sdr = screen.getByAltText(`${company.name} logo, Standard`);
    const ultra = screen.getByAltText(`${company.name} logo, Ultra`);
    expect(sdr.getAttribute("src")).toBe(company.gainmapPath);
    expect(ultra.getAttribute("src")).toBe(company.gainmapPath);
    // Same asset in both slots means identical srcset width descriptors and
    // sizes — the seam lines up because both sides are pixel-identical.
    expect(sdr.getAttribute("srcset")).toBe(ultra.getAttribute("srcset"));
    expect(sdr.getAttribute("sizes")).toBe(ultra.getAttribute("sizes"));
  });

  it("uses the default sizes attribute when none is passed", () => {
    render(<SeamCompareLogo company={company} />);
    const ultra = screen.getByAltText(`${company.name} logo, Ultra`);
    expect(ultra).toHaveAttribute("sizes", "(max-width: 640px) 100vw, 512px");
  });

  it("forwards a custom sizes attribute to both slots", () => {
    render(<SeamCompareLogo company={company} sizes="200px" />);
    const sdr = screen.getByAltText(`${company.name} logo, Standard`);
    const ultra = screen.getByAltText(`${company.name} logo, Ultra`);
    expect(sdr).toHaveAttribute("sizes", "200px");
    expect(ultra).toHaveAttribute("sizes", "200px");
  });

  it("forwards width, height, and className to the shared instrument container", () => {
    const { container } = render(
      <SeamCompareLogo company={company} width={128} height={128} className="my-class" />,
    );
    const root = container.querySelector(".inst") as HTMLElement;
    expect(root).toHaveClass("my-class");
    expect(root.style.width).toBe("128px");
    expect(root.style.height).toBe("128px");
  });

  it("uses eager loading by default", () => {
    render(<SeamCompareLogo company={company} />);
    const sdr = screen.getByAltText(`${company.name} logo, Standard`);
    const ultra = screen.getByAltText(`${company.name} logo, Ultra`);
    expect(sdr).toHaveAttribute("loading", "eager");
    expect(ultra).toHaveAttribute("loading", "eager");
  });

  it("uses lazy loading when lazy is true", () => {
    render(<SeamCompareLogo company={company} lazy />);
    const sdr = screen.getByAltText(`${company.name} logo, Standard`);
    const ultra = screen.getByAltText(`${company.name} logo, Ultra`);
    expect(sdr).toHaveAttribute("loading", "lazy");
    expect(ultra).toHaveAttribute("loading", "lazy");
  });
});
