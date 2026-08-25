import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { defaultOutputPath, planOutputs, stripExtension } from "#src/output-path.js";

describe("output-path", () => {
  it("builds default names and plans stdout, file, and directory outputs", () => {
    assert.equal(stripExtension("a.png"), "a");
    assert.equal(stripExtension("a"), "a");
    assert.match(defaultOutputPath("/tmp/photo.jpg"), /photo-gainmap\.jpg$/);
    const def = planOutputs(["/tmp/a.jpg"], { suffix: "-gainmap", stdout: false, outputIsDirectory: false });
    assert.match(def[0]!.output ?? "", /a-gainmap\.jpg$/);
    const stdout = planOutputs(["/tmp/a.png"], { suffix: "-gainmap", stdout: true, outputIsDirectory: false });
    assert.equal(stdout[0]!.stdout, true);
    const dash = planOutputs(["/tmp/a.png"], { output: "-", suffix: "-gainmap", stdout: false, outputIsDirectory: false });
    assert.equal(dash[0]!.stdout, true);
    const file = planOutputs(["/tmp/a.png"], { output: "/tmp/out.jpg", suffix: "-gainmap", stdout: false, outputIsDirectory: false });
    assert.equal(file[0]!.output, "/tmp/out.jpg");
    const dir = planOutputs(["/tmp/shots/a.jpg"], { output: "/tmp/out", suffix: "-hdr", stdout: false, outputIsDirectory: true, root: "/tmp/shots" });
    assert.equal(dir[0]!.output, "/tmp/out/a-hdr.jpg");
    const nested = planOutputs(["/tmp/shots/sub/a.jpg"], { output: "/tmp/out", suffix: "-gainmap", stdout: false, outputIsDirectory: true, root: "/tmp/shots" });
    assert.match(nested[0]!.output ?? "", /sub\/a-gainmap\.jpg$/);
    assert.throws(() => planOutputs(["a.png", "b.png"], { suffix: "-gainmap", stdout: true, outputIsDirectory: false }), /exactly one/);
    assert.throws(() => planOutputs(["a.png", "b.png"], { output: "-", suffix: "-gainmap", stdout: false, outputIsDirectory: false }), /exactly one/);
  });

  it("preserves .jpg extension exactly", () => {
    assert.match(defaultOutputPath("/tmp/photo.jpg"), /photo-gainmap\.jpg$/);
    const plan = planOutputs(["/tmp/a.jpg"], { suffix: "-gainmap", stdout: false, outputIsDirectory: false });
    assert.match(plan[0]!.output ?? "", /a-gainmap\.jpg$/);
  });

  it("preserves .jpeg extension exactly", () => {
    assert.match(defaultOutputPath("/tmp/photo.jpeg"), /photo-gainmap\.jpeg$/);
    const plan = planOutputs(["/tmp/a.jpeg"], { suffix: "-gainmap", stdout: false, outputIsDirectory: false });
    assert.match(plan[0]!.output ?? "", /a-gainmap\.jpeg$/);
  });

  it("preserves uppercase JPEG extension (.JPG)", () => {
    assert.match(defaultOutputPath("/tmp/photo.JPG"), /photo-gainmap\.JPG$/);
    const dir = planOutputs(["/tmp/shots/a.JPG"], { output: "/tmp/out", suffix: "-gainmap", stdout: false, outputIsDirectory: true, root: "/tmp/shots" });
    assert.equal(dir[0]!.output, "/tmp/out/a-gainmap.JPG");
  });

  it("defaults to .jpg for a filename with no extension", () => {
    assert.match(defaultOutputPath("/tmp/photo"), /photo-gainmap\.jpg$/);
    const plan = planOutputs(["/tmp/photo"], { suffix: "-gainmap", stdout: false, outputIsDirectory: false });
    assert.match(plan[0]!.output ?? "", /photo-gainmap\.jpg$/);
  });

  it("throws for non-JPEG inputs (.png)", () => {
    assert.throws(() => defaultOutputPath("/tmp/photo.png"), /cannot carry a gain map/);
    assert.throws(
      () => planOutputs(["/tmp/a.PNG"], { suffix: "-gainmap", stdout: false, outputIsDirectory: false }),
      /cannot carry a gain map/,
    );
  });

  it("log path contains real extension (.jpeg)", () => {
    const path = defaultOutputPath("/tmp/photo.jpeg");
    assert.match(path, /photo-gainmap\.jpeg$/);
    const plan = planOutputs(["/tmp/a.jpeg"], { suffix: "-gainmap", stdout: false, outputIsDirectory: false });
    assert.match(plan[0]!.output ?? "", /a-gainmap\.jpeg$/);
  });
});
