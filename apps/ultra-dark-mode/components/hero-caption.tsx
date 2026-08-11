// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

/*
  What is actually on screen, stated plainly: which file is showing on the left,
  what the Ultra switch is doing on the right. Monospace because these are file
  names and numbers, and because it should read as a readout, not as copy.
*/
export function HeroCaption({ file, state }: { file: string; state: string }) {
  return (
    <figcaption className="flex items-baseline justify-between gap-4 font-[family-name:var(--font-geist-mono)] text-[12px] text-[var(--muted)]">
      <span>{file}</span>
      <span>{state}</span>
    </figcaption>
  );
}
