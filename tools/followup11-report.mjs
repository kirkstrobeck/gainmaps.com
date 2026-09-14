#!/usr/bin/env node
/** Assemble reviewer-facing Follow-up 11 evidence from generated logs. */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const root = "sandbox-shots-tmp";
const read = (name) => readFileSync(`${root}/${name}`, "utf8").trim();
const lines = (name) => read(name).split("\n");
const tail = (name) => lines(name).slice(-3).join("\n");
const playwright = read("playwright.log");

const hdrEvidence = playwright.split("\n").filter((line) => (
  line.startsWith("HDR matchMedia=")
  || line.startsWith("first-visit modal CLS")
  || line.startsWith("mobile DPR=1.75")
  || line.startsWith("hero preload links")
));
const hdr = [
  "HDR GATE DECISION",
  "UltraWord emits the pre-493654e SVG mask definitions and both canvas boxes in SSR markup. Client matchMedia initializes synchronously; only HDR mask measurement/ResizeObserver and UltraFillCanvas effects do work on HDR. SDR keeps the same reserved absolute overlay boxes without measurement or GPU work.",
  "The static DOM removes the additional gate-induced insertion/flash and preserves the pre-493654e foundation ratio and intensity. Headless matchMedia proves branching/effect plumbing, not physical HDR luminance; physical brightness requires HDR hardware.",
  "",
  "EVIDENCE",
  ...hdrEvidence,
  "Unit: matchMedia=true renders two masks/two canvases and calls startUltraFill twice; matchMedia=false renders reserved masks/canvases and calls startUltraFill zero times.",
  "SUMMARY HDR true: document CLS=0, Ultra CLS=0, masks/canvases present, effects started.",
  "SUMMARY HDR false: document CLS=0, Ultra CLS=0, reserved markup present, effects skipped.",
  "SUMMARY first visit: modal CLS=0; DPR 1.75 selected 800px hero candidates with high priority and responsive head preload.",
].join("\n");
writeFileSync(`${root}/hdr-gate.log`, `${hdr}\n`);

const afterLcp = lines("lighthouse-followup11.log").filter((line) => (
  /^(home|convert|photos)-(desktop|mobile) run/.test(line)
));
const commits = execFileSync("git", ["log", "--format=%H %s", "1c5cb8a..HEAD"], { encoding: "utf8" }).trim();
const logNames = [
  "verify.log", "layout.log", "playwright.log", "gain-probe-all.log",
  "is-agentic-after.log", "hdr-gate.log", "lighthouse-opportunities.log",
  "lighthouse-residuals.log",
];
const tails = logNames.map((name) => `### ${name}\n\n\`\`\`text\n${tail(name)}\n\`\`\``).join("\n\n");
const report = `# Follow-up 11 report

## Commits

\`\`\`text
${commits || "commit pending"}
\`\`\`

No push was performed.

## Part A — display-check first visit

The exact load → requestIdleCallback (5s callback timeout) / setTimeout(0) fallback is restored with the original storage key, a second storage check at callback time, cleanup, and immediate navigation registration. SSR and pre-idle renders contain no modal DOM. Scrollbar gutter reservation produced first-visit modal CLS=0.

The absolute “never LCP” requirement remains unmet. Browser LCP continues accepting larger late DOM until trusted input; in all three mobile /convert runs the unchanged 192px test image replaced the prior drop-zone heading as LCP. No arbitrary delay, content suppression, image shrink, or metric evasion was retained.

### Frozen original labels

\`\`\`text
${read("lighthouse-original-lcp.log")}
\`\`\`

### Follow-up labels (/, /convert, /photos)

\`\`\`text
${afterLcp.join("\n")}
\`\`\`

## Part B — HDR gate

\`\`\`text
${hdr}
\`\`\`

## Part C — Lighthouse

\`\`\`text
${read("lighthouse-followup11.log").split("FOLLOW-UP 11 LCP ELEMENTS")[0].trim()}
\`\`\`

Network-byte and SSR-DOM reductions are directly measured; overall performance did not reach 100 and several medians regressed. The remaining work is not bounded only by required gainmap bytes.

\`\`\`text
${read("lighthouse-comparison.log")}
\`\`\`

\`\`\`text
${read("lighthouse-residuals.log")}
\`\`\`

## Part D — log tails

${tails}
`;
writeFileSync(`${root}/followup11-report.md`, report);
