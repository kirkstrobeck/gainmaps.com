import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorPage from "@/app/error";

describe("ErrorPage", () => {
  it("renders an error message", () => {
    render(<ErrorPage error={new Error("test")} reset={() => {}} />);
    expect(screen.getByText(/something failed/i)).toBeInTheDocument();
  });

  it("renders a heading to reload", () => {
    render(<ErrorPage error={new Error("test")} reset={() => {}} />);
    expect(screen.getByRole("heading", { name: /reload the processor/i })).toBeInTheDocument();
  });

  it("calls reset when Try again is clicked", () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error("test")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
