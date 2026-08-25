import { CopyButton } from "@/components/copy-button";

export function UltraSkillCard() {
  return (
    <div className="mt-10">
      <h3 className="font-display text-xl font-semibold">Add Ultra text to your site</h3>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
        A Claude Code skill, bundled in this repository, that teaches any agent how to add Ultra HDR letterforms to headlines and logotypes.
      </p>
      <div className="mt-4 flex items-center gap-2 max-w-md rounded-[var(--radius)] border border-[var(--border)] bg-[var(--panel)] px-4 py-2">
        <code className="flex-1 truncate font-mono text-sm">npx skills add kirkstrobeck/gainmaps.com</code>
        <CopyButton text="npx skills add kirkstrobeck/gainmaps.com" className="ml-2" />
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        <a
          href="https://github.com/kirkstrobeck/gainmaps.com/tree/main/.claude/skills/ultra-text"
          className="underline underline-offset-2 hover:text-[var(--accent)] transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          View skill source on GitHub →
        </a>
      </p>
    </div>
  );
}
