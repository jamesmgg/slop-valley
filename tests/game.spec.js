import { test, expect } from "@playwright/test";
import { createGame } from "../src/game.js";

const readState = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("slop-valley-save-v1")));

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  const game = createGame("browser-smoke");
  await page.addInitScript((seed) => {
    if (!localStorage.getItem("slop-valley-save-v1"))
      localStorage.setItem("slop-valley-save-v1", JSON.stringify(seed));
  }, game);
});

test("a complete career loop: iterate, custom feedback, launch, hire, upgrade, reload and reset", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Meeting Mortality Calculator" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Fix the actual product/ }).click();
  await expect(
    page.getByText("incorporating your very specific feedback", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Touch grass/ }).click();
  await page
    .getByRole("textbox", { name: "Custom agent feedback" })
    .fill("Fix bugs and simplify for real users");
  await page
    .getByRole("button", { name: "Send custom feedback", exact: true })
    .click();
  await expect(page.getByRole("button", { name: /Rest in/ })).toBeDisabled();
  await page
    .getByRole("button", { name: "Resume simulation", exact: true })
    .click();
  await page.clock.runFor(20000);
  await page
    .getByRole("button", { name: "Pause simulation", exact: true })
    .click();
  await expect(
    page.getByText("Your feedback: Fix bugs and simplify for real users"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ship it to X" }).click();
  await expect(
    page.getByRole("dialog", { name: "Time to build in public." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Post to the simulated timeline" })
    .click();
  await expect(
    page.getByRole("heading", { name: /needs a purpose/ }),
  ).toBeVisible();
  expect((await readState(page)).shipped).toBe(1);
  await page.getByRole("button", { name: /One more agent/ }).click();
  expect((await readState(page)).agents).toHaveLength(4);
  await page.getByRole("button", { name: /Browse upgrades/ }).click();
  await page
    .locator(".upgrade-row")
    .filter({ hasText: "A second brain cell" })
    .getByRole("button")
    .click();
  expect((await readState(page)).upgrades.context).toBe(1);
  await page.getByRole("button", { name: "Close dialog" }).click();
  const before = await readState(page);
  await page.reload();
  const after = await readState(page);
  expect(after.cash).toBe(before.cash);
  expect(after.agents.length).toBe(4);
  expect(after.paused).toBe(true);
  await page.getByRole("button", { name: /Launch history/ }).click();
  await expect(
    page.getByRole("heading", { name: "The public record" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /New career/ }).click();
  await page.getByRole("button", { name: "Keep the dream alive" }).click();
  expect((await readState(page)).agents).toHaveLength(4);
  await page.getByRole("button", { name: /New career/ }).click();
  await page.getByRole("button", { name: "Start fresh" }).click();
  expect((await readState(page)).agents).toHaveLength(3);
  expect((await readState(page)).shipped).toBe(0);
  expect(errors).toEqual([]);
});

test("simulation speed advances by the selected multiplier and pauses for dialogs", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "3×", exact: true }).click();
  await page
    .getByRole("button", { name: "Resume simulation", exact: true })
    .click();
  await page.clock.runFor(3000);
  expect((await readState(page)).elapsed).toBe(9);
  await page.getByRole("button", { name: /Browse upgrades/ }).click();
  const before = (await readState(page)).elapsed;
  await page.clock.runFor(5000);
  expect((await readState(page)).elapsed).toBe(before);
});

test("desktop and mobile layouts expose the game without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Dismiss introduction" }).click();
  await page.screenshot({ path: "artifacts/desktop.png", fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(
      page.getByRole("button", { name: "Ship it to X" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Ship it to X" }).click();
  await page.getByRole("button", { name: /The unhinged founder arc/ }).click();
  await expect(
    page.getByRole("button", { name: "Post to the simulated timeline" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("events resolve once and malformed local saves recover without a blank screen", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Resume simulation", exact: true })
    .click();
  await page.clock.runFor(120000);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator(".event-options button").first().click();
  await expect(dialog).not.toBeVisible();
  expect((await readState(page)).event).toBeNull();
  await page.evaluate(() =>
    localStorage.setItem("slop-valley-save-v1", "{broken"),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Meeting Mortality Calculator" }),
  ).toBeVisible();
});

test("blocked storage does not prevent playing", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Blocked", "SecurityError");
    };
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Meeting Mortality Calculator" }),
  ).toBeVisible();
  await expect(
    page.getByText("Autosave unavailable in this browser"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ship it to X" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(errors).toEqual([]);
});
