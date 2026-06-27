# simple-monad

A tiny, dependency-free `Result` type for TypeScript — a value that is either
`Ok` (success) or `Bad` (failure), so errors live in the type system instead of
in thrown exceptions.

**Lightweight:** ~4.9 kB packed / ~11.8 kB unpacked, with **zero runtime dependencies**.

It comes in two layers:

- **Simple layer** — `ok` / `bad` produce plain tagged-union values you return,
  narrow with `isOk()` / `isBad()`, and read via `.value` / `.reason`.
- **`Result` layer** — an opt-in wrapper (`Result.from(...)`) you reach for when
  you want to _chain_ operations (`map`, `match`, `toUnion`).

## Usage

### Simple layer — `ok` / `bad` + narrowing

```ts
import { ok, bad, type OkOrBad } from "simple-monad";

function parsePort(raw: string): OkOrBad<number, string> {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    return bad(`invalid port: ${raw}`);
  }
  return ok(n);
}

const r = parsePort("8080");
if (r.isOk()) {
  // narrowed to Ok<number>, so `.value` is safe
  console.log(r.value);
} else {
  // narrowed to Bad<string>, so `.reason` is safe
  console.error(r.reason);
}
```

### `Result` layer — chaining

Lift a `OkOrBad` (or a bare `ok` / `bad`) with `Result.from(...)` when you want
to transform or fold it:

```ts
import { Result } from "simple-monad";

const label = Result.from(parsePort("8080"))
  .map((p) => p * 2) // transform the success value; a failure passes through
  .match({
    ok: (p) => `port ${p}`, // p: number
    bad: (e) => `error: ${e}`, // e: string
  });
```

## Compatibility

`simple-monad` is published as **ESM only** (`"type": "module"`): it ships ES modules
plus `.d.ts` type declarations, with no CommonJS build.

- **ESM projects / modern bundlers** — just `import` it, as shown above.
- **CommonJS consumers** — you can't `require("simple-monad")`. Either load it with a
  dynamic `import("simple-monad")`, or run a Node version new enough to `require()` ESM
  (Node ≥ 20.19 / ≥ 22.12).

## Why

Throwing is invisible in a function's signature — the caller has no way to know
what might go wrong. Returning a `OkOrBad<T, E>` makes the failure case part of
the type, so the compiler forces you to handle it.

The `isOk()` / `isBad()` guards are TypeScript [type predicates], so a single `if`
narrows the union to the correct branch and unlocks `.value` or `.reason` with no
casts.

[type predicates]: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates

## API

### Simple layer

| Export                 | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `ok(value)`            | Construct a success leaf, `Ok<T>`.                                 |
| `bad(reason)`          | Construct a failure leaf, `Bad<E>`.                                |
| `Ok<T>` / `Bad<E>`     | Leaf classes — `.value` / `.reason` plus a `success` discriminant. |
| `OkOrBad<O, B>`        | `Ok<O> \| Bad<B>` — the type a function returns.                   |
| `.isOk()` / `.isBad()` | Type-narrowing guards (one `if` unlocks `.value` / `.reason`).     |

### `Result` layer

Constructed only via `Result.from(...)` (the constructor is private).

| Member                 | Description                                                               |
| ---------------------- | ------------------------------------------------------------------------- |
| `Result.from(res)`     | Lift an `Ok` / `Bad` / `OkOrBad` into a `Result` for chaining.            |
| `.map(f)`              | Transform the success value; a failure passes through unchanged.          |
| `.match({ ok, bad })`  | Collapse to a single value by handling both arms.                         |
| `.toUnion()`           | Return the value or the reason (`A \| B`); types as `A` after `isOk()`.   |
| `.isOk()` / `.isBad()` | Narrow the _opposite_ rail to `never` (`isOk()` ⇒ error type is `never`). |

## Development

This repo uses **Yarn 4 with Plug'n'Play** — dependencies live in zip archives, not in
`node_modules`. After cloning:

1. **Enable Yarn and install** — run `corepack enable` once per machine (it activates the
   Yarn version pinned in `package.json`'s `packageManager` field), then `yarn install`
   (`yarn.lock` pins exact versions for reproducible installs).
2. **Configure your editor for PnP.** Editors bundle their own TypeScript, which looks
   for `node_modules` and so can't resolve PnP's zipped packages — you point the editor
   at a PnP-aware SDK instead.

   **VS Code** (what this repo is configured for):

   ```bash
   yarn dlx @yarnpkg/sdks vscode
   ```

   Then open any `.ts` file and choose **"Use Workspace Version"** when prompted (or
   Cmd+Shift+P → _TypeScript: Select TypeScript Version_). Without
   this, the editor shows phantom errors like _"Cannot find type definition file for
   'node'"_ even though `yarn build` succeeds.

   Optional : install the recommended
   **ZipFS** extension (`arcanis.vscode-zipfs`) to browse dependency sources.

   **Other editors** (Vim, Neovim, …): run `yarn dlx @yarnpkg/sdks <editor>` — see
   [editor SDKs].

### Project layout

| Path                | What it holds                                             |
| ------------------- | --------------------------------------------------------- |
| `src/index.ts`      | Public barrel — re-exports the simple layer and `Result`. |
| `src/lib/Ok.ts`     | `Ok` leaf + `ok()`.                                       |
| `src/lib/Bad.ts`    | `Bad` leaf + `bad()`.                                     |
| `src/lib/Result.ts` | `OkOrBad` and the `Result` wrapper.                       |
| `src/tests/`        | Jest specs (`Ok-Bad.test.ts`, `Result.test.ts`).          |

| Command         | What it does                                                                     |
| --------------- | -------------------------------------------------------------------------------- |
| `yarn build`    | Compile the library to `dist/` (ESM + `.d.ts`) via `tsc -p tsconfig.build.json`. |
| `yarn test`     | Run the [Jest] test suite (via ts-jest).                                         |
| `yarn lint`     | Check formatting and lint rules with [Biome].                                    |
| `yarn lint:fix` | Auto-fix lint issues and format.                                                 |
| `yarn format`   | Format only.                                                                     |

### Further reading

In-repo notes on the Yarn PnP toolchain:

- [Editor setup for Yarn PnP](reports/yarn-pnp-editor-sdk.md) — what `yarn dlx @yarnpkg/sdks vscode` does, and the problem it solves.
- [Jest + Yarn PnP](reports/jest-pnp-and-jestrunner.md) — running tests under PnP and keeping the VS Code Jest Runner extension working.

[Jest]: https://jestjs.io
[Biome]: https://biomejs.dev
[editor SDKs]: https://yarnpkg.com/getting-started/editor-sdks

## Contributing

Found a bug or have an idea? Please [open an issue](https://github.com/aigouassel/simple-monad/issues). Pull requests are welcome too.
