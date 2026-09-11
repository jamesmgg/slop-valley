import test from "node:test";
import assert from "node:assert/strict";
import * as game from "./game.js";

function engine() {
  return game;
}
function review(seed = 11) {
  return engine().createGame(seed);
}

test("seeded games begin with three agents and are serializable", () => {
  const { createGame } = engine();
  const a = createGame(123);
  assert.deepEqual(a, createGame(123));
  assert.notDeepEqual(a, createGame(124));
  assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
  assert.equal(a.cash, 480);
  assert.equal(a.followers, 128);
  assert.equal(a.agents.length, 3);
  assert.equal(a.agents[0].status, "review");
  assert.equal(a.agents.filter((x) => x.status === "working").length, 2);
});

test("time advances all working agents together without mutating the save", () => {
  const { stepGame } = engine();
  const state = review();
  const before = JSON.stringify(state);
  const next = stepGame(state, 5);
  assert.equal(JSON.stringify(state), before);
  for (const agent of next.agents.slice(1))
    assert.ok(
      agent.progress > state.agents.find((x) => x.id === agent.id).progress,
    );
  assert.equal(next.agents[0].progress, 100);
  assert.ok(stepGame(next, 60).agents.every((x) => x.status === "review"));
});

test("pause freezes time and speed multiplies simulation time", () => {
  const { act, stepGame } = engine();
  const state = review();
  const paused = act(state, { type: "pause" });
  assert.deepEqual(stepGame(paused, 10), paused);
  assert.equal(
    stepGame(act(state, { type: "speed", value: 3 }), 5).elapsed,
    15,
  );
});

test("iteration costs resources and improves the review after work completes", () => {
  const { act, stepGame, ACTIONS } = engine();
  const state = review();
  const agent = state.agents[0];
  const next = act(state, { type: "iterate", id: agent.id, mode: "polish" });
  assert.equal(next.cash, state.cash - ACTIONS.polish.cost);
  assert.ok(next.attention < state.attention);
  assert.equal(next.agents[0].status, "working");
  assert.equal(next.agents[0].idea.iteration, 1);
  const done = stepGame(next, 60);
  assert.equal(done.agents[0].status, "review");
  assert.ok(done.agents[0].idea.quality > agent.idea.quality);
  assert.equal(state.agents[0].status, "review");
});

test("custom feedback persists as plain text and influences iteration", () => {
  const { act, stepGame } = engine();
  const state = review();
  const instruction =
    "Talk to users, test accessibility, fix bugs, simplify the UI.";
  const next = stepGame(
    act(state, {
      type: "iterate",
      id: state.agents[0].id,
      mode: "custom",
      instruction,
    }),
    60,
  );
  assert.equal(next.agents[0].idea.lastInstruction, instruction);
  assert.ok(next.agents[0].idea.quality > state.agents[0].idea.quality);
  assert.ok(
    next.agents[0].idea.notes.length > state.agents[0].idea.notes.length,
  );
});

test("invalid or unaffordable actions cannot spend resources", () => {
  const { act } = engine();
  const state = review();
  for (const action of [
    { type: "ship", id: "missing" },
    { type: "iterate", id: state.agents[1].id, mode: "polish" },
    { type: "iterate", id: state.agents[0].id, mode: "made-up" },
    { type: "upgrade", key: "secret" },
    { type: "speed", value: 999 },
  ])
    assert.deepEqual(act(state, action), state);
  const broke = { ...state, cash: 0, attention: 0 };
  for (const action of [
    { type: "spawn" },
    { type: "iterate", id: state.agents[0].id, mode: "polish" },
    { type: "upgrade", key: "model" },
  ])
    assert.deepEqual(act(broke, action), broke);
});

test("shipping resolves once and better products earn a better audience response", () => {
  const { act } = engine();
  let goodTotal = 0,
    slopTotal = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const state = review(seed);
    const id = state.agents[0].id;
    const good = structuredClone(state),
      slop = structuredClone(state);
    Object.assign(good.agents[0].idea, {
      quality: 95,
      novelty: 90,
      potential: 95,
      hype: 50,
    });
    Object.assign(slop.agents[0].idea, {
      quality: 5,
      novelty: 5,
      potential: 5,
      hype: 95,
    });
    const shipped = act(good, { type: "ship", id, tone: "honest" });
    const dud = act(slop, { type: "ship", id, tone: "hype" });
    assert.equal(shipped.shipped, 1);
    assert.equal(shipped.agents[0].status, "idle");
    assert.deepEqual(
      act(shipped, { type: "ship", id, tone: "honest" }),
      shipped,
    );
    goodTotal += shipped.followers - state.followers;
    slopTotal += dud.followers - state.followers;
  }
  assert.ok(goodTotal > slopTotal + 10000);
  assert.ok(slopTotal < 0);
});

test("an established audience loses trust when unfinished products are repeatedly overhyped", () => {
  const { act } = engine();
  let totalChange = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const state = { ...review(seed), followers: 5000 };
    Object.assign(state.agents[0].idea, {
      quality: 50,
      novelty: 65,
      potential: 60,
      hype: 80,
    });
    const next = act(state, {
      type: "ship",
      id: state.agents[0].id,
      tone: "hype",
    });
    totalChange += next.followers - state.followers;
  }
  assert.ok(
    totalChange < 0,
    `unfinished launch spam should lose trust on average, observed ${totalChange}`,
  );
});

test("hiring increases parallel capacity and caps at eight agents", () => {
  const { act, getEconomy } = engine();
  let state = { ...review(), cash: 100000 };
  const price = getEconomy(state).spawnCost;
  state = act(state, { type: "spawn" });
  assert.equal(state.cash, 100000 - price);
  assert.equal(state.agents.length, 4);
  assert.equal(state.agents[3].status, "working");
  assert.ok(getEconomy(state).spawnCost > price);
  for (let i = 0; i < 12; i++) state = act(state, { type: "spawn" });
  assert.equal(state.agents.length, 8);
  assert.equal(new Set(state.agents.map((x) => x.id)).size, 8);
});

test("trashing enables a fresh idea and has no duplicate salvage reward", () => {
  const { act, getEconomy } = engine();
  const state = review();
  const id = state.agents[0].id;
  const trashed = act(state, { type: "trash", id });
  assert.equal(trashed.trashed, 1);
  assert.equal(trashed.agents[0].status, "idle");
  assert.deepEqual(act(trashed, { type: "trash", id }), trashed);
  const restarted = act(trashed, { type: "start", id, category: "chaos" });
  assert.equal(restarted.agents[0].status, "working");
  assert.equal(restarted.agents[0].idea.category, "chaos");
  assert.notEqual(restarted.agents[0].idea.id, state.agents[0].idea.id);
  assert.equal(restarted.cash, trashed.cash - getEconomy(trashed).startCost);
});

test("upgrades spend once per level and increase their next price", () => {
  const { act, getEconomy, UPGRADES } = engine();
  let state = { ...review(), cash: 100000 };
  const old = getEconomy(state).upgradeCosts.model;
  state = act(state, { type: "upgrade", key: "model" });
  assert.equal(state.upgrades.model, 1);
  assert.equal(state.cash, 100000 - old);
  assert.ok(getEconomy(state).upgradeCosts.model > old);
  for (let i = 0; i < 10; i++)
    state = act(state, { type: "upgrade", key: "model" });
  assert.equal(state.upgrades.model, UPGRADES.model.maxLevel);
  assert.deepEqual(act(state, { type: "upgrade", key: "model" }), state);
});

test("effective feedback costs expose the same context discount the action charges", () => {
  const { act, getEconomy } = engine();
  const state = {
    ...review(),
    attention: 3,
    upgrades: { slots: 0, model: 0, context: 4 },
  };
  const economy = getEconomy(state);
  assert.equal(economy.attentionCosts?.polish, 2);
  assert.equal(economy.attentionCosts?.custom, 2);
  assert.equal(economy.attentionCosts?.validate, 4);
  const next = act(state, {
    type: "iterate",
    id: state.agents[0].id,
    mode: "polish",
  });
  assert.equal(next.agents[0].status, "working");
  assert.equal(next.attention, state.attention - economy.attentionCosts.polish);
});

test("break and freelance rescue prevent a resource dead end", () => {
  const { act } = engine();
  const state = { ...review(), cash: 0, attention: 0, followers: 128 };
  const rested = act(state, { type: "break" });
  assert.ok(rested.attention >= 45);
  assert.equal(rested.elapsed, 30);
  const rescued = act(state, { type: "grant" });
  assert.ok(rescued.cash >= 150);
  assert.equal(rescued.elapsed, 45);
  assert.ok(rescued.followers < state.followers);
});

test("recovery actions share a cooldown that only ordinary running time clears", () => {
  const { act, stepGame, getEconomy } = engine();
  const initial = review();
  const rested = act(initial, { type: "break" });
  assert.equal(getEconomy(rested).humanCooldown, 18);
  for (const type of ["break", "grant"])
    assert.deepEqual(act(rested, { type }), rested);
  const waiting = stepGame(rested, 17);
  assert.equal(getEconomy(waiting).humanCooldown, 1);
  assert.deepEqual(act(waiting, { type: "grant" }), waiting);
  const paused = act(waiting, { type: "pause" });
  assert.deepEqual(stepGame(paused, 100), paused);
  const ready = stepGame(act(paused, { type: "pause" }), 1);
  const paid = act(ready, { type: "grant" });
  assert.equal(getEconomy(paid).humanCooldown, 30);
  assert.ok(paid.cash >= ready.cash + 150);
  for (const type of ["break", "grant"])
    assert.deepEqual(act(paid, { type }), paid);
  const spedUp = stepGame(act(paid, { type: "speed", value: 3 }), 10);
  assert.equal(getEconomy(spedUp).humanCooldown, 0);
  assert.ok(act(spedUp, { type: "break" }).elapsed > spedUp.elapsed);
});

test("older saves without a recovery cooldown remain playable", () => {
  const { act, getEconomy } = engine();
  const state = review();
  delete state.humanCooldown;
  assert.equal(getEconomy(state).humanCooldown, 0);
  assert.equal(act(state, { type: "grant" }).humanCooldown, 30);
});

test("daily sponsors pay once per day and scale with the audience", () => {
  const { stepGame } = engine();
  const state = review();
  const day = stepGame(state, 60);
  assert.equal(day.day, 2);
  assert.ok(day.cash > state.cash);
  assert.equal(stepGame(day, 0).cash, day.cash);
  const popular = stepGame({ ...state, followers: 5000 }, 60);
  assert.ok(popular.cash - day.cash > 100);
});

test("industry events offer a choice and cannot be claimed twice", () => {
  const { stepGame, act } = engine();
  const state = stepGame(review(), 121);
  assert.ok(state.event?.options.length >= 2);
  const choice = state.event.options[0].id;
  const resolved = act(state, { type: "event", option: choice });
  assert.equal(resolved.event, null);
  assert.deepEqual(act(resolved, { type: "event", option: choice }), resolved);
});

test("10k followers with three hits wins while allowing endless play", () => {
  const { stepGame } = engine();
  const state = stepGame({ ...review(), followers: 10000, hits: 3 }, 1);
  assert.equal(state.won, true);
  assert.ok(state.achievements.length > 0);
  assert.equal(stepGame(state, 1).elapsed, 2);
});

test("long seeded play remains deterministic, finite and bounded", () => {
  const { act, stepGame } = engine();
  function run() {
    let state = review(789);
    for (let tick = 0; tick < 300; tick++) {
      state = stepGame(state, 3);
      if (state.event)
        state = act(state, {
          type: "event",
          option: state.event.options[0].id,
        });
      for (const agent of state.agents) {
        if (agent.status === "review")
          state = act(state, { type: "ship", id: agent.id, tone: "honest" });
        if (agent.status === "idle")
          state = act(state, { type: "start", id: agent.id });
      }
      if (state.cash < 30) state = act(state, { type: "grant" });
      if (state.attention < 15) state = act(state, { type: "break" });
      assert.ok(state.cash >= 0 && Number.isFinite(state.cash));
      assert.ok(state.followers >= 0 && Number.isFinite(state.followers));
      assert.ok(state.attention >= 0 && state.attention <= 100);
      assert.ok(state.feed.length <= 60);
      for (const agent of state.agents)
        for (const key of ["quality", "novelty", "hype", "potential"])
          assert.ok(agent.idea[key] >= 0 && agent.idea[key] <= 100);
    }
    return state;
  }
  assert.deepEqual(run(), run());
});

test("a launch keeps a product and a linked comment thread without duplicate shipments", () => {
  const state = review(42);
  const agent = state.agents[0];
  const shipped = game.act(state, {
    type: "ship",
    id: agent.id,
    tone: "honest",
  });
  assert.equal(shipped.products?.length, 1);
  const product = shipped.products[0];
  assert.equal(product.ideaId, agent.idea.id);
  assert.equal(product.title, agent.idea.title);
  assert.ok(product.dailyRevenue >= 0);
  const post = shipped.feed.find((entry) => entry.id === product.launchPostId);
  assert.equal(post.productId, product.id);
  assert.ok(post.comments.length >= 3);
  assert.ok(post.comments.every((comment) => comment.handle && comment.text));
  assert.deepEqual(game.act(shipped, { type: "ship", id: agent.id }), shipped);
});

test("products pay the advertised revenue once at each day boundary", () => {
  let state = game.act(review(42), {
    type: "ship",
    id: review(42).agents[0].id,
  });
  Object.assign(state.products?.[0] || {}, {
    dailyRevenue: 40,
    quality: 85,
    potential: 85,
    health: 85,
  });
  const income = game.getEconomy(state);
  assert.equal(income.productIncomePerDay, 40);
  const next = game.stepGame(state, 60);
  assert.equal(next.cash - state.cash, income.sponsorIncomePerDay + 40);
  assert.equal(next.products[0].totalRevenue, 40);
  assert.equal(next.products[0].age, 1);
  assert.equal(game.stepGame(next, 0).cash, next.cash);
});

test("weak launched products lose revenue and die instead of growing forever", () => {
  let state = game.act(review(91), {
    type: "ship",
    id: review(91).agents[0].id,
  });
  assert.ok(state.products?.length);
  Object.assign(state.products[0], {
    dailyRevenue: 8,
    quality: 12,
    potential: 14,
    ceiling: 24,
    health: 18,
  });
  state = game.stepGame(state, 600);
  assert.equal(state.products[0].status, "dead");
  assert.equal(state.products[0].dailyRevenue, 0);
  const oldTotal = state.products[0].totalRevenue;
  state = game.stepGame(state, 60);
  assert.equal(state.products[0].totalRevenue, oldTotal);
});

test("product investment occupies a free agent then resolves without launching again", () => {
  let state = game.act(review(12), {
    type: "ship",
    id: review(12).agents[0].id,
  });
  assert.equal(typeof game.getProductActionInfo, "function");
  const product = state.products[0];
  Object.assign(product, {
    status: "steady",
    dailyRevenue: 30,
    health: 60,
    quality: 60,
    potential: 70,
    ceiling: 90,
  });
  const info = game.getProductActionInfo(state, product, "improve");
  assert.equal(info.enabled, true);
  const invested = game.act(state, {
    type: "investProduct",
    productId: product.id,
    mode: "improve",
  });
  assert.equal(invested.cash, state.cash - info.cost);
  assert.equal(invested.agents[0].status, "working");
  assert.equal(invested.agents[0].projectTask.productId, product.id);
  assert.equal(invested.products[0].investment.agentId, state.agents[0].id);
  assert.deepEqual(
    game.act(invested, {
      type: "investProduct",
      productId: product.id,
      mode: "improve",
    }),
    invested,
  );
  assert.deepEqual(
    game.act(invested, { type: "sunsetProduct", productId: product.id }),
    invested,
  );
  const done = game.stepGame(invested, info.duration);
  assert.equal(done.agents[0].status, "idle");
  assert.equal(done.products[0].investment, null);
  assert.equal(done.shipped, 1);
  assert.equal(done.products.length, 1);
  assert.ok(done.products[0].history.length > product.history.length);
  assert.equal(
    game.getProductActionInfo(done, done.products[0], "improve").enabled,
    false,
  );
});

test("revivals are uncertain and retired products cannot be used as an income exploit", () => {
  let revived = 0,
    failed = 0;
  for (let seed = 1; seed <= 60; seed++) {
    let state = game.act(review(seed), {
      type: "ship",
      id: review(seed).agents[0].id,
    });
    assert.ok(state.products?.length);
    const product = state.products[0];
    Object.assign(product, {
      status: "dead",
      dailyRevenue: 0,
      health: 0,
      quality: 55,
      potential: 55,
      ceiling: 70,
    });
    state = game.act(state, {
      type: "investProduct",
      productId: product.id,
      mode: "revive",
    });
    state = game.stepGame(state, 40);
    if (state.products[0].status === "dead") failed++;
    else revived++;
    const sunset = game.act(state, {
      type: "sunsetProduct",
      productId: product.id,
    });
    assert.equal(sunset.products[0].status, "sunset");
    assert.equal(sunset.products[0].dailyRevenue, 0);
    assert.deepEqual(
      game.act(sunset, {
        type: "investProduct",
        productId: product.id,
        mode: "revive",
      }),
      sunset,
    );
  }
  assert.ok(
    revived > 0 && failed > 0,
    `${revived} recoveries, ${failed} failed revivals`,
  );
});

test("a doomed idea cannot be polished past its ceiling and repetition diminishes returns", () => {
  let state = review(91);
  state.cash = 100000;
  Object.assign(state.agents[0].idea, {
    quality: 20,
    potential: 20,
    ceiling: 30,
  });
  for (let index = 0; index < 12; index++) {
    state.attention = 100;
    state.agents[0].status = "review";
    state = game.act(state, {
      type: "iterate",
      id: state.agents[0].id,
      mode: index % 2 ? "validate" : "polish",
    });
    assert.ok(state.agents[0].idea.quality <= 30);
    assert.ok(state.agents[0].idea.potential <= 30);
  }
  const lowIteration = review(51);
  const highIteration = structuredClone(lowIteration);
  highIteration.agents[0].idea.iteration = 12;
  const lowGain =
    game.act(lowIteration, {
      type: "iterate",
      id: lowIteration.agents[0].id,
      mode: "polish",
    }).agents[0].idea.quality - lowIteration.agents[0].idea.quality;
  const highGain =
    game.act(highIteration, {
      type: "iterate",
      id: highIteration.agents[0].id,
      mode: "polish",
    }).agents[0].idea.quality - highIteration.agents[0].idea.quality;
  assert.ok(highGain < lowGain);
});

test("some iterations regress and a pivot can uncover a worse opportunity", () => {
  let regressions = 0,
    failedPivots = 0;
  for (let seed = 1; seed <= 80; seed++) {
    const state = review(seed);
    const before = state.agents[0].idea;
    const polished = game.act(state, {
      type: "iterate",
      id: state.agents[0].id,
      mode: "polish",
    });
    if (polished.agents[0].idea.quality < before.quality) regressions++;
    const pivoted = game.act(state, {
      type: "iterate",
      id: state.agents[0].id,
      mode: "pivot",
    });
    if (pivoted.agents[0].idea.potential < before.potential) failedPivots++;
  }
  assert.ok(regressions > 0 && regressions < 45);
  assert.ok(failedPivots > 0);
});
