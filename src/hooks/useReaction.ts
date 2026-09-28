"use client";

import { getReaction, setReaction, type ReactionKind } from "@/lib/api";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

interface UseReactionReturn {
  reaction: ReactionKind | null;
  likes: number;
  dislikes: number;
  isLoading: boolean;
  error: string | null;
  canReact: boolean;
  signedOut: boolean;
  choose: (reaction: ReactionKind) => Promise<void>;
}

export function useReaction(blogId: string, initialLikes = 0, initialDislikes = 0): UseReactionReturn {
  const { status } = useSession();
  const [reaction, setCurrent] = useState<ReactionKind | null>(null);
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !blogId) return;
    let cancelled = false;
    getReaction(blogId)
      .then((result) => {
        if (cancelled) return;
        setCurrent(result.reaction);
        setLikes(result.total_likes);
        setDislikes(result.total_dislikes);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [blogId, status]);

  const choose = useCallback(
    async (next: ReactionKind) => {
      if (status !== "authenticated" || isLoading || !blogId) return;
      setIsLoading(true);
      setError(null);
      try {
        const result = await setReaction(blogId, next);
        setCurrent(result.reaction);
        setLikes(result.total_likes);
        setDislikes(result.total_dislikes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save reaction");
      } finally {
        setIsLoading(false);
      }
    },
    [blogId, isLoading, status]
  );

  return {
    reaction,
    likes,
    dislikes,
    isLoading,
    error,
    canReact: status === "authenticated",
    signedOut: status === "unauthenticated",
    choose,
  };
}
