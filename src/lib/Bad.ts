export class Bad<T = unknown> {
  readonly reason: T;
  readonly success: false = false;

  constructor(reason: T) {
    this.reason = reason;
  }

  isOk(): this is never {
    return this.success;
  }

  isBad(): this is Bad<T> {
    return !this.success;
  }
}

export const bad = <E = never>(reason: E): Bad<E> => new Bad<E>(reason);
