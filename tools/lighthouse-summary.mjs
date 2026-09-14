#!/usr/bin/env node
/** Print category scores and every scored audit below 100. */
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

const directory = process.argv[2] ?? "sandbox-shots-tmp/lighthouse";
const finalMode = process.argv[3] === "--final";
const pattern = finalMode ? /-final[123]\.json$/ : process.argv[3] ? new RegExp(process.argv[3]) : /\.json$/;
const categories = ["performance", "accessibility", "best-practices", "seo"];
const files = readdirSync(directory).filter((file) => file.endsWith(".json") && pattern.test(file)).sort();
const finalRows = new Map();

for (const file of files) {
  const report = JSON.parse(readFileSync(join(directory, file), "utf8"));
  const scores = Object.fromEntries(categories.map((name) => [name, Math.round(100 * report.categories[name].score)]));
  console.log(`${basename(file, ".json")} performance=${scores.performance} accessibility=${scores.accessibility} best-practices=${scores["best-practices"]} seo=${scores.seo}`);
  for (const [id, audit] of Object.entries(report.audits)) {
    if (audit.score == null || audit.score === 1 || audit.scoreDisplayMode === "notApplicable") continue;
    console.log(`  ${id} score=${audit.score} ${audit.title}`);
  }
  if (finalMode) {
    const match = basename(file, ".json").match(/^(.*)-final([123])$/);
    if (!match) continue;
    const key = match[1];
    const rows = finalRows.get(key) ?? [];
    rows.push({ run: Number(match[2]), scores, benchmark: report.environment.benchmarkIndex });
    finalRows.set(key, rows);
  }
}

if (finalMode) {
  console.log("FINAL TABLE route/form | perf runs | accessibility | best-practices | seo | benchmark runs");
  const unmet = [];
  for (const [key, rows] of [...finalRows].sort()) {
    rows.sort((a, b) => a.run - b.run);
    const perf = rows.map((row) => row.scores.performance);
    const med = [...perf].sort((a, b) => a - b)[1];
    const stable = categories.slice(1).map((name) => Math.min(...rows.map((row) => row.scores[name])));
    console.log(`${key} | ${perf.join("/")} median=${med} | ${stable.join(" | ")} | ${rows.map((row) => row.benchmark).join("/")}`);
    if (med < 100) unmet.push(`${key}: performance median ${med}`);
    categories.slice(1).forEach((name, index) => {
      if (stable[index] < 100) unmet.push(`${key}: ${name} ${stable[index]}`);
    });
  }
  if (unmet.length === 0) console.log("ALL 100");
  if (unmet.length > 0) console.log(`NOT 100: ${unmet.join("; ")}`);
}
