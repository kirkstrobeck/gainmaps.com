import { NextResponse } from "next/server";
import { companyBySlug } from "@/lib/logos/companies";
import { jsonOk, jsonNotFound, methodNotAllowed } from "@/lib/api-response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;
  const company = companyBySlug(slug);
  if (!company) return jsonNotFound("logo", slug);
  return jsonOk({ rank: company.rank, name: company.name, slug: company.slug, svgPath: company.svgPath, gainmapPath: company.gainmapPath });
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
