import { NextResponse } from "next/server";
import { COMPANIES } from "@/lib/logos/companies";
import { jsonOk, methodNotAllowed } from "@/lib/api-response";

export async function GET(): Promise<NextResponse> {
  const data = COMPANIES.map((company) => ({
    rank: company.rank,
    name: company.name,
    slug: company.slug,
    svgPath: company.svgPath,
    gainmapPath: company.gainmapPath,
  }));
  return jsonOk(data);
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
