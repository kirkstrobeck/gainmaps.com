export function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.gainmaps.com/#organization",
        name: "Gainmaps",
        url: "https://www.gainmaps.com",
        sameAs: [
          "https://github.com/kirkstrobeck/gainmaps.com",
          "https://www.npmjs.com/package/gainmap",
          "https://github.com/kirkstrobeck",
        ],
        address: {
          "@type": "PostalAddress",
          addressCountry: "US",
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: "kirk@strobeck.com",
          contactType: "customer support",
          url: "https://www.gainmaps.com/contact",
          areaServed: "Worldwide",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://www.gainmaps.com/#website",
        url: "https://www.gainmaps.com",
        name: "Gainmaps",
        description: "Convert photos to HDR gain map images in the browser. Local and private.",
        publisher: { "@id": "https://www.gainmaps.com/#organization" },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.gainmaps.com/#cli",
        name: "gainmap",
        applicationCategory: "MultimediaApplication",
        operatingSystem: "macOS, Linux, Windows",
        description: "CLI tool to batch-encode HDR gain map JPEG images",
        url: "https://www.gainmaps.com/docs",
        publisher: { "@id": "https://www.gainmaps.com/#organization" },
      },
      {
        "@type": "FAQPage",
        "@id": "https://www.gainmaps.com/#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is a gain map image?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A gain map image encodes an SDR photo plus a secondary brightness map. On HDR displays (Apple XDR, Android Ultra HDR, Windows Advanced Color) highlights render above SDR reference white. On SDR displays the image renders normally — the format is fully backward compatible.",
            },
          },
          {
            "@type": "Question",
            name: "Does Gainmaps upload my photos?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. All processing runs locally in a browser service worker. No file leaves your device. No upload, no server.",
            },
          },
          {
            "@type": "Question",
            name: "How do I batch-encode gain map images from the terminal?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Install the gainmap CLI: npm install -g gainmap, or brew install kirkstrobeck/tap/gainmap, or curl -fsSL https://gainmaps.com/install.sh | sh.",
            },
          },
        ],
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
