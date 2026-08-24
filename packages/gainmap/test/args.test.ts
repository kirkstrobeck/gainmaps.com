import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { flagBool, flagNumber, flagString, flagStrings, parseArgs } from "#src/args.js";

describe("args", () => {
  it("parses aliases, equals, booleans, rest, and repeatable flags", () => {
    const parsed = parseArgs([
      "convert", "in.png", "-o", "out.jpg", "--preset=unused", "--exclude", "a/**", "--exclude=b/**",
      "--help", "-R", "--", "-weird",
    ]);
    assert.deepEqual(parsed.positionals, ["convert", "in.png", "-weird"]);
    assert.equal(flagString(parsed.flags, "output"), "out.jpg");
    assert.equal(flagBool(parsed.flags, "help"), true);
    assert.equal(flagBool(parsed.flags, "recursive"), true);
    assert.deepEqual(flagStrings(parsed.flags, "exclude"), ["a/**", "b/**"]);
    assert.equal(flagString(parsed.flags, "exclude"), "b/**");
    assert.equal(flagString({}, "missing"), undefined);
    assert.deepEqual(flagStrings({}, "exclude"), []);
    assert.equal(flagNumber({ jobs: "4" }, "jobs"), 4);
    assert.equal(flagNumber({}, "jobs"), undefined);
  });

  it("treats dash as a positional and rejects missing values", () => {
    const parsed = parseArgs(["-", "--stdout"]);
    assert.deepEqual(parsed.positionals, ["-"]);
    assert.equal(flagBool(parsed.flags, "stdout"), true);
    assert.throws(() => parseArgs(["--quality"]), /requires a value/);
    assert.throws(() => parseArgs(["--quality", "--force"]), /requires a value/);
    assert.throws(() => flagString({ quality: true }, "quality"), /requires a value/);
    assert.throws(() => flagNumber({ jobs: "nope" }, "jobs"), /must be a number/);
  });

  it("stores a single repeatable value as an array after the second flag", () => {
    const once = parseArgs(["--exclude", "raw/**"]);
    assert.deepEqual(flagStrings(once.flags, "exclude"), ["raw/**"]);
    const twice = parseArgs(["--exclude", "raw/**", "--exclude", "tmp/**"]);
    assert.deepEqual(flagStrings(twice.flags, "exclude"), ["raw/**", "tmp/**"]);
  });
});
