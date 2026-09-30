"use client";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

interface CommentUser {
  name?: string;
  profile?: { fullName?: string; avatar?: string };
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

function commenterAvatar(user: PublicComment["userId"]): string | undefined {
  if (!user || typeof user === "string") return undefined;
  return user.profile?.avatar;
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
    <section className="mt-10 pt-8 border-t border-neutral-200">
      <h2 className="font-display text-xl font-semibold text-ink mb-5">Comments</h2>

      {status === "authenticated" ? (
        <form onSubmit={submit} className="mb-10 space-y-3">
          <Textarea
            id="comment"
            label="Add a comment"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Share your thoughts..."
            required
          />
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} disabled={isSubmitting}>
            Post comment
          </Button>
        </form>
      ) : (
        <p className="mb-10 text-sm text-accent-500">
          <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-700">
            Sign in
          </Link>{" "}
          to comment.
        </p>
      )}

      {message && (
        <p className="mb-4 text-sm text-green-700 rounded-xl border border-green-200 bg-green-50 px-3 py-2">{message}</p>
      )}
      {error && (
        <p className="mb-4 text-sm text-red-600 rounded-xl border border-red-200 bg-red-50 px-3 py-2">{error}</p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-accent-500">No comments yet. Be the first to reply.</p>
      ) : (
        <ul className="space-y-5">
          {comments.map((comment) => (
            <li key={comment._id} className="rounded-2xl border border-neutral-200 bg-surface p-4 sm:p-5">
              <div className="flex items-center gap-2.5">
                <UserAvatar src={commenterAvatar(comment.userId)} name={commenterName(comment.userId)} size="sm" />
                <p className="text-sm font-semibold text-ink">{commenterName(comment.userId)}</p>
              </div>
              <p className="mt-2 text-neutral-700 whitespace-pre-wrap break-words leading-relaxed">{comment.content}</p>
              {comment.replies && comment.replies.length > 0 && (
                <ul className="mt-4 space-y-3 border-l-2 border-primary-100 pl-4">
                  {comment.replies.map((reply) => (
                    <li key={reply._id}>
                      <div className="flex items-center gap-2.5">
                        <UserAvatar src={commenterAvatar(reply.userId)} name={commenterName(reply.userId)} size="sm" />
                        <p className="text-sm font-semibold text-ink">{commenterName(reply.userId)}</p>
                      </div>
                      <p className="mt-1 text-neutral-700 whitespace-pre-wrap break-words leading-relaxed">
                        {reply.content}
                      </p>
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
