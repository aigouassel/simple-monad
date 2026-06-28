import { bad, ok, Result } from "../index.js";

describe("Result wrapper: from / isOk / isBad", () => {
  it("wraps an Ok", () => {
    const r = Result.from(ok(2));
    expect(r.isOk()).toBe(true);
    expect(r.isBad()).toBe(false);
  });

  it("wraps a Bad", () => {
    const r = Result.from(bad("NOPE"));
    expect(r.isOk()).toBe(false);
    expect(r.isBad()).toBe(true);
  });
});

describe("Result.map", () => {
  it("transforms the value of an Ok", () => {
    const out = Result.from(ok(2))
      .map((n) => n * 10)
      .match({ ok: (n) => n, bad: () => -1 });
    expect(out).toBe(20);
  });

  it("passes a Bad through untouched (reason and value intact)", () => {
    const out = Result.from(bad("NOPE", 7))
      .map((n: number) => n * 10)
      .match({ ok: () => "ok", bad: (b) => `${b.reason}:${b.value}` });
    expect(out).toBe("NOPE:7");
  });

  it("chains", () => {
    const out = Result.from(ok(3))
      .map((n) => n + 1)
      .map((n) => n * 2)
      .match({ ok: (n) => n, bad: () => -1 });
    expect(out).toBe(8);
  });
});

describe("Result.match", () => {
  it("runs the ok handler for a success", () => {
    const out = Result.from(ok(2)).match({
      ok: (n) => `ok:${n}`,
      bad: () => "bad",
    });
    expect(out).toBe("ok:2");
  });

  it("runs the bad handler with access to reason and value", () => {
    const out = Result.from(bad("NOPE", 7)).match({
      ok: (n: number) => `ok:${n}`,
      bad: (b) => `bad:${b.reason}:${b.value}`,
    });
    expect(out).toBe("bad:NOPE:7");
  });
});

describe("Result.toUnion", () => {
  it("returns the underlying Ok | Bad leaf (the inverse of from)", () => {
    const okLeaf = Result.from(ok(2)).toUnion();
    expect(okLeaf.isOk()).toBe(true);
    expect(Result.unwrap(okLeaf)).toBe(2);

    const badLeaf = Result.from(bad("NOPE", 7)).toUnion();
    expect(badLeaf.isBad()).toBe(true);
    expect(Result.unwrapBadReason(badLeaf)).toBe("NOPE");
    expect(Result.unwrapBadValue(badLeaf)).toBe(7);
  });
});

describe("multiple failure modes keep each tag bound to its own value", () => {
  // The union below is exactly:
  //   Ok<number>
  //   | Bad<"book_not_found", { isbn: string }>
  //   | Bad<"invalid_price", { price: number }>
  // Each handler's `b.value` is the value paired with *that* tag — a 3-param
  // Result<A, R, V> would have let the tags and values cross-pollinate.
  function priceOf(book: string) {
    if (book === "missing") return bad("book_not_found", { isbn: "000" });
    if (book === "free") return bad("invalid_price", { price: 0 });
    return ok(42);
  }

  it("narrows value per tag via matchBad", () => {
    const out = Result.matchBad(priceOf("free"), {
      book_not_found: (b) => b.value.isbn, // b.value: { isbn: string }
      invalid_price: (b) => b.value.price, // b.value: { price: number }
    });
    expect(out).toBe(0);
  });
});
