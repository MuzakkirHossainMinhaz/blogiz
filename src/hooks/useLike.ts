"use client";

import { useState, useEffect, useCallback } from "react";
import { toggleLike, checkLikeStatus } from "@/lib/api";

interface UseLikeReturn {
  liked: boolean;
  likeCount: number;
  isLoading: boolean;
  error: string | null;
  toggleLike: () => Promise<void>;
}

export function useLike(blogId: string): UseLikeReturn {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check like status on component mount
  useEffect(() => {
    const checkLikeStatusAsync = async () => {
      try {
        const result = await checkLikeStatus(blogId);
        setLiked(result.liked);
      } catch (err) {
        console.error("Failed to check like status:", err);
        // Don't show error for initial check, just log it
      }
    };

    if (blogId) {
      checkLikeStatusAsync();
    }
  }, [blogId]);

  const handleToggleLike = useCallback(async () => {
    if (isLoading || !blogId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Optimistic update - toggle UI immediately
      const newLikedState = !liked;
      setLiked(newLikedState);
      setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

      // Make API call
      const result = await toggleLike(blogId);
      
      // Update with actual server response
      setLiked(result.liked);
      setLikeCount(result.count);
    } catch (err) {
      // Revert optimistic update on error
      setLiked(!liked);
      setLikeCount(prev => !liked ? prev + 1 : prev - 1);
      
      const errorMessage = err instanceof Error ? err.message : "Failed to toggle like";
      setError(errorMessage);
      console.error("Failed to toggle like:", err);
    } finally {
      setIsLoading(false);
    }
  }, [blogId, liked, isLoading]);

  return {
    liked,
    likeCount,
    isLoading,
    error,
    toggleLike: handleToggleLike,
  };
}
