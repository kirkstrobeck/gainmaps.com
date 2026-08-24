"use client";

import { CheckIcon as CheckFilled, ContentCopyIcon as CopyFilled, TerminalIcon as TerminalBoxFilled } from "@/components/icons";
import { useCallback, useState } from "react";

import { UltraIcon } from "@/components/ultra-icon";

export function BrewCopy() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText("brew install kirkstrobeck/tap/gainmap");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] px-4 py-2">
      <UltraIcon size={16}>
        <TerminalBoxFilled />
      </UltraIcon>
      <code className="font-mono text-sm">brew install kirkstrobeck/tap/gainmap</code>
      <button
        type="button"
        onClick={handleCopy}
        className={`ml-2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] ${copied ? "text-[var(--success)]" : "text-[var(--muted)] hover:text-[var(--accent)]"}`}
        aria-label="Copy brew install command"
      >
        {copied ? (
          <UltraIcon size={14}>
            <CheckFilled />
          </UltraIcon>
        ) : (
          <UltraIcon size={14}>
            <CopyFilled />
          </UltraIcon>
        )}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
