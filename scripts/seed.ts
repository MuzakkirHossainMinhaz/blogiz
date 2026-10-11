import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";
import { canSignIn } from "../src/lib/session-policy";
import { passwordSchema } from "../src/lib/validation";
import Blog from "../src/models/Blog";
import BlogView from "../src/models/BlogView";
import Comment from "../src/models/Comment";
import MediaAsset from "../src/models/MediaAsset";
import ModerationAction from "../src/models/ModerationAction";
import Reaction from "../src/models/Reaction";
import RoleUpgradeRequest from "../src/models/RoleUpgradeRequest";
import User from "../src/models/User";
import {
  blogFixtures,
  buildSeedUsers,
  commentFixtures,
} from "./seed-data/fixtures.mjs";

const COLLECTIONS = [
  ModerationAction,
  MediaAsset,
  RoleUpgradeRequest,
  BlogView,
  Reaction,
  Comment,
  Blog,
  User,
] as const;

async function truncateAll() {
  for (const model of COLLECTIONS) {
    // No filter arg: iterating a union of Model types breaks `deleteMany({})` overload resolution.
    await model.deleteMany();
    await model.syncIndexes();
  }
}

async function hashPassword(password: string) {
  if (!passwordSchema.safeParse(password).success) {
    throw new Error(
      `Password does not meet policy: length ≥10 with a letter and a number`,
    );
  }
  return bcrypt.hash(password, 12);
}

type SeedRole = "admin" | "author" | "reader";
type SeedBlogStatus = "draft" | "published";
type SeedThumbnailSource = "upload" | "ai" | "none";

function asSeedRole(role: string): SeedRole {
  if (role === "admin" || role === "author" || role === "reader") return role;
  throw new Error(`Invalid seed role: ${role}`);
}

function asBlogStatus(status: string): SeedBlogStatus {
  if (status === "draft" || status === "published") return status;
  throw new Error(`Invalid seed blog status: ${status}`);
}

function asThumbnailSource(source: string | undefined): SeedThumbnailSource {
  if (!source) return "upload";
  if (source === "upload" || source === "ai" || source === "none")
    return source;
  throw new Error(`Invalid seed thumbnail source: ${source}`);
}

async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: SeedRole;
  profile: Record<string, unknown>;
  isActive?: boolean;
  emailVerified?: boolean;
}) {
  const hashed = await hashPassword(input.password);
  const user = await User.create({
    email: input.email.toLowerCase().trim(),
    password: hashed,
    name: input.name,
    role: input.role,
    profile: input.profile,
    isActive: input.isActive ?? true,
    emailVerified: input.emailVerified ?? true,
    commentSuspended: false,
    sessionVersion: 0,
  });

  const loginOk = canSignIn({ isActive: user.isActive });
  const passwordOk = await bcrypt.compare(input.password, user.password);
  if (!passwordOk) {
    throw new Error(`Password hash mismatch for ${input.email}`);
  }
  if (!loginOk) {
    throw new Error(
      `Seeded user ${input.email} cannot sign in (flags misaligned)`,
    );
  }

  return user;
}

async function main() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.SEED_FORCE !== "1" &&
    !process.argv.includes("--force")
  ) {
    console.error("Refusing to seed while NODE_ENV=production");
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!process.env.MONGODB_URI || !adminEmail || !adminPassword) {
    console.error("MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD are required");
    process.exit(1);
  }

  if (!passwordSchema.safeParse(adminPassword).success) {
    console.error(
      "ADMIN_PASSWORD does not meet the password policy (min 10 chars, letter + number)",
    );
    process.exit(1);
  }

  await connectDB();
  console.log("Truncating collections…");
  await truncateAll();

  const fixtures = buildSeedUsers(adminEmail);
  console.log("Seeding users…");

  const admin = await createUser({
    email: fixtures.admin.email,
    password: adminPassword,
    name: fixtures.admin.name,
    role: "admin",
    profile: fixtures.admin.profile,
    isActive: true,
    emailVerified: true,
  });

  const authors = [];
  for (const author of fixtures.authors) {
    authors.push(
      await createUser({
        email: author.email,
        password: author.password,
        name: author.name,
        role: asSeedRole(author.role),
        profile: author.profile,
        isActive: true,
        emailVerified: true,
      }),
    );
  }

  const readers = [];
  for (const reader of fixtures.readers) {
    readers.push(
      await createUser({
        email: reader.email,
        password: reader.password,
        name: reader.name,
        role: asSeedRole(reader.role),
        profile: reader.profile,
        isActive: true,
        emailVerified: true,
      }),
    );
  }

  const byEmail = new Map<string, typeof admin>([
    [admin.email, admin],
    ...authors.map((u) => [u.email, u] as const),
    ...readers.map((u) => [u.email, u] as const),
  ]);

  console.log("Seeding blogs…");
  const blogsByKey = new Map<
    string,
    mongoose.Document & {
      _id: mongoose.Types.ObjectId;
      authorId: mongoose.Types.ObjectId;
    }
  >();
  for (const fixture of blogFixtures) {
    const author = byEmail.get(fixture.authorEmail);
    if (!author) throw new Error(`Missing author ${fixture.authorEmail}`);
    const status = asBlogStatus(fixture.status);
    const publishedAt = status === "published" ? new Date() : null;
    const blog = await Blog.create({
      title: fixture.title,
      description: fixture.description,
      content: fixture.content,
      authorName: author.profile?.fullName || author.name,
      authorId: author._id,
      createdBy: author._id,
      thumbnail: fixture.thumbnail,
      thumbnailSource: asThumbnailSource(fixture.thumbnailSource),
      status,
      publishedAt,
      tags: fixture.tags,
      readingTime: fixture.readingTime,
      totalLikes: 0,
      totalDislikes: 0,
      totalComments: 0,
      totalViews: 0,
    });
    blogsByKey.set(fixture.key, blog as never);
  }

  console.log("Seeding comments…");
  const rootComments: mongoose.Types.ObjectId[] = [];
  for (const fixture of commentFixtures) {
    const blog = blogsByKey.get(fixture.blogKey);
    const user = byEmail.get(fixture.authorEmail);
    if (!blog || !user) continue;

    const parentId =
      typeof fixture.replyToIndex === "number"
        ? rootComments[fixture.replyToIndex] || null
        : null;

    const comment = await Comment.create({
      blogId: blog._id,
      userId: user._id,
      content: fixture.content,
      parentId,
      isVisible: fixture.isVisible !== false,
    });

    if (!parentId) {
      rootComments.push(comment._id as mongoose.Types.ObjectId);
    }

    if (fixture.isVisible !== false) {
      await Blog.updateOne({ _id: blog._id }, { $inc: { totalComments: 1 } });
    }
  }

  console.log("Seeding reactions…");
  const indigo = blogsByKey.get("indigo-craft");
  const multi = blogsByKey.get("multi-author");
  if (indigo && readers[0]) {
    await Reaction.create({
      blogId: indigo._id,
      userId: readers[0]._id,
      type: "like",
    });
    await Blog.updateOne({ _id: indigo._id }, { $inc: { totalLikes: 1 } });
  }
  if (indigo && readers[1]) {
    await Reaction.create({
      blogId: indigo._id,
      userId: readers[1]._id,
      type: "like",
    });
    await Blog.updateOne({ _id: indigo._id }, { $inc: { totalLikes: 1 } });
  }
  if (multi && readers[0]) {
    await Reaction.create({
      blogId: multi._id,
      userId: readers[0]._id,
      type: "dislike",
    });
    await Blog.updateOne({ _id: multi._id }, { $inc: { totalDislikes: 1 } });
  }
  if (multi && authors[0]) {
    await Reaction.create({
      blogId: multi._id,
      userId: authors[0]._id,
      type: "like",
    });
    await Blog.updateOne({ _id: multi._id }, { $inc: { totalLikes: 1 } });
  }

  console.log("Seeding views…");
  if (indigo) {
    await BlogView.create({
      blogId: indigo._id,
      userId: readers[0]?._id,
      viewedAt: new Date(),
    });
    await BlogView.create({
      blogId: indigo._id,
      userId: readers[1]?._id,
      viewedAt: new Date(),
    });
    await Blog.updateOne({ _id: indigo._id }, { $inc: { totalViews: 2 } });
  }
  if (multi && readers[0]) {
    await BlogView.create({
      blogId: multi._id,
      userId: readers[0]._id,
      viewedAt: new Date(),
    });
    await Blog.updateOne({ _id: multi._id }, { $inc: { totalViews: 1 } });
  }

  console.log("Seeding role upgrade request…");
  if (readers[1]) {
    await RoleUpgradeRequest.create({
      userId: readers[1]._id,
      requestedRole: "author",
      currentRole: "reader",
      reason: "I want to publish short essays about independent software.",
      status: "pending",
    });
  }

  console.log("Verifying admin login flags…");
  const reloaded = await User.findOne({ email: adminEmail }).lean();
  if (
    !reloaded ||
    !(await bcrypt.compare(adminPassword, reloaded.password as string)) ||
    !canSignIn(reloaded)
  ) {
    throw new Error("Post-seed admin login check failed");
  }
  if (
    reloaded.role !== "admin" ||
    !reloaded.isActive ||
    !reloaded.emailVerified
  ) {
    throw new Error(
      "Post-seed admin flags are not aligned (role/isActive/emailVerified)",
    );
  }

  const [
    userCount,
    blogCount,
    commentCount,
    reactionCount,
    viewCount,
    upgradeCount,
  ] = await Promise.all([
    User.countDocuments(),
    Blog.countDocuments(),
    Comment.countDocuments(),
    Reaction.countDocuments(),
    BlogView.countDocuments(),
    RoleUpgradeRequest.countDocuments(),
  ]);

  console.log(`Seed complete. Admin: ${adminEmail}`);
  console.log("Sign in at /auth/login (requires REDIS_URL for rate limiting).");
  console.log(
    `Counts — users: ${userCount}, blogs: ${blogCount}, comments: ${commentCount}, reactions: ${reactionCount}, views: ${viewCount}, upgrades: ${upgradeCount}`,
  );

  void mongoose.disconnect().catch(() => undefined);
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed");
  console.error(error instanceof Error ? error.message : "Error");
  void mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
