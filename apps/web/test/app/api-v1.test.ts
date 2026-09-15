import { describe, it, expect } from "vitest";
import { GET as v1PhotosGet } from "@/app/api/v1/photos/route";
import { GET as v1PhotoSlugGet } from "@/app/api/v1/photos/[slug]/route";
import { GET as v1LogosGet } from "@/app/api/v1/logos/route";
import { GET as v1LogoSlugGet } from "@/app/api/v1/logos/[slug]/route";
import { GET as v1VersionGet } from "@/app/api/v1/version/route";

describe("GET /api/v1/photos — versioned alias", () => {
  it("returns 200 with an array identical to /api/photos", async () => {
    const res = await v1PhotosGet();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("slug");
  });
});

describe("GET /api/v1/photos/{slug} — versioned alias", () => {
  it("returns 200 for a valid slug", async () => {
    const slug = "a-seal-rests-on-a-shallow-sandbar-in-calm-water";
    const res = await v1PhotoSlugGet(new Request(`http://localhost/api/v1/photos/${slug}`), {
      params: Promise.resolve({ slug }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).slug).toBe(slug);
  });

  it("returns 404 JSON for unknown slug", async () => {
    const res = await v1PhotoSlugGet(
      new Request("http://localhost/api/v1/photos/no-such"),
      { params: Promise.resolve({ slug: "no-such" }) },
    );
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("NOT_FOUND");
  });
});

describe("GET /api/v1/logos — versioned alias", () => {
  it("returns 200 with an array", async () => {
    const res = await v1LogosGet();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty("slug");
  });
});

describe("GET /api/v1/logos/{slug} — versioned alias", () => {
  it("returns 200 for toyota", async () => {
    const res = await v1LogoSlugGet(
      new Request("http://localhost/api/v1/logos/toyota"),
      { params: Promise.resolve({ slug: "toyota" }) },
    );
    expect(res.status).toBe(200);
    expect((await res.json()).slug).toBe("toyota");
  });
});

describe("GET /api/v1/version — versioned alias", () => {
  it("returns 200 with version info", async () => {
    const res = await v1VersionGet();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("version");
    expect(data).toHaveProperty("installCommands");
  });
});
