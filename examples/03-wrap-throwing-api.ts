/**
 * Example 03 — turn a throwing API into a Result.
 *
 * `JSON.parse` throws on bad input, and that failure is invisible in its
 * signature. Wrapping it once at the boundary converts the hidden exception into
 * an explicit `Bad` the caller is forced to handle.
 */
import { bad, type Bad, ok, type OkOrBad } from "simple-monad";

function parseJson<T>(raw: string): OkOrBad<T, Bad<"invalid_json", string>> {
  try {
    return ok(JSON.parse(raw) as T);
  } catch (err) {
    return bad(
      "invalid_json",
      err instanceof Error ? err.message : String(err),
    );
  }
}

const okInput = '{"id":1}';
console.log(`Input: ${okInput}`);
const good = parseJson<{ id: number }>(okInput);
console.log(good.isOk() ? good.value : good.reason); // { id: 1 }

const badInput = "{ not json";
console.log(`Input: ${JSON.stringify(badInput)}`);
const broken = parseJson(badInput);
console.error(broken.isBad() ? `failed: ${broken.reason}` : "ok"); // failed: invalid_json
