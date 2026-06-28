// Writes dist/cjs/package.json with {"type":"commonjs"}.
//
// The repo root declares "type": "module", and that cascades to every .js file
// in the tree — including the CommonJS output tsc emits into dist/cjs/. Without
// this marker, Node would parse that CommonJS as ESM and the "require" exports
// condition would be broken. This nested package.json is the *nearest* one to
// dist/cjs/**, so it resets the module system to CommonJS for that subtree only.
//
// tsc cannot emit a package.json itself, so the build step runs this after the
// CJS compile. Kept as a Node script (not an inline `echo`) so it is shell- and
// platform-independent and self-documenting.
import { writeFileSync } from "node:fs";

const target = new URL("../dist/cjs/package.json", import.meta.url);
writeFileSync(target, '{"type":"commonjs"}\n');
