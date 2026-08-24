import { BoltIcon } from "@/components/icons";
import { PhotoCredit, PhotoPair } from "@/components/photo-pair";
import { UltraIcon } from "@/components/ultra-icon";
import { UltraWord } from "@/components/ultra-word";
import type { Photo } from "@/lib/photos/catalog";
import { TEXT_ULTRA_INTENSITY } from "@/lib/text-ultra";

const ULTRA_TYPE = "font-display text-5xl font-bold sm:text-6xl lg:text-7xl";
const TEXT_COMPARE_TYPE = "font-display text-4xl font-bold sm:text-5xl";

export function HeroSection({ comparePhoto }: { comparePhoto: Photo }) {
  return (
    <section
      aria-label="Hero"
      className="hero-stage mx-auto flex min-h-[calc(100dvh-7rem)] max-w-4xl flex-col items-center justify-center gap-6 px-4 py-8 text-center sm:px-6 lg:px-8"
    >
      {/* Eyebrow */}
      <div className="flex items-center gap-3">
        <span className="site-mark flex size-11 items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] text-[var(--accent-foreground)] transition">
          <UltraIcon size={22}>
            <BoltIcon />
          </UltraIcon>
        </span>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
          Brighter than white
        </p>
      </div>

      {/* Headline */}
      <h1 className="flex flex-wrap items-baseline justify-center gap-x-2">
        <UltraWord word="Gain" typeClassName={ULTRA_TYPE} intensity={TEXT_ULTRA_INTENSITY} />
        <UltraWord word="maps" typeClassName={ULTRA_TYPE} intensity={TEXT_ULTRA_INTENSITY} />
      </h1>

      {/* Tagline */}
      <p className="max-w-md text-base leading-7 text-[var(--muted)] sm:text-lg">
        One file. Two renderers. Standard clips highlights. Ultra unlocks them.
      </p>

      {/* Side-by-side proofs — text + photo, both above the fold */}
      <div className="grid w-full max-w-3xl items-start gap-8 sm:grid-cols-2">
        <div className="grid justify-items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">Text</p>
          <div className="grid grid-cols-2 gap-6">
            <div className="grid gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">Standard</p>
              <p className={`${TEXT_COMPARE_TYPE} text-[var(--foreground)]`}>Ultra</p>
            </div>
            <div className="grid gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">Ultra</p>
              <UltraWord word="Ultra" typeClassName={TEXT_COMPARE_TYPE} intensity={TEXT_ULTRA_INTENSITY} />
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">Photo</p>
          <PhotoPair photo={comparePhoto} size="card" priority />
          <PhotoCredit photo={comparePhoto} />
        </div>
      </div>
    </section>
  );
}
