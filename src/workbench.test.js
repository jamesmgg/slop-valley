import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "./game.js";

const ui = await import("./workbench.js").catch(() => ({}));
test("next ready wraps the queue, skipping cooking agents and the current review", () => {
  assert.equal(typeof ui.nextReadyAgent, "function");
  const state = createGame(12);
  state.agents[2].status = "review";
  assert.equal(
    ui.nextReadyAgent(state, state.agents[0].id).id,
    state.agents[2].id,
  );
  assert.equal(
    ui.nextReadyAgent(state, state.agents[2].id).id,
    state.agents[0].id,
  );
  state.agents[2].status = "working";
  assert.equal(ui.nextReadyAgent(state, state.agents[0].id), null);
});
test("action guidance explains deficits and uses actual upgraded costs and timing", () => {
  assert.equal(typeof ui.feedbackInfo, "function");
  const state = createGame(12);
  state.cash = 10;
  state.attention = 1;
  const blocked = ui.feedbackInfo(state, "polish");
  assert.equal(blocked.disabled, true);
  assert.match(blocked.reason, /\$22/);
  assert.match(blocked.reason, /8 attention/);
  state.cash = 100;
  state.attention = 3;
  state.upgrades.context = 4;
  state.upgrades.model = 2;
  const allowed = ui.feedbackInfo(state, "polish");
  assert.equal(allowed.disabled, false);
  assert.equal(allowed.attention, 2);
  assert.equal(allowed.seconds, 14);
});
