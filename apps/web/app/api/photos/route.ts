import { NextResponse } from "next/server";
import { PHOTOS, photoStandardSrc, photoGainmapSrc } from "@/lib/photos/catalog";
import { jsonOk, methodNotAllowed } from "@/lib/api-response";

export async function GET(): Promise<NextResponse> {
  const data = PHOTOS.map((photo) => ({
    id: photo.id,
    slug: photo.slug,
    alt: photo.alt,
    width: photo.width,
    height: photo.height,
    photographer: photo.photographer,
    photographerUrl: photo.photographerUrl,
    photoUrl: photo.photoUrl,
    standardSrc: photoStandardSrc(photo, 1280),
    gainmapSrc: photoGainmapSrc(photo),
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
