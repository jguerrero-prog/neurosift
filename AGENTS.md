# Agent instructions

## Run every CI check before pushing

The `Pull Request Checks` workflow (`.github/workflows/pr-checks.yml`) runs on the
whole repository, not only on the files a change touches. Run all of its checks
locally before every push, even for a TypeScript-only change:

```bash
pip install black && black --check .   # Python formatting (black . to fix)
npm run format:check                   # prettier, all of src/ (npm run format to fix)
npm run lint                           # eslint
npx tsc -b --noEmit                    # type checking
npm test                               # unit tests (vitest)
npm run build && npm run check:bundle  # per-page JavaScript budget
```

Notes:

- CI installs the latest `black`, unpinned. A file that passed before can fail
  after a black release, and a Python file another PR merged unformatted fails
  every later PR. If `black --check .` flags files your change did not touch, run
  `black` on them and include the result in your PR rather than leaving CI red.
- Run `npm run format:check` (the whole `src/` glob), not prettier on just the
  files you edited.
- Run `npm ci` first if `node_modules` is missing, otherwise the checks above fail
  for unrelated reasons.
- `codespell` also runs in CI (`.github/workflows/codespell.yml`, configured by
  `.codespellrc`).

## Design system

The design system lives in `design-system/`: design tokens in `tokens/` and its documentation site in `docs/` (Astro, with its own install: `npm run docs:install`, then `npm run docs:dev`).

- **Generated files, do not edit by hand:** `src/css/tokens.css` and `design-system/docs/src/styles/specimens.css`. Edit `design-system/tokens/*.tokens.json` (W3C design tokens, exported from the Figma variables), then run `npm run tokens`. A test fails if the generated files are stale.
- **Styling:** classes in CSS files that read the tokens (`var(--action-primary)`, `.type-body`). No inline `style` attributes, no MUI `sx`, no hex or named colors in new code.
- **Components:** pure components render only from props, with every state controlled by props; data loading lives in a separate wrapper. Build once and reuse; never copy a function or component.
- **Comments:** only where the code can't explain itself, two lines at most. If a comment restates a name, rename instead.
- **New tokens or token groups** get a page in `design-system/docs/src/pages` and an entry in `design-system/docs/src/navigation.ts`.
- Astro runs its dev server in the background when it detects a coding agent; stop it with `npx astro dev stop` in `design-system/docs`.
