import type { Metadata } from "next";
import { PageChrome } from "@/components/page-chrome";
import { UltraWord } from "@/components/ultra-word";
import { TEXT_ULTRA_INTENSITY } from "@/lib/text-ultra";

export const metadata: Metadata = {
  title: "Contact · Gainmaps",
  description: "Get in touch with the Gainmaps project via GitHub Issues or email.",
  alternates: { canonical: "/contact" },
  openGraph: { type: "website", url: "/contact" },
};

export default function ContactPage() {
  return (
    <main>
      <PageChrome />
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold tracking-normal">
          <UltraWord text="Contact" typeClassName="font-display text-4xl font-bold tracking-normal" intensity={TEXT_ULTRA_INTENSITY} />
        </h1>
        <div className="mt-8 grid gap-6 text-base leading-7 text-[var(--muted)]">
          <p>
            For bugs, feature requests, and questions, open an issue on GitHub:
          </p>
          <p>
            <a
              href="https://github.com/kirkstrobeck/gainmaps/issues"
              className="text-[var(--accent)] underline underline-offset-2"
              rel="noopener noreferrer"
              target="_blank"
            >
              github.com/kirkstrobeck/gainmaps/issues →
            </a>
          </p>
          <p>
            For direct enquiries, email{" "}
            <a href="mailto:kirk@strobeck.com" className="text-[var(--accent)] underline underline-offset-2">
              kirk@strobeck.com
            </a>.
          </p>
          <p>
            Include the input format, operating system, browser or CLI version, and the exact
            command or conversion step that failed. For rendering questions, say whether the
            display has HDR enabled and whether the same file behaves differently in another
            compatible viewer. Those details make reports reproducible and help separate encoder
            issues from display capability or application support.
          </p>
          <p>
            Security reports should avoid public issue threads when they contain private files or
            exploit details. Email a concise reproduction instead. Gainmaps does not offer account
            support or retain uploaded images because browser conversions stay on the device.
            General documentation, installation commands, and the public API are available from
            the developer page before contacting the project.
          </p>
        </div>
      </div>
    </main>
  );
}
