# Changelog

All notable changes to this project are documented here. This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) and the format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [3.0.0] - 2026-06-28

This release tightens the **`Result` wrapper** and the **`matchBad`** toolkit so the
type system catches more mistakes at the call site. Narrowing now belongs entirely to
the leaves; the wrapper is for chaining and folding. The simple layer (`ok` / `bad`,
`isOk` / `isBad`, `unwrap*`) is unchanged.

### Changed (breaking)

- **Removed `Result.isOk()` / `Result.isBad()` (the wrapper guards).** A single generic
  class cannot narrow on negation — TypeScript can't subtract `Result<A, never>` from
  `Result<A, B>` — so these never narrowed the value the way the same-named _leaf_
  guards do. Narrow with the leaves instead: `.match(...)`, or `.toUnion()` then
  `isOk()` / `isBad()` on the leaf union.
- **`Result.matchBad(result, map)` now requires `result` to be a `Bad`** (was any
  result). Passing a value that could still be an `Ok` is a compile error at the call
  site, instead of leaking `| undefined` into the result — narrow the `Ok` away first.
  It no longer returns `undefined` for an `Ok`; forced through a cast, an `Ok` now
  **throws** `ResultError` (consistent with the `unwrap*` helpers). `MatchBadResult` no
  longer includes `undefined`.
- **`match`'s `bad` arm is now a per-reason map**, identical to `matchBad` — one
  callback per failure tag (`bad: { tag: (b) => … }`), each receiving the `Bad` for that
  tag — instead of a single `bad: (b) => …` handler. Failures refine by tag with no
  manual `switch`.
- **`match` drops the unreachable handler.** An all-success `Result<A, never>` takes
  just `{ ok }` (and now _rejects_ a dead `bad`); an all-failure `Result<never, B>`
  takes just `{ bad }`. When both rails are inhabited, both arms are still required.

### Migrating from 2.x

```ts
// Wrapper narrowing → narrow the leaf instead
- if (Result.from(x).isOk()) { … }
+ const leaf = Result.from(x).toUnion();
+ if (leaf.isOk()) { … }                  // or just use .match(...)

// matchBad on a possible Ok → narrow first
- const msg = Result.matchBad(result, { … }) ?? "ok";
+ if (result.isOk()) return "ok";
+ const msg = Result.matchBad(result, { … });

// match's bad handler → a per-reason map
- result.match({ ok: (v) => v, bad: (b) => b.reason })
+ result.match({ ok: (v) => v, bad: { my_tag: (b) => b.reason } })

// match on a result that can't fail → drop the dead bad handler
- Result.from(ok(2)).match({ ok: (n) => n, bad: () => -1 })
+ Result.from(ok(2)).match({ ok: (n) => n })
```

## [2.0.0] - 2026-06-28

This release reshapes the **error channel**. A `Bad` is no longer "any error value" —
it is now a string **tag** (`reason`) plus an optional **payload** (`value`). On top
of that, a new static toolkit (`unwrap*` / `matchBad`) was added. The success channel
is essentially unchanged: `ok(x)` still produces `Ok<x>`, and `ok()` is new.

### Added

- `ok()` — a valueless success, `Ok<void>` (the existing `ok(x)` is unchanged).
- `bad(tag, value)` — an optional second argument carrying a payload alongside the tag.
- Static toolkit on `Result`, operating directly on bare `Ok`/`Bad` leaves:
  - `Result.unwrap` — the `Ok` value, or **throws** `ResultError` on a `Bad`.
  - `Result.unwrapOnlyOk` — like `unwrap`, but typed to accept only an `Ok`.
  - `Result.unwrapBad` — the `Bad` leaf, or **throws** on an `Ok`.
  - `Result.unwrapBadReason` — the `Bad`'s tag, or **throws** on an `Ok`.
  - `Result.unwrapBadValue` — the `Bad`'s payload, or **throws** on an `Ok`.
  - `Result.matchBad(result, map)` — dispatches on the `reason` tag; **throws** if no
    handler matches; returns `undefined` for an `Ok`.
- New exports: `ReasonType`, `AnyResult`, `ResultError`, `throwResultError`,
  `MatchBadInput`, `MatchBadResult`.

### Changed (breaking)

- **`bad()` reason must be a `string` tag.** Structured error data moves to the new
  second argument. `bad({ code: 404 })` and `bad(new Error())` no longer type-check.
- **`Bad<E>` → `Bad<R extends string = string, V = void>`.** The first param is the tag,
  the second is the payload type.
- **`Bad.reason` is now a tag, not the error.** Code reading `.reason.message` / nested
  fields must read them off `.value` instead.
- **`match()`'s `bad` handler now receives the whole `Bad`**, not the bare reason.
  Use `bad: (b) => b.reason` (and `b.value`) instead of `bad: (reason) => reason`.
- **`Result<A, B>` — `B` is now the *union of `Bad` leaves*** (constrained
  `B extends Bad<…> = never`), not the error type. This keeps each tag bound to its own
  value. `Result<number, string>` becomes e.g. `Result<number, Bad<"nan", string>>`.
- **`OkOrBad<O, B>` — same change:** `OkOrBad<O, B extends Bad<…> = never> = Ok<O> | B`.
- **`toUnion()` now returns the underlying `Ok<A> | B` leaf union** (the inverse of
  `Result.from`), not `A | reason`. Narrow it with `isOk()`/`isBad()` or pass it to the
  static toolkit.
- **`Ok<T>` default changed `unknown` → `void`.** Only affects a bare `Ok` annotation
  (`ok(42)` is unchanged); a valueless success now reads as `Ok<void>`.

### Notes

- The library now **throws** (`ResultError`) — but only from the new `unwrap*` /
  `matchBad` helpers. No previously existing code path changes its behaviour.
- Still **zero runtime dependencies**: the type-level helpers it needs are inlined.

### Migrating from 1.x

```ts
// Constructing a failure
- bad({ code: 404, message: "missing" })
+ bad("NOT_FOUND", { code: 404, message: "missing" })

// Reading the failure
- if (r.isBad()) console.log(r.reason.message)
+ if (r.isBad()) console.log(r.value.message)   // tag is in r.reason now

// Pattern-matching the wrapper
- result.match({ ok: (v) => v, bad: (reason) => reason })
+ result.match({ ok: (v) => v, bad: (b) => b.reason })

// Type annotations
- let r: Result<number, string>
+ let r: Result<number, Bad<"nan", string>>

// Collapsing the wrapper
- const value = result.toUnion()          // was A | reason
+ const leaf = result.toUnion()           // now Ok<A> | Bad<…>
+ const value = Result.unwrap(leaf)       // or narrow with leaf.isOk()
```

## [1.0.0]

- Initial release: a tiny `Result` (`Ok` / `Bad`) type with `ok`/`bad` leaves,
  `isOk`/`isBad` guards, and a `Result` wrapper (`from`/`map`/`match`/`toUnion`).
