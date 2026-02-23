"use client";

import { useLike } from "@/hooks/useLike";
import { FiHeart } from "react-icons/fi";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  blogId: string;
  initialLikeCount?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  variant?: "default" | "outline" | "ghost";
}

export function LikeButton({
  blogId,
  initialLikeCount = 0,
  className,
  size = "md",
  showCount = true,
  variant = "default",
}: LikeButtonProps) {
  const { liked, likeCount, isLoading, toggleLike, error } = useLike(blogId);

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-5 py-2.5 text-lg",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const variantClasses = {
    default: liked
      ? "bg-red-500 text-white hover:bg-red-600 border-red-500"
      : "bg-white text-neutral-700 hover:bg-neutral-50 border-neutral-300 hover:border-red-300 hover:text-red-600",
    outline: liked
      ? "bg-red-50 text-red-600 border-red-300 hover:bg-red-100"
      : "bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50 hover:text-red-600",
    ghost: liked
      ? "text-red-600 hover:bg-red-50"
      : "text-neutral-600 hover:bg-neutral-50 hover:text-red-600",
  };

  const baseClasses = {
    default: "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 border",
    outline: "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 border",
    ghost: "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200",
  };

  return (
    <div className={cn("flex flex-col items-start", className)}>
      <button
        onClick={toggleLike}
        disabled={isLoading}
        className={cn(
          baseClasses[variant],
          variantClasses[variant],
          sizeClasses[size],
          isLoading && "opacity-50 cursor-not-allowed",
          "group"
        )}
        aria-label={liked ? "Unlike this article" : "Like this article"}
      >
        <FiHeart
          className={cn(
            iconSizes[size],
            "transition-all duration-200",
            liked
              ? "fill-current animate-pulse-scale"
              : "group-hover:scale-110"
          )}
        />
        {showCount && (
          <span className="font-medium">
            {likeCount}
          </span>
        )}
      </button>
      
      {error && (
        <p className="text-xs text-red-600 mt-1 animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
}

// Add custom animation for heart pulse
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse-scale {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
    .animate-pulse-scale {
      animation: pulse-scale 0.3s ease-in-out;
    }
  `;
  document.head.appendChild(style);
}
