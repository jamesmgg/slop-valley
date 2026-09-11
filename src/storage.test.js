import test from "node:test";
import assert from "node:assert/strict";
import { createGame, act } from "./game.js";

const storageModule = await import("./storage.js").catch(() => ({}));
test("a malformed local save safely starts a new game", () => {
  assert.equal(typeof storageModule.readSave, "function");
  const fallback = () => ({ fresh: true });
  assert.deepEqual(
    storageModule.readSave({ getItem: () => "{broken" }, fallback),
    { fresh: true },
  );
  assert.deepEqual(
    storageModule.readSave(
      { getItem: () => '{"version":1,"agents":[null]}' },
      fallback,
    ),
    { fresh: true },
  );
});
test("storage restrictions do not stop the game", () => {
  assert.equal(typeof storageModule.writeSave, "function");
  assert.equal(
    storageModule.writeSave(
      {
        setItem: () => {
          throw new Error("disabled");
        },
      },
      {},
    ),
    false,
  );
});
test("an inaccessible introduction flag still lets the game open", () => {
  assert.equal(typeof storageModule.readFlag, "function");
  assert.equal(
    storageModule.readFlag(
      {
        getItem: () => {
          throw new Error("disabled");
        },
      },
      "intro",
    ),
    false,
  );
});

test("version one saves migrate without losing resources and recover recent launches", () => {
  const old = createGame(81);
  old.version = 1;
  delete old.products;
  old.cash = 972;
  old.shipped = 1;
  delete old.agents[0].idea.ceiling;
  old.agents[0].status = "idle";
  old.feed.unshift({
    id: "post-old",
    handle: "@you",
    kind: "success",
    text: "Made a thing: Meeting Mortality Calculator. It solves one small problem. Feedback welcome.",
    time: 4,
    followersDelta: 130,
    cashDelta: 45,
  });
  const loaded = storageModule.readSave(
    { getItem: () => JSON.stringify(old) },
    () => createGame(1),
  );
  assert.equal(loaded.version, 2);
  assert.equal(loaded.cash, 972);
  assert.equal(loaded.shipped, 1);
  assert.equal(loaded.paused, true);
  assert.equal(loaded.products.length, 1);
  assert.equal(loaded.products[0].title, old.agents[0].idea.title);
  assert.equal(loaded.products[0].totalRevenue, 0);
  assert.equal(loaded.feed[0].productId, loaded.products[0].id);
  assert.ok(loaded.feed[0].comments.length >= 3);
  assert.ok(Number.isFinite(loaded.agents[0].idea.ceiling));
});

test("version two saves keep live product jobs and reject corrupt portfolio data", () => {
  let state = createGame(7);
  state = act(state, { type: "ship", id: state.agents[0].id });
  assert.ok(state.products?.length);
  Object.assign(state.products[0], { status: "steady", dailyRevenue: 20 });
  state = act(state, {
    type: "investProduct",
    productId: state.products[0].id,
    mode: "improve",
  });
  const loaded = storageModule.readSave(
    { getItem: () => JSON.stringify(state) },
    () => createGame(1),
  );
  assert.deepEqual(loaded.products, state.products);
  assert.deepEqual(loaded.agents[0].projectTask, state.agents[0].projectTask);
  const invalid = {
    ...state,
    products: [{ ...state.products[0], dailyRevenue: "infinite money" }],
  };
  const reset = storageModule.readSave(
    { getItem: () => JSON.stringify(invalid) },
    () => createGame(1),
  );
  assert.equal(reset.products.length, 0);
});
