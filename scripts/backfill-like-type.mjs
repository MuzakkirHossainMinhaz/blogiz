const { register } = await import("node:module");

register("./seed-loader.mjs", import.meta.url);
await import("./backfill-like-type.ts");
