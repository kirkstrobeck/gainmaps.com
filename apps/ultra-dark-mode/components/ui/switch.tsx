"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-[var(--border)] shadow-sm transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-[var(--accent)] data-[state=unchecked]:bg-[var(--border)]",
      className,
    )}
    {...props}
    ref={ref}
  >
    {/*
      Geometry, so nobody "simplifies" it back to size-6 / translate-x-5:
      the h-7 w-12 root has a 1px border, so the content box is 26x46. The
      thumb is 22px and ring-1 draws outside it, so the visible circle is
      24px — 1px of gap above and below in the 26px slot. Horizontally,
      2px of box on the left minus the 1px ring is 1px of visible gap, and
      46 - 22 - 22 = 2px of box on the right, again 1px once the ring is
      counted. Every gap is 1px.
    */}
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block size-[22px] rounded-full bg-[var(--panel)] shadow-md ring-1 ring-black/10 transition-transform",
        "data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[2px]",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
