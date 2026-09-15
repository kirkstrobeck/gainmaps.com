import { NextResponse } from "next/server";
import { jsonOk, methodNotAllowed, CORS_HEADERS } from "@/lib/api-response";

export function GET(): NextResponse {
  return jsonOk({
    endpoints: [
      { method: "GET", path: "/api/photos", description: "List all photos" },
      { method: "GET", path: "/api/photos/{slug}", description: "Get a photo by slug" },
      { method: "GET", path: "/api/logos", description: "List all logos" },
      { method: "GET", path: "/api/logos/{slug}", description: "Get a logo by slug" },
      { method: "GET", path: "/api/version", description: "Get CLI version info" },
    ],
    spec: "/openapi.json",
    versioned: "/api/v1",
  });
}

const notAllowed = () => methodNotAllowed();
export const POST = notAllowed;
export const PUT = notAllowed;
export const PATCH = notAllowed;
export const DELETE = notAllowed;

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS, allow: "GET, HEAD, OPTIONS" } });
}
