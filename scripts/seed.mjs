import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

const force = process.argv.includes("--force") || process.env.SEED_FORCE === "1";

if (process.env.NODE_ENV === "production" && !force) {
  console.error("Refusing to seed while NODE_ENV=production. Pass --force only on a disposable database (see GUIDE.md).");
  process.exit(1);
}

const { register } = await import("node:module");

register("./seed-loader.mjs", import.meta.url);
await import("./seed.ts");
