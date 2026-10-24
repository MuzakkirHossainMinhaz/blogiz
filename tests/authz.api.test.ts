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

function sessionFor(user: {
  _id: { toString(): string };
  role: string;
  email: string;
  name: string;
  emailVerified: boolean;
  commentSuspended?: boolean;
}) {
  return {
    user: {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      commentSuspended: Boolean(user.commentSuspended),
    },
  };
}

async function makeUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    email: `user-${new mongoose.Types.ObjectId().toString()}@example.com`,
    password: "$2b$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012",
    name: "Tester",
    role: "reader",
    profile: { fullName: "Tester Person" },
    isActive: true,
    emailVerified: true,
    commentSuspended: false,
    sessionVersion: 0,
    ...overrides,
  });
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  const { connectDB } = await import("@/lib/mongodb");
  await connectDB();
}, 300_000);

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
      authorName: "Tester",
      authorId: author._id,
      createdBy: author._id,
      status: "draft",
    });
    await Blog.create({
      title: "Public",
      description: "visible",
      content: "public body",
      authorName: "Tester",
      authorId: author._id,
      createdBy: author._id,
      status: "published",
      publishedAt: new Date(),
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

  it("returns the author's own draft (and published post) for edit", async () => {
    const author = await makeUser({ role: "author" });
    const other = await makeUser({ role: "author" });
    const draft = await Blog.create({
      title: "My draft",
      description: "work in progress",
      content: "draft body for editing",
      authorName: "Tester",
      authorId: author._id,
      createdBy: author._id,
      status: "draft",
    });
    const published = await Blog.create({
      title: "My published",
      description: "live",
      content: "published body",
      authorName: "Tester",
      authorId: author._id,
      createdBy: author._id,
      status: "published",
      publishedAt: new Date(),
    });

    const { GET: getOne } = await import("@/app/api/blogs/[id]/route");

    authMock.mockResolvedValue(sessionFor(author));
    const ownDraft = await getOne(new NextRequest("http://localhost:3000/api/blogs/" + draft._id), {
      params: Promise.resolve({ id: draft._id.toString() }),
    });
    const ownDraftBody = await ownDraft.json();
    expect(ownDraft.status).toBe(200);
    expect(ownDraftBody.blog.title).toBe("My draft");
    expect(ownDraftBody.blog.status).toBe("draft");
    expect(ownDraftBody.blog.content).toBe("draft body for editing");

    const ownPublished = await getOne(new NextRequest("http://localhost:3000/api/blogs/" + published._id), {
      params: Promise.resolve({ id: published._id.toString() }),
    });
    const ownPublishedBody = await ownPublished.json();
    expect(ownPublished.status).toBe(200);
    expect(ownPublishedBody.blog.title).toBe("My published");
    expect(ownPublishedBody.blog.status).toBe("published");

    authMock.mockResolvedValue(sessionFor(other));
    const foreignDraft = await getOne(new NextRequest("http://localhost:3000/api/blogs/" + draft._id), {
      params: Promise.resolve({ id: draft._id.toString() }),
    });
    expect(foreignDraft.status).toBe(404);
  });

  it("lets authors self-publish", async () => {
    const reader = await makeUser({ role: "reader" });
    const author = await makeUser({ role: "author" });
    const { POST } = await import("@/app/api/blogs/route");
    const { POST: publish } = await import("@/app/api/blogs/[id]/publish/route");

    const payload = {
      title: "A post",
      description: "desc",
      content: "hello world",
      authorName: "Tester",
      status: "published",
    };

    authMock.mockResolvedValue(sessionFor(reader));
    const denied = await POST(
      new NextRequest("http://localhost:3000/api/blogs", { method: "POST", body: JSON.stringify(payload) })
    );
    expect(denied.status).toBe(403);

    authMock.mockResolvedValue(sessionFor(author));
    const created = await POST(
      new NextRequest("http://localhost:3000/api/blogs", {
        method: "POST",
        body: JSON.stringify({ ...payload, status: "draft" }),
      })
    );
    expect(created.status).toBe(201);
    const createdBody = await created.json();
    expect(createdBody.blog.status).toBe("draft");

    const published = await publish(
      new NextRequest("http://localhost:3000/api/blogs/" + createdBody.blog._id + "/publish", { method: "POST" }),
      { params: Promise.resolve({ id: createdBody.blog._id }) }
    );
    const publishedBody = await published.json();
    expect(published.status).toBe(200);
    expect(publishedBody.blog.status).toBe("published");
    expect(publishedBody.blog.publishedAt).toBeTruthy();
  });
});

describe("upload and admin actions", () => {
  it("stores sniffed images locally and rejects non-images regardless of filename", async () => {
    const author = await makeUser({ role: "author" });
    authMock.mockResolvedValue(sessionFor(author));
    const { POST } = await import("@/app/api/upload/route");

    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const good = new FormData();
    good.set("file", new File([png], "../../evil.html", { type: "text/html" }));
    const saved = await POST(new NextRequest("http://localhost:3000/api/upload", { method: "POST", body: good }));
    const savedBody = await saved.json();
    expect(saved.status).toBe(200);
    expect(savedBody.url).toMatch(
      /^\/api\/media\/covers\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/i
    );
    expect(savedBody.url).not.toContain("evil");

    const bad = new FormData();
    bad.set("file", new File([Buffer.from("<script>alert(1)</script>")], "photo.png", { type: "image/png" }));
    const rejected = await POST(new NextRequest("http://localhost:3000/api/upload", { method: "POST", body: bad }));
    expect(rejected.status).toBe(400);
  });

  it("lets an admin deactivate a reader and suspend commenting", async () => {
    const admin = await makeUser({ role: "admin" });
    const reader = await makeUser({ role: "reader" });
    const { PUT } = await import("@/app/api/admin/users/route");

    authMock.mockResolvedValue(sessionFor(admin));
    const deactivated = await PUT(
      new NextRequest("http://localhost:3000/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({ userId: reader._id.toString(), action: "deactivate" }),
      })
    );
    expect(deactivated.status).toBe(200);
    expect((await User.findById(reader._id))?.isActive).toBe(false);

    const other = await makeUser({ role: "reader" });
    const suspended = await PUT(
      new NextRequest("http://localhost:3000/api/admin/users", {
        method: "PUT",
        body: JSON.stringify({
          userId: other._id.toString(),
          action: "suspendCommenting",
          reason: "Spam",
        }),
      })
    );
    expect(suspended.status).toBe(200);
    const reloaded = await User.findById(other._id);
    expect(reloaded?.commentSuspended).toBe(true);
  });
});
