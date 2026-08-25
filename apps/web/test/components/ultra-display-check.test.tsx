import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UltraDisplayCheck } from "@/components/ultra-display-check";
import * as siteAppearance from "@/lib/site-appearance";

describe("UltraDisplayCheck", () => {
  beforeEach(() => {
    delete document.documentElement.dataset.ultra;
  });

  it("shows Ultra on message when ultra is on", () => {
    document.documentElement.dataset.ultra = "on";
    render(<UltraDisplayCheck />);
    expect(screen.getByText(/you're seeing the real thing/i)).toBeInTheDocument();
  });

  it("shows Ultra off message when ultra is off", () => {
    document.documentElement.dataset.ultra = "off";
    render(<UltraDisplayCheck />);
    expect(screen.getByText(/here's what you're missing/i)).toBeInTheDocument();
  });

  it("shows '1000 nits' label when ultra is on", () => {
    document.documentElement.dataset.ultra = "on";
    render(<UltraDisplayCheck />);
    expect(screen.getByText(/1000 nits/i)).toBeInTheDocument();
  });

  it("shows 'Ultra off' label when ultra is off", () => {
    document.documentElement.dataset.ultra = "off";
    render(<UltraDisplayCheck />);
    expect(screen.getByText(/ultra off/i)).toBeInTheDocument();
  });
});
