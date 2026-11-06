import react from "@astrojs/react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";

// DOCS_BASE sets the path prefix when the site is published under a subpath, such as GitHub Pages.
export default defineConfig({
  base: process.env.DOCS_BASE ?? "/",
  server: { port: 4321 },
  devToolbar: { enabled: false },
  integrations: [react()],
  vite: {
    // The docs render the app's own components; one copy of React serves both.
    resolve: {
      alias: { "@ui": fileURLToPath(new URL("../../src/ui", import.meta.url)) },
      dedupe: ["react", "react-dom"],
    },
  },
});
