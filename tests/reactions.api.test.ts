import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { NextRequest } from "next/server";
import User from "@/models/User";
import Blog from "@/models/Blog";
import Reaction from "@/models/Reaction";
import { PUBLIC_PROFILE_PAGE_LIMIT, getPublicAuthorProfile } from "@/lib/db";
import { syncReactionCounts } from "@/lib/engagement";

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

describe("blog reactions", () => {
  it("keeps one reaction per user and switches between like and dislike", async () => {
    const author = await makeUser({ role: "author" });
    const reader = await makeUser({ role: "reader" });
    const other = await makeUser({ role: "reader" });
    const blog = await makeBlog(author._id);
    const draft = await makeBlog(author._id, { title: "Secret draft", status: "draft", publishedAt: null });
    const { POST } = await import("@/app/api/reactions/route");
    const blogId = blog._id.toString();

    authMock.mockResolvedValue(null);
    const anonymous = await POST(postJson("http://localhost:3000/api/reactions", { blogId, reaction: "like" }));
    expect(anonymous.status).toBe(401);

    authMock.mockResolvedValue(sessionFor(reader));
    const liked = await POST(postJson("http://localhost:3000/api/reactions", { blogId, reaction: "like" }));
    expect(liked.status).toBe(200);
    expect(await liked.json()).toMatchObject({ reaction: "like", totalLikes: 1, totalDislikes: 0 });
    expect(await Reaction.countDocuments({ blogId, userId: reader._id })).toBe(1);

    const removed = await POST(postJson("http://localhost:3000/api/reactions", { blogId, reaction: "like" }));
    expect(await removed.json()).toMatchObject({ reaction: null, totalLikes: 0, totalDislikes: 0 });
    expect(await Reaction.countDocuments({ blogId, userId: reader._id })).toBe(0);

    await POST(postJson("http://localhost:3000/api/reactions", { blogId, reaction: "like" }));
    const switched = await POST(postJson("http://localhost:3000/api/reactions", { blogId, reaction: "dislike" }));
    expect(await switched.json()).toMatchObject({ reaction: "dislike", totalLikes: 0, totalDislikes: 1 });
    expect(await Reaction.countDocuments({ blogId, userId: reader._id })).toBe(1);
    expect(await Reaction.findOne({ blogId, userId: reader._id })).toMatchObject({ type: "dislike" });

    authMock.mockResolvedValue(sessionFor(other));
    const second = await POST(postJson("http://localhost:3000/api/reactions", { blogId, reaction: "like" }));
    expect(await second.json()).toMatchObject({ reaction: "like", totalLikes: 1, totalDislikes: 1 });
    expect(await Reaction.countDocuments({ blogId })).toBe(2);

    const hidden = await POST(
      postJson("http://localhost:3000/api/reactions", { blogId: draft._id.toString(), reaction: "like" })
    );
    expect(hidden.status).toBe(404);
    expect(await Reaction.countDocuments({ blogId: draft._id })).toBe(0);
  });

  it("lets an author comment and react on someone else's published post", async () => {
    const owner = await makeUser({ role: "author", profile: { fullName: "Post Owner" } });
    const author = await makeUser({ role: "author", profile: { fullName: "Guest Author" } });
    const blog = await makeBlog(owner._id, { title: "Someone else's post", authorName: "Post Owner" });
    const blogId = blog._id.toString();

    authMock.mockResolvedValue(sessionFor(author));
    const { POST: comment } = await import("@/app/api/comments/route");
    const { GET: listComments } = await import("@/app/api/comments/route");
    const { POST: react } = await import("@/app/api/reactions/route");
    const { PUT } = await import("@/app/api/blogs/[id]/route");

    const created = await comment(
      postJson("http://localhost:3000/api/comments", { blogId, content: "A note from another author" })
    );
    expect(created.status).toBe(201);
    const createdBody = await created.json();
    expect(createdBody.comment.isVisible).toBe(true);
    expect(createdBody.comment.userId._id.toString()).toBe(author._id.toString());

    const listed = await listComments(new NextRequest(`http://localhost:3000/api/comments?blogId=${blogId}`));
    const listedBody = await listed.json();
    expect(listedBody.comments).toHaveLength(1);

    const liked = await react(postJson("http://localhost:3000/api/reactions", { blogId, reaction: "like" }));
    expect(liked.status).toBe(200);
    expect(await liked.json()).toMatchObject({ reaction: "like", totalLikes: 1, totalDislikes: 0 });

    const disliked = await react(postJson("http://localhost:3000/api/reactions", { blogId, reaction: "dislike" }));
    expect(await disliked.json()).toMatchObject({ reaction: "dislike", totalLikes: 0, totalDislikes: 1 });
    expect(await Reaction.countDocuments({ blogId, userId: author._id })).toBe(1);

    const edited = await PUT(
      new NextRequest(`http://localhost:3000/api/blogs/${blogId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Taken over",
          description: "nope",
          content: "nope",
          authorName: "Guest Author",
        }),
      }),
      { params: Promise.resolve({ id: blogId }) }
    );
    expect(edited.status).toBe(403);
    const stored = await Blog.findById(blogId);
    expect(stored?.title).toBe("Someone else's post");
    expect(stored?.authorId.toString()).toBe(owner._id.toString());
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
    await makeBlog(author._id, { title: "Hidden draft 9f3a", status: "draft", publishedAt: null });
    await makeBlog(author._id, {
      title: "Published profile post",
      description: "On the public profile",
      status: "published",
      publishedAt: new Date(),
      totalLikes: 4,
      totalDislikes: 2,
    });

    const profile = await getPublicAuthorProfile(author._id.toString());
    expect(profile).not.toBeNull();
    const profileJson = JSON.stringify(profile);
    expect(profileJson).not.toContain(email);
    expect(profileJson).not.toContain("Hidden draft 9f3a");
    expect(profile?.blogs).toHaveLength(1);
    expect(profile?.blogs[0]).toMatchObject({
      title: "Published profile post",
      totalLikes: 4,
      totalDislikes: 2,
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
    expect(body.user.recentBlogs).toHaveLength(1);
    expect(body.user.recentBlogs[0]).toMatchObject({ totalLikes: 4, totalDislikes: 2 });
    expect(body.user.profile.fullName).toBe("Ada Writer");
    expect(body.user.stats.publishedBlogsCount).toBe(1);
  });

  it("returns the first page of published posts and five recent blogs", async () => {
    const author = await makeUser({ role: "author" });
    for (let index = 0; index < 6; index += 1) {
      await makeBlog(author._id, {
        title: `Post ${index}`,
        publishedAt: new Date(Date.UTC(2024, 0, index + 1)),
      });
    }

    const first = await getPublicAuthorProfile(author._id.toString(), { page: 1, limit: 2, skip: 0 });
    expect(first?.blogs.map((blog) => blog.title)).toEqual(["Post 5", "Post 4"]);
    expect(first?.pagination).toEqual({ page: 1, limit: 2, total: 6, pages: 3 });

    const second = await getPublicAuthorProfile(author._id.toString(), { page: 2, limit: 2, skip: 2 });
    expect(second?.blogs.map((blog) => blog.title)).toEqual(["Post 3", "Post 2"]);

    const bounded = await getPublicAuthorProfile(author._id.toString());
    expect(bounded?.pagination.limit).toBe(PUBLIC_PROFILE_PAGE_LIMIT);
    expect(bounded?.pagination.total).toBe(6);
    expect(bounded?.blogs).toHaveLength(6);

    const { GET } = await import("@/app/api/users/[userId]/route");
    const response = await GET(new NextRequest(`http://localhost:3000/api/users/${author._id.toString()}`), {
      params: Promise.resolve({ userId: author._id.toString() }),
    });
    const body = await response.json();
    expect(body.user.stats.publishedBlogsCount).toBe(6);
    expect(body.user.recentBlogs.map((blog: { title: string }) => blog.title)).toEqual([
      "Post 5",
      "Post 4",
      "Post 3",
      "Post 2",
      "Post 1",
    ]);
  });
});

describe("reaction count sync", () => {
  it("counts likes and dislikes on the blog document", async () => {
    const author = await makeUser({ role: "author" });
    const reader = await makeUser();
    const blog = await makeBlog(author._id);
    await Reaction.create({ blogId: blog._id, userId: reader._id, type: "like" });
    await Reaction.create({ blogId: blog._id, userId: author._id, type: "dislike" });

    await expect(syncReactionCounts(blog._id)).resolves.toEqual({ totalLikes: 1, totalDislikes: 1 });
    const stored = await Blog.findById(blog._id).select("totalLikes totalDislikes");
    expect(stored?.totalLikes).toBe(1);
    expect(stored?.totalDislikes).toBe(1);
  });
});
