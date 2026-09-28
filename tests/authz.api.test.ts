import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { NextRequest } from "next/server";
import User from "@/models/User";
import Blog from "@/models/Blog";

const authMock = vi.hoisted(() => vi.fn(async (): Promise<{ user: Record<string, unknown> } | null> => null));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
  handlers: {},
  authConfig: {},
}));

let mongo: MongoMemoryServer;

function sessionFor(user: { _id: { toString(): string }; role: string; email: string; name: string; isApproved: boolean; emailVerified: boolean }) {
  return {
    user: {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      isApproved: user.isApproved,
      emailVerified: user.emailVerified,
    },
  };
}

async function makeUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    email: `user-${new mongoose.Types.ObjectId().toString()}@example.com`,
    password: "$2b$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012",
    name: "Tester",
    role: "user",
    profile: { fullName: "Tester Person" },
    isApproved: true,
    isActive: true,
    emailVerified: true,
    sessionVersion: 0,
    ...overrides,
  });
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  const { connectDB } = await import("@/lib/mongodb");
  await connectDB();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => {
  authMock.mockReset();
  authMock.mockResolvedValue(null);
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

describe("blog authorization", () => {
  it("does not list or return unpublished posts to anonymous callers", async () => {
    const author = await makeUser({ role: "author" });
    const draft = await Blog.create({
      title: "Secret draft",
      description: "hidden",
      content: "draft body",
      author_name: "Tester",
      authorId: author._id,
      createdBy: author._id,
      status: "draft",
      isApproved: false,
    });
    await Blog.create({
      title: "Public",
      description: "visible",
      content: "public body",
      author_name: "Tester",
      authorId: author._id,
      createdBy: author._id,
      status: "published",
      isApproved: true,
    });

    const { GET } = await import("@/app/api/blogs/route");
    const { GET: getOne } = await import("@/app/api/blogs/[id]/route");

    const list = await GET(new NextRequest("http://localhost:3000/api/blogs?status=draft"));
    const listBody = await list.json();
    expect(list.status).toBe(200);
    expect(listBody.blogs).toHaveLength(1);
    expect(listBody.blogs[0].title).toBe("Public");
    expect(JSON.stringify(listBody)).not.toContain("email");

    const hidden = await getOne(new NextRequest("http://localhost:3000/api/blogs/" + draft._id), {
      params: Promise.resolve({ id: draft._id.toString() }),
    });
    expect(hidden.status).toBe(404);
  });

  it("requires createBlog and ignores client publish status", async () => {
    const reader = await makeUser({ role: "user" });
    const author = await makeUser({ role: "author", isApproved: true });
    const admin = await makeUser({ role: "admin" });
    const { POST } = await import("@/app/api/blogs/route");
    const { PUT } = await import("@/app/api/blogs/[id]/route");
    const { POST: publish } = await import("@/app/api/blogs/[id]/publish/route");

    const payload = {
      title: "A post",
      description: "desc",
      content: "hello world",
      author_name: "Tester",
      status: "published",
    };

    authMock.mockResolvedValue(sessionFor(reader));
    const denied = await POST(new NextRequest("http://localhost:3000/api/blogs", { method: "POST", body: JSON.stringify(payload) }));
    expect(denied.status).toBe(403);

    authMock.mockResolvedValue(sessionFor(author));
    const pending = await POST(new NextRequest("http://localhost:3000/api/blogs", { method: "POST", body: JSON.stringify(payload) }));
    expect(pending.status).toBe(201);
    const pendingBody = await pending.json();
    expect(pendingBody.blog.status).toBe("pending");
    expect(pendingBody.blog.isApproved).toBe(false);

    const updated = await PUT(
      new NextRequest("http://localhost:3000/api/blogs/" + pendingBody.blog._id, {
        method: "PUT",
        body: JSON.stringify({ ...payload, status: "published" }),
      }),
      { params: Promise.resolve({ id: pendingBody.blog._id }) }
    );
    const updatedBody = await updated.json();
    expect(updated.status).toBe(200);
    expect(updatedBody.blog.status).toBe("pending");
    expect(updatedBody.blog.isApproved).toBe(false);

    const queued = await publish(new NextRequest("http://localhost:3000/api/blogs/" + pendingBody.blog._id + "/publish", { method: "POST" }), {
      params: Promise.resolve({ id: pendingBody.blog._id }),
    });
    const queuedBody = await queued.json();
    expect(queuedBody.blog.status).toBe("pending");
    expect(queuedBody.blog.isApproved).toBe(false);

    authMock.mockResolvedValue(sessionFor(admin));
    const published = await publish(new NextRequest("http://localhost:3000/api/blogs/" + pendingBody.blog._id + "/publish", { method: "POST" }), {
      params: Promise.resolve({ id: pendingBody.blog._id }),
    });
    const publishedBody = await published.json();
    expect(publishedBody.blog.status).toBe("published");
    expect(publishedBody.blog.isApproved).toBe(true);
  });
});

describe("upload and admin actions", () => {
  it("stores sniffed images and rejects non-images regardless of filename", async () => {
    const author = await makeUser({ role: "author" });
    authMock.mockResolvedValue(sessionFor(author));
    const { POST } = await import("@/app/api/upload/route");

    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const good = new FormData();
    good.set("file", new File([png], "../../evil.html", { type: "text/html" }));
    const saved = await POST(new NextRequest("http://localhost:3000/api/upload", { method: "POST", body: good }));
    const savedBody = await saved.json();
    expect(saved.status).toBe(200);
    expect(savedBody.url).toMatch(/^\/api\/media\/[a-f0-9]{24}$/i);
    expect(savedBody.url).not.toContain("evil");

    const bad = new FormData();
    bad.set("file", new File([Buffer.from("<script>alert(1)</script>")], "photo.png", { type: "image/png" }));
    const rejected = await POST(new NextRequest("http://localhost:3000/api/upload", { method: "POST", body: bad }));
    expect(rejected.status).toBe(400);
  });

  it("stops an admin from deactivating a superadmin and an author from managing banners", async () => {
    const admin = await makeUser({ role: "admin" });
    const superadmin = await makeUser({ role: "superadmin" });
    const author = await makeUser({ role: "author" });
    const { PUT } = await import("@/app/api/admin/users/route");
    const { POST } = await import("@/app/api/admin/banners/route");

    authMock.mockResolvedValue(sessionFor(admin));
    const locked = await PUT(
      new NextRequest("http://localhost:3000/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({ userId: superadmin._id.toString(), action: "deactivate" }),
      })
    );
    expect(locked.status).toBe(403);
    const stillActive = await User.findById(superadmin._id);
    expect(stillActive?.isActive).toBe(true);

    authMock.mockResolvedValue(sessionFor(author));
    const banner = await POST(
      new NextRequest("http://localhost:3000/api/admin/banners", {
        method: "POST",
        body: JSON.stringify({ title: "Hi", image: "/api/media/aaaaaaaaaaaaaaaaaaaaaaaa", ctaLink: "javascript:alert(1)" }),
      })
    );
    expect(banner.status).toBe(403);
  });
});
