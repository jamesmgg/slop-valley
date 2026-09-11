import test from "node:test";
import assert from "node:assert/strict";
import { createLocalAI } from "./local-ai.js";

const validIdea = {
  title: "Tab Amnesty",
  description:
    "Closes abandoned research tabs and writes each one a tiny farewell.",
  log: "I found the memory leak. It was your ambition.",
};

function fixture({
  availability = "available",
  response = JSON.stringify(validIdea),
  create,
  prompt,
} = {}) {
  const calls = { availability: [], create: [], prompt: [], destroyed: 0 };
  const session = {
    prompt: async (...args) => {
      calls.prompt.push(args);
      return prompt ? prompt(...args) : response;
    },
    destroy: () => {
      calls.destroyed += 1;
    },
  };
  const scope = {
    isSecureContext: true,
    navigator: { userActivation: { isActive: true } },
    LanguageModel: {
      availability: async (options) => {
        calls.availability.push(options);
        if (availability instanceof Error) throw availability;
        return availability;
      },
      create: async (options) => {
        calls.create.push(options);
        return create ? create(options, session) : session;
      },
    },
  };
  const ai = createLocalAI({ scope, timeoutMs: 20, enableTimeoutMs: 30 });
  assert.ok(ai, "createLocalAI provides the local browser adapter");
  return { ai, scope, calls, session };
}

test("availability detection never creates or downloads a model", async () => {
  for (const value of [
    "available",
    "downloadable",
    "downloading",
    "unavailable",
  ]) {
    const { ai, calls } = fixture({ availability: value });
    const status = await ai.getStatus();
    assert.equal(status.availability, value);
    assert.equal(status.enabled, false);
    assert.equal(calls.create.length, 0);
    assert.deepEqual(calls.availability[0].expectedInputs, [
      { type: "text", languages: ["en"] },
    ]);
    assert.deepEqual(calls.availability[0].expectedOutputs, [
      { type: "text", languages: ["en"] },
    ]);
    assert.equal(await ai.generateIdea({ theme: "tools" }), null);
  }
});

test("insecure Tailscale HTTP does not access the browser model", async () => {
  const { ai, scope, calls } = fixture();
  scope.isSecureContext = false;
  const status = await ai.getStatus();
  assert.equal(status.availability, "unavailable");
  assert.match(status.reason, /localhost.*HTTPS|HTTPS.*localhost/);
  assert.equal((await ai.enable()).enabled, false);
  assert.equal(calls.availability.length, 0);
  assert.equal(calls.create.length, 0);
});

test("unsupported browsers and availability errors use canned content", async () => {
  const { ai, scope } = fixture();
  delete scope.LanguageModel;
  assert.match((await ai.getStatus()).reason, /desktop Chrome/);
  assert.equal((await ai.enable()).enabled, false);
  const failed = fixture({ availability: new Error("blocked") });
  assert.equal((await failed.ai.getStatus()).availability, "unavailable");
  assert.equal((await failed.ai.enable()).enabled, false);
  assert.equal(failed.calls.create.length, 0);
});

test("enable requires user activation and is the only path that can download", async () => {
  const { ai, scope, calls } = fixture({ availability: "downloadable" });
  await ai.getStatus();
  scope.navigator.userActivation.isActive = false;
  assert.equal((await ai.enable()).enabled, false);
  assert.equal(calls.create.length, 0);
  scope.navigator.userActivation.isActive = true;
  assert.equal((await ai.enable()).enabled, true);
  assert.equal(calls.create.length, 1);
  assert.deepEqual(
    calls.create[0].expectedInputs,
    calls.availability[0].expectedInputs,
  );
  ai.disable();
});

test("valid narrative output contains only the three bounded text fields", async () => {
  const { ai, calls } = fixture();
  await ai.enable();
  const result = await ai.generateIdea({
    theme: "tools",
    instruction: "make it practical",
    existingIdea: { title: "Old title", quality: 99 },
  });
  assert.deepEqual(result, validIdea);
  assert.equal(calls.prompt.length, 1);
  const [prompt, options] = calls.prompt[0];
  assert.match(prompt, /make it practical/);
  assert.doesNotMatch(prompt, /"quality"/);
  assert.equal(options.responseConstraint.additionalProperties, false);
  assert.ok(options.signal instanceof AbortSignal);
  ai.disable();
});

test("malformed or excessive output is rejected rather than repaired or applied", async () => {
  const invalid = [
    "```json\n{}\n```",
    JSON.stringify({ ...validIdea, quality: 100 }),
    JSON.stringify({ ...validIdea, title: "a".repeat(81) }),
    JSON.stringify({ ...validIdea, description: "a".repeat(361) }),
    JSON.stringify({ ...validIdea, log: "a".repeat(241) }),
    JSON.stringify({ ...validIdea, title: "<script>alert(1)</script>" }),
    JSON.stringify({ ...validIdea, title: "   " }),
    JSON.stringify({ ...validIdea, log: null }),
    JSON.stringify({ ...validIdea, log: "Click [here](https://example.com)" }),
    JSON.stringify({ ...validIdea, title: "bad\u0000text" }),
    JSON.stringify({ ...validIdea, title: "bad\u202etext" }),
    "a".repeat(4097),
  ];
  for (const response of invalid) {
    const { ai } = fixture({ response });
    await ai.enable();
    assert.equal(await ai.generateIdea({}), null, response.slice(0, 65));
    ai.disable();
  }
});

test("comments are exactly two plain fictional reactions with no economy fields", async () => {
  const comments = [
    "The button works. Terrible news for my cynicism.",
    "Where is the twelve-part launch thread?",
  ];
  const { ai } = fixture({ response: JSON.stringify({ comments }) });
  await ai.enable();
  assert.deepEqual(
    await ai.generateComments({ idea: validIdea, outcome: "breakout" }),
    comments,
  );
  ai.disable();
  const bad = fixture({
    response: JSON.stringify({ comments, followersDelta: 1000 }),
  });
  await bad.ai.enable();
  assert.equal(await bad.ai.generateComments({}), null);
  bad.ai.disable();
});

test("a busy model skips concurrent work without queuing", async () => {
  let resolve;
  const { ai, calls } = fixture({
    prompt: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  await ai.enable();
  const first = ai.generateIdea({});
  await new Promise((done) => setTimeout(done, 0));
  assert.equal((await ai.getStatus()).busy, true);
  assert.equal(await ai.generateComments({}), null);
  assert.equal(calls.prompt.length, 1);
  resolve(JSON.stringify(validIdea));
  assert.deepEqual(await first, validIdea);
  assert.equal((await ai.getStatus()).busy, false);
  ai.disable();
});

test("inference timeout falls back and destroys the session", async () => {
  const { ai, calls } = fixture({ prompt: () => new Promise(() => {}) });
  await ai.enable();
  assert.equal(await ai.generateIdea({}), null);
  assert.equal((await ai.getStatus()).enabled, false);
  assert.equal((await ai.getStatus()).busy, false);
  assert.ok(calls.destroyed >= 1);
});

test("a rejected prompt uses canned content and releases model resources", async () => {
  const { ai, calls } = fixture({
    prompt: () => Promise.reject(new Error("out of memory")),
  });
  await ai.enable();
  assert.equal(await ai.generateIdea({}), null);
  assert.equal((await ai.getStatus()).enabled, false);
  assert.ok(calls.destroyed >= 1);
});

test("disable aborts pending inference and ignores its later output", async () => {
  let resolve;
  const { ai, calls } = fixture({
    prompt: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  await ai.enable();
  const pending = ai.generateIdea({});
  await new Promise((done) => setTimeout(done, 0));
  assert.equal(ai.disable().enabled, false);
  assert.equal(await pending, null);
  resolve(JSON.stringify(validIdea));
  assert.equal((await ai.getStatus()).enabled, false);
  assert.ok(calls.destroyed >= 1);
});

test("late model creation after a cancelled enable is destroyed", async () => {
  let resolve;
  const { ai, calls, session } = fixture({
    create: () =>
      new Promise((done) => {
        resolve = done;
      }),
  });
  await ai.getStatus();
  const pending = ai.enable();
  await new Promise((done) => setTimeout(done, 0));
  ai.disable();
  assert.equal((await pending).enabled, false);
  resolve(session);
  await new Promise((done) => setTimeout(done, 0));
  assert.ok(calls.destroyed >= 1);
  assert.equal((await ai.getStatus()).enabled, false);
});

test("creation errors and creation timeout leave the game in canned mode", async () => {
  for (const create of [
    () => Promise.reject(new Error("download denied")),
    () => new Promise(() => {}),
  ]) {
    const { ai } = fixture({ create });
    const status = await ai.enable();
    assert.equal(status.enabled, false);
    assert.equal(status.busy, false);
  }
});

test("overlapping Enable clicks only create one local model session", async () => {
  const { ai, scope, calls } = fixture();
  let resolveAvailability;
  const availability = new Promise((done) => {
    resolveAvailability = done;
  });
  scope.LanguageModel.availability = () => availability;
  const first = ai.enable();
  const second = ai.enable();
  resolveAvailability("available");
  await Promise.all([first, second]);
  assert.equal(calls.create.length, 1);
  assert.equal((await ai.getStatus()).enabled, true);
  ai.disable();
});

test("download progress is bounded and ignored after the user disables setup", async () => {
  const updates = [];
  let listener;
  let resolveCreate;
  const base = fixture({
    availability: "downloadable",
    create: (options) => {
      options.monitor({
        addEventListener: (_, callback) => {
          listener = callback;
        },
      });
      return new Promise((done) => {
        resolveCreate = done;
      });
    },
  });
  const ai = createLocalAI({
    scope: base.scope,
    timeoutMs: 20,
    enableTimeoutMs: 30,
    onStatus: (value) => updates.push(value),
  });
  await ai.getStatus();
  const pending = ai.enable();
  await new Promise((done) => setTimeout(done, 0));
  listener({ loaded: 0.4 });
  assert.equal(updates.at(-1).progress, 0.4);
  listener({ loaded: 2 });
  assert.equal(updates.at(-1).progress, 1);
  ai.disable();
  listener({ loaded: 0.9 });
  assert.equal(updates.at(-1).progress, null);
  resolveCreate(base.session);
  assert.equal((await pending).enabled, false);
});
