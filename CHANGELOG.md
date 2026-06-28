# Changelog

All notable changes to this project are documented here. This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) and the format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
