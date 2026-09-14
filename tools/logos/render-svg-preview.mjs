#!/usr/bin/env node
import { readdir, mkdir } from "node:fs/promises";
import sharp from "sharp";
const input = process.argv[2] ?? "sandbox-shots-tmp/required-raw";
const output = process.argv[3] ?? "sandbox-shots-tmp/required-preview";
await mkdir(output, { recursive: true });
for (const file of await readdir(input)) {
  if (!file.endsWith(".svg")) continue;
  await sharp(`${input}/${file}`, { density: 300 }).resize(512, 512, { fit: "inside" })
    .png().toFile(`${output}/${file.replace(/\.svg$/, ".png")}`);
}
