"use client";

import { useReaction } from "@/hooks/useReaction";
import type { ReactionKind } from "@/lib/api";
import { cn } from "@/lib/utils";
import { FiThumbsDown, FiThumbsUp } from "react-icons/fi";

interface ReactionButtonsProps {
  blogId: string;
  initialLikes?: number;
  initialDislikes?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showSignInHint?: boolean;
}

export function ReactionButtons({
  blogId,
  initialLikes = 0,
  initialDislikes = 0,
  className,
  size = "md",
  showSignInHint = false,
}: ReactionButtonsProps) {
  const { reaction, likes, dislikes, isLoading, error, canReact, signedOut, choose } = useReaction(
    blogId,
    initialLikes,
    initialDislikes
  );

  const sizeClasses = {
    sm: "min-h-10 px-3 py-2 text-sm",
    md: "min-h-11 px-3.5 py-2 text-sm",
    lg: "min-h-12 px-4 py-2.5 text-base",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const buttonClass = (kind: ReactionKind, active: string, idle: string) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors touch-manipulation",
      sizeClasses[size],
      reaction === kind ? active : idle,
      (!canReact || isLoading) && "cursor-not-allowed opacity-70"
    );

  return (
    <div className={cn("flex flex-col items-start gap-1", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => choose("like")}
          disabled={!canReact || isLoading}
          aria-pressed={reaction === "like"}
          aria-label={reaction === "like" ? "Remove like" : "Like"}
          className={buttonClass(
            "like",
            "border-red-300 bg-red-50 text-red-700",
            "border-neutral-300 bg-white text-neutral-700 hover:border-red-300 hover:text-red-600"
          )}
        >
          <FiThumbsUp className={cn(iconSizes[size], reaction === "like" && "fill-current")} />
          <span>Like</span>
          <span className="font-semibold">{likes}</span>
        </button>
        <button
          type="button"
          onClick={() => choose("dislike")}
          disabled={!canReact || isLoading}
          aria-pressed={reaction === "dislike"}
          aria-label={reaction === "dislike" ? "Remove dislike" : "Dislike"}
          className={buttonClass(
            "dislike",
            "border-neutral-800 bg-neutral-900 text-white",
            "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500"
          )}
        >
          <FiThumbsDown className={cn(iconSizes[size], reaction === "dislike" && "fill-current")} />
          <span>Dislike</span>
          <span className="font-semibold">{dislikes}</span>
        </button>
      </div>
      {showSignInHint && signedOut && <p className="text-xs text-neutral-500">Sign in to react</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
