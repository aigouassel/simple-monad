import type { AnyResult } from "./AnyResult.js";
import type { Bad } from "./Bad.js";
import { type Ok, ok } from "./Ok.js";
import type { ReasonType } from "./ReasonType.js";
import { throwResultError } from "./ResultError.js";
import type { IsUnknown, UnionToIntersection } from "./types.js";

// `B` is the *union of failure leaves*, not separate tag/value axes — that keeps
// each Bad's tag bound to its own value (a discriminated union, not a cross-product).
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

export type MatchBadInput<T> =
  IsUnknown<MatchBadMap<T>> extends true ? never : MatchBadMap<T>;

type CallbackReturns<M> = {
  [K in keyof M]: M[K] extends (...args: never[]) => infer Ret ? Ret : never;
}[keyof M];

export type MatchBadResult<T, M> =
  T extends Ok<unknown> ? CallbackReturns<M> | undefined : CallbackReturns<M>;

export class Result<A, B extends Bad<ReasonType, unknown> = never> {
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

  isOk(): this is Result<A, never> {
    return this.res.isOk();
  }

  isBad(): this is Result<never, B> {
    return this.res.isBad();
  }

  toUnion(): OkOrBad<A, B> {
    return this.res;
  }

  map<U>(f: (value: A) => U): Result<U, B> {
    if (this.res.isOk()) {
      return new Result<U, B>(ok(f(this.res.value)));
    }
    // A Bad has no success value to map; it flows through with reason + value intact.
    return new Result<U, B>(this.res);
  }

  match<U, T>(handlers: { ok: (value: A) => U; bad: (bad: B) => T }): U | T {
    if (this.res.isOk()) {
      return handlers.ok(this.res.value);
    }
    // The bad handler receives the whole Bad union, so it can narrow on reason and read value.
    return handlers.bad(this.res);
  }

  // ===== Static toolkit: operates directly on bare Ok/Bad leaves (no wrapping). =====

  static unwrap<T extends AnyResult>(result: T): OkValueOf<T> {
    if (!result.success) {
      throwResultError(result);
    }
    return result.value as OkValueOf<T>;
  }

  static unwrapOnlyOk<T extends Ok<unknown>>(result: T): OkValueOf<T> {
    if (!(result as AnyResult).success) {
      throwResultError(result as AnyResult);
    }
    return result.value as OkValueOf<T>;
  }

  static unwrapBad<T extends AnyResult>(result: T): BadOf<T> {
    if (result.success) {
      throwResultError(result);
    }
    return result as unknown as BadOf<T>;
  }

  static unwrapBadReason<T extends AnyResult>(result: T): BadReasonOf<T> {
    const failure = Result.unwrapBad(result) as unknown as Bad<
      ReasonType,
      unknown
    >;
    return failure.reason as BadReasonOf<T>;
  }

  static unwrapBadValue<T extends AnyResult>(result: T): BadValueOf<T> {
    const failure = Result.unwrapBad(result) as unknown as Bad<
      ReasonType,
      unknown
    >;
    return failure.value as BadValueOf<T>;
  }

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
