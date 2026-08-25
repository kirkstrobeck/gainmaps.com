import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShareBar } from "@/components/share-bar";

describe("ShareBar", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    // Remove share so it's not detected
    delete (navigator as unknown as Record<string, unknown>).share;
  });

  it("renders 'Copy link' button", () => {
    render(<ShareBar />);
    expect(screen.getByLabelText("Copy link")).toBeInTheDocument();
  });

  it("clicking Copy link calls clipboard.writeText", async () => {
    render(<ShareBar />);
    fireEvent.click(screen.getByLabelText("Copy link"));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
    });
  });

  it("shows 'Copied' after clicking copy", async () => {
    render(<ShareBar />);
    fireEvent.click(screen.getByLabelText("Copy link"));
    await waitFor(() => {
      expect(screen.getByLabelText("Copy link").textContent).toContain("Copied");
    });
  });

  it("does not show Share button when navigator.share is undefined", () => {
    render(<ShareBar />);
    expect(screen.queryByLabelText("Share")).toBeNull();
  });
});
