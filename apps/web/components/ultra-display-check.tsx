"use client";

import { useSyncExternalStore } from "react";
import { readSiteUltra, subscribeSiteAppearance, type SiteUltra } from "@/lib/site-appearance";

function useSiteUltra(): SiteUltra {
  return useSyncExternalStore(subscribeSiteAppearance, readSiteUltra, () => "on");
}

export function UltraDisplayCheck() {
  const ultra = useSiteUltra();

  return (
    <div className="border-t border-[var(--border)] px-4 sm:px-8 lg:px-16">
      <div className="flex h-10 items-center justify-between font-mono text-[12px] text-[var(--muted)]">
        {ultra === "on" ? (
          <>
            <span className="flex items-center gap-3">
              <span
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                style={{ boxShadow: "0 0 9px var(--accent)" }}
                aria-hidden
              />
              <span>
                Your screen has the headroom.{" "}
                <span className="text-[var(--foreground)]">You&apos;re seeing the real thing.</span>
              </span>
            </span>
            <span className="hidden text-[var(--foreground)] sm:inline">1000 nits · Ultra on</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--muted)]" aria-hidden />
              <span>
                Your screen tops out at SDR.{" "}
                <span className="text-[var(--foreground)]">Here&apos;s what you&apos;re missing.</span>
              </span>
            </span>
            <span className="hidden text-[var(--foreground)] sm:inline">Ultra off</span>
          </>
        )}
      </div>
    </div>
  );
}
