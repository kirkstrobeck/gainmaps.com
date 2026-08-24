"use client";

import { LightningFilled } from "@mingcute/react/core-filled";

import { UltraIcon } from "@/components/ultra-icon";

export function UltraDisplayCheck() {
  return (
    <details open className="border-b border-[var(--border)]">
      <summary className="cursor-pointer select-none px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-[var(--muted)] transition hover:text-[var(--foreground)] sm:px-6 lg:px-8 [&::-webkit-details-marker]:hidden [&::marker]:hidden">
        Display check
      </summary>
      <div className="mx-auto max-w-7xl px-4 pb-4 pt-1 sm:px-6 lg:px-8">
        <div className="flex items-center gap-5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] px-5 py-4">
          {/* Reference-white square — UltraIcon Lightning paints brighter than this on HDR */}
          <div
            className="flex shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.6)]"
            style={{ width: 52, height: 52, background: "#fff" }}
          >
            <UltraIcon size={26}>
              <LightningFilled />
            </UltraIcon>
          </div>
          <p className="text-sm leading-6 text-[var(--muted)]">
            If you can see the{" "}
            <strong className="font-semibold text-[var(--foreground)]">Lightning</strong> glowing
            brighter than the white square, this display is capable of showing gainmaps. If not, try
            on your phone or try on something else.
          </p>
        </div>
      </div>
    </details>
  );
}
