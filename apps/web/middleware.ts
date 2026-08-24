import { NextRequest, NextResponse } from "next/server";

import { parseSiteMode, parseSiteUltra } from "@/lib/site-appearance";
import { TEXT_ULTRA_SLIDER_DEFAULT } from "@/lib/text-ultra";

function clampIntensity(raw: string | undefined | null): number {
  const n = Number(raw ?? TEXT_ULTRA_SLIDER_DEFAULT);
  if (!Number.isFinite(n)) return TEXT_ULTRA_SLIDER_DEFAULT;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  if (/^light\./i.test(hostname)) {
    const dest = new URL(request.url);
    dest.hostname = hostname.replace(/^light\./i, "");
    dest.searchParams.set("mode", "light");
    return NextResponse.redirect(dest, 308);
  }
  if (/^dark\./i.test(hostname)) {
    const dest = new URL(request.url);
    dest.hostname = hostname.replace(/^dark\./i, "");
    dest.searchParams.set("mode", "dark");
    return NextResponse.redirect(dest, 308);
  }

  const modeParam = url.searchParams.get("mode");
  const existingMode = request.cookies.get("site-mode")?.value;
  const mode = parseSiteMode(
    modeParam === "light" || modeParam === "dark" ? modeParam : existingMode,
  );

  const ultraParam = url.searchParams.get("ultra");
  const existingUltra = request.cookies.get("site-ultra")?.value;
  const ultra = parseSiteUltra(
    ultraParam === "on" || ultraParam === "off" ? ultraParam : existingUltra,
  );

  const intensityParam = url.searchParams.get("intensity");
  const existingIntensity = request.cookies.get("site-intensity")?.value;
  const intensity = clampIntensity(intensityParam ?? existingIntensity);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-site-mode", mode);
  requestHeaders.set("x-site-ultra", ultra);
  requestHeaders.set("x-site-intensity", String(intensity));

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set("site-mode", mode, { path: "/", sameSite: "lax" });
  response.cookies.set("site-ultra", ultra, { path: "/", sameSite: "lax" });
  response.cookies.set("site-intensity", String(intensity), { path: "/", sameSite: "lax" });
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon\\.ico|.*\\..*).*)"],
};
