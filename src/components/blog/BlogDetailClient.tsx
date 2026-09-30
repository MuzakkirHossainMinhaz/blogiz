"use client";

import { CommentSection } from "@/components/blog/CommentSection";
import { FadeIn } from "@/components/motion";
import { ReactionButtons } from "@/components/ui/ReactionButtons";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ROUTES } from "@/config/constants";
import { Blog } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { FiCalendar } from "react-icons/fi";
import { authorAvatarUrl, authorProfileId, formatDate } from "@/lib/utils";
import { renderMarkdown } from "@/lib/sanitize";
import { isCloudinaryDeliveryUrl } from "@/lib/urls";

interface BlogDetailClientProps {
  blog: Blog;
}

export function BlogDetailClient({ blog }: BlogDetailClientProps) {
  const currentUrl =
    typeof window !== "undefined" ? window.location.href : `https://your-domain.com/blogs/${blog._id}`;
  const profileId = authorProfileId(blog.authorId);

  return (
    <article className="max-w-3xl mx-auto w-full min-w-0">
      <FadeIn>
        <header className="mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium bg-primary-50 text-primary-800 border border-primary-100 mb-4">
            <FiCalendar className="w-3.5 h-3.5 shrink-0" />
            <span>{formatDate(blog.publish_date || blog.createdAt)}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-ink mb-6 leading-tight tracking-tight break-words">
            {blog.title}
          </h1>

          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 mb-2">
            <div className="flex items-center gap-3">
              <UserAvatar src={authorAvatarUrl(blog.authorId)} name={blog.author_name} size="lg" />
              <div className="text-left min-w-0">
                {profileId ? (
                  <Link
                    href={ROUTES.AUTHOR(profileId)}
                    className="font-semibold text-ink hover:text-primary-600 break-words"
                  >
                    {blog.author_name}
                  </Link>
                ) : (
                  <p className="font-semibold text-ink break-words">{blog.author_name}</p>
                )}
                <p className="text-sm text-accent-500">Author</p>
              </div>
            </div>
          </div>
        </header>
      </FadeIn>

      {blog.blog_image && isCloudinaryDeliveryUrl(blog.blog_image) && (
        <FadeIn delay={0.06}>
          <figure className="mb-8 md:mb-10 rounded-2xl overflow-hidden shadow-soft border border-neutral-200/80">
            <Image
              src={blog.blog_image}
              width={1200}
              height={600}
              alt={blog.title}
              className="w-full h-auto object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </figure>
        </FadeIn>
      )}

      <div className="prose prose-neutral sm:prose-lg max-w-none mb-10 sm:mb-12">
        <div
          className="text-neutral-700 leading-relaxed text-base sm:text-lg break-words"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(blog.content || blog.description) }}
        />
      </div>

      <div className="sticky bottom-3 z-20 sm:static sm:bottom-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-neutral-200 bg-surface/95 backdrop-blur-md shadow-soft p-3 sm:p-4 sm:border-0 sm:bg-transparent sm:shadow-none sm:backdrop-blur-none sm:p-0">
          <ReactionButtons
            blogId={blog._id}
            initialLikes={blog.total_likes}
            initialDislikes={blog.total_dislikes ?? 0}
            size="md"
            showSignInHint
          />
          <ShareButtons title={blog.title} url={currentUrl} size="md" variant="compact" />
        </div>
      </div>

      <footer className="pt-6 sm:pt-8 border-t border-neutral-200">
        <CommentSection blogId={blog._id} />
      </footer>
    </article>
  );
}
