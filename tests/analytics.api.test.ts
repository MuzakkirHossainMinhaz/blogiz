import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { NextRequest } from "next/server";
import User from "@/models/User";
import Blog from "@/models/Blog";
import BlogView from "@/models/BlogView";
import Comment from "@/models/Comment";
import Reaction from "@/models/Reaction";

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

async function makeBlog(authorId: mongoose.Types.ObjectId, overrides: Record<string, unknown> = {}) {
  return Blog.create({
    title: "Published post",
    description: "Visible description",
    content: "Public body",
    authorName: "Owner",
    authorId,
    createdBy: authorId,
    status: "published",
    publishedAt: new Date(),
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

describe("GET /api/blogs/analytics", () => {
  it("returns chart series for the signed-in author only", async () => {
    const author = await makeUser({ role: "author" });
    const other = await makeUser({ role: "author" });
    const reader = await makeUser({ role: "reader" });

    const own = await makeBlog(author._id, {
      title: "Own hit",
      totalLikes: 4,
      totalViews: 10,
      totalComments: 2,
    });
    await makeBlog(author._id, { title: "Own draft", status: "draft", publishedAt: null, totalLikes: 0 });
    const foreign = await makeBlog(other._id, { title: "Other post", totalLikes: 50, totalViews: 99 });

    await Reaction.create({ blogId: own._id, userId: reader._id, type: "like" });
    await Reaction.create({ blogId: foreign._id, userId: reader._id, type: "like" });
    await BlogView.create({ blogId: own._id, userId: reader._id, viewedAt: new Date() });
    await BlogView.create({ blogId: foreign._id, userId: reader._id, viewedAt: new Date() });
    await Comment.create({
      blogId: own._id,
      userId: reader._id,
      content: "Nice post",
      isVisible: true,
    });

    authMock.mockResolvedValue(sessionFor(author));
    const { GET } = await import("@/app/api/blogs/analytics/route");
    const response = await GET(new NextRequest("http://localhost:3000/api/blogs/analytics"));
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.stats).toMatchObject({
      totalBlogs: 2,
      publishedBlogs: 1,
      draftBlogs: 1,
      totalLikes: 4,
      totalViews: 10,
      totalComments: 2,
    });
    expect(body.statusMix).toEqual([
      { status: "Published", count: 1 },
      { status: "Draft", count: 1 },
    ]);
    expect(body.topPosts).toEqual([
      expect.objectContaining({ title: "Own hit", totalLikes: 4, totalViews: 10 }),
    ]);
    expect(body.engagementOverTime).toHaveLength(12);

    const lastWeek = body.engagementOverTime[body.engagementOverTime.length - 1];
    expect(lastWeek.views).toBeGreaterThanOrEqual(1);
    expect(lastWeek.likes).toBeGreaterThanOrEqual(1);
    expect(lastWeek.comments).toBeGreaterThanOrEqual(1);
  });

  it("rejects readers", async () => {
    const reader = await makeUser({ role: "reader" });
    authMock.mockResolvedValue(sessionFor(reader));
    const { GET } = await import("@/app/api/blogs/analytics/route");
    const response = await GET(new NextRequest("http://localhost:3000/api/blogs/analytics"));
    expect(response.status).toBe(403);
  });
});
