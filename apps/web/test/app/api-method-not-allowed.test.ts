import { describe, it, expect } from "vitest";
import { methodNotAllowed } from "@/lib/api-response";
import { DELETE as photosDelete } from "@/app/api/photos/route";
import { DELETE as photoSlugDelete } from "@/app/api/photos/[slug]/route";
import { DELETE as logosDelete } from "@/app/api/logos/route";
import { DELETE as logoSlugDelete } from "@/app/api/logos/[slug]/route";
import { DELETE as versionDelete } from "@/app/api/version/route";
import {
  GET as apiIndexGet,
  DELETE as apiIndexDelete,
  OPTIONS as apiIndexOptions,
} from "@/app/api/route";
import {
  GET as v1IndexGet,
  DELETE as v1IndexDelete,
  OPTIONS as v1IndexOptions,
} from "@/app/api/v1/route";
import { OPTIONS as photosOptions } from "@/app/api/photos/route";
import { OPTIONS as photoSlugOptions } from "@/app/api/photos/[slug]/route";
import { OPTIONS as logosOptions } from "@/app/api/logos/route";
import { OPTIONS as logoSlugOptions } from "@/app/api/logos/[slug]/route";
import { OPTIONS as versionOptions } from "@/app/api/version/route";

describe("methodNotAllowed helper", () => {
  it("returns 405 with METHOD_NOT_ALLOWED code", async () => {
    const res = methodNotAllowed();
    expect(res.status).toBe(405);
    const data = await res.json();
    expect(data.error.code).toBe("METHOD_NOT_ALLOWED");
    expect(data.error.hint).toContain("GET");
  });

  it("default Allow header includes GET, HEAD, OPTIONS", () => {
    const res = methodNotAllowed();
    const allow = res.headers.get("allow") ?? "";
    expect(allow).toContain("GET");
    expect(allow).toContain("HEAD");
    expect(allow).toContain("OPTIONS");
  });

  it("custom allowed string is reflected in header and hint", async () => {
    const res = methodNotAllowed("GET, POST");
    expect(res.headers.get("allow")).toBe("GET, POST");
    expect((await res.json()).error.hint).toContain("GET, POST");
  });

  it("returns application/json content-type", () => {
    const res = methodNotAllowed();
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
  });

  it("includes CORS header", () => {
    const res = methodNotAllowed();
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
});

describe("405 JSON responses on known API routes", () => {
  it("DELETE /api/photos returns 405 with JSON error", async () => {
    const res = await photosDelete();
    expect(res.status).toBe(405);
    const data = await res.json();
    expect(data.error.code).toBe("METHOD_NOT_ALLOWED");
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
    const allow = res.headers.get("allow") ?? "";
    expect(allow).toContain("GET");
    expect(allow).toContain("HEAD");
  });

  it("DELETE /api/photos/{slug} returns 405", async () => {
    const res = await photoSlugDelete();
    expect(res.status).toBe(405);
    expect((await res.json()).error.code).toBe("METHOD_NOT_ALLOWED");
  });

  it("DELETE /api/logos returns 405", async () => {
    const res = await logosDelete();
    expect(res.status).toBe(405);
    expect((await res.json()).error.code).toBe("METHOD_NOT_ALLOWED");
  });

  it("DELETE /api/logos/{slug} returns 405", async () => {
    const res = await logoSlugDelete();
    expect(res.status).toBe(405);
    expect((await res.json()).error.code).toBe("METHOD_NOT_ALLOWED");
  });

  it("DELETE /api/version returns 405", async () => {
    const res = await versionDelete();
    expect(res.status).toBe(405);
    expect((await res.json()).error.code).toBe("METHOD_NOT_ALLOWED");
  });
});

describe("GET /api — bare API index", () => {
  it("returns 200 with JSON endpoint listing", async () => {
    const res = await apiIndexGet();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.endpoints)).toBe(true);
    expect(data.endpoints.length).toBeGreaterThan(0);
    expect(data.spec).toBe("/openapi.json");
    expect(data.versioned).toBe("/api/v1");
  });

  it("has CORS header", async () => {
    const res = await apiIndexGet();
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("DELETE /api returns 405", async () => {
    const res = await apiIndexDelete();
    expect(res.status).toBe(405);
    expect((await res.json()).error.code).toBe("METHOD_NOT_ALLOWED");
  });

  it("OPTIONS /api returns 204 with Allow including HEAD", async () => {
    const res = await apiIndexOptions();
    expect(res.status).toBe(204);
    const allow = res.headers.get("allow") ?? "";
    expect(allow).toContain("GET");
    expect(allow).toContain("HEAD");
    expect(allow).toContain("OPTIONS");
  });
});

describe("GET /api/v1 — versioned index", () => {
  it("returns 200 with endpoint listing for v1 paths", async () => {
    const res = await v1IndexGet();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.endpoints)).toBe(true);
    expect(data.endpoints.every((e: { path: string }) => e.path.startsWith("/api/v1/"))).toBe(true);
    expect(data.spec).toBe("/openapi.json");
  });

  it("DELETE /api/v1 returns 405", async () => {
    const res = await v1IndexDelete();
    expect(res.status).toBe(405);
    expect((await res.json()).error.code).toBe("METHOD_NOT_ALLOWED");
  });

  it("OPTIONS /api/v1 returns 204 with truthful Allow header", async () => {
    const res = await v1IndexOptions();
    expect(res.status).toBe(204);
    const allow = res.headers.get("allow") ?? "";
    expect(allow).toContain("GET");
    expect(allow).toContain("HEAD");
    expect(allow).toContain("OPTIONS");
  });
});

describe("OPTIONS on catalog routes returns 204 with truthful Allow", () => {
  const check = (res: Response) => {
    expect(res.status).toBe(204);
    const allow = res.headers.get("allow") ?? "";
    expect(allow).toContain("GET");
    expect(allow).toContain("HEAD");
    expect(allow).toContain("OPTIONS");
    expect(allow).not.toContain("POST");
    expect(allow).not.toContain("DELETE");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  };

  it("OPTIONS /api/photos", () => check(photosOptions()));
  it("OPTIONS /api/photos/{slug}", () => check(photoSlugOptions()));
  it("OPTIONS /api/logos", () => check(logosOptions()));
  it("OPTIONS /api/logos/{slug}", () => check(logoSlugOptions()));
  it("OPTIONS /api/version", () => check(versionOptions()));
});
