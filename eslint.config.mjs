import { createRequire } from "node:module";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const require = createRequire(import.meta.url);
const espree = require("espree");

export default defineConfig([
  ...nextVitals,
  {
    files: ["**/*.{js,cjs}"],
    languageOptions: {
      parser: espree,
      parserOptions: { ecmaVersion: "latest", sourceType: "commonjs" },
    },
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      parser: espree,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);
