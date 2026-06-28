import type { AnyResult } from "./AnyResult.js";

// Thrown by the `unwrap*` / `matchBad` helpers when a result is the wrong
// variant for what was asked (e.g. `unwrap` on a Bad, or `unwrapBad` on an Ok).
// These helpers are the deliberate escape hatch out of the type-safe flow.
export class ResultError extends Error {
  readonly result: AnyResult;

  constructor(result: AnyResult) {
    const reason = result.success
      ? "SUCCESS_RESULT_AS_ERROR_RESULT"
      : result.reason;
    super(`ERROR_RESULT with reason: ${reason}`);
    this.name = "ResultError";
    this.result = result;
  }
}

export function throwResultError(result: AnyResult): never {
  throw new ResultError(result);
}
