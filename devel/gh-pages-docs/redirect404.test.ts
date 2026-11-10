import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Runs the redirect script in the docs site's 404.html against a stubbed
// window.location, as devel/gh-pages-root/redirect404.test.ts does for the app.
const html = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "404.html"),
  "utf-8",
);
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const HOST = "jguerrero-prog.github.io";

const run = (pathname: string, search = "", hash = "") => {
  const redirects: string[] = [];
  const location = {
    protocol: "https:",
    host: HOST,
    pathname,
    search,
    hash,
    replace: (url: string) => redirects.push(url),
  };
  const win: Record<string, unknown> = { location };
  new Function("window", script as string)(win);
  return {
    redirect: redirects[0] ?? null,
    siteRoot: win.__notFoundSiteRoot as string | undefined,
  };
};

describe("docs site 404", () => {
  it("sends a deep link into the app to the app root, keeping path, query and hash", () => {
    const { redirect } = run(
      "/neurosift/app/nwb",
      "?url=https://x.org/a.nwb&tab=view:PSTH|/units",
      "#h",
    );
    expect(redirect).toBe(
      `https://${HOST}/neurosift/app/?/nwb&url=https://x.org/a.nwb~and~tab=view:PSTH|/units#h`,
    );
  });

  it("leaves the app root, an already redirected link and docs pages alone", () => {
    expect(run("/neurosift/app/").redirect).toBeNull();
    expect(run("/neurosift/app/", "?/nwb&url=x").redirect).toBeNull();
    const docs = run("/neurosift/components/missing/");
    expect(docs.redirect).toBeNull();
    expect(docs.siteRoot).toBe("/neurosift/");
  });

  it("never redirects to a page that would redirect again", () => {
    let pathname = "/neurosift/app/search";
    let search = "?q=hippocampus";
    for (let i = 0; i < 5; i++) {
      const { redirect } = run(pathname, search);
      if (!redirect) return;
      const url = new URL(redirect);
      pathname = url.pathname;
      search = url.search;
    }
    throw new Error("redirect loop");
  });
});
