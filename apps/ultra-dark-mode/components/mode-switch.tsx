// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { useAppearance } from "@/components/appearance-provider";
import { Switch } from "@/components/ui/switch";

/*
  Moon, switch, sun. Dark sits on the left, so checked means light and the
  switch sits in its "off" position for almost every visitor.

  The icons are labels, not buttons: the switch is the control, and it carries
  the accessible name. Both icons stay mounted and only change colour, so
  nothing in the pill moves when the mode flips.
*/

/*
  The shared Switch paints the track with the accent when checked, which reads
  as "on". This is a two-position selector — neither dark nor light is the
  enabled state — so hold the track at the border colour in both states and
  let the thumb position carry the meaning.
*/
const trackClassName =
  "data-[state=checked]:bg-[var(--border)] data-[state=unchecked]:bg-[var(--border)]";

function iconStyle(active: boolean) {
  return {
    color: active ? "var(--ink)" : "var(--muted)",
    opacity: active ? 1 : 0.45,
  };
}

export function ModeSwitch() {
  const { mode, setMode } = useAppearance();
  const dark = mode === "dark";

  return (
    <>
      <MoonIcon style={iconStyle(dark)} />
      <Switch
        checked={!dark}
        onCheckedChange={(checked) => setMode(checked ? "light" : "dark")}
        aria-label="Light mode"
        className={trackClassName}
      />
      <SunIcon style={iconStyle(!dark)} />
    </>
  );
}
