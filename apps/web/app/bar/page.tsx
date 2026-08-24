// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

import type { Metadata } from "next";

import { UltraWord } from "@/components/ultra-word";
import { TEXT_ULTRA_INTENSITY } from "@/lib/text-ultra";

export const metadata: Metadata = {
  title: "Ultra · Gainmaps",
  description: "Ultra HDR brighter-than-white word demo.",
};

const TYPE = "font-display text-[18vw] font-bold leading-none";

export default function Base() {
  return (
    <main className="flex h-[100dvh] items-center justify-center bg-black">
      <UltraWord word="Ultra" typeClassName={TYPE} intensity={TEXT_ULTRA_INTENSITY} />
    </main>
  );
}
