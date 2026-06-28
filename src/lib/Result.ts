import type { AnyResult } from "./AnyResult.js";
import type { Bad } from "./Bad.js";
import { type Ok, ok } from "./Ok.js";
import type { ReasonType } from "./ReasonType.js";
import { throwResultError } from "./ResultError.js";
import type { IsUnknown, UnionToIntersection } from "./types.js";

/**
 * A function's result type: an {@link Ok} success, or one of the {@link Bad}
 * failure leaves in `B`. `B` is the **union of `Bad` leaves**, which keeps each
 * tag bound to its own payload (a discriminated union, not a cross-product).
 *
 * @typeParam O - The success value type.
 * @typeParam B - The union of possible {@link Bad} failures (`never` if none).
 * @example
 * ```ts
 * type ParseResult = OkOrBad<number, Bad<"nan", string>>;
 * ```
 */
export type OkOrBad<O, B extends Bad<ReasonType, unknown> = never> = Ok<O> | B;

// --- extraction types: pull a precise type out of a result union ---
type OkValueOf<T> = T extends Ok<infer U> ? U : never;
type BadOf<T> = T extends Bad<infer R, infer V> ? Bad<R, V> : never;
type BadReasonOf<T> = T extends Bad<infer R, unknown> ? R : never;
type BadValueOf<T> = T extends Bad<ReasonType, infer V> ? V : never;

// --- matchBad types: a map from each reason tag to a handler for that Bad ---
type ReasonCallbacks<T> =
  T extends Bad<infer R, infer V>
    ? { [K in R]: (result: Bad<R, V>) => unknown }
    : Record<never, never>;

type MatchBadMap<T> = UnionToIntersection<ReasonCallbacks<T>>;

/**
 * The handler map {@link Result.matchBad} expects for a result `T`: one callback
 * per reason tag, each receiving the {@link Bad} carrying that tag. Resolves to
 * `never` when `T` has no failure variants to match.
 *
 * @typeParam T - The result union being matched.
 */
export type MatchBadInput<T> =
  IsUnknown<MatchBadMap<T>> extends true ? never : MatchBadMap<T>;

type CallbackReturns<M> = {
  [K in keyof M]: M[K] extends (...args: never[]) => infer Ret ? Ret : never;
}[keyof M];

/**
 * The return type of {@link Result.matchBad} for result `T` and handler map `M`:
 * the union of the handlers' return types, plus `undefined` when `T` can be an
 * {@link Ok}.
 *
 * @typeParam T - The result union being matched.
 * @typeParam M - The handler map passed to `matchBad`.
 */
export type MatchBadResult<T, M> =
  T extends Ok<unknown> ? CallbackReturns<M> | undefined : CallbackReturns<M>;

/**
 * An opt-in wrapper around an {@link Ok} / {@link Bad} leaf that adds chaining
 * combinators (`map`, `match`, `toUnion`) and hosts the static `unwrap*` /
 * {@link Result.matchBad | matchBad} toolkit. Build it with {@link Result.from}
 * — the constructor is private.
 *
 * @typeParam A - The success value type.
 * @typeParam B - The union of possible {@link Bad} failures (`never` if none).
 */
export class Result<A, B extends Bad<ReasonType, unknown> = never> {
  /**
   * Lift an {@link Ok} / {@link Bad} leaf (or an {@link OkOrBad} union) into a
   * {@link Result} for chaining.
   *
   * @param res - The leaf to wrap.
   * @returns A {@link Result} wrapping `res`.
   */
  static from<A>(res: Ok<A>): Result<A, never>;
  static from<B extends Bad<ReasonType, unknown>>(res: B): Result<never, B>;
  static from<A, B extends Bad<ReasonType, unknown>>(
    res: OkOrBad<A, B>,
  ): Result<A, B>;
  static from<A, B extends Bad<ReasonType, unknown>>(
    res: OkOrBad<A, B>,
  ): Result<A, B> {
    return new Result<A, B>(res);
  }

  private constructor(private readonly res: OkOrBad<A, B>) {}

  /** Type guard narrowing the failure rail to `never` when this is a success. */
  isOk(): this is Result<A, never> {
    return this.res.isOk();
  }

  /** Type guard narrowing the success rail to `never` when this is a failure. */
  isBad(): this is Result<never, B> {
    return this.res.isBad();
  }

  /**
   * Drop back to the underlying `Ok<A> | B` leaf union — the inverse of
   * {@link Result.from}. Narrow it with the leaf guards or feed it to the static
   * toolkit.
   *
   * @returns The wrapped leaf union.
   */
  toUnion(): OkOrBad<A, B> {
    return this.res;
  }

  /**
   * Transform the success value; a failure passes through unchanged (its reason
   * and value intact).
   *
   * @typeParam U - The mapped success type.
   * @param f - Maps the success value `A` to `U`.
   * @returns A {@link Result} with the value mapped, failures preserved.
   */
  map<U>(f: (value: A) => U): Result<U, B> {
    if (this.res.isOk()) {
      return new Result<U, B>(ok(f(this.res.value)));
    }
    // A Bad has no success value to map; it flows through with reason + value intact.
    return new Result<U, B>(this.res);
  }

  /**
   * Collapse to a single value by handling both arms.
   *
   * @typeParam U - The success handler's return type.
   * @typeParam T - The failure handler's return type.
   * @param handlers - `ok` receives the value; `bad` receives the whole
   * {@link Bad} union, so it can narrow on `reason` and read `value`.
   * @returns Whatever the chosen handler returns.
   */
  match<U, T>(handlers: { ok: (value: A) => U; bad: (bad: B) => T }): U | T {
    if (this.res.isOk()) {
      return handlers.ok(this.res.value);
    }
    // The bad handler receives the whole Bad union, so it can narrow on reason and read value.
    return handlers.bad(this.res);
  }

  // ===== Static toolkit: operates directly on bare Ok/Bad leaves (no wrapping). =====

  /**
   * Extract the success value.
   *
   * @typeParam T - The result type.
   * @param result - The result to unwrap.
   * @returns The {@link Ok} value.
   * @throws {@link ResultError} if `result` is a {@link Bad}.
   */
  static unwrap<T extends AnyResult>(result: T): OkValueOf<T> {
    if (!result.success) {
      throwResultError(result);
    }
    return result.value as OkValueOf<T>;
  }

  /**
   * Like {@link Result.unwrap}, but typed to accept only an {@link Ok}.
   *
   * @typeParam T - The {@link Ok} type.
   * @param result - The success to read.
   * @returns The {@link Ok} value.
   * @throws {@link ResultError} if handed a {@link Bad} through an unsafe cast.
   */
  static unwrapOnlyOk<T extends Ok<unknown>>(result: T): OkValueOf<T> {
    if (!(result as AnyResult).success) {
      throwResultError(result as AnyResult);
    }
    return result.value as OkValueOf<T>;
  }

  /**
   * Extract the {@link Bad} leaf.
   *
   * @typeParam T - The result type.
   * @param result - The result to unwrap.
   * @returns The {@link Bad} leaf.
   * @throws {@link ResultError} if `result` is an {@link Ok}.
   */
  static unwrapBad<T extends AnyResult>(result: T): BadOf<T> {
    if (result.success) {
      throwResultError(result);
    }
    return result as unknown as BadOf<T>;
  }

  /**
   * Extract a failure's reason tag.
   *
   * @typeParam T - The result type.
   * @param result - The result to unwrap.
   * @returns The {@link Bad}'s `reason` tag.
   * @throws {@link ResultError} if `result` is an {@link Ok}.
   */
  static unwrapBadReason<T extends AnyResult>(result: T): BadReasonOf<T> {
    const failure = Result.unwrapBad(result) as unknown as Bad<
      ReasonType,
      unknown
    >;
    return failure.reason as BadReasonOf<T>;
  }

  /**
   * Extract a failure's payload.
   *
   * @typeParam T - The result type.
   * @param result - The result to unwrap.
   * @returns The {@link Bad}'s `value` payload (`undefined` if it has none).
   * @throws {@link ResultError} if `result` is an {@link Ok}.
   */
  static unwrapBadValue<T extends AnyResult>(result: T): BadValueOf<T> {
    const failure = Result.unwrapBad(result) as unknown as Bad<
      ReasonType,
      unknown
    >;
    return failure.value as BadValueOf<T>;
  }

  /**
   * Dispatch on a failure's reason tag, like a `switch` over the {@link Bad}
   * variants.
   *
   * @typeParam T - The result type being matched.
   * @typeParam M - The handler map (see {@link MatchBadInput}).
   * @param result - The result to match.
   * @param map - One handler per reason tag; each receives the matching {@link Bad}.
   * @returns The chosen handler's return value, or `undefined` for an {@link Ok}.
   * @throws {@link ResultError} if the failure's reason has no handler.
   * @example
   * ```ts
   * Result.matchBad(parse(input), {
   *   nan: (b) => `not a number: ${b.value}`,
   * });
   * ```
   */
  static matchBad<T extends AnyResult, M extends MatchBadInput<T>>(
    result: T,
    map: M,
  ): MatchBadResult<T, M> {
    if (!result.success) {
      const failure = result as unknown as Bad<ReasonType, unknown>;
      const handlers = map as Record<
        string,
        ((result: Bad<ReasonType, unknown>) => unknown) | undefined
      >;
      const entry = handlers[failure.reason];
      if (!entry) {
        throwResultError(failure);
      }
      return entry(failure) as MatchBadResult<T, M>;
    }
    return undefined as MatchBadResult<T, M>;
  }
}
