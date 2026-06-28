/**
 * Example 06 — fold several failure modes with `match`'s per-reason map.
 *
 * The `Result` wrapper's `match` takes the same per-tag `bad` map as
 * `Result.matchBad`: one handler per failure reason, each seeing the payload
 * typed for *that* tag. Combined with `map`, you get a parse → transform → fold
 * pipeline that refines every failure mode in one place — no manual `switch`, and
 * the compiler makes you handle every tag.
 */
import { bad, type Bad, ok, type OkOrBad, Result } from "simple-monad";

interface Cart {
  items: number[];
  limit: number;
}

type CheckoutError =
  | Bad<"empty_cart", void> // tag-only failure
  | Bad<"over_budget", { total: number; limit: number }>;

function totalCart(cart: Cart): OkOrBad<number, CheckoutError> {
  if (cart.items.length === 0) return bad("empty_cart");
  const total = cart.items.reduce((sum, n) => sum + n, 0);
  if (total > cart.limit) return bad("over_budget", { total, limit: cart.limit });
  return ok(total);
}

// Fold straight to an HTTP-ish response: 200 on success, a tailored 4xx per tag.
function checkout(cart: Cart): { status: number; body: string } {
  return Result.from(totalCart(cart))
    .map((total) => `charged $${total}`) // runs only on success
    .match({
      ok: (message) => ({ status: 200, body: message }),
      // One handler per reason; each `b.value` is typed for its own tag.
      bad: {
        empty_cart: () => ({ status: 400, body: "cart is empty" }),
        over_budget: (b) => ({
          status: 402,
          body: `over budget by $${b.value.total - b.value.limit}`,
        }),
      },
    });
}

console.log(checkout({ items: [20, 30], limit: 100 })); // { status: 200, body: 'charged $50' }
console.log(checkout({ items: [], limit: 100 })); // { status: 400, body: 'cart is empty' }
console.error(checkout({ items: [80, 70], limit: 100 })); // { status: 402, body: 'over budget by $50' }
