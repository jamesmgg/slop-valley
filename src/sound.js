// Short synthesized cues; no audio assets or network calls.
export const CUES = {
  tap: [
    [440, 0, 0.07],
    [660, 0.045, 0.08],
  ],
  ready: [
    [660, 0, 0.12],
    [880, 0.12, 0.16],
  ],
  success: [
    [523, 0, 0.13],
    [659, 0.1, 0.13],
    [784, 0.2, 0.13],
    [1046, 0.3, 0.25],
  ],
  failure: [
    [392, 0, 0.18],
    [294, 0.14, 0.2],
    [147, 0.3, 0.28],
  ],
  income: [
    [1046, 0, 0.08],
    [1318, 0.08, 0.13],
  ],
  event: [
    [330, 0, 0.1],
    [330, 0.16, 0.1],
    [494, 0.3, 0.17],
  ],
  trash: [
    [220, 0, 0.08],
    [110, 0.07, 0.12],
  ],
  rest: [
    [392, 0, 0.22],
    [523, 0.17, 0.3],
  ],
  invest: [
    [262, 0, 0.09],
    [392, 0.08, 0.1],
    [523, 0.17, 0.14],
  ],
};
export function playCue(context, cue = "tap") {
  if (!context) return;
  try {
    context.resume()?.catch?.(() => {});
    for (const [frequency, delay, duration] of CUES[cue] || CUES.tap) {
      const osc = context.createOscillator(),
        gain = context.createGain();
      const start = context.currentTime + delay;
      osc.type = cue === "failure" || cue === "trash" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.028, start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
      osc.start(start);
      osc.stop(start + duration + 0.01);
    }
  } catch {
    /* Playback must never interrupt a decision. */
  }
}
