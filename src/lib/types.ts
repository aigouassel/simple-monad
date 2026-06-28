// Small type-level utilities, inlined so the package stays dependency-free.

/** `true` only when `T` is exactly `any`. */
export type IsAny<T> = 0 extends 1 & T ? true : false;

/** `true` when `T` is exactly `unknown` (and not `any`). */
export type IsUnknown<T> =
  IsAny<T> extends true ? false : unknown extends T ? true : false;

/** Turns a union `A | B` into the intersection `A & B`. */
export type UnionToIntersection<U> = (
  U extends unknown
    ? (arg: U) => void
    : never
) extends (arg: infer I) => void
  ? I
  : never;
