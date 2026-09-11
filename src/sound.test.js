import test from "node:test";
import assert from "node:assert/strict";
import * as sound from "./sound.js";

test("game events have short distinct safe-volume sound signatures", () => {
  assert.equal(typeof sound.playCue, "function");
  const cues = [
    "tap",
    "ready",
    "success",
    "failure",
    "income",
    "event",
    "trash",
    "rest",
    "invest",
  ];
  assert.equal(
    new Set(cues.map((cue) => JSON.stringify(sound.CUES?.[cue]))).size,
    cues.length,
  );
  for (const cue of cues) {
    assert.ok(sound.CUES[cue].length > 0);
    for (const [frequency, start, duration] of sound.CUES[cue]) {
      assert.ok(frequency >= 80 && frequency <= 1500);
      assert.ok(start + duration < 1.5);
    }
  }
});
test("audio is optional and unsupported contexts never interrupt gameplay", () => {
  assert.doesNotThrow(() => sound.playCue(null, "success"));
});
