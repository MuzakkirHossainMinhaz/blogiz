"use client";

import { CommentSection } from "@/components/blog/CommentSection";
import { ReactionButtons } from "@/components/ui/ReactionButtons";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { ROUTES } from "@/config/constants";
import { Blog } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { FaCalendar } from "react-icons/fa";
import { authorProfileId, formatDate } from "@/lib/utils";
import { renderMarkdown } from "@/lib/sanitize";
import { isCloudinaryDeliveryUrl } from "@/lib/urls";

interface BlogDetailClientProps {
  blog: Blog;
}

export function BlogDetailClient({ blog }: BlogDetailClientProps) {
  const currentUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://your-domain.com/blogs/${blog._id}`;
  const profileId = authorProfileId(blog.authorId);

  return (
    <article className="max-w-4xl mx-auto w-full min-w-0">
      <header className="mb-8 md:mb-12 text-center">
        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-accent-100 text-accent-800 border border-accent-200 mb-4">
          <FaCalendar className="w-3.5 h-3.5 mr-2 shrink-0" />
          <span>{formatDate(blog.publish_date || blog.createdAt)}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6 leading-tight break-words">
          {blog.title}
        </h1>

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 shrink-0 rounded-full ring-2 ring-primary-100 bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-semibold text-lg">
                {blog.author_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-left min-w-0">
              {profileId ? (
                <Link href={ROUTES.AUTHOR(profileId)} className="font-semibold text-neutral-900 hover:text-primary-600 break-words">
                  {blog.author_name}
                </Link>
              ) : (
                <p className="font-semibold text-neutral-900 break-words">{blog.author_name}</p>
              )}
              <p className="text-sm text-neutral-600">Author</p>
            </div>
          </div>

          <div className="h-8 w-px bg-neutral-200 hidden sm:block" />

          <ReactionButtons
            blogId={blog._id}
            initialLikes={blog.total_likes}
            initialDislikes={blog.total_dislikes ?? 0}
            size="md"
            showSignInHint
            className="items-center sm:items-start"
          />
        </div>
      </header>

      {blog.blog_image && isCloudinaryDeliveryUrl(blog.blog_image) && (
        <figure className="mb-8 md:mb-12 rounded-xl sm:rounded-2xl overflow-hidden shadow-soft-lg">
          <Image
            src={blog.blog_image}
            width={1200}
            height={600}
            alt={blog.title}
            className="w-full h-auto object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
            priority
          />
        </figure>
      )}

      <div className="prose prose-neutral sm:prose-lg max-w-none mb-10 sm:mb-12">
        <div
          className="text-neutral-700 leading-relaxed text-base sm:text-lg break-words"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(blog.content || blog.description) }}
        />
      </div>

      <footer className="pt-6 sm:pt-8 border-t border-neutral-200">
        <ShareButtons title={blog.title} url={currentUrl} size="md" variant="compact" />
        <CommentSection blogId={blog._id} />
      </footer>
    </article>
  );
}
