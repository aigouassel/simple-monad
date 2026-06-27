export class Ok<T = unknown> {
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

export const ok = <T>(value: T): Ok<T> => new Ok(value);
