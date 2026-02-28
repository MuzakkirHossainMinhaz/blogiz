"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { FiCheck, FiFacebook, FiLink, FiLinkedin, FiShare2, FiTwitter } from "react-icons/fi";

interface ShareButtonsProps {
  title: string;
  url: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact";
}

export function ShareButtons({ title, url, className, size = "md", variant = "default" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const sizeClasses = {
    sm: "p-2 text-sm",
    md: "p-2.5 text-base",
    lg: "p-3 text-lg",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  };

  const handleShare = (platform: keyof typeof shareUrls) => {
    window.open(shareUrls[platform], "_blank", "width=600,height=400,scrollbars=yes,resizable=yes");
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <button
          onClick={handleCopyLink}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
            "bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300 hover:border-neutral-400",
            sizeClasses[size]
          )}
          title="Copy link"
        >
          {copied ? (
            <FiCheck className={cn(iconSizes[size], "text-green-600")} />
          ) : (
            <FiLink className={cn(iconSizes[size])} />
          )}
        </button>

        <button
          onClick={() => handleShare("twitter")}
          className={cn(
            "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
            "bg-sky-500 text-white hover:bg-sky-600 border border-sky-500",
            sizeClasses[size]
          )}
          title="Share on Twitter"
        >
          <FiTwitter className={cn(iconSizes[size])} />
        </button>

        <button
          onClick={() => handleShare("facebook")}
          className={cn(
            "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
            "bg-blue-600 text-white hover:bg-blue-700 border border-blue-600",
            sizeClasses[size]
          )}
          title="Share on Facebook"
        >
          <FiFacebook className={cn(iconSizes[size])} />
        </button>

        <button
          onClick={() => handleShare("linkedin")}
          className={cn(
            "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
            "bg-blue-700 text-white hover:bg-blue-800 border border-blue-700",
            sizeClasses[size]
          )}
          title="Share on LinkedIn"
        >
          <FiLinkedin className={cn(iconSizes[size])} />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <FiShare2 className={cn(iconSizes[size], "text-neutral-600")} />
        <span className="font-medium text-neutral-900">Share this article</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCopyLink}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
            "bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300 hover:border-neutral-400 hover:text-neutral-900",
            sizeClasses[size]
          )}
        >
          {copied ? (
            <>
              <FiCheck className={cn(iconSizes[size], "text-green-600")} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <FiLink className={cn(iconSizes[size])} />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <button
          onClick={() => handleShare("twitter")}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
            "bg-sky-500 text-white hover:bg-sky-600 border border-sky-500 hover:border-sky-600",
            sizeClasses[size]
          )}
        >
          <FiTwitter className={cn(iconSizes[size])} />
          <span>Twitter</span>
        </button>

        <button
          onClick={() => handleShare("facebook")}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
            "bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 hover:border-blue-700",
            sizeClasses[size]
          )}
        >
          <FiFacebook className={cn(iconSizes[size])} />
          <span>Facebook</span>
        </button>

        <button
          onClick={() => handleShare("linkedin")}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
            "bg-blue-700 text-white hover:bg-blue-800 border border-blue-700 hover:border-blue-800",
            sizeClasses[size]
          )}
        >
          <FiLinkedin className={cn(iconSizes[size])} />
          <span>LinkedIn</span>
        </button>
      </div>
    </div>
  );
}
