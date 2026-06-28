/**
 * Example 01 — validate untrusted input (the simple layer).
 *
 * The most basic shape: a function returns `ok(value)` on success or a tagged
 * `bad(reason, payload)` on failure, and the caller narrows with `isOk()` /
 * `isBad()`. No wrapper, no toolkit — just the leaves.
 */
import { bad, type Bad, ok, type OkOrBad } from "simple-monad";

function parsePort(raw: string): OkOrBad<number, Bad<"invalid_port", string>> {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    // The tag names the failure; the payload keeps the offending input.
    return bad("invalid_port", raw);
  }
  return ok(n);
}

for (const raw of ["8080", "70000", "abc"]) {
  const result = parsePort(raw);
  if (result.isOk()) {
    // narrowed to Ok<number> — `.value` is safe
    console.log(`✓ ${raw} → port ${result.value}`);
  } else {
    // narrowed to Bad<"invalid_port", string> — `.reason` and `.value` are safe
    console.error(`✗ ${result.reason}: ${JSON.stringify(result.value)}`);
  }
}
