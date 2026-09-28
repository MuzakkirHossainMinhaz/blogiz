if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed while NODE_ENV=production");
  process.exit(1);
}

const { register } = await import("node:module");

register("./seed-loader.mjs", import.meta.url);
await import("./seed-admin.ts");
