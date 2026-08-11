// Ultra mode by Kirk Strobeck – https://UltraDarkMode.com

"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import { startUltraFill, type UltraFillSession } from "@/lib/ultra-fill";

type Props = {
  intensity: number;
  className?: string;
  style?: CSSProperties;
};

/** A rectangle of Ultra white. Shape it with a CSS mask on the parent's terms. */
export function UltraFillCanvas({ intensity, className, style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<UltraFillSession | null>(null);
  // The value the session is born with. Every later value arrives through the
  // second effect, so the ref is only ever read once.
  const firstIntensity = useRef(intensity);

  /*
    The device outlives the intensity. Requesting an adapter and a device is
    asynchronous and costs a GPU context; keying this effect on the headroom
    would tear both down and rebuild them on every step of a slider drag.
  */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const session = startUltraFill(canvas, { intensity: firstIntensity.current });
    sessionRef.current = session;
    const repaint = () => session.poke();
    document.addEventListener("visibilitychange", repaint);
    window.addEventListener("resize", repaint);

    return () => {
      document.removeEventListener("visibilitychange", repaint);
      window.removeEventListener("resize", repaint);
      sessionRef.current = null;
      session.stop();
    };
  }, []);

  useEffect(() => {
    sessionRef.current?.setIntensity(intensity);
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
