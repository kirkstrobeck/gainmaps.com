// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { useAppearance } from "@/components/appearance-provider";
import { Switch } from "@/components/ui/switch";

/*
  Sun, switch, moon. Checked means dark, which is the default, so the switch
  sits in its "on" position for almost every visitor.

  The icons are labels, not buttons: the switch is the control, and it carries
  the accessible name. Both icons stay mounted and only change colour, so
  nothing in the pill moves when the mode flips.
*/

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
      <SunIcon style={iconStyle(!dark)} />
      <Switch
        checked={dark}
        onCheckedChange={(checked) => setMode(checked ? "dark" : "light")}
        aria-label="Dark mode"
      />
      <MoonIcon style={iconStyle(dark)} />
    </>
  );
}
