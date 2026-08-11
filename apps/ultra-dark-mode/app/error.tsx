// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

/*
  The shell failed to render. The page is one column of type and one photo, so
  there is nothing to recover — offer the reset and stay out of the way.
*/
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-[100dvh] place-items-center p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="m-0 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
          Error
        </p>
        <h1 className="m-0 text-[32px] font-extrabold tracking-[-0.02em] text-[var(--ink)]">
          Something failed
        </h1>
        <button
          className="text-[14px] text-[var(--muted)] underline underline-offset-4 transition-colors duration-200 hover:text-[var(--ink)]"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
