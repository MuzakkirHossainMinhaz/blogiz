import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { describe, expect, it } from "vitest";
import { dashboardAccess, hasPermission } from "@/lib/permissions";
import { parsePageLimit, escapeRegex } from "@/lib/pagination";
import {
  buildBlogListFilter,
  publicPostFilter,
  resolveCreateStatus,
  resolvePublishStatus,
  resolveUpdateStatus,
} from "@/lib/public-posts";
import { renderMarkdown } from "@/lib/sanitize";
import { canSignIn, evaluateSession } from "@/lib/session-policy";
import { assertInsideUploadRoot, sniffImage, UPLOAD_ROOT } from "@/lib/uploads";
import { isSafeNavigationUrl, safeCallbackUrl } from "@/lib/urls";
import { passwordSchema } from "@/lib/validation";

describe("authorization policy", () => {
  it("keeps banner management off the author role", () => {
    expect(hasPermission("author", "manageBanners")).toBe(false);
    expect(hasPermission("admin", "manageBanners")).toBe(true);
    expect(hasPermission("user", "createBlog")).toBe(false);
  });

  it("gates admin dashboard prefixes", () => {
    expect(dashboardAccess(undefined, "/dashboard")).toBe("login");
    expect(dashboardAccess("user", "/dashboard")).toBe("ok");
    expect(dashboardAccess("author", "/dashboard/admin/users")).toBe("forbidden");
    expect(dashboardAccess("admin", "/dashboard/admin")).toBe("ok");
  });

  it("rejects inactive users and unapproved authors at sign-in", () => {
    expect(canSignIn({ isActive: false, role: "admin", isApproved: true })).toBe(false);
    expect(canSignIn({ isActive: true, role: "author", isApproved: false })).toBe(false);
    expect(canSignIn({ isActive: true, role: "user", isApproved: true })).toBe(true);
  });

  it("drops sessions that are inactive or revoked", () => {
    const user = {
      role: "admin" as const,
      isActive: true,
      isApproved: true,
      emailVerified: true,
      sessionVersion: 2,
      email: "a@example.com",
      name: "A",
    };
    expect(evaluateSession(null, 2).ok).toBe(false);
    expect(evaluateSession({ ...user, isActive: false }, 2).ok).toBe(false);
    expect(evaluateSession(user, 1).ok).toBe(false);
    const fresh = evaluateSession(user, 2);
    expect(fresh.ok && fresh.role).toBe("admin");
  });

  it("does not let clients publish without approveBlog", () => {
    expect(resolveCreateStatus("author", "published")).toEqual({ status: "pending", isApproved: false });
    expect(resolveCreateStatus("admin", "published")).toEqual({ status: "published", isApproved: true });
    expect(resolveUpdateStatus("author", "published")).toBeNull();
    expect(resolveUpdateStatus("admin", "published")).toEqual({ status: "published", isApproved: true });
    expect(resolvePublishStatus("author").isApproved).toBe(false);
    expect(resolvePublishStatus("superadmin")).toMatchObject({ status: "published", isApproved: true });
  });

  it("keeps anonymous lists on published and approved posts", () => {
    expect(buildBlogListFilter(null, null, "draft")).toEqual(publicPostFilter());
    expect(publicPostFilter()).toEqual({ status: "published", isApproved: true });
  });
});

describe("input guards", () => {
  it("escapes regex and rejects bad pages", () => {
    expect(escapeRegex("a+b")).toBe("a\\+b");
    expect("error" in parsePageLimit("0", "10")).toBe(true);
    expect("error" in parsePageLimit("-1", "10")).toBe(true);
    expect(parsePageLimit("1", "500")).toMatchObject({ limit: 50, page: 1 });
  });

  it("blocks open redirects and script URLs", () => {
    expect(safeCallbackUrl("https://evil.example")).toBe("/dashboard");
    expect(safeCallbackUrl("//evil.example")).toBe("/dashboard");
    expect(safeCallbackUrl("/dashboard/blogs")).toBe("/dashboard/blogs");
    expect(isSafeNavigationUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeNavigationUrl("https://example.com/go")).toBe(true);
  });

  it("renders markdown without raw HTML", () => {
    const html = renderMarkdown("Hello <script>alert(1)</script> **bold**");
    expect(html).not.toContain("<script>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("rejects upload paths that leave the upload root", () => {
    expect(() => assertInsideUploadRoot(UPLOAD_ROOT, "../etc/passwd")).toThrow(/Invalid upload path/);
    expect(() => assertInsideUploadRoot(UPLOAD_ROOT, "..\\..\\evil.html")).toThrow(/Invalid upload path/);
    expect(assertInsideUploadRoot(UPLOAD_ROOT, "file.png")).toContain("file.png");
  });

  it("sniffs image bytes instead of the client type", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(sniffImage(png)?.mime).toBe("image/png");
    expect(sniffImage(Buffer.from("<html></html>"))).toBeNull();
  });

  it("raises the password policy", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("password123").success).toBe(true);
  });
});

describe("seed is not a public route", () => {
  it("removes the seed route and refuses production without printing the password", () => {
    expect(existsSync("src/app/api/seed/route.ts")).toBe(false);
    const source = readFileSync("scripts/seed-admin.ts", "utf8");
    expect(source).not.toMatch(/console\.(log|error|info|debug)\([\s\S]*\$\{[^}]*password/i);

    const password = "supersecret1";
    const result = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/seed-admin.mjs"], {
      env: {
        ...process.env,
        NODE_ENV: "production",
        MONGODB_URI: "mongodb://127.0.0.1:27017/blogiz",
        AUTH_SECRET: "test-secret-not-for-production",
        AUTH_URL: "http://localhost:3000",
        ADMIN_EMAIL: "admin@example.com",
        ADMIN_PASSWORD: password,
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).not.toContain(password);
    expect(result.stderr).toContain("NODE_ENV=production");
  });
});
