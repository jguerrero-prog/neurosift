import { defineConfig, devices } from "@playwright/test";

const PORT = 4322;
const SITE = `http://localhost:${PORT}${process.env.DOCS_BASE ?? "/"}`;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: SITE, ...devices["Desktop Chrome"] },
  webServer: {
    command: `npm run build && node tests/serve.mjs ${PORT}`,
    url: SITE,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
