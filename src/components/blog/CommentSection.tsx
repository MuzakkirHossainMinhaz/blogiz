"use client";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

interface CommentUser {
  _id?: string;
  name?: string;
  profile?: { fullName?: string; avatar?: string };
}

interface PublicComment {
  _id: string;
  content: string;
  createdAt?: string;
  isVisible?: boolean;
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

function commenterId(user: PublicComment["userId"]): string | undefined {
  if (!user || typeof user === "string") return typeof user === "string" ? user : undefined;
  return user._id;
}

export function CommentSection({ blogId }: { blogId: string }) {
  const { data: session, status } = useSession();
  const role = (session?.user?.role as UserRole) || "reader";
  const userId = session?.user?.id;
  const canModerateAny = hasPermission(role, "deleteAnyComment");
  const canDeleteOwn = hasPermission(role, "deleteOwnComment");

  const [comments, setComments] = useState<PublicComment[]>([]);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    const response = await fetch(`/api/comments?blogId=${encodeURIComponent(blogId)}`);
    if (!response.ok) return;
    const data = await response.json();
    setComments(Array.isArray(data.comments) ? data.comments : []);
  }, [blogId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadComments().catch(() => setError("Could not load comments"));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadComments]);

  const postComment = async (text: string, parentId?: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 1 || trimmed.length > 1000) {
      setError("Comment must be between 1 and 1000 characters");
      return false;
    }
    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId, content: trimmed, ...(parentId ? { parentId } : {}) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof result.error === "string" ? result.error : "Could not post comment");
        return false;
      }
      setMessage(typeof result.message === "string" ? result.message : "Comment posted");
      await loadComments();
      return true;
    } catch {
      setError("Could not post comment");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await postComment(content);
    if (ok) setContent("");
  };

  const submitReply = async (event: FormEvent, parentId: string) => {
    event.preventDefault();
    const ok = await postComment(replyContent, parentId);
    if (ok) {
      setReplyContent("");
      setReplyTo(null);
    }
  };

  const moderate = async (commentId: string, action: "hide" | "unhide" | "delete") => {
    setBusyId(commentId);
    setError("");
    setMessage("");
    try {
      if (action === "delete") {
        const response = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(typeof result.error === "string" ? result.error : "Could not delete comment");
          return;
        }
        setMessage("Comment deleted");
      } else {
        const response = await fetch(`/api/comments/${commentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(typeof result.error === "string" ? result.error : "Could not update comment");
          return;
        }
        setMessage(action === "hide" ? "Comment hidden" : "Comment restored");
      }
      await loadComments();
    } finally {
      setBusyId(null);
    }
  };

  const canActOn = (comment: PublicComment) => {
    const ownerId = commenterId(comment.userId);
    if (canModerateAny) return true;
    if (canDeleteOwn && ownerId && userId && ownerId === userId) return true;
    return false;
  };

  const renderActions = (comment: PublicComment) => {
    if (!canActOn(comment)) return null;
    const busy = busyId === comment._id;
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {canModerateAny ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => void moderate(comment._id, comment.isVisible === false ? "unhide" : "hide")}
          >
            {comment.isVisible === false ? "Unhide" : "Hide"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-red-600"
          disabled={busy}
          onClick={() => void moderate(comment._id, "delete")}
        >
          Delete
        </Button>
      </div>
    );
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
            <li
              key={comment._id}
              className={`rounded-2xl border bg-surface p-4 sm:p-5 ${
                comment.isVisible === false ? "border-amber-200 opacity-80" : "border-neutral-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserAvatar src={commenterAvatar(comment.userId)} name={commenterName(comment.userId)} size="sm" />
                <p className="text-sm font-semibold text-ink">{commenterName(comment.userId)}</p>
                {comment.isVisible === false ? (
                  <span className="text-xs text-amber-700 border border-amber-200 rounded-lg px-1.5 py-0.5">Hidden</span>
                ) : null}
              </div>
              <p className="mt-2 text-neutral-700 whitespace-pre-wrap break-words leading-relaxed">{comment.content}</p>
              {renderActions(comment)}
              {status === "authenticated" ? (
                <div className="mt-2">
                  {replyTo === comment._id ? (
                    <form onSubmit={(event) => void submitReply(event, comment._id)} className="mt-3 space-y-2">
                      <Textarea
                        id={`reply-${comment._id}`}
                        label="Reply"
                        value={replyContent}
                        onChange={(event) => setReplyContent(event.target.value)}
                        maxLength={1000}
                        rows={3}
                        placeholder="Write a reply…"
                        required
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} disabled={isSubmitting}>
                          Post reply
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyTo(null);
                            setReplyContent("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setReplyTo(comment._id)}>
                      Reply
                    </Button>
                  )}
                </div>
              ) : null}
              {comment.replies && comment.replies.length > 0 && (
                <ul className="mt-4 space-y-3 border-l-2 border-primary-100 pl-4">
                  {comment.replies.map((reply) => (
                    <li key={reply._id}>
                      <div className="flex items-center gap-2.5">
                        <UserAvatar src={commenterAvatar(reply.userId)} name={commenterName(reply.userId)} size="sm" />
                        <p className="text-sm font-semibold text-ink">{commenterName(reply.userId)}</p>
                        {reply.isVisible === false ? (
                          <span className="text-xs text-amber-700 border border-amber-200 rounded-lg px-1.5 py-0.5">
                            Hidden
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-neutral-700 whitespace-pre-wrap break-words leading-relaxed">
                        {reply.content}
                      </p>
                      {renderActions(reply)}
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
