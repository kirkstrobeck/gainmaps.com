import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LogoPair } from "@/components/logo-pair";
import { COMPANIES } from "@/lib/logos/companies";

const company = COMPANIES[0]!;

describe("LogoPair", () => {
  it("renders an SDR-clamped tile and an Ultra tile at card size", () => {
    render(<LogoPair company={company} size="card" />);
    const sdr = screen.getByAltText(`${company.name} logo, Standard`);
    const ultra = screen.getByAltText(`${company.name} logo, Ultra`);
    expect(sdr).toHaveClass("preview-original");
    expect(ultra).toHaveClass("gainmap-image");
    expect(ultra).toHaveAttribute("sizes");
    expect(ultra.getAttribute("srcset")).toContain("128w");
    expect(screen.getByText("SDR JPEG")).toBeInTheDocument();
    expect(screen.getByText("ULTRA HDR JPEG")).toBeInTheDocument();
  });

  it("renders detail size with a larger sizes attribute on both tiles", () => {
    render(<LogoPair company={company} size="detail" />);
    const sdr = screen.getByAltText(`${company.name} logo, Standard`);
    const ultra = screen.getByAltText(`${company.name} logo, Ultra`);
    expect(ultra).toHaveAttribute("sizes", expect.stringContaining("512px"));
    expect(sdr).toHaveAttribute("sizes", expect.stringContaining("512px"));
  });

  it("both slots are fed from the same gainmap asset — local has no separate SDR asset layer", () => {
    render(<LogoPair company={company} size="card" />);
    const sdr = screen.getByAltText(`${company.name} logo, Standard`);
    const ultra = screen.getByAltText(`${company.name} logo, Ultra`);
    expect(sdr.getAttribute("src")).toBe(company.gainmapPath);
    expect(ultra.getAttribute("src")).toBe(company.gainmapPath);
    expect(sdr.getAttribute("srcset")).toBe(ultra.getAttribute("srcset"));
  });

  it("defaults to eager loading when lazy is not passed", () => {
    render(<LogoPair company={company} size="card" />);
    const sdr = screen.getByAltText(`${company.name} logo, Standard`);
    expect(sdr).toHaveAttribute("loading", "eager");
  });

  it("forwards lazy to the underlying images", () => {
    render(<LogoPair company={company} size="card" lazy />);
    const sdr = screen.getByAltText(`${company.name} logo, Standard`);
    const ultra = screen.getByAltText(`${company.name} logo, Ultra`);
    expect(sdr).toHaveAttribute("loading", "lazy");
    expect(ultra).toHaveAttribute("loading", "lazy");
  });
});
