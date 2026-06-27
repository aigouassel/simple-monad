import { bad, type OkOrBad, ok, Result } from "../index.js";

describe("Result.isOk / isBad", () => {
  it("reports success for an Ok", () => {
    const r = Result.from(ok(2));
    expect(r.isOk()).toBe(true);
    expect(r.isBad()).toBe(false);
  });

  it("reports failure for a Bad", () => {
    const r = Result.from(bad("nope"));
    expect(r.isOk()).toBe(false);
    expect(r.isBad()).toBe(true);
  });
});

describe("Result.match", () => {
  it("runs the ok handler for a success", () => {
    const r = Result.from(ok(2));
    const out = r.match({
      ok: (n) => `ok:${n}`,
      bad: (e) => `bad:${e}`,
    });
    expect(out).toBe("ok:2");
  });

  it("runs the bad handler for a failure", () => {
    const r = Result.from(bad("nope"));
    const out = r.match({
      ok: (n) => `ok:${n}`,
      bad: (e) => `bad:${e}`,
    });
    expect(out).toBe("bad:nope");
  });

  it("returns whatever the chosen handler returns (the two arms can differ)", () => {
    const r = Result.from(ok(42));
    const out = r.match({
      ok: (n) => n,
      bad: () => null,
    });
    expect(out).toBe(42);
  });
});

describe("Result.map", () => {
  it("transforms the value of an Ok and preserves the success arm", () => {
    const r = Result.from(ok(2));
    expect(r.map((n) => n * 10).match({ ok: (n) => n, bad: () => -1 })).toBe(
      20,
    );
  });

  it("can change the value type (number -> string)", () => {
    // map<U> returns Result<U, B>; the annotation locks in that U became string.
    const r: Result<string, never> = Result.from(ok(2)).map((n) => `v${n}`);
    expect(r.toUnion()).toBe("v2");
  });

  it("leaves a Bad untouched — the reason flows through unchanged", () => {
    const r = Result.from(bad("nope"));
    expect(
      r.map((n) => n * 10).match({ ok: (n) => `${n}`, bad: (e) => e }),
    ).toBe("nope");
  });

  it("chains", () => {
    const r = Result.from(ok(3));
    const out = r
      .map((n) => n + 1)
      .map((n) => n * 2)
      .match({ ok: (n) => n, bad: () => -1 });
    expect(out).toBe(8);
  });

  it("map on an unnarrowed Result is sound — value typed, error preserved, Bad passes through", () => {
    // `r` is a genuine Result<number, string> the function cannot narrow.
    // `n` is typed `number` (not `number | string`), the error type `string` is
    // preserved through the map, and a Bad passes through with its reason intact.
    function double(r: Result<number, string>): Result<number, string> {
      return r.map((n) => n * 2);
    }
    expect(
      double(Result.from(ok(3))).match({
        ok: (n) => n,
        bad: () => -1,
      }),
    ).toBe(6);
    expect(
      double(Result.from(bad("nope"))).match({
        ok: () => null,
        bad: (e) => e,
      }),
    ).toBe("nope");
  });
});

describe("Result.from + toUnion", () => {
  it("returns the value for an Ok and the reason for a Bad (A | B)", () => {
    expect(Result.from(ok(2)).toUnion()).toBe(2);
    expect(Result.from(bad("nope")).toUnion()).toBe("nope");
  });

  it("collapses to the value type once narrowed with isOk()", () => {
    const r: Result<number, string> = Result.from(ok(7));
    expect(r.isOk()).toBe(true);
    if (r.isOk()) {
      // after isOk(), B is `never`, so toUnion() is typed `number`, not `number | string`
      const v: number = r.toUnion();
      expect(v).toBe(7);
    }
  });

  it("collapses to the reason type once narrowed with isBad()", () => {
    const r: Result<number, string> = Result.from(bad("nope"));
    expect(r.isBad()).toBe(true);
    if (r.isBad()) {
      // after isBad(), A is `never`, so toUnion() is typed `string`, not `number | string`
      const e: string = r.toUnion();
      expect(e).toBe("nope");
    }
  });

  it("lifts an existing OkOrBad from a function (the bridge use case)", () => {
    function parse(s: string): OkOrBad<number, string> {
      const n = Number(s);
      return Number.isNaN(n) ? bad("NaN") : ok(n);
    }
    expect(
      Result.from(parse("42"))
        .map((n) => n + 1)
        .toUnion(),
    ).toBe(43);
    expect(
      Result.from(parse("x"))
        .map((n) => n + 1)
        .toUnion(),
    ).toBe("NaN");
  });
});
