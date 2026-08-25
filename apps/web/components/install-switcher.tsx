/* Ultra mode by Kirk Strobeck */
"use client";

import { CheckIcon as CheckFilled, ContentCopyIcon as CopyFilled, TerminalIcon as TerminalBoxFilled } from "@/components/icons";
import { useCallback, useState } from "react";

import { INSTALL_COMMANDS, type InstallTab } from "@/lib/install-commands";
import { UltraIcon } from "@/components/ultra-icon";
import { cn } from "@/lib/utils";

const TABS: { key: InstallTab; label: string }[] = [
  { key: "npm", label: "npm" },
  { key: "brew", label: "brew" },
  { key: "curl", label: "curl" },
];

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

export function InstallSwitcher() {
  const [active, setActive] = useState<InstallTab>("npm");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(INSTALL_COMMANDS[active]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [active]);

  return (
    <div className="max-w-md">
      <div className="mb-3 flex gap-1 border-b border-[var(--border)]">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setActive(key); setCopied(false); }}
            className={cn(
              "-mb-px border-b-2 px-3 py-1.5 text-sm font-medium transition",
              FOCUS,
              active === key
                ? "border-[var(--accent)] text-[var(--foreground)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] px-4 py-2">
        <UltraIcon size={16}>
          <TerminalBoxFilled />
        </UltraIcon>
        <code className="flex-1 truncate font-mono text-sm">{INSTALL_COMMANDS[active]}</code>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "ml-2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition",
            FOCUS,
            copied ? "text-[var(--success)]" : "text-[var(--muted)] hover:text-[var(--accent)]",
          )}
          aria-label="Copy command"
        >
          <UltraIcon size={14}>
            {copied ? <CheckFilled /> : <CopyFilled />}
          </UltraIcon>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
