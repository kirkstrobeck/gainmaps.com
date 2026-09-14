import { describe, it, expect } from "vitest";
import robots from "@/app/robots";

describe("robots", () => {
  it("allows all user agents", () => {
    const result = robots();
    const rules = result.rules as { userAgent: string; allow: string }[];
    const wildcardRule = Array.isArray(rules) ? rules.find((r) => r.userAgent === "*") : (rules as { userAgent: string; allow: string });
    expect(wildcardRule?.userAgent).toBe("*");
    expect(wildcardRule?.allow).toBe("/");
  });

  it("includes sitemap URL", () => {
    const result = robots();
    expect(result.sitemap).toBe("https://www.gainmaps.com/sitemap.xml");
  });

  it("declares the canonical host", () => {
    const result = robots();
    expect(result.host).toBe("https://www.gainmaps.com");
  });
});
