import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UltraSkillCard } from "@/components/ultra-skill-card";

describe("UltraSkillCard", () => {
  it("renders the heading", () => {
    render(<UltraSkillCard />);
    expect(screen.getByText(/add ultra text to your site/i)).toBeInTheDocument();
  });

  it("renders the npx command text", () => {
    render(<UltraSkillCard />);
    expect(screen.getByText(/npx skills add kirkstrobeck\/gainmaps\.com/i)).toBeInTheDocument();
  });

  it("renders a link to GitHub", () => {
    render(<UltraSkillCard />);
    const link = screen.getByRole("link", { name: /view skill source/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("github.com"));
  });
});
