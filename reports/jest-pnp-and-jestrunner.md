# Jest + Yarn PnP — and the VS Code "Jest Runner" extension

*How tests run under Plug'n'Play, and the one editor setting that keeps the run/debug
codelens working.*

This repo uses **Yarn 4 with Plug'n'Play (PnP)**: there is **no `node_modules` folder** —
dependencies are `.zip` archives resolved through a generated `.pnp.cjs`. Getting Jest to
work in that world has **two layers**, because PnP's "no `node_modules`" rule bites at two
different boundaries.

---

## The root cause, at two boundaries

Any tool that bypasses Node's PnP-patched resolver fails under PnP. For Jest that happens
twice:

1. **Resolution *inside* a test run** — the modules Jest itself loads (your code, ts-jest,
   transitive deps). Fixed in `jest.config.cjs` (Layer 1).
2. ***Launching* Jest at all** — finding the `jest` executable. The VS Code "Jest Runner"
   extension shells out to `jest` directly, which under PnP isn't on disk. Fixed in
   `.vscode/settings.json` (Layer 2).

Same cause, two fixes.

---

## Layer 1 — making the Jest CLI work (`jest.config.cjs`)

```js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
  resolver: "jest-pnp-resolver",
  passWithNoTests: true,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.spec.json" }],
  },
};
```

What each PnP-relevant piece does:

- **`resolver: "jest-pnp-resolver"`** — Jest ships its own module resolver that assumes a
  `node_modules` layout. `jest-pnp-resolver` routes Jest's resolution through `.pnp.cjs`
  instead, so it can find packages inside the zip cache. It is a declared
  **`devDependency`** — under PnP you may only use what you explicitly declare, so it
  cannot be relied on transitively.
- **`transform` → `ts-jest` with `tsconfig.spec.json`** — compiles the TypeScript specs.
  `tsconfig.spec.json` emits **CommonJS** (Jest does not load ESM natively) and adds the
  `jest` global types.
- **`moduleNameMapper` (`.js` strip)** — the library is ESM, so specs import with explicit
  `.js` extensions (`import … from "./index.js"`), which TypeScript's `nodenext` resolution
  requires. But ts-jest runs them as CommonJS, where `./index.js` does **not** resolve to
  `index.ts`. The mapper strips the trailing `.js` from relative imports for test
  resolution only.

### The hidden PnP gotcha: `ts-jest` → `jest-util`

`ts-jest` declares `jest-util` as a **peer dependency it doesn't pull in**. Under PnP's
strict resolution, that unmet peer is a **hard error**, not a warning. The fix lives in
`.yarnrc.yml`:

```yaml
packageExtensions:
  "ts-jest@*":
    dependencies:
      jest-util: "*"
```

This patches *ts-jest's* manifest to declare `jest-util` as a dependency, satisfying PnP
**without** adding `jest-util` to our own `dependencies`.

📖 `packageExtensions` — <https://yarnpkg.com/configuration/yarnrc#packageExtensions>

With all of the above, **`yarn test` works** — `yarn` preloads `.pnp.cjs`, and Jest
resolves everything through it.

---

## Layer 2 — the VS Code "Jest Runner" extension

The **Jest Runner** extension (`firsttris.vscode-jest-runner`) adds inline **`Run | Debug`**
codelens above each `it`/`describe`, so you can run a single test from the editor.

**Why it breaks under PnP:** by default the extension launches the `jest` **binary
directly** (it expects `node_modules/.bin/jest`). With PnP there is no `node_modules`, so
the binary isn't on disk and the run fails — even though `yarn test` works fine from the
terminal.

**The fix** (`.vscode/settings.json`):

```jsonc
"jestrunner.jestCommand": "yarn test"
```

Now the extension invokes **`yarn test`** (with the specific test file/name appended)
instead of a raw `jest`. Because the command goes through `yarn`, `.pnp.cjs` is preloaded
first, and the run/debug buttons behave exactly like the CLI.

> This is the same pattern as the TypeScript editor SDK: a tool that bypasses Node's
> PnP-patched resolver — here, to *find the executable* — needs a PnP-aware entry point.
> For TypeScript that's the SDK shim; for Jest Runner it's "go through `yarn`."

---

## Notes specific to this repo

- **`.vscode/` is gitignored**, so `jestrunner.jestCommand` is a **local** setting. After
  cloning, add it yourself (or it ships in your own VS Code profile). The Jest Runner
  extension is not auto-installed; install it per machine if you want the codelens.
- **`jest-pnp-resolver` is in `devDependencies`** — keep it there; removing it breaks
  `yarn test` under PnP.
- The companion doc `reports/yarn-pnp-editor-sdk.md` covers the TypeScript side of editor
  setup (`yarn dlx @yarnpkg/sdks vscode`).

## Reference index

- Plug'n'Play — <https://yarnpkg.com/features/pnp>
- `packageExtensions` — <https://yarnpkg.com/configuration/yarnrc#packageExtensions>
- `jest-pnp-resolver` — <https://github.com/arcanis/jest-pnp-resolver>
- Jest Runner extension — <https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner>
