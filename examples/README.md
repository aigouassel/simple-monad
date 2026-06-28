# Examples

Self-contained, real-world snippets showing how to use `simple-monad`. Each file
imports from the package exactly as a consumer would (`import { ok, bad } from
"simple-monad"`), so you can copy any of them into your own project verbatim.

| File                                                   | Layer shown                        | Scenario                                                       |
| ------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------------- |
| [`01-parse-input.ts`](./01-parse-input.ts)             | Simple leaves + `isOk()`/`isBad()` | Validate untrusted input (a port number).                      |
| [`02-form-validation.ts`](./02-form-validation.ts)     | `Result.matchBad`                  | A signup form with several tagged failure modes.               |
| [`03-wrap-throwing-api.ts`](./03-wrap-throwing-api.ts) | Simple leaves                      | Turn a throwing API (`JSON.parse`) into a `Result`.            |
| [`04-domain-operation.ts`](./04-domain-operation.ts)   | `ok()` + `unwrap*` toolkit         | A bank withdrawal with business rules and a valueless success. |
| [`05-result-chaining.ts`](./05-result-chaining.ts)     | `Result` wrapper (`map`/`match`)   | A parse → transform → fold pipeline.                           |

## Running them

Each file has a `console.log` or two. Run all of them with:

```sh
yarn examples
```

That rebuilds `dist/` and runs every `examples/*.ts` in turn. Each file imports
`"simple-monad"`, which [self-resolves][self-ref] to the local build, so no install
step is needed in this repo.

To run a single one (Node ≥ 22.18 / 24 strips the TypeScript types natively):

```sh
yarn build              # once, so dist/ is current
node examples/01-parse-input.ts
```

[self-ref]: https://nodejs.org/api/packages.html#self-referencing-a-package-using-its-name
