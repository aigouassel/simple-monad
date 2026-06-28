// A Bad's `reason` is a string *tag* (a discriminant), not free-form error data.
// Constraining it to `string` is what lets `Result.matchBad` switch on the reason.
export type ReasonType = string;
