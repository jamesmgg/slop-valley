import { test, expect } from "@playwright/test";
import { createGame, act } from "../src/game.js";

const SAVE_KEY = "slop-valley-save-v1";
const generated = {
  title: "Tab Amnesty Office",
  description:
    "A useful button closes your abandoned tabs and files a tiny farewell for each.",
  log: "The feature works. I am requesting a promotion to middleware.",
};
const readState = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);

async function installBrowserAI(
  page,
  { available = true, mode = "valid" } = {},
) {
  const origin = new URL(test.info().project.use.baseURL);
  test.skip(
    available && origin.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname),
    "Local Gemini requires a secure context. Run these model-stub tests on localhost or HTTPS; HTTP still tests the real fallback.",
  );
  await page.addInitScript(
    ({ available, mode, generated }) => {
      window.__localAITest = {
        creates: 0,
        prompts: 0,
        destroys: 0,
        inputs: [],
        resolve: null,
      };
      if (!available) {
        Object.defineProperty(window, "LanguageModel", {
          configurable: true,
          value: undefined,
        });
        return;
      }
      Object.defineProperty(window, "LanguageModel", {
        configurable: true,
        value: {
          availability: async () => "available",
          create: async () => {
            window.__localAITest.creates += 1;
            return {
              prompt: async (input, options) => {
                window.__localAITest.prompts += 1;
                window.__localAITest.inputs.push(input);
                if (mode === "pending") {
                  return new Promise((resolve) => {
                    window.__localAITest.resolve = resolve;
                  });
                }
                if (mode === "malformed")
                  return JSON.stringify({ ...generated, quality: 999 });
                if (options.responseConstraint.properties.comments) {
                  return JSON.stringify({
                    comments: [
                      "The button works. Terrible news for my cynicism.",
                      "Where is the twelve-part launch thread?",
                    ],
                  });
                }
                return JSON.stringify(generated);
              },
              destroy: () => {
                window.__localAITest.destroys += 1;
              },
            };
          },
        },
      });
    },
    { available, mode, generated },
  );
}

async function openCreativity(page) {
  await page
    .getByRole("button", { name: "Sound & creativity", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "A local imagination, optionally.",
      exact: true,
    }),
  ).toBeVisible();
}

async function enableAI(page) {
  await openCreativity(page);
  const enable = page.getByRole("button", {
    name: "Enable local Gemini",
    exact: true,
  });
  await expect(enable).toBeEnabled();
  await enable.click();
  await expect
    .poll(() => page.evaluate(() => window.__localAITest.creates))
    .toBe(1);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
}

async function sendFeedback(page) {
  await page
    .getByRole("textbox", { name: "Custom agent feedback", exact: true })
    .fill("Simplify the button and test the practical feature");
  await page
    .getByRole("button", { name: "Send custom feedback", exact: true })
    .click();
}

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(
    ({ seed, key }) => {
      localStorage.setItem(key, JSON.stringify(seed));
      localStorage.setItem("slop-valley-tip", "1");
      localStorage.setItem("slop-valley-auto-switch", "0");
    },
    { seed: createGame("ai-ui-tests"), key: SAVE_KEY },
  );
});

test("unsupported local AI explains the fallback and leaves canned gameplay usable", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await installBrowserAI(page, { available: false });
  await page.goto("/");
  await openCreativity(page);
  await expect(
    page.getByRole("dialog").getByText(/supported desktop Chrome/),
  ).toBeVisible();
  await expect(
    page
      .getByRole("dialog")
      .getByText(/built-in satire/i)
      .first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await sendFeedback(page);
  await expect(
    page.getByRole("heading", {
      name: "Meeting Mortality Calculator",
      exact: true,
    }),
  ).toBeVisible();
  const state = await readState(page);
  expect(state.agents[0].idea.lastInstruction).toContain("Simplify the button");
  expect(state.agents[0].status).toBe("working");
  expect(await page.evaluate(() => window.__localAITest.creates)).toBe(0);
  expect(errors).toEqual([]);
});

test("opening creativity never creates a model; explicit Enable enriches only narrative", async ({
  page,
}) => {
  await installBrowserAI(page);
  await page.goto("/");
  await openCreativity(page);
  await expect(
    page.getByRole("button", { name: "Enable local Gemini", exact: true }),
  ).toBeEnabled();
  expect(await page.evaluate(() => window.__localAITest.creates)).toBe(0);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await enableAI(page);
  const before = await readState(page);
  const instruction = "Simplify the button and test the practical feature";
  const expected = act(before, {
    type: "iterate",
    id: before.agents[0].id,
    mode: "custom",
    instruction,
  });
  await sendFeedback(page);
  await expect(
    page.getByRole("heading", { name: generated.title, exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () => (await readState(page)).agents[0].idea.narrativeSource)
    .toBe("gemini");
  const state = await readState(page);
  expect(state.cash).toBe(expected.cash);
  expect(state.attention).toBe(expected.attention);
  expect(state.followers).toBe(expected.followers);
  for (const field of [
    "quality",
    "novelty",
    "hype",
    "potential",
    "iteration",
  ]) {
    expect(state.agents[0].idea[field]).toBe(expected.agents[0].idea[field]);
  }
  expect(state.agents[0].idea.description).toBe(generated.description);
  expect(
    await page.evaluate(() =>
      window.__localAITest.inputs.some((value) =>
        value.includes("Simplify the button"),
      ),
    ),
  ).toBe(true);
});

test("malformed local model output cannot replace the canned idea or alter its scores", async ({
  page,
}) => {
  await installBrowserAI(page, { mode: "malformed" });
  await page.goto("/");
  await enableAI(page);
  const before = await readState(page);
  await sendFeedback(page);
  await expect
    .poll(() => page.evaluate(() => window.__localAITest.prompts))
    .toBe(1);
  const state = await readState(page);
  expect(state.agents[0].idea.title).toBe(before.agents[0].idea.title);
  expect(state.agents[0].idea.narrativeSource).not.toBe("gemini");
  expect(state.agents[0].idea.quality).toBeLessThanOrEqual(100);
  await expect(
    page.getByRole("heading", { name: generated.title, exact: true }),
  ).toHaveCount(0);
});

test("a generation that finishes after career reset cannot contaminate the new career", async ({
  page,
}) => {
  await installBrowserAI(page, { mode: "pending" });
  await page.goto("/");
  await enableAI(page);
  await sendFeedback(page);
  await expect
    .poll(() => page.evaluate(() => window.__localAITest.prompts))
    .toBe(1);
  await page.getByRole("button", { name: "New career", exact: true }).click();
  await page.getByRole("button", { name: "Start fresh", exact: true }).click();
  const reset = await readState(page);
  await page.evaluate(
    (value) => window.__localAITest.resolve(JSON.stringify(value)),
    generated,
  );
  await page.clock.runFor(100);
  await expect(
    page.getByRole("heading", {
      name: "Meeting Mortality Calculator",
      exact: true,
    }),
  ).toBeVisible();
  expect((await readState(page)).agents[0].idea.title).toBe(
    reset.agents[0].idea.title,
  );
  expect((await readState(page)).cash).toBe(reset.cash);
  expect((await readState(page)).agents[0].idea.narrativeSource).not.toBe(
    "gemini",
  );
  expect(
    await page.evaluate(() => window.__localAITest.destroys),
  ).toBeGreaterThan(0);
});

test("local launch replies attach to the newest product and preserve the simulated result", async ({
  page,
}) => {
  await installBrowserAI(page);
  await page.goto("/");
  // Keep an older product in the portfolio, so this catches reversed list order.
  await page.getByRole("button", { name: "Ship it to X", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Post to the simulated timeline",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: /Touch grass/ }).click();
  await page.getByRole("button", { name: /GPT Intern/ }).click();
  await enableAI(page);
  const before = await readState(page);
  const expected = act(before, {
    type: "ship",
    id: before.selectedAgentId,
    tone: "honest",
  });
  const olderProduct = before.products[0];
  await page.getByRole("button", { name: "Ship it to X", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Post to the simulated timeline",
      exact: true,
    })
    .click();
  await expect
    .poll(async () => (await readState(page)).products[0].comments[0].handle)
    .toBe("@local_reply_1");
  const state = await readState(page);
  const product = state.products[0];
  expect(product.comments.slice(0, 2).map((comment) => comment.text)).toEqual([
    "The button works. Terrible news for my cynicism.",
    "Where is the twelve-part launch thread?",
  ]);
  expect(
    state.products.find((item) => item.id === olderProduct.id).comments,
  ).toEqual(olderProduct.comments);
  expect(
    state.feed.find((post) => post.id === product.launchPostId).comments,
  ).toEqual(product.comments);
  expect(product.outcome).toBe(expected.products[0].outcome);
  expect(state.cash).toBe(expected.cash);
  expect(state.followers).toBe(expected.followers);
  expect(state.attention).toBe(expected.attention);
});
