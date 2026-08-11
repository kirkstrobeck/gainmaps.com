// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

/*
  The shadcn new-york Slider, in this app's token names — the same port the
  other primitives in components/ui got, so all of the chrome stays monochrome.

  Two deliberate departures from the generated file:

  - No transition on the thumb. Nothing in this app's appearance animates.
  - aria-label is forwarded to the Thumb, which is the element that carries
    role="slider". Left on the Root it names a group nobody focuses, and the
    control reaches a screen reader unnamed.
*/
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, "aria-label": ariaLabel, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[var(--border)]">
      <SliderPrimitive.Range className="absolute h-full bg-[var(--accent)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      aria-label={ariaLabel}
      className={cn(
        "block size-4 shrink-0 cursor-pointer rounded-full border border-[var(--border)] bg-[var(--accent)] shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--panel)]",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
