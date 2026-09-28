"use client";

import { Button } from "@/components/ui/Button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

interface CommentUser {
  name?: string;
  profile?: { fullName?: string };
}

interface PublicComment {
  _id: string;
  content: string;
  createdAt?: string;
  userId?: CommentUser | string;
  replies?: PublicComment[];
}

function commenterName(user: PublicComment["userId"]): string {
  if (!user || typeof user === "string") return "Reader";
  return user.profile?.fullName || user.name || "Reader";
}

export function CommentSection({ blogId }: { blogId: string }) {
  const { status } = useSession();
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    const response = await fetch(`/api/comments?blogId=${encodeURIComponent(blogId)}`);
    if (!response.ok) return;
    const data = await response.json();
    setComments(Array.isArray(data.comments) ? data.comments : []);
  }, [blogId]);

  useEffect(() => {
    // Fetch after the effect so comment state is not set in the effect body.
    const timeout = window.setTimeout(() => {
      loadComments().catch(() => setError("Could not load comments"));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadComments]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (trimmed.length < 1 || trimmed.length > 1000) {
      setError("Comment must be between 1 and 1000 characters");
      return;
    }
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      let response: Response;
      try {
        response = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blogId, content: trimmed }),
        });
      } catch {
        setError("Could not post comment");
        return;
      }
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "Could not post comment");
        return;
      }
      setContent("");
      setMessage(typeof result.message === "string" ? result.message : "Comment submitted for approval");
      await loadComments();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-12 pt-8 border-t border-neutral-200">
      <h2 className="text-xl font-semibold text-neutral-900 mb-4">Comments</h2>

      {status === "authenticated" ? (
        <form onSubmit={submit} className="mb-8 space-y-3">
          <label htmlFor="comment" className="block text-sm font-medium text-neutral-700">
            Add a comment
          </label>
          <textarea
            id="comment"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={1000}
            rows={4}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} disabled={isSubmitting}>
            Post comment
          </Button>
        </form>
      ) : (
        <p className="mb-8 text-sm text-neutral-600">
          <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-700">
            Sign in
          </Link>{" "}
          to comment.
        </p>
      )}

      {message && <p className="mb-4 text-sm text-green-700">{message}</p>}
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {comments.length === 0 ? (
        <p className="text-sm text-neutral-500">No comments yet.</p>
      ) : (
        <ul className="space-y-6">
          {comments.map((comment) => (
            <li key={comment._id}>
              <p className="text-sm font-medium text-neutral-900">{commenterName(comment.userId)}</p>
              <p className="mt-1 text-neutral-700 whitespace-pre-wrap">{comment.content}</p>
              {comment.replies && comment.replies.length > 0 && (
                <ul className="mt-3 ml-4 space-y-3 border-l border-neutral-200 pl-4">
                  {comment.replies.map((reply) => (
                    <li key={reply._id}>
                      <p className="text-sm font-medium text-neutral-900">{commenterName(reply.userId)}</p>
                      <p className="mt-1 text-neutral-700 whitespace-pre-wrap">{reply.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
