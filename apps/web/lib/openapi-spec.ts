const ERROR_SCHEMA = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        code: { type: "string" },
        message: { type: "string" },
        hint: { type: "string" },
      },
      required: ["code", "message", "hint"],
    },
  },
  required: ["error"],
};

const PHOTO_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    slug: { type: "string" },
    alt: { type: "string" },
    width: { type: "number" },
    height: { type: "number" },
    photographer: { type: "string" },
    photographerUrl: { type: "string" },
    photoUrl: { type: "string" },
    standardSrc: { type: "string" },
    gainmapSrc: { type: "string" },
  },
  required: ["id", "slug", "alt", "width", "height", "standardSrc", "gainmapSrc"],
};

const LOGO_SCHEMA = {
  type: "object",
  properties: {
    rank: { type: "number" },
    name: { type: "string" },
    slug: { type: "string" },
    svgPath: { type: "string" },
    gainmapPath: { type: "string" },
  },
  required: ["rank", "name", "slug", "svgPath", "gainmapPath"],
};

const SLUG_PARAM = {
  name: "slug",
  in: "path",
  required: true,
  schema: { type: "string" },
};

const NOT_FOUND_RESPONSE = {
  description: "Not found",
  content: { "application/json": { schema: ERROR_SCHEMA } },
};

const SERVER_ERROR_RESPONSE = {
  description: "Internal server error",
  content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } },
};

export function buildOpenApiSpec(): object {
  return {
    openapi: "3.1.0",
    info: {
      title: "Gainmaps API",
      version: "1.1.0",
      description: [
        "Public JSON API for the Gainmaps photo and logo catalogs, version info, and OpenAPI spec.",
        "",
        "**Versioning**: The API uses a single-version path prefix-free design. Breaking changes",
        "increment the `info.version` field and are announced via the /api/version endpoint.",
        "Non-breaking additions (new fields, new endpoints) are shipped without a version bump.",
        "",
        "**Pagination**: List endpoints (`/api/photos`, `/api/logos`) return the full catalog.",
        "The catalogs are small (hundreds of items) so cursor/offset pagination is not implemented.",
        "Filter by slug using the per-item endpoints instead.",
        "",
        "**Rate limits**: 1000 requests per hour per IP. Limits are returned in `ratelimit-*` headers",
        "on every response (`ratelimit-limit`, `ratelimit-remaining`, `ratelimit-reset`, `ratelimit-policy`).",
      ].join("\n"),
    },
    servers: [{ url: "https://www.gainmaps.com" }],
    components: {
      schemas: {
        Error: ERROR_SCHEMA,
        Photo: PHOTO_SCHEMA,
        Logo: LOGO_SCHEMA,
      },
      headers: {
        "X-Api-Version": {
          description: "Current API version (semver). Breaking changes increment the major segment.",
          schema: { type: "string", example: "1.1.0" },
        },
        "RateLimit-Limit": {
          description: "Maximum requests allowed in the current window.",
          schema: { type: "integer", example: 1000 },
        },
        "RateLimit-Remaining": {
          description: "Requests remaining in the current window.",
          schema: { type: "integer", example: 999 },
        },
        "RateLimit-Reset": {
          description: "Seconds until the current window resets.",
          schema: { type: "integer", example: 3600 },
        },
      },
    },
    paths: {
      "/api/photos": {
        get: {
          operationId: "listPhotos",
          summary: "List all photos",
          description: "Returns the full catalog of photos. No pagination — the full array is returned.",
          responses: {
            "200": {
              description: "Array of photo records",
              content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Photo" } } } },
            },
            "500": SERVER_ERROR_RESPONSE,
          },
        },
      },
      "/api/photos/{slug}": {
        get: {
          operationId: "getPhoto",
          summary: "Get a photo by slug",
          description: "Returns a single photo by slug.",
          parameters: [SLUG_PARAM],
          responses: {
            "200": {
              description: "Photo record",
              content: { "application/json": { schema: { "$ref": "#/components/schemas/Photo" } } },
            },
            "404": NOT_FOUND_RESPONSE,
            "500": SERVER_ERROR_RESPONSE,
          },
        },
      },
      "/api/logos": {
        get: {
          operationId: "listLogos",
          summary: "List all logos",
          description: "Returns the full catalog of brand logos. No pagination — the full array is returned.",
          responses: {
            "200": {
              description: "Array of logo records",
              content: { "application/json": { schema: { type: "array", items: { "$ref": "#/components/schemas/Logo" } } } },
            },
            "500": SERVER_ERROR_RESPONSE,
          },
        },
      },
      "/api/logos/{slug}": {
        get: {
          operationId: "getLogo",
          summary: "Get a logo by slug",
          description: "Returns a single logo by slug.",
          parameters: [SLUG_PARAM],
          responses: {
            "200": {
              description: "Logo record",
              content: { "application/json": { schema: { "$ref": "#/components/schemas/Logo" } } },
            },
            "404": NOT_FOUND_RESPONSE,
            "500": SERVER_ERROR_RESPONSE,
          },
        },
      },
      "/api/version": {
        get: {
          operationId: "getVersion",
          summary: "Get CLI version info",
          description: "Returns the current gainmap package version and install commands.",
          responses: {
            "200": {
              description: "Version info",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      version: { type: "string" },
                      installCommands: { type: "object" },
                      homebrewFormula: { type: "string" },
                    },
                    required: ["name", "version", "installCommands", "homebrewFormula"],
                  },
                },
              },
            },
            "500": SERVER_ERROR_RESPONSE,
          },
        },
      },
    },
  };
}
