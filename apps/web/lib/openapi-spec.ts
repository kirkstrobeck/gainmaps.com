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

const VERSION_INFO_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    version: { type: "string" },
    installCommands: { type: "object" },
    homebrewFormula: { type: "string" },
  },
  required: ["name", "version", "installCommands", "homebrewFormula"],
};

const SLUG_PARAM = {
  name: "slug",
  in: "path",
  required: true,
  schema: { type: "string" },
};

const NOT_FOUND_RESPONSE = {
  description: "Not found",
  content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } },
};

const METHOD_NOT_ALLOWED_RESPONSE = {
  description: "Method not allowed",
  content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } },
};

const SERVER_ERROR_RESPONSE = {
  description: "Internal server error",
  content: { "application/json": { schema: { "$ref": "#/components/schemas/Error" } } },
};

const VERSION_HEADER_REF = {
  "X-Api-Version": { "$ref": "#/components/headers/X-Api-Version" },
};

function listEndpoint(
  operationId: string,
  summary: string,
  description: string,
  itemRef: string,
  listSchemaRef: string,
) {
  return {
    get: {
      operationId,
      summary,
      description,
      responses: {
        "200": {
          description: summary,
          headers: VERSION_HEADER_REF,
          content: { "application/json": { schema: { "$ref": listSchemaRef } } },
        },
        "405": METHOD_NOT_ALLOWED_RESPONSE,
        "500": SERVER_ERROR_RESPONSE,
      },
    },
  };
}

function itemEndpoint(
  operationId: string,
  summary: string,
  description: string,
  itemRef: string,
) {
  return {
    get: {
      operationId,
      summary,
      description,
      parameters: [SLUG_PARAM],
      responses: {
        "200": {
          description: summary,
          headers: VERSION_HEADER_REF,
          content: { "application/json": { schema: { "$ref": itemRef } } },
        },
        "404": NOT_FOUND_RESPONSE,
        "405": METHOD_NOT_ALLOWED_RESPONSE,
        "500": SERVER_ERROR_RESPONSE,
      },
    },
  };
}

export function buildOpenApiSpec(): object {
  return {
    openapi: "3.1.0",
    info: {
      title: "Gainmaps API",
      version: "1.1.0",
      description: [
        "Public JSON API for the Gainmaps photo and logo catalogs, version info, and OpenAPI spec.",
        "",
        "**Versioning**: The stable, versioned base path is `/api/v1/`. The unversioned `/api/` prefix",
        "is kept for backwards compatibility and maps to the same handlers. Non-breaking additions",
        "(new fields, new endpoints) are shipped without a version bump. Breaking changes increment",
        "the `info.version` field and are announced via the /api/version endpoint.",
        "The current API version is returned in the `X-Api-Version` response header on every response.",
        "",
        "**Pagination**: List endpoints return the full catalog.",
        "The catalogs are small (hundreds of items) so cursor/offset pagination is not implemented.",
        "Filter by slug using the per-item endpoints instead.",
        "",
        "**Errors**: All error responses use a typed `Error` object with `code`, `message`, and `hint`.",
        "Unsupported methods return HTTP 405 with an `Allow` header and a JSON error body.",
      ].join("\n"),
    },
    servers: [
      { url: "https://www.gainmaps.com", description: "Production — versioned at /api/v1/" },
    ],
    components: {
      schemas: {
        Error: ERROR_SCHEMA,
        Photo: PHOTO_SCHEMA,
        PhotoList: { type: "array", items: { "$ref": "#/components/schemas/Photo" } },
        Logo: LOGO_SCHEMA,
        LogoList: { type: "array", items: { "$ref": "#/components/schemas/Logo" } },
        VersionInfo: VERSION_INFO_SCHEMA,
      },
      headers: {
        "X-Api-Version": {
          description: "Current API version (semver). Breaking changes increment the major segment.",
          schema: { type: "string", example: "1.1.0" },
        },
      },
    },
    paths: {
      "/api/photos": listEndpoint(
        "listPhotos",
        "List all photos",
        "Returns the full catalog of photos. No pagination — the full array is returned.",
        "#/components/schemas/Photo",
        "#/components/schemas/PhotoList",
      ),
      "/api/photos/{slug}": itemEndpoint(
        "getPhoto",
        "Get a photo by slug",
        "Returns a single photo by slug.",
        "#/components/schemas/Photo",
      ),
      "/api/logos": listEndpoint(
        "listLogos",
        "List all logos",
        "Returns the full catalog of brand logos. No pagination — the full array is returned.",
        "#/components/schemas/Logo",
        "#/components/schemas/LogoList",
      ),
      "/api/logos/{slug}": itemEndpoint(
        "getLogo",
        "Get a logo by slug",
        "Returns a single logo by slug.",
        "#/components/schemas/Logo",
      ),
      "/api/version": {
        get: {
          operationId: "getVersion",
          summary: "Get CLI version info",
          description: "Returns the current gainmap package version and install commands.",
          responses: {
            "200": {
              description: "Version info",
              headers: VERSION_HEADER_REF,
              content: { "application/json": { schema: { "$ref": "#/components/schemas/VersionInfo" } } },
            },
            "405": METHOD_NOT_ALLOWED_RESPONSE,
            "500": SERVER_ERROR_RESPONSE,
          },
        },
      },
      "/api/v1/photos": listEndpoint(
        "listPhotosV1",
        "List all photos (v1)",
        "Stable v1 alias for `/api/photos`. Returns the full catalog of photos.",
        "#/components/schemas/Photo",
        "#/components/schemas/PhotoList",
      ),
      "/api/v1/photos/{slug}": itemEndpoint(
        "getPhotoV1",
        "Get a photo by slug (v1)",
        "Stable v1 alias for `/api/photos/{slug}`.",
        "#/components/schemas/Photo",
      ),
      "/api/v1/logos": listEndpoint(
        "listLogosV1",
        "List all logos (v1)",
        "Stable v1 alias for `/api/logos`. Returns the full catalog of brand logos.",
        "#/components/schemas/Logo",
        "#/components/schemas/LogoList",
      ),
      "/api/v1/logos/{slug}": itemEndpoint(
        "getLogoV1",
        "Get a logo by slug (v1)",
        "Stable v1 alias for `/api/logos/{slug}`.",
        "#/components/schemas/Logo",
      ),
      "/api/v1/version": {
        get: {
          operationId: "getVersionV1",
          summary: "Get CLI version info (v1)",
          description: "Stable v1 alias for `/api/version`.",
          responses: {
            "200": {
              description: "Version info",
              headers: VERSION_HEADER_REF,
              content: { "application/json": { schema: { "$ref": "#/components/schemas/VersionInfo" } } },
            },
            "405": METHOD_NOT_ALLOWED_RESPONSE,
            "500": SERVER_ERROR_RESPONSE,
          },
        },
      },
    },
  };
}
