import { NextRequest } from "next/server";
import { jsonNotFound, CORS_HEADERS } from "@/lib/api-response";

export function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  void params;
  const url = new URL(req.url);
  return jsonNotFound("endpoint", url.pathname);
}

export function POST() {
  return jsonNotFound("endpoint", "method");
}

export function PUT() {
  return jsonNotFound("endpoint", "method");
}

export function PATCH() {
  return jsonNotFound("endpoint", "method");
}

export function DELETE() {
  return jsonNotFound("endpoint", "method");
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS, allow: "GET, OPTIONS" } });
}
