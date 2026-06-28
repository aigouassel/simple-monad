import { bad, ok } from "../index.js";

describe("ok", () => {
  it("ok(value) is a success carrying the value", () => {
    const r = ok(42);
    expect(r.success).toBe(true);
    expect(r.isOk()).toBe(true);
    expect(r.isBad()).toBe(false);
    expect(r.value).toBe(42);
  });

  it("ok() is a valueless (void) success", () => {
    const r = ok();
    expect(r.success).toBe(true);
    expect(r.isOk()).toBe(true);
    expect(r.value).toBeUndefined();
  });
});

describe("bad", () => {
  it("bad(tag) is a failure carrying the tag as reason, with no value", () => {
    const r = bad("NOT_FOUND");
    expect(r.success).toBe(false);
    expect(r.isBad()).toBe(true);
    expect(r.isOk()).toBe(false);
    expect(r.reason).toBe("NOT_FOUND");
    expect(r.value).toBeUndefined();
  });

  it("bad(tag, value) attaches a payload alongside the tag", () => {
    const r = bad("PARSE_FAILED", 3712);
    expect(r.reason).toBe("PARSE_FAILED");
    expect(r.value).toBe(3712);
  });

  it("narrows an Ok | Bad union returned from a function", () => {
    function parse(s: string) {
      const n = Number(s);
      return Number.isNaN(n) ? bad("NaN", s) : ok(n);
    }

    const good = parse("42");
    if (!good.isOk()) {
      throw new Error("expected ok");
    }
    expect(good.value).toBe(42); // narrowed to Ok<number>

    const oops = parse("x");
    if (!oops.isBad()) {
      throw new Error("expected bad");
    }
    expect(oops.reason).toBe("NaN"); // narrowed to Bad<"NaN", string>
    expect(oops.value).toBe("x");
  });
});
