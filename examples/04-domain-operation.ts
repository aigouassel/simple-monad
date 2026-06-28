/**
 * Example 04 — a domain operation with business rules (`ok()` + the toolkit).
 *
 * Shows a *valueless* success (`ok()` → `Ok<void>`, when the action itself is the
 * result and there's nothing to return), tagged failures with payloads, and
 * reading a failure back with the static `unwrap*` toolkit.
 */
import { bad, type Bad, ok, type OkOrBad, Result } from "simple-monad";

interface Account {
  balance: number;
  frozen: boolean;
}

type WithdrawError =
  | Bad<"account_frozen", void>
  | Bad<"insufficient_funds", { balance: number; requested: number }>;

function withdraw(
  account: Account,
  amount: number,
): OkOrBad<void, WithdrawError> {
  if (account.frozen) return bad("account_frozen");
  if (amount > account.balance) {
    return bad("insufficient_funds", {
      balance: account.balance,
      requested: amount,
    });
  }
  account.balance -= amount;
  return ok(); // success carries no value — the side effect is the result
}

const account: Account = { balance: 100, frozen: false };

console.log(`Input: ${JSON.stringify(account)}, amount to withdraw : 150`);
const denied = withdraw(account, 150);
if (denied.isBad()) {
  // unwrapBad* pull a precise piece out of the failure (and throw a ResultError
  // if you call them on an Ok — they're the deliberate escape hatch).
  const reason = Result.unwrapBadReason(denied); // "insufficient_funds"
  const detail = Result.unwrapBadValue(denied); // { balance, requested } | undefined
  console.error(`denied (${reason}):`, detail);
}

console.log(`Input: ${JSON.stringify(account)}, amount to withdraw : 40`);
const okWithdraw = withdraw(account, 40);
console.log(okWithdraw.isOk() ? `✓ new balance ${account.balance}` : "denied");
