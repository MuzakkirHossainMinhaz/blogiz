"use client";

import { LikeButton } from "@/components/ui/LikeButton";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { Blog } from "@/types";
import Image from "next/image";
import { FaCalendar } from "react-icons/fa";
import { formatDate } from "@/lib/utils";
import { UI_CONFIG } from "@/config/constants";

interface BlogDetailClientProps {
  blog: Blog;
}

export function BlogDetailClient({ blog }: BlogDetailClientProps) {
  const currentUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : `https://your-domain.com/blogs/${blog._id}`;

  return (
    <article className="max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-8 md:mb-12 text-center">
        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-accent-100 text-accent-800 border border-accent-200 mb-4">
          <FaCalendar className="w-3.5 h-3.5 mr-2" />
          <span>{formatDate(blog.publish_date || blog.createdAt)}</span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-6 leading-tight">
          {blog.title}
        </h1>

        {/* Author Info */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full ring-2 ring-primary-100 bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-semibold text-lg">
                {blog.author_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-neutral-900">
                {blog.author_name}
              </p>
              <p className="text-sm text-neutral-600">Author</p>
            </div>
          </div>

          <div className="h-8 w-px bg-neutral-200" />

          <div className="flex items-center gap-2 text-neutral-600">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xs">♥</span>
            </div>
            <span className="font-semibold">
              {blog.total_likes}
            </span>
            <span className="text-sm">likes</span>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {blog.blog_image && (
        <figure className="mb-8 md:mb-12 rounded-2xl overflow-hidden shadow-soft-lg">
          <Image
            src={blog.blog_image}
            width={1200}
            height={600}
            alt={blog.title}
            className="w-full h-auto object-cover"
            priority
          />
        </figure>
      )}

      {/* Content */}
      <div className="prose prose-lg max-w-none mb-12">
        <div 
          className="text-neutral-700 leading-relaxed text-lg"
          dangerouslySetInnerHTML={{ __html: blog.content || blog.description }}
        />
      </div>

      {/* Footer Actions */}
      <footer className="pt-8 border-t border-neutral-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Like Button */}
          <LikeButton 
            blogId={blog._id}
            initialLikeCount={blog.total_likes}
            size="lg"
            variant="default"
          />

          {/* Share Buttons */}
          <ShareButtons 
            title={blog.title}
            url={currentUrl}
            size="md"
            variant="compact"
          />
        </div>
      </footer>
    </article>
  );
}
