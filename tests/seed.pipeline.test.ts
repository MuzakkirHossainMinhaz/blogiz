import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { canSignIn } from "@/lib/session-policy";

function runSeed(env: NodeJS.ProcessEnv): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--experimental-strip-types", "scripts/seed.mjs"], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    const timer = setTimeout(() => child.kill("SIGKILL"), 90_000);
    child.on("close", (status) => {
      clearTimeout(timer);
      resolve({ status, stdout, stderr });
    });
  });
}

describe("full database seed", () => {
  let mongo: MongoMemoryServer;
  const adminEmail = "seed-admin@blogiz.test";
  const adminPassword = "SeedAdminPass1";

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
  }, 120_000);

  afterAll(async () => {
    await mongoose.disconnect().catch(() => undefined);
    if (mongo) await mongo.stop();
  });

  it("truncates, seeds every collection, and aligns admin login flags", async () => {
    const result = await runSeed({
      ...process.env,
      NODE_ENV: "test",
      MONGODB_URI: mongo.getUri(),
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD: adminPassword,
      CLOUDINARY_CLOUD_NAME: "demo",
    });

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(`${result.stdout}${result.stderr}`).not.toContain(adminPassword);
    expect(result.stdout).toContain("Seed complete");

    await mongoose.connect(mongo.getUri());
    const db = mongoose.connection.db;
    if (!db) throw new Error("No db");

    const users = db.collection("users");
    const blogs = db.collection("blogs");
    const comments = db.collection("comments");
    const likes = db.collection("likes");
    const banners = db.collection("banners");
    const views = db.collection("blogviews");
    const upgrades = db.collection("roleupgraderequests");

    expect(await users.countDocuments()).toBeGreaterThanOrEqual(6);
    expect(await blogs.countDocuments()).toBeGreaterThanOrEqual(4);
    expect(await comments.countDocuments()).toBeGreaterThanOrEqual(2);
    expect(await likes.countDocuments()).toBeGreaterThanOrEqual(2);
    expect(await banners.countDocuments()).toBeGreaterThanOrEqual(1);
    expect(await views.countDocuments()).toBeGreaterThanOrEqual(1);
    expect(await upgrades.countDocuments()).toBeGreaterThanOrEqual(1);

    const admin = await users.findOne({ email: adminEmail });
    expect(admin).toBeTruthy();
    expect(admin?.role).toBe("superadmin");
    expect(admin?.isActive).toBe(true);
    expect(admin?.isApproved).toBe(true);
    expect(admin?.emailVerified).toBe(true);
    expect(await bcrypt.compare(adminPassword, admin!.password as string)).toBe(true);
    expect(
      canSignIn({
        isActive: Boolean(admin?.isActive),
        role: admin?.role as "superadmin",
        isApproved: Boolean(admin?.isApproved),
      })
    ).toBe(true);
  }, 120_000);
});
