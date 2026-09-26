import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { launch } from "chrome-launcher";
import { runVisit, summarizeSamples } from "./interactions.mjs";
import { positiveInteger } from "./interaction-profiles.mjs";

test("Chrome interaction harness detects actual outcomes", async (t) => {
  const server = createServer((request, response) => {
    if (request.url === "/late.js") {
      setTimeout(() => response.writeHead(200, { "Content-Type": "text/javascript" }).end("window.lateScriptLoaded = true"), 1_000);
      return;
    }
    const mode = request.url.slice(1);
    const change = "button.setAttribute('aria-expanded', 'true'); document.querySelector('#panel').hidden = false;";
    const handler = mode === "ignored" ? "" : mode === "slow"
      ? `const end = performance.now() + 120; while (performance.now() < end) {} ${change}`
      : mode === "async" ? `setTimeout(() => { ${change} }, 150)`
        : mode === "late" ? `setTimeout(() => { ${change} }, 500)` : change;
    response.writeHead(200, { "Content-Type": "text/html" }).end(`<!doctype html>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <button data-slot="navigation-menu-trigger" aria-expanded="false" aria-controls="panel">Products</button>
      <div id="panel" hidden>Analytics</div>
      <script>const button = document.querySelector('button'); button.addEventListener('click', () => { ${handler} });</script>
      ${mode === "moved" ? `<script>
        const ready = window.__benchmarkInputReady;
        window.__benchmarkInputReady = (point) => {
          button.style.transform = 'translateY(200px)';
          return ready(point);
        };
      </script>` : ""}
      <script src="/late.js" defer></script>`);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }), headless: true,
  });
  try {
    for (const touch of [false, true]) {
      for (const mode of ["ignored", "slow", "async", "late", "moved"]) {
        await t.test(`${touch ? "touch" : "mouse"}: ${mode}`, async () => {
          const result = await runVisit({
            browser, url: `http://127.0.0.1:${server.address().port}/${mode}`,
            profile: { rate: 1, viewport: { width: 390, height: 844 }, touch },
            scenario: "early", outcomeTimeoutMs: 350,
            network: { latency: 0, downloadThroughput: -1, uploadThroughput: -1 },
          });
          const sample = result.results.navigation;
          assert.deepEqual(result.errors, []);
          assert.equal(sample.input.loadAt, null, "must inject before load finishes");
          assert.equal(sample.input.domContentLoadedAt, null, "must not wait for deferred initialization");
          assert.equal(sample.input.matched, mode !== "moved");
          if (mode === "moved") {
            assert.equal(sample.status, "wrong-target", "a target moving before input must not be called an ignored click");
          } else if (mode === "ignored") {
            assert.equal(sample.status, "no-ui-change");
            assert.equal(sample.uiStateDelayMs, null);
          } else if (mode === "late") {
            assert.equal(sample.status, "outcome-too-late", "the Event Timing collection grace period must not extend the outcome deadline");
          } else {
            assert.equal(sample.status, "success");
            if (mode === "slow") {
              assert.ok(sample.eventTiming.durationMs >= 112, JSON.stringify(sample));
              assert.ok(sample.eventTiming.processingMs >= 110, "must capture the slow click, not just pointerdown");
            } else {
              assert.ok(sample.uiStateDelayMs >= 140, "must wait for the actual async outcome");
            }
          }
        });
      }
    }
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("unreported timings and failures cannot turn into fast successful samples", () => {
  const result = summarizeSamples([
    { results: { navigation: { status: "success", eventTiming: null, input: { startTime: 10, loadAt: null }, outcomeAt: 15, uiStateDelayMs: 5 } } },
    { results: { navigation: { status: "no-ui-change", eventTiming: { durationMs: 16 }, input: { startTime: 25, loadAt: 20 } } } },
    { harnessError: "navigation failed" },
  ], "navigation");
  assert.equal(result.attempts, 3);
  assert.equal(result.successful, 1);
  assert.equal(result.failures, 2);
  assert.equal(result.harnessErrors, 1);
  assert.equal(result.unreportedTimings, 1);
  assert.equal(result.durationMs, null);
});

test("saved report can be regenerated and rejects duplicate visits", () => {
  const dir = mkdtempSync(join(tmpdir(), "interaction-report-"));
  try {
    const path = join(dir, "report.json");
    const samplePath = join(dir, "report.samples.jsonl");
    const group = { profile: "baseline-4x", project: "fixture", scenario: "early", sampleCount: 1 };
    const report = {
      status: "complete", measuredAt: "2026-09-25", environment: { browser: "fixture" },
      profiles: [{ id: "baseline-4x", rate: 4 }], methodology: { runs: 1 },
      samplesFile: "report.samples.jsonl", groups: [group],
    };
    const sample = {
      ...group, run: 1,
      results: { navigation: { status: "no-ui-change", input: { startTime: 50, loadAt: null }, firstContentfulPaintMs: 40 } },
    };
    writeFileSync(path, JSON.stringify(report));
    writeFileSync(samplePath, `${JSON.stringify(sample)}\n`);
    const script = fileURLToPath(new URL("./summarize-interactions.mjs", import.meta.url));
    execFileSync(process.execPath, [script, path]);
    const saved = JSON.parse(readFileSync(path, "utf8"));
    assert.equal(saved.groups[0].summary.navigation.failures, 1);
    assert.equal(saved.groups[0].summary.navigation.inputTimeMs.median, 50);
    assert.match(readFileSync(join(dir, "report.md"), "utf8"), /0\/1/);
    writeFileSync(samplePath, `${JSON.stringify(sample)}\n${JSON.stringify(sample)}\n`);
    assert.throws(() => execFileSync(process.execPath, [script, path], { stdio: "pipe" }), /Missing or duplicate visits/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("sample count rejects values that would silently truncate or skip runs", () => {
  for (const value of ["0", "-1", "5garbage", "2.5", "", "Infinity"]) {
    assert.throws(() => positiveInteger(value, "INTERACTION_RUNS"));
  }
  assert.equal(positiveInteger("30", "INTERACTION_RUNS"), 30);
});

test("device CDP transport preserves existing pages and uses a separate benchmark tab", async () => {
  const chrome = await launch({
    ...(process.env.CHROME_PATH ? { chromePath: process.env.CHROME_PATH } : {}),
    chromeFlags: ["--headless=new"],
  });
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`);
  try {
    const context = browser.contexts()[0];
    const existing = await context.newPage();
    await existing.goto("about:blank");
    const before = context.pages().length;
    const html = `<button data-slot="navigation-menu-trigger" aria-expanded="false"
      onclick="this.setAttribute('aria-expanded','true')">Products</button>`;
    const result = await runVisit({
      browser, url: `data:text/html,${encodeURIComponent(html)}`,
      profile: { realDevice: true, touch: true }, scenario: "early",
    });
    assert.equal(result.results.navigation.status, "success");
    assert.equal(context.pages().length, before);
    assert.equal(existing.isClosed(), false);
  } finally {
    await browser.close();
    await chrome.kill();
  }
});

test("settled suite verifies reverse actions and selected values", async (t) => {
  const browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }), headless: true,
  });
  try {
    for (const touch of [false, true]) {
      for (const mode of ["native", "custom", "pointerdown-open", "ignored-nav", "wrong-selection", "visible-after-close", "already-checked"]) {
        await t.test(`${touch ? "touch" : "mouse"}: ${mode}`, async () => {
          const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
            <button data-slot="navigation-menu-trigger" aria-expanded="false" aria-controls="nav">Products</button>
            <div id="nav" hidden>Analytics</div>
            <button role="tab" aria-selected="true" aria-controls="monthly">Monthly</button>
            <button role="tab" aria-selected="false" aria-controls="yearly">Yearly</button>
            <div id="monthly">Monthly prices</div><div id="yearly" hidden>Yearly prices</div>
            <button data-slot="accordion-trigger" aria-expanded="false" aria-controls="faq">How is this different from shadcn/ui?</button>
            <div id="faq" hidden>Answer</div>
            <button id="company-size" aria-expanded="false" aria-controls="options">Select team size</button>
            <div id="options" hidden><button role="option">1–10 employees</button></div>
            ${mode === "custom" ? '<input type="checkbox" aria-hidden="true" tabindex="-1"><button id="newsletter" role="checkbox" aria-checked="false">Newsletter</button>'
              : `<input type="checkbox" id="newsletter" ${mode === "already-checked" ? "checked" : ""}>`}
            <script>
              const handle = ({target, type}) => {
                const opensOnDown = ${JSON.stringify(mode)} === 'pointerdown-open' && target.id === 'company-size';
                if ((type === 'pointerdown') !== opensOnDown) return;
                if (target.matches('[aria-expanded]')) {
                  if (${JSON.stringify(mode)} === 'ignored-nav' && target.textContent === 'Products') return;
                  const open = target.getAttribute('aria-expanded') !== 'true';
                  target.setAttribute('aria-expanded', String(open));
                  if (!(${JSON.stringify(mode)} === 'visible-after-close' && target.textContent === 'Products' && !open)) {
                    document.getElementById(target.getAttribute('aria-controls')).hidden = !open;
                  }
                  if (opensOnDown) {
                    // Opening on down can put an overlay under the pointer before up/click.
                    document.getElementById('options').style.cssText = 'position:fixed;inset:0;background:white;padding-top:400px';
                  }
                }
                if (target.matches('[role=tab]')) {
                  for (const tab of document.querySelectorAll('[role=tab]')) {
                    tab.setAttribute('aria-selected', String(tab === target));
                    document.getElementById(tab.getAttribute('aria-controls')).hidden = tab !== target;
                  }
                }
                if (target.matches('[role=option]')) {
                  const trigger = document.getElementById('company-size');
                  trigger.textContent = ${JSON.stringify(mode)} === 'wrong-selection' ? '11–50 employees' : target.textContent;
                  const icon = document.createElement('span');
                  icon.setAttribute('aria-hidden', 'true');
                  icon.textContent = '▼';
                  trigger.append(icon);
                  trigger.setAttribute('aria-expanded', 'false');
                  document.getElementById('options').remove();
                }
                if (target.matches('button#newsletter')) {
                  target.setAttribute('aria-checked', String(target.getAttribute('aria-checked') !== 'true'));
                  document.querySelector('input[aria-hidden="true"]').click();
                }
              };
              document.addEventListener('click', handle);
              document.addEventListener('pointerdown', handle);
            </script>`;
          const visit = await runVisit({
            browser, url: `data:text/html,${encodeURIComponent(html)}`,
            profile: { rate: 1, viewport: { width: 390, height: 844 }, touch },
            scenario: "settled", outcomeTimeoutMs: 200,
          });
          assert.deepEqual(visit.errors, []);
          assert.equal(Object.keys(visit.results).length, 10);
          const expectedFailures = mode === "ignored-nav" ? { navigation: "no-ui-change", navigationClose: "prerequisite-failed" }
            : mode === "wrong-selection" ? { companyOption: "no-ui-change" }
              : mode === "visible-after-close" ? { navigationClose: "no-ui-change" }
                : mode === "already-checked" ? { newsletterCheckbox: "harness-error", newsletterUncheck: "prerequisite-failed" } : {};
          for (const [key, result] of Object.entries(visit.results)) {
            assert.equal(result.status, expectedFailures[key] ?? "success", `${key}: ${JSON.stringify(result)}`);
          }
        });
      }
    }
  } finally {
    await browser.close();
  }
});
