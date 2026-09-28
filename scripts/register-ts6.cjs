/**
 * typescript-eslint still imports the TypeScript 6 programmatic API.
 * The project compiler stays on TypeScript 7 (`tsc`). This hook is loaded
 * only by the lint script so ESLint resolves `typescript` to
 * `@typescript/typescript6`.
 */
const Module = require("module");
const ts6Entry = require.resolve("@typescript/typescript6");
const resolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "typescript") {
    return ts6Entry;
  }
  return resolveFilename.call(this, request, parent, isMain, options);
};
