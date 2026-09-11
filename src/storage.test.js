import test from "node:test";
import assert from "node:assert/strict";

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
