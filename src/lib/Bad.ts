import type { ReasonType } from "./ReasonType.js";

/**
 * The failure leaf of a result. Carries a string `reason` **tag** plus an
 * optional `value` payload (defaulting to `void`), and a `success: false`
 * discriminant.
 *
 * @typeParam R - The reason tag — a string literal such as `"not_found"`.
 * @typeParam V - The payload type (`void` when there is no payload).
 */
export class Bad<R extends ReasonType = ReasonType, V = void> {
  /** The tag naming which failure mode this is. */
  readonly reason: R;
  /** The failure payload (`undefined` when constructed without one). */
  readonly value: V;
  /** Discriminant marking this leaf as a failure (always `false`). */
  readonly success: false = false;

  constructor(reason: R, value: V) {
    this.reason = reason;
    this.value = value;
  }

  /** Type guard narrowing to {@link Ok} — always `false` for a `Bad`. */
  isOk(): this is never {
    return this.success;
  }

  /** Type guard narrowing to {@link Bad} — always `true` for a `Bad`. */
  isBad(): this is Bad<R, V> {
    return !this.success;
  }
}

/**
 * Build a {@link Bad} failure leaf from a `reason` tag, optionally carrying a
 * `value` payload that describes the failure. Pass `value` for a rich failure
 * (`Bad<R, V>`); omit it for a tag-only failure (`Bad<R, void>`).
 *
 * @typeParam R - The reason tag.
 * @typeParam V - The payload type.
 * @param reason - The string tag naming the failure.
 * @param value - Data describing the failure.
 * @returns A {@link Bad} wrapping `reason` and `value`.
 * @example
 * ```ts
 * const r = bad("invalid_price", { price: -5 });
 * // Bad<"invalid_price", { price: number }>
 * ```
 */
export function bad<R extends ReasonType, V>(reason: R, value: V): Bad<R, V>;
/**
 * Build a {@link Bad} failure leaf from a `reason` tag, optionally carrying a
 * `value` payload that describes the failure. Pass `value` for a rich failure
 * (`Bad<R, V>`); omit it for a tag-only failure (`Bad<R, void>`).
 *
 * @typeParam R - The reason tag.
 * @param reason - The string tag naming the failure.
 * @returns A {@link Bad} with no payload (`Bad<R, void>`).
 */
export function bad<R extends ReasonType>(reason: R): Bad<R, void>;
export function bad<R extends ReasonType, V>(
  reason: R,
  value?: V,
): Bad<R, V> | Bad<R, void> {
  return new Bad(reason, value as V);
}
