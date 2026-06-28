/**
 * The type of a {@link Bad}'s `reason` — a string **tag** naming a failure mode
 * (e.g. `"not_found"`). Tags are the discriminant {@link Result.matchBad}
 * switches on; the failure *data* lives separately in the `value` payload.
 */
export type ReasonType = string;
