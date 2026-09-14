#!/usr/bin/env node
/** Build the Follow-up 11 Lighthouse opportunity, LCP, and score evidence. */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const directory = "sandbox-shots-tmp/lighthouse";
const files = readdirSync(directory).filter((file) => file.endsWith(".json"));
const read = (file) => JSON.parse(readFileSync(join(directory, file), "utf8"));
const score = (value) => value == null ? "n/a" : Math.round(value * 100);

function lcpNode(report) {
  const audit = report.audits["largest-contentful-paint-element"];
  const item = audit?.details?.items?.[0];
  const node = item?.items?.[0]?.node ?? item?.node;
  return node?.nodeLabel ?? node?.snippet ?? "unavailable";
}

function originalLcpLines() {
  const targets = ["home", "convert", "photos"];
  const lines = ["ORIGINAL FINAL LCP ELEMENTS (frozen before Follow-up 11 runs)"];
  for (const target of targets) {
    for (const form of ["desktop", "mobile"]) {
      const matches = files.filter((file) => new RegExp(`^${target}-${form}-final[123]\\.json$`).test(file)).sort();
      for (const file of matches) lines.push(`${basename(file, ".json")}: ${lcpNode(read(file))}`);
    }
  }
  return lines;
}

function opportunityLines() {
  const finals = files.filter((file) => /-final[123]\.json$/.test(file)).sort();
  const lines = ["LIGHTHOUSE OPPORTUNITIES FROM ORIGINAL FINAL RUNS"];
  for (const file of finals) {
    const report = read(file);
    const audits = Object.entries(report.audits).flatMap(([id, audit]) => {
      const savingsMs = audit.details?.overallSavingsMs ?? 0;
      if (!(savingsMs > 0 || (audit.score != null && audit.score < 0.9))) return [];
      return [{ id, title: audit.title, score: audit.score, savingsMs,
        savingsBytes: audit.details?.overallSavingsBytes ?? 0 }];
    }).sort((a, b) => b.savingsMs - a.savingsMs || a.id.localeCompare(b.id));
    lines.push(`\n${basename(file, ".json")}`);
    for (const audit of audits) {
      lines.push(`${audit.id} | score=${audit.score ?? "n/a"} | savingsMs=${Math.round(audit.savingsMs)} | savingsBytes=${Math.round(audit.savingsBytes)} | ${audit.title}`);
    }
    const requests = report.audits["network-requests"]?.details?.items ?? [];
    const transfer = requests.reduce((total, item) => total + (item.transferSize ?? 0), 0);
    lines.push(`network | requests=${requests.length} | transferBytes=${Math.round(transfer)}`);
    const work = report.audits["mainthread-work-breakdown"]?.details?.items ?? [];
    for (const item of work) lines.push(`mainthread | ${item.groupLabel} | durationMs=${Math.round(item.duration)}`);
    const bootup = report.audits["bootup-time"]?.details?.items ?? [];
    for (const item of [...bootup].sort((a, b) => b.total - a.total).slice(0, 3)) {
      lines.push(`bootup | totalMs=${Math.round(item.total)} | scriptMs=${Math.round(item.scripting)} | ${item.url}`);
    }
    const scripts = report.audits["script-treemap-data"]?.details?.nodes ?? [];
    for (const item of [...scripts].sort((a, b) => b.resourceBytes - a.resourceBytes).slice(0, 3)) {
      lines.push(`script | resourceBytes=${item.resourceBytes} | encodedBytes=${item.encodedBytes} | ${item.name}`);
    }
  }
  return lines;
}

function followupLines() {
  const current = files.filter((file) => /-followup11[123]\.json$/.test(file)).sort();
  if (current.length === 0) return ["No Follow-up 11 Lighthouse results yet."];
  const groups = new Map();
  for (const file of current) {
    const match = basename(file, ".json").match(/^(.*)-followup11([123])$/);
    if (!match) continue;
    const report = read(file);
    const categories = report.categories;
    const row = {
      run: Number(match[2]), perf: score(categories.performance.score),
      a11y: score(categories.accessibility.score), bp: score(categories["best-practices"].score),
      seo: score(categories.seo.score), lcp: lcpNode(report),
    };
    groups.set(match[1], [...(groups.get(match[1]) ?? []), row]);
  }
  const lines = ["FOLLOW-UP 11 LIGHTHOUSE TABLE", "route/form | perf runs | median | A11y/BP/SEO minima"];
  for (const [key, rows] of [...groups].sort()) {
    rows.sort((a, b) => a.run - b.run);
    const sorted = [...rows.map((row) => row.perf)].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const minima = ["a11y", "bp", "seo"].map((field) => Math.min(...rows.map((row) => row[field])));
    lines.push(`${key} | ${rows.map((row) => row.perf).join("/")} | ${median} | ${minima.join("/")}`);
  }
  lines.push("", "FOLLOW-UP 11 LCP ELEMENTS");
  for (const [key, rows] of [...groups].sort()) {
    for (const row of rows) lines.push(`${key} run ${row.run}: ${row.lcp}`);
  }
  return lines;
}

function residualLines() {
  const current = files.filter((file) => /-followup11[123]\.json$/.test(file)).sort();
  const groups = new Map();
  for (const file of current) {
    const key = basename(file, ".json").replace(/-followup11[123]$/, "");
    groups.set(key, [...(groups.get(key) ?? []), { file, report: read(file) }]);
  }
  const lines = [
    "FOLLOW-UP 11 LIGHTHOUSE RESIDUALS",
    "Residual performance is not bounded solely by required gainmap bytes; CPU-throttled framework work, modal painting, fonts, and JPEG delivery also remain.",
  ];
  for (const [key, rows] of [...groups].sort()) {
    const ordered = [...rows].sort((a, b) => a.report.categories.performance.score - b.report.categories.performance.score);
    const row = ordered[Math.floor(ordered.length / 2)];
    const report = row.report;
    const performance = score(report.categories.performance.score);
    if (performance === 100) continue;
    const metric = (id) => Math.round(report.audits[id]?.numericValue ?? 0);
    lines.push(`\n${key} | median-source=${row.file} | performance=${performance} | LCPms=${metric("largest-contentful-paint")} | TBTms=${metric("total-blocking-time")} | FCPms=${metric("first-contentful-paint")} | SIms=${metric("speed-index")} | CLS=${report.audits["cumulative-layout-shift"]?.numericValue ?? 0} | bytes=${metric("total-byte-weight")}`);
    const audits = Object.values(report.audits).filter((audit) => (
      (audit.details?.overallSavingsMs ?? 0) > 0 || (audit.score != null && audit.score < 0.9)
    )).sort((a, b) => (b.details?.overallSavingsMs ?? 0) - (a.details?.overallSavingsMs ?? 0));
    for (const audit of audits) {
      lines.push(`${audit.id} | score=${audit.score ?? "n/a"} | value=${Math.round(audit.numericValue ?? 0)}${audit.numericUnit ?? ""} | savingsMs=${Math.round(audit.details?.overallSavingsMs ?? 0)} | savingsBytes=${Math.round(audit.details?.overallSavingsBytes ?? 0)}`);
    }
  }
  return lines;
}

function comparisonLines() {
  const patterns = [
    ["before", /-final[123]\.json$/],
    ["after", /-followup11[123]\.json$/],
  ];
  const data = new Map();
  for (const [phase, pattern] of patterns) {
    for (const file of files.filter((name) => pattern.test(name))) {
      const key = basename(file, ".json").replace(/-(?:final|followup11)[123]$/, "");
      const report = read(file);
      const metrics = {
        perf: score(report.categories.performance.score),
        bytes: report.audits["total-byte-weight"]?.numericValue ?? 0,
        tbt: report.audits["total-blocking-time"]?.numericValue ?? 0,
        lcp: report.audits["largest-contentful-paint"]?.numericValue ?? 0,
        dom: report.audits["dom-size"]?.numericValue ?? 0,
        main: report.audits["mainthread-work-breakdown"]?.numericValue ?? 0,
      };
      data.set(`${phase}:${key}`, [...(data.get(`${phase}:${key}`) ?? []), metrics]);
    }
  }
  const fields = ["perf", "bytes", "tbt", "lcp", "dom", "main"];
  const median = (rows, field) => [...rows.map((row) => row[field])].sort((a, b) => a - b)[1];
  const lines = ["LIGHTHOUSE BEFORE/AFTER MEDIANS", "route/form | phase | perf | bytes | TBTms | LCPms | DOM | mainthreadMs"];
  const keys = [...new Set([...data.keys()].map((key) => key.split(":")[1]))].sort();
  for (const key of keys) {
    for (const [phase] of patterns) {
      const rows = data.get(`${phase}:${key}`);
      if (!rows || rows.length !== 3) continue;
      lines.push(`${key} | ${phase} | ${fields.map((field) => Math.round(median(rows, field))).join(" | ")}`);
    }
  }
  return lines;
}

const mode = process.argv[2] ?? "baseline";
if (mode === "baseline") {
  writeFileSync("sandbox-shots-tmp/lighthouse-original-lcp.log", `${originalLcpLines().join("\n")}\n`);
  writeFileSync("sandbox-shots-tmp/lighthouse-opportunities.log", `${opportunityLines().join("\n")}\n`);
}
if (mode === "followup") writeFileSync("sandbox-shots-tmp/lighthouse-followup11.log", `${followupLines().join("\n")}\n`);
if (mode === "residuals") writeFileSync("sandbox-shots-tmp/lighthouse-residuals.log", `${residualLines().join("\n")}\n`);
if (mode === "comparison") writeFileSync("sandbox-shots-tmp/lighthouse-comparison.log", `${comparisonLines().join("\n")}\n`);
