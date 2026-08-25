/* Ultra mode by Kirk Strobeck */
"use client";

import { CheckIcon as CheckFilled, ContentCopyIcon as CopyFilled } from "@/components/icons";
import { useCallback, useState } from "react";

import { UltraIcon } from "@/components/ultra-icon";
import { cn } from "@/lib/utils";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

type Props = {
  text: string;
  className?: string;
};

export function CopyButton({ text, className }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition",
        FOCUS,
        copied ? "text-[var(--success)]" : "text-[var(--muted)] hover:text-[var(--accent)]",
        className,
      )}
      aria-label="Copy command"
    >
      <UltraIcon size={14}>
        {copied ? <CheckFilled /> : <CopyFilled />}
      </UltraIcon>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
