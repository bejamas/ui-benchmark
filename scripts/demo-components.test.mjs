import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import axe from "axe-core";
import { chromium } from "playwright-core";
import { benchmarkRoot, projects } from "./benchmark-config.mjs";
import { startStaticServer } from "./static-server.mjs";

// Exercise each framework's actual production output with fresh browser state.
// Explicitly opt into the deployed URLs after publishing the same builds.
test("demo components work with pointer, keyboard, and persisted cookie choices", async (t) => {
  const server = process.env.DEMO_DEPLOYED ? null : await startStaticServer();
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const screenshots = join(benchmarkRoot, ".benchmark-results", process.env.DEMO_DEPLOYED ? "deployed-components" : "demo-components");
  await mkdir(screenshots, { recursive: true });
  try {
    for (const project of projects) {
      for (const width of [390, 1280]) {
        await t.test(`${project.id} ${width}px`, async () => {
          const context = await browser.newContext({ viewport: { width, height: 844 } });
          try {
            const page = await context.newPage();
            await page.addInitScript({ content: axe.source });
            const errors = [];
            page.on("pageerror", (error) => errors.push(error.message));
            const url = server ? server.urls[project.id] : `https://${project.id}.bejamas-oss.workers.dev/`;
            await page.goto(url, { waitUntil: "networkidle" });
            await page.getByRole("button", { name: "Products", exact: true }).click();
            const navigationCard = page.getByRole("link", { name: "Analytics Real-time dashboards and reporting", exact: true });
            const normalColor = await navigationCard.evaluate((element) => getComputedStyle(element.firstElementChild).color);
            await navigationCard.hover();
            await navigationCard.evaluate(async (element) => { await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {}))); });
            assert.equal(await navigationCard.evaluate((element) => getComputedStyle(element.firstElementChild).color), normalColor, "navigation hover keeps the neutral foreground");
            await page.screenshot({ path: join(screenshots, `${project.id}-${width}-hover.png`) });
            await page.keyboard.press("Escape");
            const trigger = page.getByRole("button", { name: "Cookie preferences", exact: true });
            const dialog = page.getByRole("dialog", { name: "Cookie preferences", exact: true });
            const analytics = page.getByRole("switch", { name: "Analytics", exact: true });
            const marketing = page.getByRole("switch", { name: "Marketing", exact: true });
            await trigger.click();
            await dialog.waitFor({ state: "visible" });
            assert.equal(await analytics.getAttribute("aria-checked"), "false");
            const necessary = page.getByRole("switch", { name: "Necessary", exact: true });
            assert.equal(await necessary.getAttribute("aria-checked"), "true");
            assert.ok(await necessary.isDisabled() || await necessary.getAttribute("aria-disabled") === "true");
            const box = await dialog.boundingBox();
            assert.ok(box && box.x >= 0 && box.x + box.width <= width + 1 && box.y >= 0 && box.y + box.height <= 845, "dialog fits the screen");
            await dialog.evaluate(async (element) => { await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {}))); });
            const violations = await page.evaluate(async () => (await axe.run(document)).violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target }) => target) })));
            assert.deepEqual(violations, [], "open dialog accessibility");
            await page.screenshot({ path: join(screenshots, `${project.id}-${width}-cookies.png`) });
            await analytics.press("Space");
            assert.equal(await analytics.getAttribute("aria-checked"), "true");
            await page.keyboard.press("Escape");
            await dialog.waitFor({ state: "hidden" });
            await page.waitForFunction(() => document.activeElement?.textContent?.trim() === "Cookie preferences");
            await trigger.click();
            await dialog.waitFor({ state: "visible" });
            assert.equal(await analytics.getAttribute("aria-checked"), "false", "Escape discards unsaved changes");
            await analytics.press("Space");
            await page.getByRole("button", { name: "Save preferences", exact: true }).click();
            await dialog.waitFor({ state: "hidden" });
            assert.equal(await page.locator("[data-cookie-summary]").innerText(), "Necessary and analytics cookies enabled");
            await page.reload({ waitUntil: "networkidle" });
            await trigger.click();
            await dialog.waitFor({ state: "visible" });
            assert.equal(await analytics.getAttribute("aria-checked"), "true", "saved choice survives reload");
            assert.equal(await marketing.getAttribute("aria-checked"), "false");
            await page.getByRole("button", { name: "Accept all", exact: true }).click();
            await dialog.waitFor({ state: "hidden" });
            await trigger.click();
            await dialog.waitFor({ state: "visible" });
            assert.equal(await marketing.getAttribute("aria-checked"), "true");
            // Keyboard focus must stay inside the modal across wraparound.
            for (let step = 0; step < 10; step++) {
              await page.keyboard.press("Tab");
              await page.waitForFunction(() => document.querySelector('[role="dialog"]')?.contains(document.activeElement), null, { timeout: 2000 });
            }
            await page.getByRole("button", { name: "Reject optional", exact: true }).click();
            await dialog.waitFor({ state: "hidden" });
            assert.equal(await page.locator("[data-cookie-summary]").innerText(), "Only necessary cookies enabled");
            await page.getByRole("button", { name: "Notifications", exact: true }).click();
            const markRead = page.getByRole("button", { name: "Mark all as read", exact: true });
            await markRead.click();
            assert.ok(await markRead.isDisabled());
            assert.equal(await page.locator("[data-notification-summary]").innerText(), "You are all caught up");
            await page.keyboard.press("Escape");
            await page.waitForFunction(() => document.activeElement?.textContent?.trim() === "Notifications");
            await page.getByRole("button", { name: "Quick settings", exact: true }).press("Enter");
            await page.getByRole("menu").waitFor({ state: "visible" });
            await page.keyboard.press("Home");
            const tips = page.getByRole("menuitemcheckbox", { name: "Show helpful tips", exact: true });
            const digest = page.getByRole("menuitemcheckbox", { name: "Weekly digest", exact: true });
            await page.waitForFunction(() => document.activeElement?.textContent?.trim() === "Show helpful tips", null, { timeout: 2000 });
            await page.keyboard.press("Space");
            assert.equal(await tips.getAttribute("aria-checked"), "false");
            await digest.click();
            assert.equal(await digest.getAttribute("aria-checked"), "true");
            assert.equal(await page.locator("[data-settings-summary]").innerText(), "Tips off · Weekly digest on");
            await page.getByRole("menu").evaluate(async (element) => { await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {}))); });
            // Menus portal outside page landmarks. Audit WCAG rules here; the full-page
            // landmark audit runs separately against the ordinary document and modal.
            assert.deepEqual(await page.evaluate(async () => (await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })).violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target }) => target) }))), [], "open settings accessibility");
            await page.screenshot({ path: join(screenshots, `${project.id}-${width}-settings.png`) });
            await page.keyboard.press("Escape");
            assert.deepEqual(errors, []);
          } finally {
            await context.close();
          }
        });
      }
    }
  } finally {
    await browser.close();
    await server?.close();
  }
});
