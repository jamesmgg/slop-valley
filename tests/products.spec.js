import { test, expect } from "@playwright/test";
import { createGame } from "../src/game.js";

test.beforeEach(async ({ page }) => {
  await page.clock.install();
  const seed = createGame("portfolio-ui");
  seed.cash = 3000;
  await page.addInitScript((game) => {
    if (!localStorage.getItem("slop-valley-save-v1"))
      localStorage.setItem("slop-valley-save-v1", JSON.stringify(game));
    localStorage.setItem("slop-valley-tip", "1");
  }, seed);
});

test("a launched product stays playable, has a discussion and can receive agent investment", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ship it to X", exact: true }).click();
  await page
    .getByRole("button", { name: "Post to the simulated timeline" })
    .click();
  await page.getByRole("button", { name: "Products", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your tiny empires." }),
  ).toBeVisible();
  const product = page
    .locator(".product-card")
    .filter({ hasText: "Meeting Mortality Calculator" });
  await expect(product).toBeVisible();
  await product.getByRole("button", { name: /View launch discussion/ }).click();
  const thread = page.getByRole("dialog", { name: "The replies are in." });
  await expect(thread.locator(".comment-item")).toHaveCount(5);
  await expect(thread).toContainText("Meeting Mortality Calculator");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await product.getByRole("button", { name: /Improve product/ }).click();
  await expect(product).toContainText("Agent at work");
  await page
    .getByRole("button", { name: "Resume simulation", exact: true })
    .click();
  await page.clock.runFor(40000);
  await expect(product).not.toContainText("Agent at work");
  await page.reload();
  await page.getByRole("button", { name: "Products", exact: true }).click();
  await expect(product).toBeVisible();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("slop-valley-save-v1")),
  );
  expect(state.shipped).toBe(1);
  expect(state.products).toHaveLength(1);
});

test("mobile agent switcher prioritizes product titles and portfolio fits a narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/");
  await expect(
    page.locator(".agent-card.selected .agent-project-title"),
  ).toHaveText("Meeting Mortality Calculator");
  await expect(
    page.locator(".agent-card.selected .agent-project-title"),
  ).toBeInViewport();
  await page.getByRole("button", { name: "Ship it to X", exact: true }).click();
  await page
    .getByRole("button", { name: "Post to the simulated timeline" })
    .click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "Products", exact: true })
    .click();
  await expect(page.locator(".product-card")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .locator(".product-card")
    .getByRole("button", { name: /View launch discussion/ })
    .click();
  const dialog = page.getByRole("dialog");
  const bounds = await dialog.boundingBox();
  expect(bounds.width).toBeLessThanOrEqual(320);
  expect(bounds.height).toBeLessThanOrEqual(740);
});

test("launch posts open their relevant comments from the timeline", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Ship it to X", exact: true }).click();
  await page
    .getByRole("button", { name: "Post to the simulated timeline" })
    .click();
  await page.getByRole("button", { name: /Launch history/ }).click();
  await page
    .getByRole("button", { name: /Read .* comments/ })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "The replies are in." }),
  ).toBeVisible();
});
