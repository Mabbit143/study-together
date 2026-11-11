import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("demo room has no serious accessibility violations at narrow width and 200 percent zoom", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/?room=old-english-demo");
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  await expect(page.getByRole("heading", { name: "Working board" })).toBeVisible();
  await page.getByRole("button", { name: "Peer settings" }).first().focus();
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
  await expect(page.getByLabel("Your question")).toHaveValue("Typed input is a complete fallback.");
});
