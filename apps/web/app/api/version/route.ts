import { NextResponse } from "next/server";
import pkg from "../../../../../packages/gainmap/package.json";
import { INSTALL_COMMANDS } from "@/lib/install-commands";
import { jsonOk, methodNotAllowed } from "@/lib/api-response";

export async function GET(): Promise<NextResponse> {
  return jsonOk({
    name: pkg.name,
    version: pkg.version,
    installCommands: INSTALL_COMMANDS,
    homebrewFormula: "kirkstrobeck/tap/gainmap",
  });
}

const notAllowed = () => methodNotAllowed();
export const POST = notAllowed;
export const PUT = notAllowed;
export const PATCH = notAllowed;
export const DELETE = notAllowed;

import { CORS_HEADERS } from "@/lib/api-response";
export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS, allow: "GET, HEAD, OPTIONS" } });
}
