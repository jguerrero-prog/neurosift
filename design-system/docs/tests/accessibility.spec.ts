import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// WCAG 2.2 AA on every docs page; the pages are found from the side menu, so new pages are covered.
const pages: string[] = [];

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto("./");
  const hrefs = await page
    .locator(".side-menu a")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
  pages.push(...new Set(hrefs));
  await page.close();
});

// Names what sticks out past the window, so a failure says where to look.
// WebKit, like Safari's default, tabs only between form fields; Alt+Tab reaches every control.
const tab = (browserName: string) =>
  browserName === "webkit" ? "Alt+Tab" : "Tab";

const overflow = (page: Page) =>
  page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth <= width) return [];
    return [...document.querySelectorAll("body *")]
      .filter(
        (el) =>
          !el.closest(".doc-table, pre") &&
          el.getBoundingClientRect().right > width + 1,
      )
      .map(
        (el) =>
          `${el.tagName.toLowerCase()}.${el.className} ${Math.round(el.getBoundingClientRect().right - width)}px`,
      );
  });

const clipped = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("main *, nav *, header *")]
      .filter((el) => {
        if (el.closest(".doc-table, .ns-visually-hidden, .visually-hidden"))
          return false;
        const style = getComputedStyle(el);
        const hides = ["hidden", "clip"].some(
          (v) => style.overflowX === v || style.overflowY === v,
        );
        return (
          hides &&
          (el.scrollWidth > el.clientWidth + 1 ||
            el.scrollHeight > el.clientHeight + 1)
        );
      })
      .map((el) => el.className),
  );

test("every internal link and every asset a page loads responds", async ({
  page,
  request,
}) => {
  const failed: string[] = [];
  page.on("response", (response) => {
    if (response.status() >= 400)
      failed.push(`${response.status()} ${response.url()}`);
  });
  const links = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const hrefs = await page
      .locator("a[href^='/']")
      .evaluateAll((as) =>
        as.map((a) => (a as HTMLAnchorElement).href.split("#")[0]),
      );
    hrefs.forEach((href) => links.add(href));
  }
  for (const href of links) {
    const response = await request.get(href);
    if (!response.ok()) failed.push(`${response.status()} ${href}`);
  }
  expect(failed).toEqual([]);
});

test("every page passes axe at WCAG 2.2 AA", async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(violations.map((v) => `${path} ${v.id}`)).toEqual([]);
  }
});

test("every page has one h1 first, no skipped heading levels, and labelled landmarks", async ({
  page,
}) => {
  for (const path of pages) {
    await page.goto(path);
    const levels = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
    expect(levels[0], path).toBe(1);
    expect(
      levels.filter((l) => l === 1),
      path,
    ).toHaveLength(1);
    expect(
      levels.some((l, i) => i > 0 && l > levels[i - 1] + 1),
      path,
    ).toBe(false);
    await expect(page.locator("main"), path).toHaveCount(1);
    await expect(page.locator("nav[aria-label]"), path).toHaveCount(1);
  }
});

test("the keyboard reaches the skip link first and every stop shows a 2px focus ring", async ({
  page,
  browserName,
}) => {
  for (const path of pages) {
    await page.goto(path);
    await page.keyboard.press(tab(browserName));
    await expect(page.locator(".skip-link"), path).toBeFocused();
    for (let stop = 0; stop < 30; stop++) {
      // Text fields show focus by thickening their own edge in border/focus; everything else gets a ring.
      const ring = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const name =
          el.textContent?.trim() ||
          el.getAttribute("aria-label") ||
          (el as HTMLInputElement).labels?.[0]?.textContent;
        const frame = el.closest<HTMLElement>(".ns-field-box, .ns-search");
        if (frame) {
          const probe = document.createElement("span");
          probe.style.color = "var(--border-focus)";
          document.body.append(probe);
          const focus = getComputedStyle(probe).color;
          probe.remove();
          const edge = getComputedStyle(frame);
          return {
            name,
            shown: edge.borderColor === focus && edge.boxShadow !== "none",
          };
        }
        const style = getComputedStyle(el);
        return {
          name,
          shown:
            style.outlineStyle !== "none" &&
            parseFloat(style.outlineWidth) >= 2,
        };
      });
      expect(ring.shown, `${path} ${ring.name}`).toBe(true);
      await page.keyboard.press(tab(browserName));
      if (await page.evaluate(() => document.activeElement === document.body))
        break;
    }
  }
});

test("links and controls are at least 24 by 24 pixels", async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("a, button, [tabindex='0']")]
        .filter(
          (el) =>
            el.checkVisibility() &&
            !el.matches(".skip-link") &&
            !(getComputedStyle(el).display === "inline" && el.closest("p, li")),
        )
        .map((el) => ({
          el: el.textContent?.trim(),
          box: el.getBoundingClientRect(),
        }))
        .filter(({ box }) => box.width < 24 || box.height < 24)
        .map(({ el }) => el),
    );
    expect(small, path).toEqual([]);
  }
});

test("pages reflow at 320px wide and survive text spacing overrides", async ({
  page,
}) => {
  for (const path of pages) {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    expect(await overflow(page), path).toEqual([]);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addStyleTag({
      content:
        "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-block-end: 2em !important; }",
    });
    expect(await clipped(page), path).toEqual([]);
  }
});

test("text at 200% of the browser's default size neither overflows nor clips", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "Sets font sizes through Chromium's DevTools protocol",
  );
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Page.setFontSizes", {
    fontSizes: { standard: 32, fixed: 26 },
  });
  for (const path of pages) {
    await page.goto(path);
    expect(await overflow(page), path).toEqual([]);
    expect(await clipped(page), path).toEqual([]);
  }
});

test("buttons: a loading button is as wide as the same button not loading", async ({
  page,
}) => {
  await page.goto("components/buttons/");
  const pairs = await page.evaluate(() =>
    [...document.querySelectorAll("table")].flatMap((table) => {
      const heads = [...table.querySelectorAll("thead th")].map(
        (th) => th.textContent,
      );
      const idle = heads.indexOf("Default");
      const busy = heads.indexOf("Loading");
      if (idle < 0 || busy < 0) return [];
      return [...table.querySelectorAll("tbody tr")].map((row) => {
        const cells = row.children;
        const button = (i: number) =>
          cells[i].querySelector(".ns-button") as HTMLElement;
        const loading = button(busy);
        const spinner = loading
          .querySelector(".ns-spinner")!
          .getBoundingClientRect();
        const box = loading.getBoundingClientRect();
        return {
          row: row.querySelector("th")?.textContent,
          idle: button(idle).getBoundingClientRect().width,
          busy: box.width,
          centered:
            loading.dataset.spinner !== "center" ||
            Math.abs(
              spinner.left + spinner.width / 2 - (box.left + box.width / 2),
            ) < 1,
        };
      });
    }),
  );
  expect(pairs.length).toBeGreaterThanOrEqual(8);
  for (const { row, idle, busy, centered } of pairs) {
    expect(busy, `${row} loading width`).toBeCloseTo(idle, 2);
    expect(centered, `${row} spinner centered`).toBe(true);
  }
});

test("checkboxes: Space and a click on the label toggle; a disabled box doesn't change", async ({
  page,
}) => {
  await page.goto("components/checkboxes/");
  const ember = page.getByRole("checkbox", { name: /^EMBER/ });
  await expect(ember).not.toBeChecked();
  await ember.focus();
  await page.keyboard.press("Space");
  await expect(ember).toBeChecked();
  await page.getByText("EMBER", { exact: true }).click();
  await expect(ember).not.toBeChecked();
  const disabled = page.locator(".ns-checkbox-input:disabled").first();
  const before = await disabled.isChecked();
  await disabled.click({ force: true });
  expect(await disabled.isChecked()).toBe(before);
});

test("text inputs: an invalid field points to a visible message that says what fits", async ({
  page,
}) => {
  await page.goto("components/text-inputs/");
  const invalid = page.locator("[aria-invalid='true']");
  expect(await invalid.count()).toBeGreaterThan(0);
  for (const field of await invalid.all()) {
    const id = await field.getAttribute("aria-describedby");
    const message = page.locator(`[id="${id}"]`);
    await expect(message).toBeVisible();
    await expect(message).toContainText(/\S/);
  }
});

test("buttons: disabled ones leave the tab order, loading ones stay and say they're busy", async ({
  page,
}) => {
  await page.goto("components/buttons/");
  const disabled = page.locator("button:disabled").first();
  await expect(disabled).toBeDisabled();
  expect(await disabled.evaluate((el) => (el as HTMLElement).tabIndex)).toBe(0);
  await disabled.focus();
  await expect(disabled).not.toBeFocused();
  const loading = page.locator("button[aria-busy='true']").first();
  await loading.focus();
  await expect(loading).toBeFocused();
});

test("buttons keep a visible edge and focus ring in forced colors", async ({
  page,
  browserName,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("components/buttons/");
  const edges = await page
    .locator(".ns-button, .ns-icon-button")
    .evaluateAll((buttons) =>
      buttons.map((b) => {
        const style = getComputedStyle(b);
        return (
          style.borderStyle === "solid" && parseFloat(style.borderWidth) >= 1
        );
      }),
    );
  expect(edges.every(Boolean)).toBe(true);
  const button = page.locator(".ns-button--primary").first();
  await button.focus();
  await page.keyboard.press(`Shift+${tab(browserName)}`);
  await page.keyboard.press(tab(browserName));
  expect(
    await button.evaluate((b) => getComputedStyle(b).outlineStyle),
  ).not.toBe("none");
});

test("the spinner stops moving under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("components/buttons/");
  const animation = await page
    .locator(".ns-spinner-arc")
    .first()
    .evaluate((arc) => getComputedStyle(arc).animationName);
  expect(animation).toBe("none");
});

test("selects: Space opens the list, Escape closes it and keeps the value and focus", async ({
  page,
  browserName,
}) => {
  await page.goto("components/selects/");
  const select = page.getByRole("combobox", { name: "Playback speed" });
  await select.focus();
  await page.keyboard.press("Space");
  expect(await select.evaluate((s) => s.matches(":open"))).toBe(true);
  test.skip(
    browserName === "firefox",
    "Firefox's native list doesn't take synthetic keys",
  );
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  expect(await select.evaluate((s) => s.matches(":open"))).toBe(false);
  await expect(select).toBeFocused();
  await expect(select).toHaveValue("1×");
});

test("selects: typing jumps to an option; arrows and Enter pick from the styled list", async ({
  page,
  browserName,
}) => {
  await page.goto("components/selects/");
  const select = page.getByRole("combobox", { name: "Playback speed" });
  await select.focus();
  await page.keyboard.type("8");
  await expect(select).toHaveValue("8×");
  test.skip(
    browserName === "firefox",
    "Firefox's native list doesn't take synthetic keys",
  );
  await page.keyboard.press("Alt+ArrowDown");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(select).toHaveValue("4×");
  expect(await select.evaluate((s) => s.matches(":open"))).toBe(false);
});

test("menus: Enter opens on the first item, arrows skip disabled items, Escape returns focus", async ({
  page,
}) => {
  await page.goto("components/selects/");
  const trigger = page.getByRole("button", { name: "Share" }).first();
  await trigger.scrollIntoViewIfNeeded();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await page.waitForFunction(
    () => !document.querySelector("astro-island[ssr]"),
  );
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("menuitem", { name: "Copy link" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("menuitem", { name: "View on DANDI" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("menus: open under their button, at least as wide, and picking runs the item", async ({
  page,
}) => {
  await page.goto("components/selects/");
  const trigger = page.getByRole("button", { name: "Share" }).first();
  await trigger.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => !document.querySelector("astro-island[ssr]"),
  );
  await trigger.click();
  const menu = page.getByRole("menu").first();
  const [button, list] = [
    await trigger.boundingBox(),
    await menu.boundingBox(),
  ];
  expect(list!.y).toBeGreaterThanOrEqual(button!.y + button!.height);
  expect(Math.round(list!.x)).toBe(Math.round(button!.x));
  expect(list!.width).toBeGreaterThanOrEqual(button!.width);
  await page.getByRole("menuitem", { name: "Copy link" }).click();
  await expect(menu).toBeHidden();
  await expect(page.getByRole("status").first()).toHaveText("Ran “Copy link”");
});
