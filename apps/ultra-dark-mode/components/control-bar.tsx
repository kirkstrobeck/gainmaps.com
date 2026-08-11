// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

import { ModeSwitch } from "@/components/mode-switch";
import { UltraToggle } from "@/components/ultra-toggle";

/*
  One floating pill, one line: mode on the left, Ultra on the right, a hairline
  between them. It sticks 24px below the top of the viewport so it is always in
  reach — the two things this page does are both in here.
*/
export function ControlBar() {
  return (
    <div className="sticky top-6 z-10 flex justify-center">
      <div className="udm-pill">
        <ModeSwitch />
        <span className="udm-divider" aria-hidden />
        <UltraToggle />
      </div>
    </div>
  );
}
