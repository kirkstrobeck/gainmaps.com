import { describe, it, expect } from "vitest";
import { GET, POST, PUT, PATCH, DELETE, OPTIONS } from "@/app/api/[...path]/route";
import { NextRequest } from "next/server";

const makeReq = (path: string, method = "GET") =>
  new NextRequest(`http://localhost${path}`, { method });
const makeParams = (segments: string[]) => ({ params: Promise.resolve({ path: segments }) });

describe("GET /api/[...path] — unknown endpoint", () => {
  it("returns 404 JSON with NOT_FOUND code", async () => {
    const res = await GET(makeReq("/api/unknown/path"), makeParams(["unknown", "path"]));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error.code).toBe("NOT_FOUND");
  });

  it("includes the requested pathname in the message", async () => {
    const res = await GET(makeReq("/api/nonexistent"), makeParams(["nonexistent"]));
    const data = await res.json();
    expect(data.error.message).toContain("/api/nonexistent");
  });

  it("hint points to GET /api for the endpoint list", async () => {
    const res = await GET(makeReq("/api/bogus"), makeParams(["bogus"]));
    const data = await res.json();
    expect(data.error.hint).toMatch(/GET \/api\b/);
  });

  it("returns application/json content-type", async () => {
    const res = await GET(makeReq("/api/x"), makeParams(["x"]));
    expect(res.headers.get("content-type")).toMatch(/application\/json/);
  });

  it("has CORS header", async () => {
    const res = await GET(makeReq("/api/x"), makeParams(["x"]));
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("does not include fabricated rate-limit headers", async () => {
    const res = await GET(makeReq("/api/x"), makeParams(["x"]));
    expect(res.headers.get("ratelimit-limit")).toBeNull();
    expect(res.headers.get("ratelimit-remaining")).toBeNull();
    expect(res.headers.get("ratelimit-reset")).toBeNull();
  });
});

describe("POST/PUT/PATCH/DELETE /api/[...path] — unknown endpoint any method", () => {
  it("POST returns 404 JSON", async () => {
    const res = await POST(makeReq("/api/unknown", "POST"), makeParams(["unknown"]));
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });

  it("PUT returns 404 JSON", async () => {
    const res = await PUT(makeReq("/api/unknown", "PUT"), makeParams(["unknown"]));
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });

  it("PATCH returns 404 JSON", async () => {
    const res = await PATCH(makeReq("/api/unknown", "PATCH"), makeParams(["unknown"]));
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });

  it("DELETE returns 404 JSON", async () => {
    const res = await DELETE(makeReq("/api/unknown", "DELETE"), makeParams(["unknown"]));
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });
});

describe("OPTIONS /api/[...path]", () => {
  it("returns 204 No Content", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
  });

  it("includes Allow header with GET, HEAD, and OPTIONS", async () => {
    const res = await OPTIONS();
    const allow = res.headers.get("allow") ?? "";
    expect(allow).toContain("GET");
    expect(allow).toContain("HEAD");
    expect(allow).toContain("OPTIONS");
  });

  it("includes CORS header", async () => {
    const res = await OPTIONS();
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
});
