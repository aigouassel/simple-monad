/**
 * Example 05 — the `Result` wrapper for chaining.
 *
 * `Result.from(...)` lifts a leaf so you can `map` the success value (a failure
 * passes straight through, untouched) and `match` both arms down to a single
 * value. Reach for this when you have a pipeline of transforms; stick with the
 * bare leaves (examples 01–04) when you just branch once.
 */
import { bad, type Bad, ok, type OkOrBad, Result } from "simple-monad";

function parseAmount(
  raw: string,
): OkOrBad<number, Bad<"not_a_number", string>> {
  const n = Number(raw);
  return Number.isNaN(n) ? bad("not_a_number", raw) : ok(n);
}

function formatPrice(raw: string): string {
  return Result.from(parseAmount(raw))
    .map((n) => Math.round(n * 100)) // to cents — runs only on success
    .map((cents) => `$${(cents / 100).toFixed(2)}`)
    .match({
      ok: (label) => label, // "$42.00"
      // `bad` is a per-reason map (same shape as Result.matchBad) — the failure
      // flowed through both maps untouched and lands here by its tag.
      bad: { not_a_number: (b) => `not a price: ${b.value}` },
    });
}

console.log(`Formatting prices...`);
console.log(formatPrice("42")); // $42.00
console.error(formatPrice("abc")); // not a price: abc — the failure arm
