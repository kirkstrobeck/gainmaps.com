import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("renders 404 status text", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("renders 'Page not found' heading", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: /page not found/i })).toBeInTheDocument();
  });

  it("renders link back to home", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /return home/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
