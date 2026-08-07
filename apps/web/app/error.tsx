"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[var(--background)] px-6 text-[var(--foreground)]">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-[var(--muted)]">Something failed</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Reload the processor</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          The page shell hit an unexpected rendering error.
        </p>
        <button
          className="mt-6 inline-flex h-10 items-center justify-center rounded-[var(--radius)] bg-[var(--foreground)] px-4 text-sm font-medium text-[var(--background)]"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
