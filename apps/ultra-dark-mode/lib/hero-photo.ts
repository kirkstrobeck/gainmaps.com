// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

/*
  The hero photo, in both of its forms.

  ULTRA.note is not a description someone wrote — it is the exact string
  tools/ultra-dark-mode/encode-hero.ts printed when it produced peaks-ultra.jpg
  from apps/web/public/appearance/peaks.jpg. Re-run that script and paste the
  new line here if the source photo or the boost ever changes; the caption is
  meant to report what the encoder actually did.
*/

export type HeroPhoto = {
  /** Path under public/, served as-is. */
  src: string;
  /** File name shown in the caption. */
  file: string;
  /** What that file is. */
  note: string;
};

export const HERO_SDR: HeroPhoto = {
  src: "/peaks.jpg",
  file: "peaks.jpg",
  note: "SDR JPEG",
};

export const HERO_ULTRA: HeroPhoto = {
  src: "/peaks-ultra.jpg",
  file: "peaks-ultra.jpg",
  note: "Gain map JPEG · 3.34× · 1600×1068",
};

export const HERO_ALT =
  "The Milky Way and a shooting star over snow-covered mountain peaks at night";

export function heroCaption(photo: HeroPhoto): string {
  return `${photo.file} — ${photo.note}`;
}
