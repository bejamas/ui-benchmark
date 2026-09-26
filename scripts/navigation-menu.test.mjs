import assert from "node:assert/strict";
import { test } from "node:test";
import { resolve } from "node:path";
import { chromium } from "playwright-core";
import { projects } from "./benchmark-config.mjs";
import { startStaticServer } from "./static-server.mjs";
import { controls, installProbe, measureSettled } from "./interaction-probe.mjs";

test("production navigation keeps its triggers clickable through opening animations", async (t) => {
  const project = projects.find(({ id }) => id === "astro-bui");
  const server = await startStaticServer({ project: {
    ...project, buildDir: process.env.NAVIGATION_BUILD_DIR ? resolve(process.env.NAVIGATION_BUILD_DIR) : project.buildDir,
  } });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const profile of [
      { name: "mobile 20x", touch: true, rate: 20, viewport: { width: 390, height: 844 } },
      { name: "mobile native", touch: true, rate: 1, viewport: { width: 390, height: 844 } },
      { name: "desktop 4x", touch: false, rate: 4, viewport: { width: 1280, height: 800 } },
    ]) {
      await t.test(profile.name, async () => {
        const context = await browser.newContext({
          viewport: profile.viewport, isMobile: profile.touch, hasTouch: profile.touch, deviceScaleFactor: profile.touch ? 2 : 1,
        });
        try {
          const page = await context.newPage();
          const errors = [];
          page.on("pageerror", (error) => errors.push(error.message));
          const cdp = await context.newCDPSession(page);
          await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.rate });
          await page.addInitScript(installProbe, { outcomeTimeoutMs: 2000 });
          await page.goto(server.urls[project.id], { waitUntil: "networkidle" });
          for (const text of ["Products", "Solutions", "Products"]) {
            const open = { ...controls.navigation, text };
            const close = { ...controls.navigationClose, text };
            assert.equal((await measureSettled(page, cdp, open, profile.touch)).status, "success");
            // Test the whole usable trigger surface, not just a lucky tap at its center.
            const intercepted = await page.evaluate((label) => {
              const trigger = [...document.querySelectorAll('[data-slot="navigation-menu-trigger"]')]
                .find((node) => node.textContent.trim() === label);
              const rect = trigger.getBoundingClientRect();
              return [0.1, 0.5, 0.9].flatMap((x) => [0.1, 0.5, 0.9].flatMap((y) => {
                const hit = document.elementFromPoint(rect.x + rect.width * x, rect.y + rect.height * y);
                return hit && trigger.contains(hit) ? [] : [{ x, y, slot: hit?.getAttribute("data-slot") }];
              }));
            }, text);
            assert.deepEqual(intercepted, [], `${text} trigger is covered`);
            assert.equal((await measureSettled(page, cdp, close, profile.touch)).status, "success");
          }
          if (!profile.touch) {
            const trigger = page.getByRole("button", { name: "Products", exact: true });
            await page.mouse.move(0, 200);
            await trigger.hover();
            await page.waitForFunction(() => document.querySelector('[data-slot="navigation-menu-trigger"]').getAttribute("aria-expanded") === "true");
            const bridge = page.locator('[data-slot="navigation-menu-bridge"]');
            const box = await bridge.boundingBox();
            assert.ok(box && box.height > 0, "keep the hover bridge across the real gap");
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.getByRole("link", { name: /Analytics/ }).hover();
            assert.equal(await trigger.getAttribute("aria-expanded"), "true");
            await trigger.focus();
            await page.keyboard.press("Escape");
            assert.equal(await trigger.getAttribute("aria-expanded"), "false");
          }
          assert.deepEqual(errors, []);
        } finally {
          await context.close();
        }
      });
    }
  } finally {
    await browser.close();
    await server.close();
  }
});
