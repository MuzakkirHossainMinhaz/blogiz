"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { UserRole } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FiCheckCircle, FiUserPlus } from "react-icons/fi";

type AuthorUpgradeContextValue = {
  openAuthorUpgrade: () => void;
};

const AuthorUpgradeContext = createContext<AuthorUpgradeContextValue | null>(null);

export function useAuthorUpgrade() {
  const ctx = useContext(AuthorUpgradeContext);
  if (!ctx) {
    throw new Error("useAuthorUpgrade must be used within AuthorUpgradeProvider");
  }
  return ctx;
}

function AuthorUpgradeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: session } = useSession();
  const toast = useToast();
  const emailVerified = Boolean(session?.user?.emailVerified);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/user/role-upgrade");
      const data = await response.json().catch(() => ({}));
      const hasPending = Array.isArray(data.requests)
        ? data.requests.some((r: { status: string }) => r.status === "pending")
        : false;
      setPending(hasPending);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setReason("");
    void loadStatus();
  }, [open, loadStatus]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!emailVerified) {
      toast.error("Verify your email before requesting a role upgrade.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/user/role-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.error || "Could not submit request");
        return;
      }
      setPending(true);
      setReason("");
      toast.success("Request submitted. An admin will review it soon.");
      onClose();
    } catch {
      toast.error("Could not submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Become an author"
      description="Tell us why you’d like to draft and publish on Blogiz."
      size="md"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-primary-100 bg-primary-50/60 px-3.5 py-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <FiUserPlus className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 text-sm text-primary-900">
            <p className="font-medium">Author access lets you write and publish posts.</p>
            <p className="mt-0.5 text-primary-800/80">
              An admin reviews each request before your role is upgraded.
            </p>
          </div>
        </div>

        {pending ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-primary-200 bg-white px-3.5 py-3 text-sm text-primary-800">
            <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="font-medium">You already have a pending author request.</p>
          </div>
        ) : null}

        <Textarea
          id="author-upgrade-reason"
          label="Why should we upgrade you?"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          required
          disabled={pending || submitting}
          placeholder="Share a short note about what you want to write…"
        />

        <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-end sm:gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={pending || submitting}
            isLoading={submitting}
            className="w-full sm:w-auto"
          >
            Request author role
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AuthorUpgradeProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const userRole = (session?.user?.role as UserRole) || "reader";
  const canRequest = userRole === "reader";
  const [open, setOpen] = useState(false);

  const openAuthorUpgrade = useCallback(() => {
    if (!canRequest) return;
    setOpen(true);
  }, [canRequest]);

  const close = useCallback(() => setOpen(false), []);

  // Support legacy links like /dashboard/settings#role-upgrade
  useEffect(() => {
    if (!canRequest) return;

    const maybeOpenFromHash = () => {
      if (typeof window === "undefined") return;
      if (window.location.hash === "#role-upgrade") {
        setOpen(true);
        const { pathname, search } = window.location;
        window.history.replaceState(null, "", `${pathname}${search}`);
      }
    };

    maybeOpenFromHash();
    window.addEventListener("hashchange", maybeOpenFromHash);
    return () => window.removeEventListener("hashchange", maybeOpenFromHash);
  }, [canRequest]);

  const value = useMemo(() => ({ openAuthorUpgrade }), [openAuthorUpgrade]);

  return (
    <AuthorUpgradeContext.Provider value={value}>
      {children}
      {canRequest ? <AuthorUpgradeModal open={open} onClose={close} /> : null}
    </AuthorUpgradeContext.Provider>
  );
}
