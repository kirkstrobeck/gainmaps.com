"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  ULTRA_MODE_EVENT,
  applyUltraMode,
  readUltraMode,
  writeUltraMode,
  type UltraMode,
} from "@/lib/ultra-mode";
import { cn } from "@/lib/utils";

function subscribeUltraMode(onStoreChange: () => void) {
  window.addEventListener(ULTRA_MODE_EVENT, onStoreChange);
  return () => window.removeEventListener(ULTRA_MODE_EVENT, onStoreChange);
}

export function useUltraMode(): UltraMode {
  return useSyncExternalStore(subscribeUltraMode, readUltraMode, () => "on");
}

export function UltraModeToggle() {
  const mode = useUltraMode();

  useEffect(() => {
    applyUltraMode(readUltraMode());
  }, []);

  function setUltraMode(next: UltraMode) {
    writeUltraMode(next);
  }

  return (
    <div
      className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] p-0.5 text-xs ultra-surface"
      role="group"
      aria-label="Ultra display"
    >
      <span className="hidden pl-2 font-medium text-[var(--muted)] sm:inline">Ultra</span>
      <ToggleOption
        active={mode === "off"}
        label="Off"
        title="Clamp Ultra previews to SDR reference white"
        onSelect={() => setUltraMode("off")}
      />
      <ToggleOption
        active={mode === "on"}
        label="On"
        title="Unlock Ultra intensity in previews"
        onSelect={() => setUltraMode("on")}
      />
    </div>
  );
}

function ToggleOption({
  active,
  label,
  title,
  onSelect,
}: {
  active: boolean;
  label: string;
  title: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onSelect}
      className={cn(
        "min-w-10 rounded-[calc(var(--radius)-2px)] px-2.5 py-1.5 font-medium transition",
        !active && "text-[var(--muted)] hover:text-[var(--foreground)]",
        active && "bg-[var(--foreground)] text-[var(--background)]",
      )}
    >
      {label}
    </button>
  );
}
