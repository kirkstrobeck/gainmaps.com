import assert from "node:assert/strict";
import { describe, it } from "vitest";

import {
  applyHighlightSelectiveHdr,
  applyWindowGainCalibration,
  clamp,
  encodeRgbaToUltraHdrJpeg,
  flattenRgbaOntoCheckerboard,
  flattenRgbaOntoWhite,
  headroomFromBoost,
  resolveHeadroom,
  WINDOW_GAIN_CALIBRATION,
} from "#src/encode.js";

function rgba(values: number[]): Uint8Array {
  return Uint8Array.from(values);
}

describe("encode", () => {
  it("maps boost to headroom and honors explicit headroom", () => {
    assert.equal(headroomFromBoost(0), 2);
    assert.ok(Math.abs(headroomFromBoost(0.5) - WINDOW_GAIN_CALIBRATION.headroom) < 1e-9);
    assert.equal(headroomFromBoost(1), 6);
    assert.equal(resolveHeadroom({}), headroomFromBoost(0.5));
    assert.equal(resolveHeadroom({ headroom: 4 }), 4);
    assert.equal(resolveHeadroom({ headroom: 0 }), 1);
    assert.equal(resolveHeadroom({ headroom: Number.NaN, boost: 0 }), 2);
  });

  it("clamps non-finite values", () => {
    assert.equal(clamp(Number.NaN, 1, 10), 1);
    assert.equal(clamp(0, 1, 10), 1);
    assert.equal(clamp(99, 1, 10), 10);
  });

  it("flattens alpha onto white and checkerboard", () => {
    const pixels = rgba([0, 0, 0, 0, 255, 0, 0, 255]);
    const white = flattenRgbaOntoWhite(pixels, 2, 1);
    assert.equal(white[0], 255);
    assert.equal(white[3], 255);
    assert.equal(white[4], 255);
    const checker = flattenRgbaOntoCheckerboard(pixels, 2, 1, 1);
    assert.equal(checker[0], 245);
    assert.equal(checker[4], 255);
  });

  it("applies highlight and window HDR models", () => {
    const hi = applyHighlightSelectiveHdr(1, 1, 1, 3);
    assert.ok(hi[0] > 1);
    const lo = applyHighlightSelectiveHdr(0.05, 0.05, 0.05, 3);
    assert.ok(lo[0] < 0.2);
    const win = applyWindowGainCalibration(0.4, 0.3, 0.2, 3);
    assert.ok(win.every((channel) => channel >= 0));
    const linear = applyWindowGainCalibration(0.4, 0.3, 0.2, 3, { ...WINDOW_GAIN_CALIBRATION, saturation: 1 });
    assert.equal(linear.length, 3);
  });

  it("encodes a gain-map JPEG with quality, model, and matte options", () => {
    const pixels = rgba([
      255, 255, 255, 255, 10, 10, 10, 255,
      200, 20, 20, 128, 0, 0, 0, 0,
    ]);
    const encoded = encodeRgbaToUltraHdrJpeg(pixels, 2, 2, {
      boost: 0.5,
      quality: 80,
      hdrModel: "highlight",
      matte: "white",
    });
    assert.equal(encoded.output[0], 0xff);
    assert.equal(encoded.output[1], 0xd8);
    const text = Buffer.from(encoded.output).toString("latin1");
    assert.ok(text.includes("hdr-gain-map") || text.includes("GainMap") || text.includes("MPF"));
    const windowed = encodeRgbaToUltraHdrJpeg(pixels, 2, 2, {
      headroom: 3,
      hdrModel: "window",
      matte: "checkerboard",
      quality: Number.NaN,
    });
    assert.equal(windowed.output[0], 0xff);
    assert.match(windowed.note, /Gain map JPEG/);
  });
});
