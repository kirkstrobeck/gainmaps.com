import { describe, it, expect } from "vitest";
import { buildOpenApiSpec } from "@/lib/openapi-spec";
import { GET as photosGet } from "@/app/api/photos/route";
import { GET as photoSlugGet } from "@/app/api/photos/[slug]/route";
import { GET as logosGet } from "@/app/api/logos/route";
import { GET as versionGet } from "@/app/api/version/route";

const spec = buildOpenApiSpec() as {
  openapi: string;
  info: { version: string };
  paths: Record<string, { get?: { operationId?: string; responses?: Record<string, unknown> } }>;
  components: { schemas: Record<string, unknown>; headers: Record<string, unknown> };
};

describe("OpenAPI spec structure", () => {
  it("has openapi 3.1.0", () => {
    expect(spec.openapi).toBe("3.1.0");
  });

  it("Error schema is defined in components", () => {
    expect(spec.components.schemas).toHaveProperty("Error");
  });

  it("all 4xx/5xx responses reference the Error component schema (not inline)", () => {
    for (const [path, methods] of Object.entries(spec.paths)) {
      if (!methods.get) continue;
      for (const [code, resp] of Object.entries(methods.get.responses ?? {})) {
        if (!code.startsWith("4") && !code.startsWith("5")) continue;
        const schema = (resp as { content?: { "application/json"?: { schema?: { $ref?: string } } } })
          ?.content?.["application/json"]?.schema;
        expect(schema?.$ref, `${path} ${code} should use $ref:Error`).toBe(
          "#/components/schemas/Error",
        );
      }
    }
  });

  it("all 5 unversioned operations have unique operationIds", () => {
    const ids = Object.values(spec.paths)
      .map((m) => m.get?.operationId)
      .filter(Boolean);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("all 5 unversioned + 5 v1 operations have unique operationIds across all paths", () => {
    const ids = Object.values(spec.paths)
      .map((m) => m.get?.operationId)
      .filter(Boolean);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(10);
  });

  it("v1 paths exist in spec", () => {
    expect(spec.paths).toHaveProperty("/api/v1/photos");
    expect(spec.paths).toHaveProperty("/api/v1/photos/{slug}");
    expect(spec.paths).toHaveProperty("/api/v1/logos");
    expect(spec.paths).toHaveProperty("/api/v1/logos/{slug}");
    expect(spec.paths).toHaveProperty("/api/v1/version");
  });

  it("PhotoList, LogoList, VersionInfo schemas defined in components", () => {
    expect(spec.components.schemas).toHaveProperty("PhotoList");
    expect(spec.components.schemas).toHaveProperty("LogoList");
    expect(spec.components.schemas).toHaveProperty("VersionInfo");
  });

  it("list endpoints use $ref to named list schema", () => {
    const photosSchema = (
      spec.paths["/api/photos"]?.get?.responses?.["200"] as {
        content?: { "application/json"?: { schema?: { $ref?: string } } };
      }
    )?.content?.["application/json"]?.schema;
    expect(photosSchema?.$ref).toBe("#/components/schemas/PhotoList");
  });

  it("version endpoint 200 uses $ref to VersionInfo schema", () => {
    const versionSchema = (
      spec.paths["/api/version"]?.get?.responses?.["200"] as {
        content?: { "application/json"?: { schema?: { $ref?: string } } };
      }
    )?.content?.["application/json"]?.schema;
    expect(versionSchema?.$ref).toBe("#/components/schemas/VersionInfo");
  });
});

describe("OpenAPI spec matches actual API responses", () => {
  it("GET /api/photos response shape matches PhotoList schema", async () => {
    const res = await photosGet();
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    const photo = data[0];
    // Required fields from Photo schema
    for (const field of ["id", "slug", "alt", "width", "height", "standardSrc", "gainmapSrc"]) {
      expect(photo, `photo should have ${field}`).toHaveProperty(field);
    }
  });

  it("GET /api/photos/{slug} 404 response matches Error schema", async () => {
    const res = await photoSlugGet(new Request("http://localhost/api/photos/no-such"), {
      params: Promise.resolve({ slug: "no-such" }),
    });
    const data = await res.json();
    expect(data).toHaveProperty("error");
    expect(data.error).toHaveProperty("code");
    expect(data.error).toHaveProperty("message");
    expect(data.error).toHaveProperty("hint");
  });

  it("GET /api/logos response shape matches LogoList schema", async () => {
    const res = await logosGet();
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    for (const field of ["rank", "name", "slug", "svgPath", "gainmapPath"]) {
      expect(data[0]).toHaveProperty(field);
    }
  });

  it("GET /api/version response shape matches VersionInfo schema", async () => {
    const res = await versionGet();
    const data = await res.json();
    for (const field of ["name", "version", "installCommands", "homebrewFormula"]) {
      expect(data).toHaveProperty(field);
    }
  });

  it("every response carries X-Api-Version header", async () => {
    const res = await photosGet();
    expect(res.headers.get("x-api-version")).toBeTruthy();
  });
});
