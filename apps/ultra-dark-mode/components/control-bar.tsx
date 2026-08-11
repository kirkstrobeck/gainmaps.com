// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

import { useAppearance } from "@/components/appearance-provider";
import { HeadroomSlider } from "@/components/headroom-slider";
import { ModeSwitch } from "@/components/mode-switch";
import { UltraToggle } from "@/components/ultra-toggle";

/*
  One floating pill, one line: mode on the left, Ultra on the right, a hairline
  between them. It sticks 24px below the top of the viewport so it is always in
  reach — the two things this page does are both in here.

  With Ultra on, the headroom slider appears beside the pill. The rail is what
  gets centred and the slider is positioned out of flow against it, so the two
  controls above never move when it comes and goes. See .udm-rail in chrome.css.
*/
export function ControlBar() {
  const { ultra } = useAppearance();

  return (
    <div className="sticky top-6 z-10 flex justify-center">
      <div className="udm-rail">
        <div className="udm-pill">
          <ModeSwitch />
          <span className="udm-divider" aria-hidden />
          <UltraToggle />
        </div>

        {ultra === "on" ? <HeadroomSlider /> : null}
      </div>
    </div>
  );
}
