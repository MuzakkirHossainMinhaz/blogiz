"use client";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { useSessionStatus } from "@/hooks/useSessionStatus";
import { cn } from "@/lib/utils";
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
  const { session, isAuthenticated } = useSessionStatus();
  const toast = useToast();
  const role = (session?.user?.role as UserRole) || "reader";
  const userId = session?.user?.id;
  const canModerateAny = hasPermission(role, "deleteAnyComment");
  const canDeleteOwn = hasPermission(role, "deleteOwnComment");

  const [comments, setComments] = useState<PublicComment[]>([]);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
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
      loadComments().catch(() => toast.error("Could not load comments"));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadComments, toast]);

  const postComment = async (text: string, parentId?: string) => {
    const trimmed = text.trim();
    if (trimmed.length < 1 || trimmed.length > 1000) {
      toast.error("Comment must be between 1 and 1000 characters");
      return false;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId, content: trimmed, ...(parentId ? { parentId } : {}) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(typeof result.error === "string" ? result.error : "Could not post comment");
        return false;
      }
      toast.success(typeof result.message === "string" ? result.message : "Comment posted");
      await loadComments();
      return true;
    } catch {
      toast.error("Could not post comment");
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
    try {
      if (action === "delete") {
        const response = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast.error(typeof result.error === "string" ? result.error : "Could not delete comment");
          return;
        }
        toast.success("Comment deleted");
      } else {
        const response = await fetch(`/api/comments/${commentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast.error(typeof result.error === "string" ? result.error : "Could not update comment");
          return;
        }
        toast.success(action === "hide" ? "Comment hidden" : "Comment restored");
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

  const renderComment = (comment: PublicComment, isReply = false) => {
    const busy = busyId === comment._id;
    const showReply = isAuthenticated && !isReply;
    const showModeration = canActOn(comment);
    const replying = replyTo === comment._id;

    return (
      <li
        key={comment._id}
        className={cn(
          isReply
            ? "min-w-0"
            : cn(
                "rounded-2xl border bg-surface p-4 sm:p-5",
                comment.isVisible === false ? "border-amber-200 opacity-80" : "border-neutral-200"
              )
        )}
      >
        <div className="flex items-start gap-3">
          <UserAvatar src={commenterAvatar(comment.userId)} name={commenterName(comment.userId)} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-sm font-semibold text-ink">{commenterName(comment.userId)}</p>
              {comment.isVisible === false ? (
                <span className="rounded-lg border border-amber-200 px-1.5 py-0.5 text-xs text-amber-700">
                  Hidden
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-700 sm:text-base">
              {comment.content}
            </p>

            {(showReply || showModeration) && !replying ? (
              <div className="mt-3 flex flex-wrap items-center gap-1">
                {showReply ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setReplyTo(comment._id)}>
                    Reply
                  </Button>
                ) : null}
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
                {showModeration ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={busy}
                    onClick={() => void moderate(comment._id, "delete")}
                  >
                    Delete
                  </Button>
                ) : null}
              </div>
            ) : null}

            {replying ? (
              <form onSubmit={(event) => void submitReply(event, comment._id)} className="mt-3 space-y-3">
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
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyTo(null);
                      setReplyContent("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} disabled={isSubmitting}>
                    Post Reply
                  </Button>
                </div>
              </form>
            ) : null}

            {comment.replies && comment.replies.length > 0 ? (
              <ul className="mt-4 space-y-4 border-l-2 border-primary-100 pl-4 sm:pl-5">
                {comment.replies.map((reply) => renderComment(reply, true))}
              </ul>
            ) : null}
          </div>
        </div>
      </li>
    );
  };

  return (
    <section>
      <h2 className="mb-5 font-display text-xl font-semibold text-ink sm:text-2xl">Comments</h2>

      {isAuthenticated ? (
        <form onSubmit={submit} className="mb-8 space-y-3 sm:mb-10">
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
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} disabled={isSubmitting}>
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <p className="mb-8 text-sm text-accent-500 sm:mb-10">
          <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-700">
            Sign in
          </Link>{" "}
          to comment.
        </p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-accent-500">No comments yet. Be the first to reply.</p>
      ) : (
        <ul className="space-y-4 sm:space-y-5">{comments.map((comment) => renderComment(comment))}</ul>
      )}
    </section>
  );
}
