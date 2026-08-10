// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

import { UltraWord } from "@/components/ultra-word";

const TYPE =
  "font-[family-name:var(--font-geist-sans)] text-[18vw] font-bold leading-none";

export default function Page() {
  return (
    <main className="flex h-[100dvh] items-center justify-center bg-black">
      <UltraWord word="foo" typeClassName={TYPE} intensity={2.2} />
    </main>
  );
}
