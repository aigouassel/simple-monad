import type { AnyResult } from "./AnyResult.js";

/**
 * Error thrown by the {@link Result} `unwrap*` and {@link Result.matchBad}
 * helpers when a result is the wrong variant for what was asked (e.g. `unwrap`
 * on a {@link Bad}, or `unwrapBad` on an {@link Ok}). The message embeds the
 * offending reason tag. These helpers are the deliberate escape hatch out of the
 * type-safe flow.
 */
export class ResultError extends Error {
  /** The result that triggered the error. */
  readonly result: AnyResult;

  /**
   * @param result - The result that was the wrong variant.
   */
  constructor(result: AnyResult) {
    const reason = result.success
      ? "SUCCESS_RESULT_AS_ERROR_RESULT"
      : result.reason;
    super(`ERROR_RESULT with reason: ${reason}`);
    this.name = "ResultError";
    this.result = result;
  }
}

/**
 * Throw a {@link ResultError} for `result`. Returns `never`, so a call
 * terminates control flow (and narrows the variable afterwards).
 *
 * @param result - The offending result.
 * @throws {@link ResultError} always.
 */
export function throwResultError(result: AnyResult): never {
  throw new ResultError(result);
}
