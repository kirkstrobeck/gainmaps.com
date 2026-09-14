import { afterEach, describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DisplayCheckModal } from "@/components/display-check-modal";
import { openDisplayCheck } from "@/lib/display-check-store";

describe("DisplayCheckModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    document.body.style.overflow = "";
    vi.stubGlobal("requestIdleCallback", vi.fn());
    vi.stubGlobal("cancelIdleCallback", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function readyState(value: DocumentReadyState) {
    Object.defineProperty(document, "readyState", { configurable: true, value });
  }

  function renderOpen() {
    render(<DisplayCheckModal />);
    act(() => openDisplayCheck());
  }

  it("shows the display question when requested", () => {
    renderOpen();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Can you see the symbol?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();
  });

  it("shows the yes answer and dismisses", () => {
    renderOpen();
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(screen.getByText("Yes, you can see it.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("display-check-dismissed")).toBe("1");
  });

  it("shows the no answer with three square example photos", () => {
    renderOpen();
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(screen.getByText(/No, you can.t/)).toBeInTheDocument();
    expect(screen.getByText(/hard to show what this display cannot show/)).toBeInTheDocument();
    expect(screen.getByText(/These photos help demonstrate the effect/)).toBeInTheDocument();
    expect(screen.getByLabelText("Photos that help show the Ultra effect")).toBeInTheDocument();
    const examples = screen.getAllByAltText(/Photo .*effect|Close-up photo/);
    expect(examples).toHaveLength(3);
    for (const image of examples) {
      expect(image).toHaveClass("aspect-square", "object-cover");
      expect(image).toHaveAttribute("src", expect.stringContaining("/display-check/examples/example-"));
    }
  });

  it("stays hidden until requested", () => {
    localStorage.setItem("display-check-dismissed", "1");
    render(<DisplayCheckModal />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a first visit only after load and idle", () => {
    readyState("loading");
    let idle: (() => void) | undefined;
    vi.mocked(requestIdleCallback).mockImplementation((callback) => {
      idle = callback;
      return 7;
    });
    render(<DisplayCheckModal />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => window.dispatchEvent(new Event("load")));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => idle?.());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("never schedules an answered visit", () => {
    readyState("complete");
    localStorage.setItem("display-check-dismissed", "1");
    render(<DisplayCheckModal />);
    expect(requestIdleCallback).not.toHaveBeenCalled();
    act(() => window.dispatchEvent(new Event("load")));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("schedules idle immediately when the document is complete", () => {
    readyState("complete");
    render(<DisplayCheckModal />);
    expect(requestIdleCallback).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("uses a timer when requestIdleCallback is unavailable", () => {
    readyState("complete");
    vi.stubGlobal("requestIdleCallback", undefined);
    render(<DisplayCheckModal />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    act(() => vi.runOnlyPendingTimers());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not reopen when an answer is stored before idle runs", () => {
    readyState("complete");
    let idle: (() => void) | undefined;
    vi.mocked(requestIdleCallback).mockImplementation((callback) => {
      idle = callback;
      return 9;
    });
    render(<DisplayCheckModal />);
    localStorage.setItem("display-check-dismissed", "1");
    act(() => idle?.());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cancels scheduled idle work on unmount", () => {
    readyState("complete");
    vi.mocked(requestIdleCallback).mockReturnValue(11);
    const { unmount } = render(<DisplayCheckModal />);
    unmount();
    expect(cancelIdleCallback).toHaveBeenCalledWith(11);
  });

  it("stops inner click from bubbling and restores focus on dismiss", () => {
    const prior = document.createElement("button");
    document.body.appendChild(prior);
    prior.focus();
    renderOpen();
    const dialog = screen.getByRole("dialog");
    const event = new MouseEvent("click", { bubbles: true });
    const stop = vi.spyOn(event, "stopPropagation");
    dialog.dispatchEvent(event);
    expect(stop).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    prior.remove();
  });

  it("dismisses on Escape key", () => {
    renderOpen();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("presentation"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("display-check-dismissed")).toBe("1");
  });

  it("ignores a non-Escape key on the overlay", () => {
    renderOpen();
    fireEvent.keyDown(screen.getByRole("presentation"), { key: "Enter" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dismisses on click-outside", () => {
    renderOpen();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("presentation"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("display-check-dismissed")).toBe("1");
  });

  it("reopens via openDisplayCheck after dismissal", async () => {
    render(<DisplayCheckModal />);
    await act(async () => { openDisplayCheck(); });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Can you see the symbol?")).toBeInTheDocument();
  });
});
