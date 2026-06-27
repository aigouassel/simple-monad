/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
  // Jest's resolver does not understand Yarn PnP (packages live inside zips);
  // jest-pnp-resolver bridges it to the .pnp.cjs map.
  resolver: "jest-pnp-resolver",
  // The library is ESM, so specs import with explicit `.js` extensions (required by
  // TypeScript's nodenext resolution). ts-jest runs them under CommonJS, where `./x.js`
  // would not resolve to `x.ts`; strip the suffix for test resolution only.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.spec.json" }],
  },
  // Coverage is collected from library source only (specs excluded) and held at 100%.
  collectCoverageFrom: ["src/**/*.ts", "!src/tests/**"],
  coverageThreshold: {
    global: { branches: 100, functions: 100, lines: 100, statements: 100 },
  },
};
