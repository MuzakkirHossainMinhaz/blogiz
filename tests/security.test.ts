import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { describe, expect, it } from "vitest";
import { dashboardAccess, hasPermission } from "@/lib/permissions";
import { parsePageLimit, escapeRegex } from "@/lib/pagination";
import {
  buildBlogListFilter,
  canViewPost,
  publicPostFilter,
  resolveCreateStatus,
  resolvePublishStatus,
} from "@/lib/public-posts";
import { renderContent, renderMarkdown } from "@/lib/sanitize";
import { canSignIn, evaluateSession } from "@/lib/session-policy";
import { assertInsideUploadRoot, sniffImage, UPLOAD_ROOT } from "@/lib/uploads";
import {
  isLocalMediaUrl,
  isPollinationsImageUrl,
  isSafeNavigationUrl,
  isStoredImageUrl,
  localMediaRelativePath,
  safeCallbackUrl,
} from "@/lib/urls";
import { passwordSchema } from "@/lib/validation";

describe("authorization policy", () => {
  it("gives admin full plan powers and keeps readers from authoring", () => {
    expect(hasPermission("admin", "changeUserRole")).toBe(true);
    expect(hasPermission("admin", "editAnyBlog")).toBe(true);
    expect(hasPermission("admin", "suspendCommenting")).toBe(true);
    expect(hasPermission("author", "createBlog")).toBe(true);
    expect(hasPermission("reader", "createBlog")).toBe(false);
  });

  it("gates admin dashboard prefixes", () => {
    expect(dashboardAccess(undefined, "/dashboard")).toBe("login");
    expect(dashboardAccess("reader", "/dashboard")).toBe("ok");
    expect(dashboardAccess("author", "/dashboard/admin/users")).toBe("forbidden");
    expect(dashboardAccess("admin", "/dashboard/admin")).toBe("ok");
  });

  it("gates authoring routes for readers", () => {
    expect(dashboardAccess("reader", "/dashboard/blogs")).toBe("forbidden");
    expect(dashboardAccess("reader", "/dashboard/blogs/create")).toBe("forbidden");
    expect(dashboardAccess("reader", "/dashboard/analytics")).toBe("forbidden");
    expect(dashboardAccess("author", "/dashboard/blogs")).toBe("ok");
    expect(hasPermission("reader", "viewDashboard")).toBe(true);
  });

  it("rejects inactive users at sign-in", () => {
    expect(canSignIn({ isActive: false })).toBe(false);
    expect(canSignIn({ isActive: true })).toBe(true);
  });

  it("drops sessions that are inactive or revoked", () => {
    const user = {
      role: "admin" as const,
      isActive: true,
      emailVerified: true,
      commentSuspended: false,
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

  it("lets authors self-publish", () => {
    expect(resolveCreateStatus("published")).toBe("published");
    expect(resolveCreateStatus("draft")).toBe("draft");
    expect(resolveCreateStatus()).toBe("draft");
    expect(resolvePublishStatus()).toMatchObject({ status: "published" });
  });

  it("keeps anonymous lists on published posts", () => {
    expect(buildBlogListFilter(null, null, "draft")).toEqual(publicPostFilter());
    expect(publicPostFilter()).toEqual({ status: "published" });
  });

  it("lets owners view drafts when authorId is populated (edit GET path)", () => {
    const ownerId = "6adae7e65f150a86c8d8dc87";
    const viewer = { id: ownerId, role: "author" as const };
    const populatedDraft = {
      status: "draft",
      createdBy: ownerId,
      authorId: { _id: ownerId, name: "Tester", profile: { fullName: "Tester" } },
    };
    expect(canViewPost(populatedDraft, viewer)).toBe(true);
    expect(canViewPost(populatedDraft, null)).toBe(false);
    expect(canViewPost(populatedDraft, { id: "aaaaaaaaaaaaaaaaaaaaaaaa", role: "author" })).toBe(false);
    expect(canViewPost({ status: "published", createdBy: ownerId, authorId: populatedDraft.authorId }, null)).toBe(
      true
    );
    expect(
      canViewPost(
        { status: "draft", createdBy: ownerId, authorId: ownerId },
        viewer
      )
    ).toBe(true);
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

  it("renders headings, lists, links, code fences, and emphasis", () => {
    const source = [
      "# Title",
      "",
      "## Section",
      "",
      "A paragraph with **bold**, *italic*, and `code`.",
      "",
      "- first",
      "- second",
      "",
      "1. alpha",
      "2. beta",
      "",
      "[Docs](https://example.com/go)",
      "",
      "> quoted line",
      "",
      "```",
      "const x = 1;",
      "```",
      "",
      "---",
    ].join("\n");

    const html = renderMarkdown(source);
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<h2>Section</h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
    expect(html).toContain("<code>code</code>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>first</li>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>alpha</li>");
    expect(html).toContain('href="https://example.com/go"');
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<pre><code>const x = 1;</code></pre>");
    expect(html).toContain("<hr />");
  });

  it("sanitizes stored HTML blog bodies without showing tags as text", () => {
    const html = renderContent(
      "<p>Authors draft and publish.</p><p>Role upgrades should be explicit.</p><script>alert(1)</script>"
    );
    expect(html).toContain("<p>Authors draft and publish.</p>");
    expect(html).toContain("<p>Role upgrades should be explicit.</p>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("&lt;p&gt;");
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

  it("accepts local media paths and Pollinations HTTPS cover URLs only", () => {
    const local = "/api/media/covers/11111111-1111-4111-8111-111111111111.png";
    expect(isLocalMediaUrl(local)).toBe(true);
    expect(isStoredImageUrl(local)).toBe(true);
    expect(localMediaRelativePath(local)).toBe("covers/11111111-1111-4111-8111-111111111111.png");

    const pollinations =
      "https://pollinations.ai/p/Wide%20cinematic%20harbor?width=1200&height=630&seed=507f1f77bcf86cd799439011";
    expect(isPollinationsImageUrl(pollinations)).toBe(true);
    expect(isStoredImageUrl(pollinations)).toBe(true);
    expect(isStoredImageUrl("https://image.pollinations.ai/prompt/test")).toBe(true);

    expect(isStoredImageUrl("https://res.cloudinary.com/blogizdemo/image/upload/v1/blogiz/abc.png")).toBe(false);
    expect(isStoredImageUrl("https://evil.example/p/abc")).toBe(false);
    expect(isStoredImageUrl("/api/media/covers/../etc/passwd.png")).toBe(false);
    expect(isStoredImageUrl("/api/media/covers/not-a-uuid.png")).toBe(false);
  });

  it("raises the password policy", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("password123").success).toBe(true);
  });
});

describe("seed is not a public route", () => {
  it("removes the seed route and refuses production without printing the password", () => {
    expect(existsSync("src/app/api/seed/route.ts")).toBe(false);
    const seedSource = readFileSync("scripts/seed.ts", "utf8");
    expect(seedSource).not.toMatch(/console\.(log|error|info|debug)\([\s\S]*\$\{[^}]*password/i);

    const password = "supersecret1";
    const fullSeed = spawnSync(process.execPath, ["--experimental-strip-types", "scripts/seed.mjs"], {
      env: {
        ...process.env,
        NODE_ENV: "production",
        MONGODB_URI: "mongodb://127.0.0.1:27017/blogiz",
        ADMIN_EMAIL: "admin@example.com",
        ADMIN_PASSWORD: password,
      },
      encoding: "utf8",
    });
    expect(fullSeed.status).toBe(1);
    expect(`${fullSeed.stdout}${fullSeed.stderr}`).not.toContain(password);
    expect(`${fullSeed.stdout}${fullSeed.stderr}`).toContain("NODE_ENV=production");
  });
});
