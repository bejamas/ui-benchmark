export const controls = {
  navigation: {
    selector: '[data-slot="navigation-menu-trigger"]', text: "Products",
    attribute: "aria-expanded", value: "true",
  },
  pricingTabs: {
    selector: '[role="tab"]', text: "Yearly", attribute: "aria-selected", value: "true",
  },
  faqAccordion: {
    selector: '[data-slot="accordion-trigger"]', text: "How is this different from shadcn/ui?",
    attribute: "aria-expanded", value: "true",
  },
  newsletterCheckbox: { selector: "#newsletter", attribute: "aria-checked", value: "true" },
};

// Runs before application scripts. No application imports, synthetic DOM clicks,
// hydration waits, or retries. Only one input is active in a document at a time.
export function installProbe({ earlyControl, outcomeTimeoutMs }) {
  const entries = [];
  const observers = [];
  let active = null;
  let loadAt = null;
  let domContentLoadedAt = null;
  addEventListener("load", () => { loadAt = performance.now(); }, { once: true });
  addEventListener("DOMContentLoaded", () => { domContentLoadedAt = performance.now(); }, { once: true });
  const record = (list) => {
    for (const entry of list) {
      entries.push({
        entryType: entry.entryType, name: entry.name, interactionId: entry.interactionId,
        startTime: entry.startTime, duration: entry.duration,
        processingStart: entry.processingStart, processingEnd: entry.processingEnd,
      });
    }
  };
  for (const type of ["event", "first-input"]) {
    const observer = new PerformanceObserver((list) => record(list.getEntries()));
    observer.observe({ type, buffered: true, ...(type === "event" ? { durationThreshold: 16 } : {}) });
    observers.push(observer);
  }
  function find(control) {
    return [...document.querySelectorAll(control.selector)]
      .find((node) => !control.text || node.textContent.trim() === control.text);
  }
  function visible(node) {
    return node && node.getClientRects().length > 0 &&
      getComputedStyle(node).visibility !== "hidden" && getComputedStyle(node).display !== "none";
  }
  function changed(control) {
    const target = find(control);
    if (!target) return false;
    const checked = target instanceof HTMLInputElement && target.type === "checkbox";
    if (checked ? !target.checked : target.getAttribute(control.attribute) !== control.value) return false;
    const contentId = target.getAttribute("aria-controls");
    return !contentId || visible(document.getElementById(contentId));
  }
  function observeOutcome() {
    if (active?.input && active.outcomeAt === null && changed(active.control)) {
      active.outcomeAt = performance.now();
    }
  }
  new MutationObserver(observeOutcome).observe(document, {
    subtree: true, childList: true, attributes: true,
    attributeFilter: ["aria-expanded", "aria-selected", "aria-checked", "data-state", "hidden", "style", "class"],
  });
  for (const type of ["pointerdown", "pointerup", "click"]) {
    addEventListener(type, (event) => {
      if (!active) return;
      const target = find(active.control);
      const matched = target && event.composedPath().includes(target);
      if (type === "pointerdown") {
        active.input = {
          startTime: event.timeStamp, receivedAt: performance.now(), matched: Boolean(matched),
          readyState: document.readyState, loadAt, domContentLoadedAt,
        };
      }
      if (type === "click") {
        active.click = { startTime: event.timeStamp, matched: Boolean(matched) };
        // Native checkbox state is a property change, not necessarily a mutation.
        queueMicrotask(observeOutcome);
        requestAnimationFrame(observeOutcome);
      }
    }, true);
  }
  globalThis.__interactionProbe = {
    arm(control) {
      active = { control, armedAt: performance.now(), input: null, click: null, outcomeAt: null };
    },
    async result() {
      const deadline = (active.input?.startTime ?? active.armedAt) + outcomeTimeoutMs;
      while (!active.click || active.outcomeAt === null) {
        if (performance.now() >= deadline) break;
        await new Promise((resolve) => setTimeout(resolve, 25));
        observeOutcome();
      }
      // Event Timing is delivered after paint. Allow the entire down/up/click
      // interaction to arrive, rather than returning its first reported event.
      await new Promise((resolve) => setTimeout(resolve, 250));
      for (const observer of observers) record(observer.takeRecords());
      const relevant = entries.filter((entry) => entry.startTime >= active.armedAt &&
        ["pointerdown", "pointerup", "click", "mousedown"].includes(entry.name));
      const eventEntries = relevant.filter((entry) => entry.entryType === "event" && entry.interactionId > 0);
      const timingEntries = eventEntries.length ? eventEntries : relevant.filter((entry) => entry.entryType === "first-input");
      const longest = timingEntries.reduce((max, entry) => !max || entry.duration > max.duration ? entry : max, null);
      // Events painted together can have the same rounded duration. Attribute
      // the whole frame's processing span, so a cheap pointerdown does not make
      // a slow click handler appear to be presentation delay.
      const frame = longest ? relevant.filter((entry) =>
        Math.abs(entry.startTime + entry.duration - longest.startTime - longest.duration) <= 8) : [];
      const processingStart = Math.min(...frame.map((entry) => entry.processingStart));
      const processingEnd = Math.max(...frame.map((entry) => entry.processingEnd));
      const status = !active.input || !active.click ? "input-missing"
        : !active.input.matched || !active.click.matched ? "wrong-target"
          : active.outcomeAt === null ? "no-ui-change"
            : active.outcomeAt > deadline ? "outcome-too-late" : "success";
      return {
        status,
        input: active.input,
        outcomeAt: active.outcomeAt,
        uiStateDelayMs: active.outcomeAt !== null && active.input ? active.outcomeAt - active.input.startTime : null,
        eventTiming: longest ? {
          source: longest.entryType, durationMs: longest.duration,
          inputDelayMs: Math.max(0, processingStart - longest.startTime),
          processingMs: processingEnd - processingStart,
          // Quantization can put the rounded end before processingEnd.
          presentationDelayMs: Math.max(0, longest.startTime + longest.duration - processingEnd),
        } : null,
        timingStatus: longest ? "reported" : "below-threshold-or-unreported",
        events: relevant,
        firstContentfulPaintMs: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null,
        domContentLoadedMs: domContentLoadedAt,
        loadMs: loadAt,
        readyStateAtCollection: document.readyState,
      };
    },
  };
  if (earlyControl) {
    const check = () => {
      const target = find(earlyControl);
      const painted = performance.getEntriesByName("first-contentful-paint").length > 0;
      if (painted && visible(target)) {
        const rect = target.getBoundingClientRect();
        const point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        if (point.x > 0 && point.x < innerWidth && point.y > 0 && point.y < innerHeight) {
          globalThis.__interactionProbe.arm(earlyControl);
          globalThis.__benchmarkInputReady(point);
          return;
        }
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }
}

export async function dispatchInput(cdp, point, touch) {
  if (touch) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
  }
}

export async function measureSettled(page, cdp, control, touch) {
  const locator = control.text
    ? page.locator(control.selector).filter({ hasText: control.text }).first()
    : page.locator(control.selector);
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error(`Control is not visible: ${control.selector}`);
  await page.evaluate((value) => globalThis.__interactionProbe.arm(value), control);
  await dispatchInput(cdp, { x: box.x + box.width / 2, y: box.y + box.height / 2 }, touch);
  return page.evaluate(() => globalThis.__interactionProbe.result());
}
