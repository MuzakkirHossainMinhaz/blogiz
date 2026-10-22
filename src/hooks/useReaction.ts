"use client";

import { useToast } from "@/components/ui/Toast";
import { getReaction, setReaction, type ReactionKind } from "@/lib/api";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseReactionReturn {
  reaction: ReactionKind | null;
  likes: number;
  dislikes: number;
  isLoading: boolean;
  canReact: boolean;
  signedOut: boolean;
  choose: (reaction: ReactionKind) => Promise<void>;
}

function nextReactionState(
  current: ReactionKind | null,
  likes: number,
  dislikes: number,
  next: ReactionKind
) {
  if (current === next) {
    return {
      reaction: null as ReactionKind | null,
      likes: next === "like" ? Math.max(0, likes - 1) : likes,
      dislikes: next === "dislike" ? Math.max(0, dislikes - 1) : dislikes,
    };
  }

  if (current === null) {
    return {
      reaction: next,
      likes: next === "like" ? likes + 1 : likes,
      dislikes: next === "dislike" ? dislikes + 1 : dislikes,
    };
  }

  return {
    reaction: next,
    likes: next === "like" ? likes + 1 : Math.max(0, likes - 1),
    dislikes: next === "dislike" ? dislikes + 1 : Math.max(0, dislikes - 1),
  };
}

export function useReaction(blogId: string, initialLikes = 0, initialDislikes = 0): UseReactionReturn {
  const { isAuthenticated, status } = useSessionStatus();
  const toast = useToast();
  const [reaction, setCurrent] = useState<ReactionKind | null>(null);
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [isLoading, setIsLoading] = useState(false);
  const [synced, setSynced] = useState({ blogId, initialLikes, initialDislikes });
  const stateRef = useRef({ reaction, likes, dislikes });

  if (
    blogId !== synced.blogId ||
    initialLikes !== synced.initialLikes ||
    initialDislikes !== synced.initialDislikes
  ) {
    setSynced({ blogId, initialLikes, initialDislikes });
    setLikes(initialLikes);
    setDislikes(initialDislikes);
  }

  useEffect(() => {
    stateRef.current = { reaction, likes, dislikes };
  }, [reaction, likes, dislikes]);

  useEffect(() => {
    if (!isAuthenticated || !blogId) return;
    let cancelled = false;
    getReaction(blogId)
      .then((result) => {
        if (cancelled) return;
        setCurrent(result.reaction);
        setLikes(result.totalLikes);
        setDislikes(result.totalDislikes);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [blogId, isAuthenticated]);

  const choose = useCallback(
    async (next: ReactionKind) => {
      if (!isAuthenticated || isLoading || !blogId) return;

      const previous = stateRef.current;
      const optimistic = nextReactionState(previous.reaction, previous.likes, previous.dislikes, next);
      setCurrent(optimistic.reaction);
      setLikes(optimistic.likes);
      setDislikes(optimistic.dislikes);
      setIsLoading(true);

      try {
        const result = await setReaction(blogId, next);
        setCurrent(result.reaction);
        setLikes(result.totalLikes);
        setDislikes(result.totalDislikes);
      } catch (err) {
        setCurrent(previous.reaction);
        setLikes(previous.likes);
        setDislikes(previous.dislikes);
        toast.error(err instanceof Error ? err.message : "Could not save reaction");
      } finally {
        setIsLoading(false);
      }
    },
    [blogId, isAuthenticated, isLoading, toast]
  );

  return {
    reaction,
    likes,
    dislikes,
    isLoading,
    canReact: isAuthenticated,
    signedOut: status === "unauthenticated",
    choose,
  };
}
