import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { NextRequest } from "next/server";
import User from "@/models/User";
import Blog from "@/models/Blog";
import Like from "@/models/Like";
import { getPublicAuthorProfile } from "@/lib/db";

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
  isApproved: boolean;
  emailVerified: boolean;
}) {
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

async function makeBlog(authorId: mongoose.Types.ObjectId, overrides: Record<string, unknown> = {}) {
  return Blog.create({
    title: "Published post",
    description: "Visible description",
    content: "Public body",
    author_name: "Owner",
    authorId,
    createdBy: authorId,
    status: "published",
    isApproved: true,
    ...overrides,
  });
}

function postJson(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

describe("blog reactions", () => {
  it("keeps one reaction per user and switches between like and dislike", async () => {
    const author = await makeUser({ role: "author" });
    const reader = await makeUser({ role: "user" });
    const other = await makeUser({ role: "user" });
    const blog = await makeBlog(author._id);
    const draft = await makeBlog(author._id, { title: "Secret draft", status: "draft", isApproved: false });
    const { POST } = await import("@/app/api/likes/route");
    const blogId = blog._id.toString();

    authMock.mockResolvedValue(null);
    const anonymous = await POST(postJson("http://localhost:3000/api/likes", { blogId, reaction: "like" }));
    expect(anonymous.status).toBe(401);

    authMock.mockResolvedValue(sessionFor(reader));
    const liked = await POST(postJson("http://localhost:3000/api/likes", { blogId, reaction: "like" }));
    expect(liked.status).toBe(200);
    expect(await liked.json()).toMatchObject({ reaction: "like", total_likes: 1, total_dislikes: 0 });
    expect(await Like.countDocuments({ blogId, userId: reader._id })).toBe(1);

    const removed = await POST(postJson("http://localhost:3000/api/likes", { blogId, reaction: "like" }));
    expect(await removed.json()).toMatchObject({ reaction: null, total_likes: 0, total_dislikes: 0 });
    expect(await Like.countDocuments({ blogId, userId: reader._id })).toBe(0);

    await POST(postJson("http://localhost:3000/api/likes", { blogId, reaction: "like" }));
    const switched = await POST(postJson("http://localhost:3000/api/likes", { blogId, reaction: "dislike" }));
    expect(await switched.json()).toMatchObject({ reaction: "dislike", total_likes: 0, total_dislikes: 1 });
    expect(await Like.countDocuments({ blogId, userId: reader._id })).toBe(1);
    expect(await Like.findOne({ blogId, userId: reader._id })).toMatchObject({ type: "dislike" });

    authMock.mockResolvedValue(sessionFor(other));
    const second = await POST(postJson("http://localhost:3000/api/likes", { blogId, reaction: "like" }));
    expect(await second.json()).toMatchObject({ reaction: "like", total_likes: 1, total_dislikes: 1 });
    expect(await Like.countDocuments({ blogId })).toBe(2);

    const hidden = await POST(postJson("http://localhost:3000/api/likes", { blogId: draft._id.toString(), reaction: "like" }));
    expect(hidden.status).toBe(404);
    expect(await Like.countDocuments({ blogId: draft._id })).toBe(0);
  });

  it("lets an author comment and react on someone else's published post without skipping moderation", async () => {
    const owner = await makeUser({ role: "author", profile: { fullName: "Post Owner" } });
    const author = await makeUser({ role: "author", profile: { fullName: "Guest Author" } });
    const blog = await makeBlog(owner._id, { title: "Someone else's post", author_name: "Post Owner" });
    const blogId = blog._id.toString();

    authMock.mockResolvedValue(sessionFor(author));
    const { POST: comment } = await import("@/app/api/comments/route");
    const { GET: listComments } = await import("@/app/api/comments/route");
    const { POST: react } = await import("@/app/api/likes/route");
    const { PUT } = await import("@/app/api/blogs/[id]/route");

    const created = await comment(
      postJson("http://localhost:3000/api/comments", { blogId, content: "A note from another author" })
    );
    expect(created.status).toBe(201);
    const createdBody = await created.json();
    expect(createdBody.comment.isApproved).toBe(false);
    expect(createdBody.comment.userId._id.toString()).toBe(author._id.toString());

    const listed = await listComments(new NextRequest(`http://localhost:3000/api/comments?blogId=${blogId}`));
    const listedBody = await listed.json();
    expect(listedBody.comments).toHaveLength(0);

    const liked = await react(postJson("http://localhost:3000/api/likes", { blogId, reaction: "like" }));
    expect(liked.status).toBe(200);
    expect(await liked.json()).toMatchObject({ reaction: "like", total_likes: 1, total_dislikes: 0 });

    const disliked = await react(postJson("http://localhost:3000/api/likes", { blogId, reaction: "dislike" }));
    expect(await disliked.json()).toMatchObject({ reaction: "dislike", total_likes: 0, total_dislikes: 1 });
    expect(await Like.countDocuments({ blogId, userId: author._id })).toBe(1);

    const edited = await PUT(
      new NextRequest(`http://localhost:3000/api/blogs/${blogId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Taken over",
          description: "nope",
          content: "nope",
          author_name: "Guest Author",
        }),
      }),
      { params: Promise.resolve({ id: blogId }) }
    );
    expect(edited.status).toBe(403);
    const stored = await Blog.findById(blogId);
    expect(stored?.title).toBe("Someone else's post");
    expect(stored?.createdBy.toString()).toBe(owner._id.toString());
  });
});

describe("public author profile", () => {
  it("hides unpublished posts and email", async () => {
    const email = "secret-profile@example.com";
    const author = await makeUser({
      role: "author",
      email,
      name: "Ada Writer",
      profile: { fullName: "Ada Writer", bio: "Writes in public" },
    });
    await makeBlog(author._id, { title: "Hidden draft 9f3a", status: "draft", isApproved: false });
    await makeBlog(author._id, { title: "Waiting review", status: "pending", isApproved: false });
    await makeBlog(author._id, {
      title: "Published profile post",
      description: "On the public profile",
      status: "published",
      isApproved: true,
      total_likes: 4,
      total_dislikes: 2,
    });

    const profile = await getPublicAuthorProfile(author._id.toString());
    expect(profile).not.toBeNull();
    const profileJson = JSON.stringify(profile);
    expect(profileJson).not.toContain(email);
    expect(profileJson).not.toContain("Hidden draft 9f3a");
    expect(profileJson).not.toContain("Waiting review");
    expect(profile?.blogs).toHaveLength(1);
    expect(profile?.blogs[0]).toMatchObject({
      title: "Published profile post",
      total_likes: 4,
      total_dislikes: 2,
    });
    expect(profile).not.toHaveProperty("email");

    const { GET } = await import("@/app/api/users/[userId]/route");
    const response = await GET(new NextRequest("http://localhost:3000/api/users/" + author._id.toString()), {
      params: Promise.resolve({ userId: author._id.toString() }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    const bodyJson = JSON.stringify(body);
    expect(body.user.email).toBeUndefined();
    expect(bodyJson).not.toContain(email);
    expect(bodyJson).not.toContain("Hidden draft 9f3a");
    expect(bodyJson).not.toContain("Waiting review");
    expect(body.user.recentBlogs).toHaveLength(1);
    expect(body.user.recentBlogs[0]).toMatchObject({ total_likes: 4, total_dislikes: 2 });
    expect(body.user.profile.fullName).toBe("Ada Writer");
  });
});
