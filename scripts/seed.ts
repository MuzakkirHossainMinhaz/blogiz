import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../src/lib/mongodb";
import User from "../src/models/User";
import Blog from "../src/models/Blog";
import Comment from "../src/models/Comment";
import Like from "../src/models/Like";
import Banner from "../src/models/Banner";
import BlogView from "../src/models/BlogView";
import RoleUpgradeRequest from "../src/models/RoleUpgradeRequest";
import { passwordSchema } from "../src/lib/validation";
import { canSignIn } from "../src/lib/session-policy";
import { bannerFixtures, blogFixtures, buildSeedUsers, commentFixtures } from "./seed-data/fixtures.mjs";

const COLLECTIONS = [
  RoleUpgradeRequest,
  BlogView,
  Like,
  Comment,
  Banner,
  Blog,
  User,
] as const;

async function truncateAll() {
  for (const model of COLLECTIONS) {
    await model.deleteMany({});
  }
}

async function hashPassword(password: string) {
  if (!passwordSchema.safeParse(password).success) {
    throw new Error(`Password does not meet policy: length ≥10 with a letter and a number`);
  }
  return bcrypt.hash(password, 12);
}

async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: "superadmin" | "admin" | "author" | "user";
  profile: Record<string, unknown>;
  isApproved?: boolean;
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
    isApproved: input.isApproved ?? true,
    isActive: input.isActive ?? true,
    emailVerified: input.emailVerified ?? true,
    sessionVersion: 0,
  });

  const loginOk = canSignIn({
    isActive: user.isActive,
    role: user.role,
    isApproved: user.isApproved,
  });
  const passwordOk = await bcrypt.compare(input.password, user.password);
  if (!passwordOk) {
    throw new Error(`Password hash mismatch for ${input.email}`);
  }
  if (input.role !== "author" || input.isApproved !== false) {
    if (!loginOk) {
      throw new Error(`Seeded user ${input.email} cannot sign in (flags misaligned)`);
    }
  }

  return user;
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "1" && !process.argv.includes("--force")) {
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
    console.error("ADMIN_PASSWORD does not meet the password policy (min 10 chars, letter + number)");
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
    role: "superadmin",
    profile: fixtures.admin.profile,
    isApproved: true,
    isActive: true,
    emailVerified: true,
  });

  const siteAdmin =
    fixtures.siteAdmin.email.toLowerCase() === adminEmail
      ? admin
      : await createUser({
          ...fixtures.siteAdmin,
          isApproved: true,
          isActive: true,
          emailVerified: true,
        });

  const authors = [];
  for (const author of fixtures.authors) {
    authors.push(
      await createUser({
        ...author,
        isApproved: true,
        isActive: true,
        emailVerified: true,
      })
    );
  }

  const readers = [];
  for (const reader of fixtures.readers) {
    readers.push(
      await createUser({
        ...reader,
        isApproved: true,
        isActive: true,
        emailVerified: true,
      })
    );
  }

  await createUser({
    ...fixtures.pendingAuthor,
    isApproved: false,
    isActive: true,
    emailVerified: true,
  });

  const byEmail = new Map<string, typeof admin>([
    [admin.email, admin],
    [siteAdmin.email, siteAdmin],
    ...authors.map((u) => [u.email, u] as const),
    ...readers.map((u) => [u.email, u] as const),
  ]);

  console.log("Seeding blogs…");
  const blogsByKey = new Map<string, mongoose.Document & { _id: mongoose.Types.ObjectId; authorId: mongoose.Types.ObjectId }>();
  for (const fixture of blogFixtures) {
    const author = byEmail.get(fixture.authorEmail);
    if (!author) throw new Error(`Missing author ${fixture.authorEmail}`);
    const blog = await Blog.create({
      title: fixture.title,
      description: fixture.description,
      content: fixture.content,
      author_name: author.profile?.fullName || author.name,
      authorId: author._id,
      createdBy: author._id,
      blog_image: fixture.blog_image,
      status: fixture.status,
      isApproved: fixture.isApproved,
      publish_date: fixture.status === "published" ? new Date() : undefined,
      approvedBy: fixture.isApproved ? siteAdmin._id : undefined,
      approvedAt: fixture.isApproved ? new Date() : undefined,
      tags: fixture.tags,
      readingTime: fixture.readingTime,
      total_likes: 0,
      total_dislikes: 0,
      total_comments: 0,
      total_views: 0,
    });
    blogsByKey.set(fixture.key, blog as never);
  }

  console.log("Seeding comments…");
  for (const fixture of commentFixtures) {
    const blog = blogsByKey.get(fixture.blogKey);
    const user = byEmail.get(fixture.authorEmail);
    if (!blog || !user) continue;
    await Comment.create({
      blogId: blog._id,
      userId: user._id,
      content: fixture.content,
      isApproved: fixture.isApproved,
    });
    if (fixture.isApproved) {
      await Blog.updateOne({ _id: blog._id }, { $inc: { total_comments: 1 } });
    }
  }

  console.log("Seeding reactions…");
  const indigo = blogsByKey.get("indigo-craft");
  const multi = blogsByKey.get("multi-author");
  if (indigo && readers[0]) {
    await Like.create({ blogId: indigo._id, userId: readers[0]._id, type: "like" });
    await Blog.updateOne({ _id: indigo._id }, { $inc: { total_likes: 1 } });
  }
  if (indigo && readers[1]) {
    await Like.create({ blogId: indigo._id, userId: readers[1]._id, type: "like" });
    await Blog.updateOne({ _id: indigo._id }, { $inc: { total_likes: 1 } });
  }
  if (multi && readers[0]) {
    await Like.create({ blogId: multi._id, userId: readers[0]._id, type: "dislike" });
    await Blog.updateOne({ _id: multi._id }, { $inc: { total_dislikes: 1 } });
  }
  if (multi && authors[0]) {
    await Like.create({ blogId: multi._id, userId: authors[0]._id, type: "like" });
    await Blog.updateOne({ _id: multi._id }, { $inc: { total_likes: 1 } });
  }

  console.log("Seeding banners…");
  for (const fixture of bannerFixtures) {
    await Banner.create({
      ...fixture,
      createdBy: admin._id,
    });
  }

  console.log("Seeding views…");
  if (indigo) {
    await BlogView.create({ blogId: indigo._id, userId: readers[0]?._id, viewedAt: new Date() });
    await BlogView.create({ blogId: indigo._id, userId: readers[1]?._id, viewedAt: new Date() });
    await Blog.updateOne({ _id: indigo._id }, { $inc: { total_views: 2 } });
  }
  if (multi && readers[0]) {
    await BlogView.create({ blogId: multi._id, userId: readers[0]._id, viewedAt: new Date() });
    await Blog.updateOne({ _id: multi._id }, { $inc: { total_views: 1 } });
  }

  console.log("Seeding role upgrade request…");
  if (readers[1]) {
    await RoleUpgradeRequest.create({
      userId: readers[1]._id,
      requestedRole: "author",
      currentRole: "user",
      reason: "I want to publish short essays about independent software.",
      status: "pending",
    });
  }

  console.log("Verifying admin login flags…");
  const reloaded = await User.findOne({ email: adminEmail }).lean();
  if (!reloaded || !(await bcrypt.compare(adminPassword, reloaded.password as string)) || !canSignIn(reloaded as never)) {
    throw new Error("Post-seed admin login check failed");
  }
  if (reloaded.role !== "superadmin" || !reloaded.isActive || !reloaded.isApproved || !reloaded.emailVerified) {
    throw new Error("Post-seed admin flags are not aligned (role/isActive/isApproved/emailVerified)");
  }

  const [userCount, blogCount, commentCount, likeCount, bannerCount, viewCount, upgradeCount] = await Promise.all([
    User.countDocuments(),
    Blog.countDocuments(),
    Comment.countDocuments(),
    Like.countDocuments(),
    Banner.countDocuments(),
    BlogView.countDocuments(),
    RoleUpgradeRequest.countDocuments(),
  ]);

  console.log(`Seed complete. Superadmin: ${adminEmail}`);
  console.log("Sign in at /auth/login (requires REDIS_URL for rate limiting).");
  console.log(
    `Counts — users: ${userCount}, blogs: ${blogCount}, comments: ${commentCount}, likes: ${likeCount}, banners: ${bannerCount}, views: ${viewCount}, upgrades: ${upgradeCount}`
  );

  // Do not await disconnect — open pool handles can hang Node exit in scripts.
  void mongoose.disconnect().catch(() => undefined);
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed");
  console.error(error instanceof Error ? error.message : "Error");
  void mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
