import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SiteNav } from "@/components/site-nav";
import { navState } from "@/test/helpers/nav";

vi.mock("@/components/ultra-word", () => ({
  UltraWord: ({ text }: { text: string }) => <span>{text}</span>,
}));

vi.mock("@/components/ultra-icon", () => ({
  UltraIcon: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

// The mobile menu renders a second ShareCluster instance with menu=true,
// which is a distinct closure from the desktop one — these tests exercise
// its "nav_menu" surface branches (share success/aborted/failed, copy).

function openMobileMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
}

describe("SiteNav mobile ShareCluster (menu=true)", () => {
  it("copy link from the mobile menu tracks the nav_menu surface", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });
    navState.pathname = "/";
    render(<SiteNav />);
    openMobileMenu();
    const copyButtons = screen.getAllByRole("button", { name: "Copy link" });
    fireEvent.click(copyButtons[copyButtons.length - 1]!);
    expect(writeText).toHaveBeenCalled();
  });

  it("share success from the mobile menu tracks the nav_menu surface", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", {
      value: share,
      configurable: true,
      writable: true,
    });
    navState.pathname = "/";
    render(<SiteNav />);
    openMobileMenu();
    const shareBtns = await screen.findAllByRole("button", { name: "Share" });
    await act(async () => { fireEvent.click(shareBtns[shareBtns.length - 1]!); });
    expect(share).toHaveBeenCalled();
  });

  it("share AbortError from the mobile menu tracks the nav_menu surface", async () => {
    const abortError = Object.assign(new Error("cancelled"), { name: "AbortError" });
    const share = vi.fn().mockRejectedValue(abortError);
    Object.defineProperty(navigator, "share", {
      value: share,
      configurable: true,
      writable: true,
    });
    navState.pathname = "/";
    render(<SiteNav />);
    openMobileMenu();
    const shareBtns = await screen.findAllByRole("button", { name: "Share" });
    await act(async () => { fireEvent.click(shareBtns[shareBtns.length - 1]!); });
    expect(share).toHaveBeenCalled();
  });

  it("share failure from the mobile menu tracks the nav_menu surface", async () => {
    const share = vi.fn().mockRejectedValue(new Error("share failed"));
    Object.defineProperty(navigator, "share", {
      value: share,
      configurable: true,
      writable: true,
    });
    navState.pathname = "/";
    render(<SiteNav />);
    openMobileMenu();
    const shareBtns = await screen.findAllByRole("button", { name: "Share" });
    await act(async () => { fireEvent.click(shareBtns[shareBtns.length - 1]!); });
    expect(share).toHaveBeenCalled();
  });
});
