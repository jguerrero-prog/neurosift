import { defineConfig } from "astro/config";

// DOCS_BASE sets the path prefix when the site is published under a subpath, such as GitHub Pages.
export default defineConfig({
  base: process.env.DOCS_BASE ?? "/",
  server: { port: 4321 },
  devToolbar: { enabled: false },
});
