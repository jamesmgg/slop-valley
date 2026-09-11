import { test, expect } from "@playwright/test";
import { createGame } from "../src/game.js";

const SAVE_KEY = "slop-valley-save-v1";
const readState = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
const selectedCard = (page) => page.locator('.agent-card[aria-pressed="true"]');

async function openGame(page, mutate = () => {}) {
  const game = createGame("mobile-ux");
  game.paused = true;
  game.agents[2].status = "review";
  game.agents[2].progress = 100;
  mutate(game);
  await page.addInitScript(
    ({ game, key }) => {
      localStorage.setItem(key, JSON.stringify(game));
      localStorage.setItem("slop-valley-tip", "1");
    },
    { game, key: SAVE_KEY },
  );
  await page.goto("/");
  return game;
}

function readyButton(page) {
  return page.getByRole("button", { name: "Next ready agent", exact: true });
}

test.use({ reducedMotion: "reduce" });

test("next ready skips running agents and wraps the review queue", async ({
  page,
}) => {
  const game = await openGame(page);
  await expect(selectedCard(page)).toHaveAttribute(
    "data-agent-id",
    game.agents[0].id,
  );
  await readyButton(page).click();
  expect((await readState(page)).selectedAgentId).toBe(game.agents[2].id);
  await expect(selectedCard(page)).toHaveAttribute(
    "data-agent-id",
    game.agents[2].id,
  );
  await readyButton(page).click();
  expect((await readState(page)).selectedAgentId).toBe(game.agents[0].id);
});

test("feedback drafts stay with their agent when switching tasks", async ({
  page,
}) => {
  await openGame(page);
  const feedback = page.getByRole("textbox", { name: "Custom agent feedback" });
  await feedback.fill(
    "Keep the meeting calculator simple and test its numbers.",
  );
  await readyButton(page).click();
  await expect(feedback).toHaveValue("");
  await feedback.fill("Validate the second idea with a real customer.");
  await readyButton(page).click();
  await expect(feedback).toHaveValue(
    "Keep the meeting calculator simple and test its numbers.",
  );
  await readyButton(page).click();
  await expect(feedback).toHaveValue(
    "Validate the second idea with a real customer.",
  );
});

test("automatic task switching is optional and selects the next review after feedback", async ({
  page,
}) => {
  const game = await openGame(page);
  const autoSwitch = page.getByRole("checkbox", {
    name: "Auto-switch after feedback",
    exact: true,
  });
  await expect(autoSwitch).not.toBeChecked();
  await autoSwitch.check();
  await page.getByRole("button", { name: /Fix the actual product/ }).click();
  const state = await readState(page);
  expect(state.agents[0].status).toBe("working");
  expect(state.selectedAgentId).toBe(game.agents[2].id);
  await expect(selectedCard(page)).toHaveAttribute(
    "data-agent-id",
    game.agents[2].id,
  );
  await expect(readyButton(page)).toBeDisabled();
});

test("an empty review queue cannot select a working agent", async ({
  page,
}) => {
  const game = await openGame(page, (state) => {
    state.agents.forEach((agent) => {
      agent.status = "working";
      agent.progress = 30;
    });
  });
  await expect(readyButton(page)).toBeDisabled();
  expect((await readState(page)).selectedAgentId).toBe(game.agents[0].id);
});

test("unaffordable feedback explains the blocked action visibly and accessibly", async ({
  page,
}) => {
  await openGame(page, (game) => {
    game.cash = 0;
    game.attention = 0;
  });
  const polish = page.getByRole("button", { name: /Fix the actual product/ });
  await expect(polish).toBeDisabled();
  await expect(polish.locator(".action-blocked")).toBeVisible();
  await expect(polish.locator(".action-blocked")).toContainText(
    /need|short|attention|runway|cash/i,
  );
  const explanation = await polish.getAttribute("aria-describedby");
  expect(explanation).toBeTruthy();
  await expect(page.locator(`[id="${explanation}"]`)).toBeVisible();
});

test("agent detail notes collapse without hiding custom feedback", async ({
  page,
}) => {
  await openGame(page);
  const notes = page.locator("details").filter({
    has: page.getByText("Agent notes & market read", { exact: true }),
  });
  await expect(notes).toBeVisible();
  await expect(notes).not.toHaveAttribute("open", "");
  await expect(
    page.getByRole("textbox", { name: "Custom agent feedback" }),
  ).toBeVisible();
  await notes.locator("summary").click();
  await expect(notes).toHaveAttribute("open", "");
  await expect(notes).toContainText("zodiac sign");
});

test("mobile navigation reaches the timeline, upgrades and secondary controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openGame(page);
  const nav = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(nav).toBeVisible();
  await nav.getByRole("button", { name: "Timeline", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The public record" }),
  ).toBeVisible();
  await nav.getByRole("button", { name: "Workbench", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Meeting Mortality Calculator" }),
  ).toBeVisible();
  await nav.getByRole("button", { name: "Upgrades", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Spend money to make money.*" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await nav.getByRole("button", { name: "More", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: /New career/ })).toBeVisible();
});

for (const width of [320, 390, 430]) {
  test(`dark mobile workbench fits ${width}px with reachable actions and agent selection`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const game = await openGame(page);
    const background = await page.evaluate(() => {
      const body = getComputedStyle(document.body).backgroundColor;
      return body === "rgba(0, 0, 0, 0)" || body === "transparent"
        ? getComputedStyle(document.documentElement).backgroundColor
        : body;
    });
    const channels = background.match(/\d+/g)?.slice(0, 3).map(Number);
    expect(channels?.reduce((sum, value) => sum + value, 0)).toBeLessThan(240);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const dock = page.locator(".mobile-action-dock");
    const pause = page.getByRole("button", {
      name: "Resume simulation",
      exact: true,
    });
    await expect(pause).toBeInViewport();
    const ship = dock.getByRole("button", {
      name: "Ship it to X",
      exact: true,
    });
    await expect(ship).toBeInViewport();
    const nav = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(nav).toBeInViewport();
    const dockBounds = await dock.boundingBox();
    const navBounds = await nav.boundingBox();
    expect(dockBounds.y + dockBounds.height).toBeLessThanOrEqual(
      navBounds.y + 1,
    );
    for (const button of [pause, ship, ...(await nav.getByRole("button").all())]) {
      const box = await button.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
    const input = page.getByRole("textbox", { name: "Custom agent feedback" });
    expect(
      await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    await readyButton(page).click();
    await expect(selectedCard(page)).toHaveAttribute(
      "data-agent-id",
      game.agents[2].id,
    );
    await expect(selectedCard(page)).toBeInViewport();
    const cardBounds = await selectedCard(page).boundingBox();
    expect(cardBounds.x).toBeGreaterThanOrEqual(0);
    expect(cardBounds.x + cardBounds.width).toBeLessThanOrEqual(width + 1);
    await page.screenshot({
      path: `artifacts/mobile-dark-${width}.png`,
      fullPage: true,
    });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(ship).toBeInViewport();
    await expect(nav).toBeInViewport();
  });
}

test("a mobile launch dialog stays within the screen and returns keyboard focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await openGame(page);
  const trigger = page
    .locator(".mobile-action-dock")
    .getByRole("button", { name: "Ship it to X", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Time to build in public." });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(321);
  expect(box.y + box.height).toBeLessThanOrEqual(641);
  await page.keyboard.press("Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Shift+Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  const post = dialog.getByRole("button", {
    name: "Post to the simulated timeline",
  });
  await post.scrollIntoViewIfNeeded();
  await expect(post).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
