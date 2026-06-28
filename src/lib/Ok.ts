// `Ok` is the success leaf. The payload type defaults to `void`, so `ok()` is a
// valueless success and `ok(x)` is a success carrying `x`.
export class Ok<T = void> {
  readonly value: T;
  readonly success: true = true;

  constructor(value: T) {
    this.value = value;
  }

  isOk(): this is Ok<T> {
    return this.success;
  }

  isBad(): this is never {
    return !this.success;
  }
}

export function ok(): Ok<void>;
export function ok<T>(value: T): Ok<T>;
export function ok<T>(value?: T): Ok<T> | Ok<void> {
  return new Ok(value as T);
}
