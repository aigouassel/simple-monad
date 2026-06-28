import type { Bad } from "./Bad.js";
import type { Ok } from "./Ok.js";
import type { ReasonType } from "./ReasonType.js";

// The widest result shape: any Ok or any Bad. Used by the static helpers, which
// accept whatever result they're handed and narrow at runtime.
export type AnyResult = Ok<unknown> | Bad<ReasonType, unknown>;
