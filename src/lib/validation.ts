import { z } from "zod";

export const BLOG_CONTENT_MAX = 100_000;

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

export const blogWriteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(500),
  content: z.string().min(1).max(BLOG_CONTENT_MAX),
  author_name: z.string().trim().min(1).max(120),
  blog_image: z.string().optional(),
  status: z.enum(["draft", "pending", "published", "rejected"]).optional(),
  publish_date: z.string().optional(),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
  enableAI: z.boolean().optional(),
});

export type BlogWriteInput = z.infer<typeof blogWriteSchema>;

export const reactionSchema = z.object({
  blogId: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid blog ID"),
  reaction: z.enum(["like", "dislike"]),
});

export type ReactionKind = z.infer<typeof reactionSchema>["reaction"];
