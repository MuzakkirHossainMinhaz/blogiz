import { Blog } from "@/types";
import Link from "next/link";
import { ReactionButtons } from "@/components/ui/ReactionButtons";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { BlogCoverImage } from "@/components/ui/BlogCoverImage";
import { FiCalendar } from "react-icons/fi";
import { Badge } from "@/components/ui/Badge";
import { authorAvatarUrl, authorProfileId, cn, truncateText, formatDate } from "@/lib/utils";
import { ROUTES, UI_CONFIG } from "@/config/constants";

interface BlogCardBaseProps {
  blog: Blog;
  variant?: "default" | "featured";
  className?: string;
}

export function BlogCardBase({ blog, variant = "default", className }: BlogCardBaseProps) {
  const isFeatured = variant === "featured";
  const profileId = authorProfileId(blog.authorId);
  const maxDescLength = isFeatured
    ? UI_CONFIG.MAX_DESCRIPTION_LENGTH_LATEST
    : UI_CONFIG.MAX_DESCRIPTION_LENGTH_CARD;
  const coverHeight = isFeatured ? "h-56 sm:h-72 md:h-96" : "h-48 sm:h-56 md:h-64";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg motion-reduce:hover:translate-y-0",
        className
      )}
    >
      <figure className={cn("relative overflow-hidden", coverHeight)}>
        <Link href={ROUTES.BLOG_DETAIL(blog._id)} className="block h-full w-full">
          <BlogCoverImage
            src={blog.thumbnail}
            alt={blog.title}
            width={600}
            height={isFeatured ? 400 : 300}
            className={cn(
              "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100",
              coverHeight
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={isFeatured}
          />
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:hidden" />
      </figure>

      <div className="p-4 sm:p-5 md:p-6">
        {/* Date Badge */}
        <Badge variant="accent" size="sm" className="w-fit mb-3">
          <FiCalendar className="w-3 h-3" />
          <span>{formatDate(blog.publishedAt || blog.createdAt)}</span>
        </Badge>

        {/* Title */}
        <Link href={ROUTES.BLOG_DETAIL(blog._id)}>
          <h3
            className={cn(
              "font-bold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-2 break-words",
              isFeatured ? "text-lg sm:text-xl md:text-2xl mb-3" : "text-base sm:text-lg md:text-xl mb-2"
            )}
          >
            {truncateText(blog.title, UI_CONFIG.MAX_TITLE_LENGTH)}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-neutral-600 text-sm md:text-base mb-4 line-clamp-3">
          {truncateText(blog.description, maxDescLength)}
        </p>

        {/* Read More Link */}
        <Link
          href={ROUTES.BLOG_DETAIL(blog._id)}
          className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1 min-h-10 group/link"
        >
          Read More
          <svg
            className="w-4 h-4 transition-transform group-hover/link:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>

        {/* Footer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-neutral-100">
          {/* Author */}
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar src={authorAvatarUrl(blog.authorId)} name={blog.authorName} size="sm" />
            {profileId ? (
              <Link href={ROUTES.AUTHOR(profileId)} className="text-sm text-neutral-700 font-medium hover:text-primary-600 truncate">
                {blog.authorName}
              </Link>
            ) : (
              <span className="text-sm text-neutral-700 font-medium truncate">{blog.authorName}</span>
            )}
          </div>

          <ReactionButtons
            blogId={blog._id}
            initialLikes={blog.totalLikes}
            initialDislikes={blog.totalDislikes ?? 0}
            size="sm"
          />
        </div>
      </div>
    </article>
  );
}
