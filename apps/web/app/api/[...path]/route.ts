import { NextRequest, NextResponse } from "next/server";
import { CORS_HEADERS, type ApiError } from "@/lib/api-response";

function unknownEndpoint(path: string): NextResponse<ApiError> {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message: `endpoint "${path}" not found`, hint: "GET /api for the endpoint list" } },
    { status: 404, headers: CORS_HEADERS },
  );
}

export function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  void params;
  return unknownEndpoint(new URL(req.url).pathname);
}

export function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  void params;
  return unknownEndpoint(new URL(req.url).pathname);
}

export function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  void params;
  return unknownEndpoint(new URL(req.url).pathname);
}

export function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  void params;
  return unknownEndpoint(new URL(req.url).pathname);
}

export function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  void params;
  return unknownEndpoint(new URL(req.url).pathname);
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS, allow: "GET, HEAD, OPTIONS" } });
}
