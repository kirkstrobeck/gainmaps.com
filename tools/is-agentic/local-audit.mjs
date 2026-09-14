#!/usr/bin/env node
/** Local evidence for technical signals used by Is Agentic's public scanner. */
const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const checks = [];

function check(name, condition, evidence) {
  checks.push({ name, pass: Boolean(condition), evidence });
}

async function response(path, init) {
  return fetch(`${base}${path}`, init);
}

async function text(path, init) {
  const result = await response(path, init);
  return { result, body: await result.text() };
}

const home = await text("/");
check("Homepage HTTP 200", home.result.status === 200, `HTTP ${home.result.status}`);
check("HTML language", /<html[^>]+lang="en"/.test(home.body), "lang=en");
check("Canonical URL", /rel="canonical"[^>]+href="https:\/\/www\.gainmaps\.com\/?"/.test(home.body), "canonical homepage URL");
check("Open Graph type", /property="og:type"[^>]+content="website"/.test(home.body), "og:type=website");
check("Open Graph image", /property="og:image"/.test(home.body), "og:image present");
check("Meta description", /name="description"[^>]+content="[^"]+"/.test(home.body), "description present");
check("Server-rendered H1", /<h1[ >]/.test(home.body), "H1 in raw HTML");
check("Substantial HTML", home.body.replace(/<[^>]+>/g, " ").length > 500, `${home.body.length} response bytes`);

const robots = await text("/robots.txt");
check("robots.txt", robots.result.status === 200 && /User-Agent: \*/i.test(robots.body), `HTTP ${robots.result.status}`);
const sitemap = await text("/sitemap.xml");
check("sitemap.xml", sitemap.result.status === 200 && sitemap.body.includes("/logos/toyota"), `HTTP ${sitemap.result.status}`);
const llms = await text("/llms.txt");
check("llms.txt", llms.result.status === 200 && llms.body.startsWith("# Gainmaps"), `${llms.body.length} characters`);
check("When-to-use guidance", llms.body.includes("## When to use Gainmaps"), "named guidance section");
check("Developer resources", llms.body.includes("/developers") && llms.body.includes("/openapi.json"), "developer and OpenAPI links");
check("CLI instructions", llms.body.includes("npm install -g gainmap"), "npm install command");

const openapiResponse = await response("/openapi.json");
const openapi = await openapiResponse.json();
const operations = Object.values(openapi.paths).flatMap((path) => Object.values(path));
check("OpenAPI published", openapiResponse.status === 200 && openapi.openapi === "3.1.0", `HTTP ${openapiResponse.status}`);
check("Public API surface", openapi.paths["/api/photos"] && openapi.paths["/api/logos"], `${operations.length} operations`);
check("Unique operation IDs", new Set(operations.map((item) => item.operationId)).size === operations.length, `${operations.length} unique IDs`);
check("Operation descriptions", operations.every((item) => typeof item.description === "string"), "all operations described");
check("Typed responses", operations.every((item) => item.responses?.["200"]?.content?.["application/json"]?.schema), "all success responses typed");

const apiError = await text("/api/logos/not-a-logo");
const parsedError = JSON.parse(apiError.body);
check("JSON API errors", apiError.result.status === 404 && parsedError.error?.code === "NOT_FOUND", `HTTP ${apiError.result.status}, NOT_FOUND`);
const markdown = await text("/", { headers: { accept: "text/markdown" } });
check("Markdown negotiation", markdown.result.status === 200 && markdown.result.headers.get("content-type")?.includes("text/markdown"), `HTTP ${markdown.result.status}`);
check("Markdown Vary", markdown.result.headers.get("vary") === "Accept, Accept-Encoding", markdown.result.headers.get("vary"));
const missing = await text("/missing-agent-page", { headers: { accept: "text/markdown" } });
check("Agent-friendly 404", missing.result.status === 404 && missing.body.includes("Sitemap"), `HTTP ${missing.result.status}`);

for (const path of ["/about", "/contact", "/privacy"]) {
  const page = await text(path, { headers: { accept: "text/markdown" } });
  check(`${path} trust content`, page.result.status === 200 && page.body.length >= 500, `${page.body.length} markdown characters`);
}

for (const item of checks) console.log(`${item.pass ? "PASS" : "FAIL"} ${item.name}: ${item.evidence}`);
const passed = checks.filter((item) => item.pass).length;
console.log(`LOCAL TECHNICAL READINESS ${passed}/${checks.length} (${Math.round(100 * passed / checks.length)}%)`);
process.exitCode = passed === checks.length ? 0 : 1;
