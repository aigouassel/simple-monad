import {
  bad,
  type Ok,
  ok,
  Result,
  ResultError,
  throwResultError,
} from "../index.js";

describe("Result.unwrap", () => {
  it("returns the value of an Ok", () => {
    expect(Result.unwrap(ok(3712))).toBe(3712);
  });

  it("returns undefined for a void Ok", () => {
    expect(Result.unwrap(ok())).toBeUndefined();
  });

  it("throws ResultError on a Bad", () => {
    expect(() => Result.unwrap(bad("SOMETHING_WRONG"))).toThrow(ResultError);
  });
});

describe("Result.unwrapOnlyOk", () => {
  it("returns the value of an Ok", () => {
    expect(Result.unwrapOnlyOk(ok(3712))).toBe(3712);
  });

  it("throws ResultError when handed a Bad through an unsafe cast", () => {
    const sneaky = bad("SOMETHING_WRONG") as unknown as Ok<unknown>;
    expect(() => Result.unwrapOnlyOk(sneaky)).toThrow(ResultError);
  });
});

describe("Result.unwrapBad", () => {
  it("returns the Bad leaf", () => {
    const b = Result.unwrapBad(bad("SOMETHING_WRONG", 3712));
    expect(b.reason).toBe("SOMETHING_WRONG");
    expect(b.value).toBe(3712);
  });

  it("throws ResultError on an Ok", () => {
    expect(() => Result.unwrapBad(ok(3712))).toThrow(ResultError);
  });
});

describe("Result.unwrapBadReason", () => {
  it("returns the reason tag", () => {
    expect(Result.unwrapBadReason(bad("SOMETHING_WRONG", 3712))).toBe(
      "SOMETHING_WRONG",
    );
  });

  it("throws ResultError on an Ok", () => {
    expect(() => Result.unwrapBadReason(ok())).toThrow(ResultError);
  });
});

describe("Result.unwrapBadValue", () => {
  it("returns the payload", () => {
    expect(Result.unwrapBadValue(bad("SOMETHING_WRONG", 3712))).toBe(3712);
  });

  it("returns undefined when the Bad has no payload", () => {
    expect(Result.unwrapBadValue(bad("SOMETHING_WRONG"))).toBeUndefined();
  });

  it("throws ResultError on an Ok", () => {
    expect(() => Result.unwrapBadValue(ok(3712))).toThrow(ResultError);
  });
});

describe("Result.matchBad", () => {
  it("dispatches on the reason tag", () => {
    const out = Result.matchBad(bad("SOMETHING_WRONG"), {
      SOMETHING_WRONG: (x) => x.reason,
    });
    expect(out).toBe("SOMETHING_WRONG");
  });

  it("gives the handler the Bad's value", () => {
    const out = Result.matchBad(bad("SOMETHING_WRONG", 3712), {
      SOMETHING_WRONG: (x) => x.value,
    });
    expect(out).toBe(3712);
  });

  it("throws ResultError when no handler matches the reason", () => {
    const result = bad("OTHER_SOMETHING_WRONG" as "SOMETHING_WRONG");
    expect(() =>
      Result.matchBad(result, {
        SOMETHING_WRONG: (x) => x.reason,
      }),
    ).toThrow(ResultError);
  });

  it("returns undefined for an Ok", () => {
    expect(Result.matchBad(ok(), {})).toBeUndefined();
  });
});

describe("throwResultError", () => {
  it("throws a ResultError carrying the offending result", () => {
    const failure = bad("BOOM", 1);
    expect(() => throwResultError(failure)).toThrow(ResultError);
    try {
      throwResultError(failure);
    } catch (error) {
      expect((error as ResultError).result).toBe(failure);
    }
  });
});
