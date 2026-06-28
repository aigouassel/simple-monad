import { type Bad, bad, type OkOrBad, ok, Result } from "../index.js";

describe("Result wrapper: from / toUnion", () => {
  it("wraps an Ok and drops back to the leaf", () => {
    const leaf = Result.from(ok(2)).toUnion();
    expect(leaf.isOk()).toBe(true);
    expect(leaf.isBad()).toBe(false);
  });

  it("wraps a Bad and drops back to the leaf", () => {
    const leaf = Result.from(bad("NOPE")).toUnion();
    expect(leaf.isOk()).toBe(false);
    expect(leaf.isBad()).toBe(true);
  });
});

describe("Result.map", () => {
  it("transforms the value of an Ok", () => {
    const out = Result.from(ok(2))
      .map((n) => n * 10)
      .match({ ok: (n) => n });
    expect(out).toBe(20);
  });

  it("passes a Bad through untouched (reason and value intact)", () => {
    const out = Result.from(bad("NOPE", 7))
      .map((n: number) => n * 10)
      .match({
        ok: () => "ok",
        bad: { NOPE: (b) => `${b.reason}:${b.value}` },
      });
    expect(out).toBe("NOPE:7");
  });

  it("chains", () => {
    const out = Result.from(ok(3))
      .map((n) => n + 1)
      .map((n) => n * 2)
      .match({ ok: (n) => n });
    expect(out).toBe(8);
  });
});

describe("Result.match", () => {
  it("runs the ok handler for a success", () => {
    const out = Result.from(ok(2)).match({
      ok: (n) => `ok:${n}`,
    });
    expect(out).toBe("ok:2");
  });

  it("runs the bad handler with access to reason and value", () => {
    const out = Result.from(bad("NOPE", 7)).match({
      bad: { NOPE: (b) => `bad:${b.reason}:${b.value}` },
    });
    expect(out).toBe("bad:NOPE:7");
  });

  it("rejects a dead bad handler when the failure rail is never", () => {
    const out = Result.from(ok(2)).match({
      ok: (n) => n,
      // @ts-expect-error `bad` is forbidden — Result<number, never> cannot fail.
      bad: {},
    });
    expect(out).toBe(2);
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
    const r = priceOf("free");
    if (r.isOk()) throw new Error("expected a failure");
    // r is now Bad<"book_not_found", …> | Bad<"invalid_price", …>
    const out = Result.matchBad(r, {
      book_not_found: (b) => b.value.isbn, // b.value: { isbn: string }
      invalid_price: (b) => b.value.price, // b.value: { price: number }
    });
    expect(out).toBe(0);
  });

  it("refines value per tag via match's bad map (like matchBad)", () => {
    const out = Result.from(priceOf("free")).match({
      ok: (n) => `price ${n}`,
      bad: {
        book_not_found: (b) => `no isbn ${b.value.isbn}`, // b.value: { isbn: string }
        invalid_price: (b) => `bad price ${b.value.price}`, // b.value: { price: number }
      },
    });
    expect(out).toBe("bad price 0");
  });
});

describe("Result.match / matchBad edge cases", () => {
  type LookupError =
    | Bad<"not_found", { id: number }>
    | Bad<"forbidden", { role: string }>;

  function lookup(id: number, role: string): OkOrBad<string, LookupError> {
    if (role !== "admin") return bad("forbidden", { role });
    if (id <= 0) return bad("not_found", { id });
    return ok(`row#${id}`);
  }

  it("matches a valueless success (ok() → Result<void, never>)", () => {
    // B is never, so the bad arm is dropped; ok receives `void`.
    const out = Result.from(ok()).match({ ok: () => "done" });
    expect(out).toBe("done");
  });

  it("matches a tag-only failure (void payload)", () => {
    // A is never, so the ok arm is dropped; the handler's `b.value` is undefined.
    const out = Result.from(bad("timeout")).match({
      bad: { timeout: (b) => ({ tag: b.reason, payload: b.value }) },
    });
    expect(out.tag).toBe("timeout");
    expect(out.payload).toBeUndefined();
  });

  it("requires every reason in match's bad map (exhaustive)", () => {
    const r = Result.from(lookup(-1, "admin"));
    // Never executed — this asserts the *type* error of an incomplete bad map.
    const partial = () =>
      r.match({
        ok: (row) => row,
        // @ts-expect-error `forbidden` is missing from the bad map.
        bad: { not_found: (b) => `missing ${b.value.id}` },
      });
    expect(typeof partial).toBe("function");
  });

  it("returns the union of differing handler return types", () => {
    // ok → number, bad → string ⇒ the result is `string | number`.
    const onHit: string | number = Result.from(lookup(1, "admin")).match({
      ok: (row) => row.length,
      bad: {
        not_found: (b) => `missing ${b.value.id}`,
        forbidden: (b) => `forbidden for ${b.value.role}`,
      },
    });
    const onMiss: string | number = Result.from(lookup(-1, "admin")).match({
      ok: (row) => row.length,
      bad: {
        not_found: (b) => `missing ${b.value.id}`,
        forbidden: (b) => `forbidden for ${b.value.role}`,
      },
    });
    expect(onHit).toBe(5); // "row#1".length
    expect(onMiss).toBe("missing -1");
  });

  it("map re-inflates the success rail, so match then needs both arms", () => {
    // bad(...) alone is Result<never, Bad>; .map adds a success rail (U), so the
    // result is Result<number, Bad<"nope", number>> — BOTH arms are now required.
    const r = Result.from(bad("nope", 7)).map((n: number) => n * 2);
    const missingOk = () =>
      // @ts-expect-error both rails inhabited — `ok` is required.
      r.match({ bad: { nope: (b) => b.value } });
    expect(typeof missingOk).toBe("function");

    const out = r.match({
      ok: (n) => `ok ${n}`,
      bad: { nope: (b) => `bad ${b.value}` },
    });
    expect(out).toBe("bad 7"); // runtime value is the Bad, flowed through map
  });
});
