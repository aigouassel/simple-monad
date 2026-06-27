import type { Bad } from "./Bad.js";
import { type Ok, ok } from "./Ok.js";

export type OkOrBad<O, B> = Ok<O> | Bad<B>;

export class Result<A, B> {
  static from<A>(res: Ok<A>): Result<A, never>;
  static from<B>(res: Bad<B>): Result<never, B>;
  static from<A, B>(res: OkOrBad<A, B>): Result<A, B>;
  static from<A, B>(res: OkOrBad<A, B>): Result<A, B> {
    return new Result<A, B>(res);
  }

  private constructor(private readonly res: OkOrBad<A, B>) {}

  isOk(): this is Result<A, never> {
    return this.res.isOk();
  }

  isBad(): this is Result<never, B> {
    return this.res.isBad();
  }

  toUnion(): A | B {
    return this.res.isOk() ? this.res.value : this.res.reason;
  }

  map<U>(f: (value: A) => U): Result<U, B> {
    if (this.res.isOk()) {
      return new Result<U, B>(ok(f(this.res.value)));
    }
    // A Bad has no value to map; its reason (type B) flows through unchanged.
    return new Result<U, B>(this.res);
  }

  match<U, T>(handlers: { ok: (value: A) => U; bad: (reason: B) => T }): U | T {
    if (this.res.isOk()) {
      return handlers.ok(this.res.value);
    } else {
      return handlers.bad(this.res.reason);
    }
  }
}
