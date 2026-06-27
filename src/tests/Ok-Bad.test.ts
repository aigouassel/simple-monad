import { bad, type OkOrBad, ok } from "../index.js";

describe("Ok and Bad", () => {
  it("ok() produces an Ok that narrows to .value", () => {
    const r: OkOrBad<number, never> = ok(42);
    expect(r.isOk()).toBe(true);
    expect(r.isBad()).toBe(false);
    if (r.isOk()) {
      expect(r.value).toBe(42);
    }
  });

  it("bad() produces a Bad that narrows to .reason", () => {
    const r: OkOrBad<never, string> = bad("nope");
    expect(r.isBad()).toBe(true);
    if (r.isBad()) {
      expect(r.reason).toBe("nope");
    }
  });

  it("narrows a OkOrBad returned from a function (the everyday simple-layer flow)", () => {
    function parse(s: string): OkOrBad<number, string> {
      const n = Number(s);
      return Number.isNaN(n) ? bad("NaN") : ok(n);
    }

    const good = parse("42");
    expect(good.isOk()).toBe(true);
    if (good.isOk()) {
      expect(good.value).toBe(42); // narrowed to Ok<number>
    }

    const oops = parse("x");
    expect(oops.isBad()).toBe(true);
    if (oops.isBad()) {
      expect(oops.reason).toBe("NaN"); // narrowed to Bad<string>
    }
  });
});
