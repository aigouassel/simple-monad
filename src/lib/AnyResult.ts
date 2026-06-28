import type { Bad } from "./Bad.js";
import type { Ok } from "./Ok.js";
import type { ReasonType } from "./ReasonType.js";

/**
 * The widest result shape — any {@link Ok} or any {@link Bad}. The static
 * toolkit on {@link Result} accepts an `AnyResult` and narrows it at runtime.
 */
export type AnyResult = Ok<unknown> | Bad<ReasonType, unknown>;
