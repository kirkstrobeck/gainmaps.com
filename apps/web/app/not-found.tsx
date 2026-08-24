export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[var(--background)] px-6 text-[var(--foreground)]">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-[var(--muted)]">404</p>
        <h1 className="font-display mt-3 text-3xl font-bold tracking-normal">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          The HDR processor is available on the home page.
        </p>
        <a
          className="mt-6 inline-flex h-10 items-center justify-center rounded-[var(--radius)] bg-[var(--foreground)] px-4 text-sm font-medium text-[var(--background)] transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          href="/"
        >
          Return home
        </a>
      </div>
    </main>
  );
}
