"use client";

import { useEffect, useState } from "react";

const HDR_QUERY = "(dynamic-range: high)";

export function useHdrDisplay(): boolean {
  const [supported, setSupported] = useState(() => (
    typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia(HDR_QUERY).matches
  ));

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(HDR_QUERY);
    const update = () => setSupported(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  return supported;
}
