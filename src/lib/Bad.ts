import type { ReasonType } from "./ReasonType.js";

// `Bad` is the failure leaf. `reason` is a string *tag* describing what went
// wrong; `value` is an optional payload carrying data about the failure. The
// payload type defaults to `void`, so `bad(tag)` is a tag-only failure and
// `bad(tag, x)` attaches `x`.
export class Bad<R extends ReasonType = ReasonType, V = void> {
  readonly reason: R;
  readonly value: V;
  readonly success: false = false;

  constructor(reason: R, value: V) {
    this.reason = reason;
    this.value = value;
  }

  isOk(): this is never {
    return this.success;
  }

  isBad(): this is Bad<R, V> {
    return !this.success;
  }
}

export function bad<R extends ReasonType>(reason: R): Bad<R, void>;
export function bad<R extends ReasonType, V>(reason: R, value: V): Bad<R, V>;
export function bad<R extends ReasonType, V>(
  reason: R,
  value?: V,
): Bad<R, V> | Bad<R, void> {
  return new Bad(reason, value as V);
}
