/**
 * The success leaf of a result. Carries a `value` (defaulting to `void`, so a
 * valueless success is `Ok<void>`) and a `success: true` discriminant.
 *
 * @typeParam T - The type of the success value.
 */
export class Ok<T = void> {
  /** The success value. */
  readonly value: T;
  /** Discriminant marking this leaf as a success (always `true`). */
  readonly success: true = true;

  constructor(value: T) {
    this.value = value;
  }

  /** Type guard narrowing to {@link Ok} — always `true` for an `Ok`. */
  isOk(): this is Ok<T> {
    return this.success;
  }

  /** Type guard narrowing to {@link Bad} — always `false` for an `Ok`. */
  isBad(): this is never {
    return !this.success;
  }
}

/**
 * Build a valueless success.
 *
 * @returns An {@link Ok} with no payload (`Ok<void>`).
 */
export function ok(): Ok<void>;
/**
 * Build a success carrying a value.
 *
 * @typeParam T - The type of the success value.
 * @param value - The success payload.
 * @returns An {@link Ok} wrapping `value`.
 * @example
 * ```ts
 * const r = ok(42); // Ok<number>
 * ```
 */
export function ok<T>(value: T): Ok<T>;
export function ok<T>(value?: T): Ok<T> | Ok<void> {
  return new Ok(value as T);
}
