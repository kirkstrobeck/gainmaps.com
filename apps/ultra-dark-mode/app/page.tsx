// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

import { ControlBar } from "@/components/control-bar";
import { HeroPhoto } from "@/components/hero-photo";
import { Wordmark } from "@/components/wordmark";

/*
  One column, one claim, one demonstration. The wordmark is the argument and the
  photo is the evidence — the page is otherwise deliberately empty.
*/
export default function Page() {
  return (
    <div className="flex min-h-[100dvh] flex-col pt-6">
      <ControlBar />

      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col justify-center gap-10 p-8">
        <p className="m-0 text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
          ultradarkmode.com
        </p>

        <Wordmark />

        <p className="m-0 max-w-[46ch] text-[16px] leading-[1.6] text-[var(--muted)]">
          Dark mode with the lights on. Ultra unlocks the display headroom your
          screen already has, so the word above and the photo below are painted
          brighter than white.
        </p>

        <HeroPhoto />
      </main>
    </div>
  );
}
