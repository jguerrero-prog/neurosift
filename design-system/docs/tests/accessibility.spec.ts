import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// WCAG 2.2 AA on every docs page; the pages are found from the side menu, so new pages are covered.
const pages: string[] = [];

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto("/");
  const hrefs = await page
    .locator(".side-menu a")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
  pages.push(...new Set(hrefs));
  await page.close();
});

const overflow = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

const clipped = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("main *, nav *, header *")]
      .filter((el) => {
        if (el.closest(".doc-table, .ns-visually-hidden, .visually-hidden")) return false;
        const style = getComputedStyle(el);
        const hides = ["hidden", "clip"].some((v) => style.overflowX === v || style.overflowY === v);
        return hides && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
      })
      .map((el) => el.className),
  );

test("every page passes axe at WCAG 2.2 AA", async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(violations.map((v) => `${path} ${v.id}`)).toEqual([]);
  }
});

test("every page has one h1 first, no skipped heading levels, and labelled landmarks", async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    const levels = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
    expect(levels[0], path).toBe(1);
    expect(levels.filter((l) => l === 1), path).toHaveLength(1);
    expect(levels.some((l, i) => i > 0 && l > levels[i - 1] + 1), path).toBe(false);
    await expect(page.locator("main"), path).toHaveCount(1);
    await expect(page.locator("nav[aria-label]"), path).toHaveCount(1);
  }
});

test("the keyboard reaches the skip link first and every stop shows a 2px focus ring", async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link"), path).toBeFocused();
    for (let stop = 0; stop < 30; stop++) {
      const ring = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const style = getComputedStyle(el);
        return { name: el.textContent?.trim() || el.getAttribute("aria-label"), width: parseFloat(style.outlineWidth), outline: style.outlineStyle };
      });
      expect(ring.outline, `${path} ${ring.name}`).not.toBe("none");
      expect(ring.width, `${path} ${ring.name}`).toBeGreaterThanOrEqual(2);
      await page.keyboard.press("Tab");
      if (await page.evaluate(() => document.activeElement === document.body)) break;
    }
  }
});

test("links and controls are at least 24 by 24 pixels", async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("a, button, [tabindex='0']")]
        .filter((el) => !el.matches(".skip-link") && !(getComputedStyle(el).display === "inline" && el.closest("p, li")))
        .map((el) => ({ el: el.textContent?.trim(), box: el.getBoundingClientRect() }))
        .filter(({ box }) => box.width < 24 || box.height < 24)
        .map(({ el }) => el),
    );
    expect(small, path).toEqual([]);
  }
});

test("pages reflow at 320px wide and survive text spacing overrides", async ({ page }) => {
  for (const path of pages) {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    expect(await overflow(page), path).toBe(0);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addStyleTag({
      content: "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-block-end: 2em !important; }",
    });
    expect(await clipped(page), path).toEqual([]);
  }
});

test("text at 200% of the browser's default size neither overflows nor clips", async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Page.setFontSizes", { fontSizes: { standard: 32, fixed: 26 } });
  for (const path of pages) {
    await page.goto(path);
    expect(await overflow(page), path).toBe(0);
    expect(await clipped(page), path).toEqual([]);
  }
});

test("buttons: disabled ones leave the tab order, loading ones stay and say they're busy", async ({ page }) => {
  await page.goto("/components/buttons/");
  const disabled = page.locator("button:disabled").first();
  await expect(disabled).toBeDisabled();
  expect(await disabled.evaluate((el) => (el as HTMLElement).tabIndex)).toBe(0);
  await disabled.focus();
  await expect(disabled).not.toBeFocused();
  const loading = page.locator("button[aria-busy='true']").first();
  await loading.focus();
  await expect(loading).toBeFocused();
});

test("buttons keep a visible edge and focus ring in forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/components/buttons/");
  const edges = await page.locator(".ns-button, .ns-icon-button").evaluateAll((buttons) =>
    buttons.map((b) => {
      const style = getComputedStyle(b);
      return style.borderStyle === "solid" && parseFloat(style.borderWidth) >= 1;
    }),
  );
  expect(edges.every(Boolean)).toBe(true);
  const button = page.locator(".ns-button--primary").first();
  await button.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  expect(await button.evaluate((b) => getComputedStyle(b).outlineStyle)).not.toBe("none");
});

test("the spinner stops moving under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/components/buttons/");
  const animation = await page
    .locator(".ns-spinner-arc")
    .first()
    .evaluate((arc) => getComputedStyle(arc).animationName);
  expect(animation).toBe("none");
});
