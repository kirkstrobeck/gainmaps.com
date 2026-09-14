import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PHOTOS } from "@/lib/photos/catalog";

vi.mock("@/components/page-chrome", () => ({
  PageChrome: () => <div data-testid="chrome" />,
}));

vi.mock("@/components/ultra-word", () => ({
  UltraWord: ({ text }: { text: string }) => <span>{text}</span>,
}));

describe("photos index", () => {
  it("renders the Photos heading", async () => {
    const Base = (await import("@/app/photos/page")).default;
    const ui = Base();
    render(ui);
    expect(screen.getByRole("heading", { name: "Photos" })).toBeInTheDocument();
  });

  it("renders every photo in the catalog, no pagination", async () => {
    const Base = (await import("@/app/photos/page")).default;
    const ui = Base();
    render(ui);
    expect(document.querySelectorAll(".photo-card").length).toBe(PHOTOS.length);
  });

  it("has no Previous/Next pagination controls", async () => {
    const Base = (await import("@/app/photos/page")).default;
    const ui = Base();
    render(ui);
    expect(screen.queryByText("Previous")).not.toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });
});
