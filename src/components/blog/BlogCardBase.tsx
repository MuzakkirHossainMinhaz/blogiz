import { Blog } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { LikeButton } from "@/components/ui/LikeButton";
import { FaCalendar } from "react-icons/fa";
import { Badge } from "@/components/ui/Badge";
import { cn, truncateText, formatDate } from "@/lib/utils";
import { ROUTES, UI_CONFIG } from "@/config/constants";

interface BlogCardBaseProps {
  blog: Blog;
  variant?: "default" | "featured";
  className?: string;
}

export function BlogCardBase({ blog, variant = "default", className }: BlogCardBaseProps) {
  const isFeatured = variant === "featured";
  const maxDescLength = isFeatured
    ? UI_CONFIG.MAX_DESCRIPTION_LENGTH_LATEST
    : UI_CONFIG.MAX_DESCRIPTION_LENGTH_CARD;

  return (
    <article
      className={cn(
        "group card bg-white shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden",
        className
      )}
    >
      {/* Image */}
      <figure className="relative overflow-hidden">
        <Link href={ROUTES.BLOG_DETAIL(blog._id)}>
          <Image
            src={blog.blog_image || "/placeholder-blog.jpg"}
            width={600}
            height={isFeatured ? 400 : 300}
            alt={blog.title}
            className={cn(
              "w-full object-cover transition-transform duration-300 group-hover:scale-105",
              isFeatured ? "h-80 md:h-96" : "h-56 md:h-64"
            )}
            priority={isFeatured}
          />
        </Link>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </figure>

      {/* Content */}
      <div className="card-body p-5 md:p-6">
        {/* Date Badge */}
        <Badge variant="accent" size="sm" className="w-fit mb-3">
          <FaCalendar className="w-3 h-3" />
          <span>{formatDate(blog.publish_date || blog.createdAt)}</span>
        </Badge>

        {/* Title */}
        <Link href={ROUTES.BLOG_DETAIL(blog._id)}>
          <h3
            className={cn(
              "font-bold text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-2",
              isFeatured ? "text-xl md:text-2xl mb-3" : "text-lg md:text-xl mb-2"
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
          className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1 group/link"
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
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="avatar">
              <div className="w-8 h-8 flex justify-center items-center rounded-full ring-2 ring-primary-100">
                <Image
                  src={UI_CONFIG.DEFAULT_AVATAR}
                  width={20}
                  height={20}
                  alt={blog.author_name}
                  className="object-cover"
                />
              </div>
            </div>
            <span className="text-sm text-neutral-700 font-medium">
              {blog.author_name}
            </span>
          </div>

          {/* Likes */}
          <LikeButton 
            blogId={blog._id}
            initialLikeCount={blog.total_likes}
            size="sm"
            variant="ghost"
            showCount={true}
          />
        </div>
      </div>
    </article>
  );
}
