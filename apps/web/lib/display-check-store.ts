"use client";

let _open: (() => void) | null = null;

export function openDisplayCheck(): void {
  _open?.();
}

export function registerDisplayCheckSetter(opener: () => void): void {
  _open = opener;
}
