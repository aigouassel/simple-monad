# simple-monad

![version](https://img.shields.io/badge/version-3.0.0-blue)

A tiny, dependency-free `Result` type for TypeScript — a value that is either
`Ok` (success) or `Bad` (failure), so errors live in the type system instead of
in thrown exceptions.

```sh
npm install simple-monad@3.0.0
```

A failure is a string **tag** (`reason`) plus an optional **payload** (`value`):
`bad("invalid_port", raw)`. The tag is what you switch on; the payload carries the
data. Successes mirror it — `ok(x)` carries a value, `ok()` is a valueless success.

**Lightweight:** a handful of small modules, with **zero runtime dependencies**.

It comes in layers:

- **Simple layer** — `ok` / `bad` produce plain tagged-union values you return,
  narrow with `isOk()` / `isBad()`, and read via `.value` / `.reason`.
- **`Result` wrapper** — an opt-in chaining layer (`Result.from(...)` → `map`,
  `match`, `toUnion`).
- **`Result` static toolkit** — `unwrap*` / `matchBad` helpers that work directly
  on the leaves and **throw** a `ResultError` on the wrong variant.

## Usage

### Simple layer — `ok` / `bad` + narrowing

```ts
import { ok, bad, type Bad, type OkOrBad } from "simple-monad";

function parsePort(raw: string): OkOrBad<number, Bad<"invalid_port", string>> {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    return bad("invalid_port", raw); // tag + payload
  }
  return ok(n);
}

const r = parsePort("8080");
if (r.isOk()) {
  // narrowed to Ok<number>, so `.value` is safe
  console.log(r.value);
} else {
  // narrowed to Bad<"invalid_port", string>
  console.error(r.reason, r.value); // "invalid_port", the raw input
}
```

### Multiple failure modes

Because the second type argument is the **union of `Bad` leaves**, each tag stays
bound to its own payload — narrowing on `.reason` reveals the right `.value`:

```ts
function checkout(book: Book) {
  if (!inStock(book)) return bad("book_not_found", { isbn: book.isbn });
  if (book.price <= 0) return bad("invalid_price", { price: book.price });
  return ok(book.price);
}
// inferred:
//   Ok<number>
//   | Bad<"book_not_found", { isbn: string }>
//   | Bad<"invalid_price", { price: number }>
```

### Static toolkit — `matchBad` / `unwrap`

`matchBad` requires a `Bad` (narrow away the `Ok` first), then dispatches on the tag
(and throws `ResultError` if a tag is unhandled); `unwrap` pulls the success value out
or throws on a failure:

```ts
import { Result } from "simple-monad";

const result = checkout(book);
const message = result.isOk()
  ? `price: ${result.value}`
  : Result.matchBad(result, {
      book_not_found: (b) => `no such book: ${b.value.isbn}`, // b.value: { isbn: string }
      invalid_price: (b) => `bad price: ${b.value.price}`, // b.value: { price: number }
    });

const port = Result.unwrap(parsePort("8080")); // number — or throws ResultError on a Bad
```

### `Result` wrapper — chaining

Lift a leaf (or `OkOrBad`) with `Result.from(...)` when you want to transform or fold it:

```ts
import { Result } from "simple-monad";

const label = Result.from(parsePort("8080"))
  .map((p) => p * 2) // transform the success value; a failure passes through
  .match({
    ok: (p) => `port ${p}`, // p: number
    // `bad` is a per-reason map (same shape as `matchBad`), one handler per tag
    bad: { invalid_port: (b) => `error: ${b.reason}` }, // b: Bad<"invalid_port", string>
  });
```

`match` requires only the arms a result can produce: an all-success `Result<A, never>`
takes just `{ ok }` (and rejects a dead `bad`), an all-failure `Result<never, B>` takes
just `{ bad }`.

The wrapper is for chaining, not narrowing — it has no `isOk()` / `isBad()` guards.
To narrow, use `.match(...)`, or drop back to the leaf with `.toUnion()` and use the
leaf guards (`if (leaf.isOk()) …`), which narrow the value on both branches.

## Compatibility

`simple-monad` ships a **dual build** — native ES modules **and** CommonJS — plus
`.d.ts` type declarations. As of v3.1.0 it resolves cleanly under both module systems.

- **ESM projects / modern bundlers** — `import` it, as shown above.
- **CommonJS consumers** — `require("simple-monad")` works; it resolves to the CJS build
  (this is what unblocks CJS test runners such as Jest via ts-jest).
- **TypeScript** — one shared set of `.d.ts` serves both; no extra configuration.

## Why

Throwing is invisible in a function's signature — the caller has no way to know
what might go wrong. Returning an `OkOrBad<T, …>` makes the failure case part of
the type, so the compiler forces you to handle it.

The `isOk()` / `isBad()` guards are TypeScript [type predicates], so a single `if`
narrows the union to the correct branch and unlocks `.value` or `.reason` with no
casts. Modelling `reason` as a **string tag** lets `matchBad` switch on it, and
because the failure type is a union of `Bad` leaves, adding a failure mode is just
`| Bad<"new_tag", NewValue>` — each handler sees the payload paired with its tag.

[type predicates]: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates

## API

### Simple layer

| Export                         | Description                                                             |
| ------------------------------ | ----------------------------------------------------------------------- |
| `ok()` / `ok(value)`           | Success leaf — `Ok<void>` / `Ok<T>`.                                    |
| `bad(tag)` / `bad(tag, value)` | Failure leaf — `Bad<R>` / `Bad<R, V>` (string tag + payload).           |
| `Ok<T>` / `Bad<R, V>`          | Leaf classes — `.value`, `.reason` (Bad), and a `success` discriminant. |
| `OkOrBad<O, B>`                | `Ok<O> \| B`, where `B` is the union of `Bad` leaves — the return type. |
| `ReasonType`                   | The tag type (`string`).                                                |
| `.isOk()` / `.isBad()`         | Type-narrowing guards (one `if` unlocks `.value` / `.reason`).          |

### `Result` wrapper

Constructed only via `Result.from(...)` (the constructor is private).

| Member                | Description                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `Result.from(res)`    | Lift an `Ok` / `Bad` / `OkOrBad` into a `Result` for chaining.                                                                 |
| `.map(f)`             | Transform the success value; a failure passes through unchanged.                                                               |
| `.match({ ok, bad })` | Collapse to a single value; `bad` is a per-reason map (like `matchBad`). Each arm is required only when its rail is inhabited. |
| `.toUnion()`          | Drop back to the `Ok \| Bad` leaf union — the inverse of `Result.from`.                                                        |

### `Result` static toolkit

These operate on bare leaves and **throw `ResultError`** when handed the wrong variant.

| Member                             | Description                                                                |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `Result.unwrap(r)`                 | The `Ok` value — throws on a `Bad`.                                        |
| `Result.unwrapOnlyOk(r)`           | Like `unwrap`, but typed to accept only an `Ok`.                           |
| `Result.unwrapBad(r)`              | The `Bad` leaf — throws on an `Ok`.                                        |
| `Result.unwrapBadReason(r)`        | The `Bad`'s tag — throws on an `Ok`.                                       |
| `Result.unwrapBadValue(r)`         | The `Bad`'s payload — throws on an `Ok`.                                   |
| `Result.matchBad(r, map)`          | Requires a `Bad` (narrow first); dispatch on the tag; throws if unhandled. |
| `ResultError` / `throwResultError` | The error thrown by the helpers above, and its thrower.                    |

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

| Path                     | What it holds                                                  |
| ------------------------ | -------------------------------------------------------------- |
| `src/index.ts`           | Public barrel — re-exports every layer.                        |
| `src/lib/Ok.ts`          | `Ok` leaf + `ok()`.                                            |
| `src/lib/Bad.ts`         | `Bad` leaf + `bad()`.                                          |
| `src/lib/Result.ts`      | `OkOrBad`, the `Result` wrapper, and the static toolkit.       |
| `src/lib/ResultError.ts` | `ResultError` + `throwResultError`.                            |
| `src/lib/ReasonType.ts`  | `ReasonType` — the failure tag type.                           |
| `src/lib/AnyResult.ts`   | `AnyResult` — the widest leaf shape, for the helpers.          |
| `src/lib/types.ts`       | Inlined type utilities (kept in-repo to stay dependency-free). |
| `src/tests/`             | Jest specs (`Ok-Bad`, `Result`, `Result.helpers`).             |

| Command         | What it does                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `yarn build`    | Compile both builds: ESM to `dist/` (+ `.d.ts`) and CommonJS to `dist/cjs/` (`build:esm` + `build:cjs`). |
| `yarn test`     | Run the [Jest] test suite (via ts-jest).                                                                 |
| `yarn lint`     | Check formatting and lint rules with [Biome].                                                            |
| `yarn lint:fix` | Auto-fix lint issues and format.                                                                         |
| `yarn format`   | Format only.                                                                                             |

### Further reading

In-repo notes on the Yarn PnP toolchain:

- [Editor setup for Yarn PnP](reports/yarn-pnp-editor-sdk.md) — what `yarn dlx @yarnpkg/sdks vscode` does, and the problem it solves.
- [Jest + Yarn PnP](reports/jest-pnp-and-jestrunner.md) — running tests under PnP and keeping the VS Code Jest Runner extension working.

[Jest]: https://jestjs.io
[Biome]: https://biomejs.dev
[editor SDKs]: https://yarnpkg.com/getting-started/editor-sdks

## Contributing

Found a bug or have an idea? Please [open an issue](https://github.com/aigouassel/simple-monad/issues). Pull requests are welcome too.
