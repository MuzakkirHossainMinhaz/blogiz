import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
    env: {
      AUTH_SECRET: "test-secret-not-for-production",
      AUTH_URL: "http://localhost:3000",
      MONGODB_URI: "mongodb://127.0.0.1:27017/blogiz-test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
