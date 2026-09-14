import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Explicitly allow all AI answer-engine crawlers (training crawlers disallowed separately).
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "FacebookBot", allow: "/" },
      { userAgent: "cohere-ai", allow: "/" },
      { userAgent: "YouBot", allow: "/" },
      { userAgent: "Bytespider", allow: "/" },
      { userAgent: "ora-agent", allow: "/" },
      // All other crawlers: full access.
      { userAgent: "*", allow: "/" },
    ],
    sitemap: "https://www.gainmaps.com/sitemap.xml",
    host: "https://www.gainmaps.com",
  };
}
