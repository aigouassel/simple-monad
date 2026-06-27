# Editor setup for Yarn PnP — `yarn dlx @yarnpkg/sdks vscode`

*What this command is for, and the problem it solves.*

This repo uses **Yarn 4 with Plug'n'Play (PnP)**, so there is **no `node_modules`
folder** — dependencies are stored as `.zip` archives and resolved through a generated
`.pnp.cjs` file. That works great for the CLI (`yarn build`, `yarn test`), but **editors
need one extra setup step** to understand it. That step is:

```bash
yarn dlx @yarnpkg/sdks vscode
```

---

## The problem it solves

VS Code ships its **own** bundled copy of the TypeScript language server
(`tsserver`), and that copy resolves modules the classic way — by **walking
`node_modules`**. In a PnP project there is no `node_modules`, so the editor finds
nothing and you get:

- phantom red squiggles such as **“Cannot find type definition file for 'node'”**,
- no IntelliSense / autocomplete for dependencies,
- broken **Go to Definition** into library code,

**even though `yarn build` and `yarn test` pass.** That gap is the tell: the CLI tools go
through `.pnp.cjs` and are happy; only the editor is resolving the old way. Nothing is
actually broken in your checkout — the editor just needs to be pointed at a PnP-aware
TypeScript.

## What an "SDK" is here

In this context an **SDK** is a tiny **shim** that wraps a real tool (TypeScript, ESLint,
Prettier, …) so that it **preloads `.pnp.cjs` before running**. The wrapped tool then
resolves packages from the zip cache like everything else.

You can see the shim this repo generated:

```jsonc
// .yarn/sdks/typescript/package.json
{ "name": "typescript", "version": "6.0.3-sdk",
  "bin": { "tsc": "./bin/tsc", "tsserver": "./bin/tsserver" } }
```

The `-sdk` suffix and the `bin/tsserver` wrapper are the giveaway: it is not TypeScript
itself, but a PnP-aware front door to it.

## What the command generates

`yarn dlx` downloads and runs a package **once**, without adding it as a dependency. The
`@yarnpkg/sdks vscode` run produces three things:

1. **`.yarn/sdks/<tool>/`** — the shim packages (here, `typescript`), plus
   `.yarn/sdks/integrations.yml` recording that the `vscode` integration was generated.
2. **`.vscode/settings.json`** — points the editor at the SDK:
   ```jsonc
   "typescript.tsdk": ".yarn/sdks/typescript/lib",          // use the PnP-aware TS
   "typescript.enablePromptUseWorkspaceTsdk": true,          // offer to activate it
   "search.exclude": { "**/.yarn": true, "**/.pnp.*": true } // hide generated noise
   ```
3. **`.vscode/extensions.json`** — recommends the **ZipFS** extension
   (`arcanis.vscode-zipfs`). Because packages are zips, ZipFS lets you open and read a
   dependency's source *inside* the archive (e.g. when you Go to Definition into a
   library).

## Why `.vscode` is edited — and the one manual step

Setting `typescript.tsdk` is how VS Code is told *“use this TypeScript, not your bundled
one.”* For safety, VS Code won't switch automatically; after opening a `.ts` file you
accept once:

> **Cmd+Shift+P → “TypeScript: Select TypeScript Version” → “Use Workspace Version”**

(The `enablePromptUseWorkspaceTsdk` setting makes VS Code *offer* this on its own.)

---

## Using it in this repo

This repo **gitignores `.vscode/` and `.yarn/sdks/`** (they are machine-local, generated
artifacts), so each developer regenerates them after cloning:

```bash
yarn install                    # restore the zip cache + .pnp.*
yarn dlx @yarnpkg/sdks vscode   # generate the editor SDK + .vscode settings
# then open a .ts file → "Use Workspace Version"
```

Install the **ZipFS** extension once per machine to browse dependency sources (optional,
but recommended).

**Other editors** (Vim, Neovim, …) use the same mechanism with a different argument:
`yarn dlx @yarnpkg/sdks <editor>`.

📖 Official reference: **Editor SDKs** — <https://yarnpkg.com/getting-started/editor-sdks>
