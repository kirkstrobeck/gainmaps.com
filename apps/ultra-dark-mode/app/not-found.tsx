// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

/*
  A real 404, not the framework's. Without one, the production build falls back
  to the Pages Router error page and fails to prerender /404 outright.
*/
export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <p className="m-0 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
          404
        </p>
        <h1 className="m-0 text-[32px] font-extrabold tracking-[-0.02em] text-[var(--ink)]">
          Nothing here
        </h1>
        <a
          className="text-[14px] text-[var(--muted)] underline underline-offset-4 transition-colors duration-200 hover:text-[var(--ink)]"
          href="/"
        >
          Back to Ultra
        </a>
      </div>
    </main>
  );
}
