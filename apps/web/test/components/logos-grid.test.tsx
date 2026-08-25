import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LogosGrid } from "@/components/logos-grid";
import type { Company } from "@/lib/logos/companies";

vi.mock("@/components/logo-pair", () => ({
  LogoPair: ({ company }: { company: Company }) => <span data-testid="logo-pair">{company.name}</span>,
}));

function makeCompanies(count: number): Company[] {
  return Array.from({ length: count }, (_, i) => ({
    slug: `company-${i}`,
    name: `Company ${i}`,
    rank: i + 1,
    description: `Desc ${i}`,
    colors: { primary: "#000", on: "#fff" },
    svg: "icon.svg",
  }));
}

describe("LogosGrid", () => {
  it("renders the first 24 companies", () => {
    const companies = makeCompanies(30);
    render(<LogosGrid companies={companies} />);
    const pairs = screen.getAllByTestId("logo-pair");
    expect(pairs.length).toBe(24);
  });

  it("renders all companies when count ≤ PAGE_SIZE", () => {
    const companies = makeCompanies(10);
    render(<LogosGrid companies={companies} />);
    const pairs = screen.getAllByTestId("logo-pair");
    expect(pairs.length).toBe(10);
  });

  it("shows 'Show more' button when there are more than 24", () => {
    const companies = makeCompanies(30);
    render(<LogosGrid companies={companies} />);
    expect(screen.getByRole("button", { name: /show more/i })).toBeInTheDocument();
  });

  it("does not show 'Show more' button when all fit on first page", () => {
    const companies = makeCompanies(10);
    render(<LogosGrid companies={companies} />);
    expect(screen.queryByRole("button", { name: /show more/i })).toBeNull();
  });

  it("shows more companies on button click", () => {
    const companies = makeCompanies(30);
    render(<LogosGrid companies={companies} />);
    fireEvent.click(screen.getByRole("button", { name: /show more/i }));
    const pairs = screen.getAllByTestId("logo-pair");
    expect(pairs.length).toBe(30);
  });

  it("shows remaining count in button label", () => {
    const companies = makeCompanies(30);
    render(<LogosGrid companies={companies} />);
    expect(screen.getByRole("button", { name: /6 remaining/i })).toBeInTheDocument();
  });
});
