import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { defaultOutputPath, planOutputs, stripExtension } from "#src/output-path.js";

describe("output-path", () => {
  it("builds default names and plans stdout, file, and directory outputs", () => {
    assert.equal(stripExtension("a.png"), "a");
    assert.equal(stripExtension("a"), "a");
    assert.match(defaultOutputPath("/tmp/photo.jpg"), /photo-gainmap.jpg$/);
    const def = planOutputs(["/tmp/a.png"], { suffix: "-gainmap", stdout: false, outputIsDirectory: false });
    assert.match(def[0]!.output ?? "", /a-gainmap.jpg$/);
    const stdout = planOutputs(["/tmp/a.png"], { suffix: "-gainmap", stdout: true, outputIsDirectory: false });
    assert.equal(stdout[0]!.stdout, true);
    const dash = planOutputs(["/tmp/a.png"], { output: "-", suffix: "-gainmap", stdout: false, outputIsDirectory: false });
    assert.equal(dash[0]!.stdout, true);
    const file = planOutputs(["/tmp/a.png"], { output: "/tmp/out.jpg", suffix: "-gainmap", stdout: false, outputIsDirectory: false });
    assert.equal(file[0]!.output, "/tmp/out.jpg");
    const dir = planOutputs(["/tmp/shots/a.png"], { output: "/tmp/out", suffix: "-hdr", stdout: false, outputIsDirectory: true, root: "/tmp/shots" });
    assert.equal(dir[0]!.output, "/tmp/out/a-hdr.jpg");
    const nested = planOutputs(["/tmp/shots/sub/a.png"], { output: "/tmp/out", suffix: "-gainmap", stdout: false, outputIsDirectory: true, root: "/tmp/shots" });
    assert.match(nested[0]!.output ?? "", /sub\/a-gainmap.jpg$/);
    assert.throws(() => planOutputs(["a.png", "b.png"], { suffix: "-gainmap", stdout: true, outputIsDirectory: false }), /exactly one/);
    assert.throws(() => planOutputs(["a.png", "b.png"], { output: "-", suffix: "-gainmap", stdout: false, outputIsDirectory: false }), /exactly one/);
  });
});
