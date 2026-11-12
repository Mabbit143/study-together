import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("demo room has no serious accessibility violations at narrow width and 200 percent zoom", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/?room=old-english-demo");
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await expect(page.getByRole("heading", { name: "Working board" })).toBeVisible();
  const overflowing = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("body *")]
    .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1)
    .map((element) => `${element.tagName}.${element.className}:${element.textContent?.trim().slice(0, 60)}`));
  expect(overflowing).toEqual([]);
  const firstSettings = page.getByRole("button", { name: "Peer settings" }).first();
  await firstSettings.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(firstSettings).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Peer settings" }).first()).toBeFocused();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);
});

test("denied microphone leaves typed input available and never starts automatically", async ({ page, context }) => {
  await context.clearPermissions();
  await page.goto("/?room=old-english-demo");
  await expect(page.getByRole("button", { name: /Start recording/i })).toBeVisible();
  await expect(page.getByText(/Recording…/i)).toHaveCount(0);
  await page.getByLabel("Your question").fill("Typed input is a complete fallback.");
  await page.getByRole("button", { name: /Start recording/i }).click();
  await expect(page.getByText(/Microphone permission was denied|Recording could not start|not supported/i).first()).toBeVisible();
  await expect(page.getByLabel("Your question")).toHaveValue("Typed input is a complete fallback.");
});

test("keyboard-only learner changes and replaces a peer, clears the board, and completes a study action", async ({ page }) => {
  await page.goto("/?room=old-english-demo");
  const firstSettings = page.getByRole("button", { name: "Peer settings" }).first();
  await firstSettings.focus(); await page.keyboard.press("Enter");
  const voice = page.getByRole("combobox", { name: "Voice" });
  await voice.focus(); await page.keyboard.press("ArrowDown");
  const personality = page.getByRole("combobox", { name: "Personality" });
  await personality.focus(); await page.keyboard.press("ArrowDown");
  const approach = page.getByRole("combobox", { name: "Study approach" });
  await approach.focus(); await page.keyboard.press("ArrowDown");
  const replace = page.getByRole("button", { name: "Replace peer" });
  await replace.focus(); await page.keyboard.press("Enter");
  const close = page.getByRole("button", { name: "Close settings" });
  await close.focus(); await page.keyboard.press("Enter");
  await expect(firstSettings).toBeFocused();
  await expect(page.getByText("Jules (new)", { exact: true }).first()).toBeVisible();

  const clear = page.getByRole("button", { name: "Clear board" });
  await clear.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Confirm clear board" })).toBeFocused(); await page.keyboard.press("Enter");
  await expect(page.getByText(/Board cleared/)).toBeVisible();
  await expect(clear).toBeFocused();

  const demo = page.getByRole("button", { name: "Use reliable demo" });
  await demo.focus(); await page.keyboard.press("Enter");
  await expect(page.getByText(/Demo response shown/i)).toBeVisible();
  await expect(demo).toBeFocused();

  const offline = page.getByRole("button", { name: "Simulate going offline" });
  await offline.focus(); await page.keyboard.press("Enter");
  await expect(page.locator(".offline-label")).toContainText("Offline without a prepared pack");
  const search = page.getByLabel("Search confirmed excerpt");
  await search.focus(); await page.keyboard.type("cwēn");
  const highlight = page.getByRole("button", { name: /Highlight on whiteboard:.*cwēn/i });
  await highlight.focus(); await page.keyboard.press("Enter");
  await expect(page.getByLabel("Grounded source highlights").getByText(/cwēn/)).toBeVisible();
});
