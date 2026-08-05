import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

import { parseJpeg, serializeJpeg } from '../src/jpeg/structure.js';
import { extractIccProfile, setIccProfile } from '../src/jpeg/icc-segments.js';
import { summarizeIcc } from '../src/icc/describe.js';

const SOURCE = 'ashbyhq_logo.jpg';
const TARGET = 'Sticker - 5_.jpg';
const PROFILE = 'profiles/rec2020-pq.icc';
const EXPECTED = 'Rec2020 Gamut with PQ Transfer';

const sha = (data: Buffer) => createHash('sha256').update(data).digest('hex');

describe('jpeg structure', () => {
  it('re-serializes an untouched JPEG byte-for-byte', async () => {
    for (const file of [SOURCE, TARGET]) {
      const original = await readFile(file);
      assert.equal(sha(serializeJpeg(parseJpeg(original))), sha(original), file);
    }
  });

  it('rejects non-JPEG input', () => {
    assert.throws(() => parseJpeg(Buffer.from('not a jpeg')), /missing SOI/);
  });
});

describe('icc description', () => {
  it('reads the Rec.2020 PQ name from the donor image', async () => {
    const profile = extractIccProfile(parseJpeg(await readFile(SOURCE)));
    assert.ok(profile);
    assert.equal(summarizeIcc(profile).description, EXPECTED);
  });

  it('does not mutate the profile buffer it describes', async () => {
    const profile = await readFile(PROFILE);
    const before = sha(profile);
    assert.equal(summarizeIcc(profile).description, EXPECTED);
    assert.equal(summarizeIcc(profile).description, EXPECTED);
    assert.equal(sha(profile), before, 'summarizeIcc mutated its input');
  });

  it('describes the bundled profile identically to the donor', async () => {
    const donor = extractIccProfile(parseJpeg(await readFile(SOURCE)));
    assert.ok(donor);
    assert.equal(sha(await readFile(PROFILE)), sha(donor));
  });
});

describe('assigning a profile', () => {
  it('embeds the profile without altering the pixel scan', async () => {
    const original = parseJpeg(await readFile(TARGET));
    const profile = await readFile(PROFILE);

    const tagged = parseJpeg(serializeJpeg(setIccProfile(original, profile)));

    assert.equal(sha(tagged.scan), sha(original.scan), 'scan changed');
    assert.ok(extractIccProfile(tagged)?.equals(profile), 'profile did not round-trip');
    assert.equal(summarizeIcc(extractIccProfile(tagged)!).description, EXPECTED);
  });

  it('replaces an existing profile rather than stacking one', async () => {
    const jpeg = parseJpeg(await readFile(SOURCE));
    const replacement = Buffer.concat([await readFile(PROFILE), Buffer.alloc(0)]);
    const tagged = parseJpeg(serializeJpeg(setIccProfile(jpeg, replacement)));

    const app2 = tagged.segments.filter((s) => s.marker === 0xe2);
    assert.equal(app2.length, Math.ceil(replacement.length / 65519));
    assert.ok(extractIccProfile(tagged)?.equals(replacement));
  });

  it('splits and reassembles a profile larger than one segment', async () => {
    const jpeg = parseJpeg(await readFile(TARGET));
    const big = Buffer.concat([await readFile(PROFILE), Buffer.alloc(140_000, 0x5a)]);
    const tagged = parseJpeg(serializeJpeg(setIccProfile(jpeg, big)));

    assert.equal(tagged.segments.filter((s) => s.marker === 0xe2).length, 3);
    assert.ok(extractIccProfile(tagged)?.equals(big));
    assert.equal(sha(tagged.scan), sha(jpeg.scan));
  });
});
