// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import { startUltraFill } from "@/lib/ultra-fill";

type Props = {
  intensity: number;
  className?: string;
  style?: CSSProperties;
};

/** A rectangle of Ultra white. Shape it with a CSS mask on the parent's terms. */
export function UltraFillCanvas({ intensity, className, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const session = startUltraFill(canvas, { intensity });
    const repaint = () => session.poke();
    document.addEventListener("visibilitychange", repaint);
    window.addEventListener("resize", repaint);

    return () => {
      document.removeEventListener("visibilitychange", repaint);
      window.removeEventListener("resize", repaint);
      session.stop();
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      width={1}
      height={1}
      aria-hidden
      className={`ultra-fill ${className ?? ""}`}
      style={style}
    />
  );
}
