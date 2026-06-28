/**
 * Example 02 — several distinct failure modes (`matchBad`).
 *
 * Each rule fails with its own `Bad<tag, payload>` leaf, so the return type is a
 * union of leaves. `Result.matchBad` dispatches on the tag, and each handler sees
 * the payload typed for *that* tag — adding a rule is just one more union member
 * and one more handler.
 */
import { bad, type Bad, ok, type OkOrBad, Result } from "simple-monad";

interface Signup {
  email: string;
  password: string;
  age: number;
}

type SignupError =
  | Bad<"missing_email", void>
  | Bad<"weak_password", { minLength: number }>
  | Bad<"underage", { age: number; required: number }>;

function validateSignup(input: Signup): OkOrBad<Signup, SignupError> {
  if (!input.email.includes("@")) return bad("missing_email"); // tag-only failure
  if (input.password.length < 8) return bad("weak_password", { minLength: 8 });
  if (input.age < 18) return bad("underage", { age: input.age, required: 18 });
  return ok(input);
}

function describe(input: Signup): string {
  const result = validateSignup(input);
  // matchBad requires a Bad, so handle the success first — the early return also
  // narrows `result` to the SignupError union for the call below.
  if (result.isOk()) return "✓ signup accepted";
  return Result.matchBad(result, {
    missing_email: () => "email must contain @",
    weak_password: (b) => `password needs ${b.value.minLength}+ chars`,
    underage: (b) => `must be ${b.value.required}, got ${b.value.age}`,
  });
}

const okInput = { email: "a@b.co", password: "longenough", age: 30 };
console.log(`Input: ${JSON.stringify(okInput)}`);
console.log(describe(okInput));

const badInput = { email: "nope", password: "x", age: 12 };
console.log(`Input: ${JSON.stringify(badInput)}`);
console.error(describe(badInput)); // a rejected signup — report on stderr
