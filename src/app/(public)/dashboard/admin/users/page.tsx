"use client";

import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { canManageRole, hasPermission, type UserRole } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FiArrowLeft, FiRefreshCw, FiSearch, FiUsers } from "react-icons/fi";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  commentSuspended?: boolean;
  createdAt?: string;
  profile?: { fullName?: string };
}

type UserAction =
  | "activate"
  | "deactivate"
  | "changeRole"
  | "suspendCommenting"
  | "unsuspendCommenting"
  | "resetPassword"
  | "delete";

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "reader", label: "Reader" },
  { value: "author", label: "Author" },
  { value: "admin", label: "Admin" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "comment_suspended", label: "Commenting suspended" },
];

const CHANGEABLE_ROLES = [
  { value: "reader", label: "Reader" },
  { value: "author", label: "Author" },
  { value: "admin", label: "Admin" },
];

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const toast = useToast();
  const actorRole = (session?.user?.role as UserRole) || "reader";
  const canDeactivate = hasPermission(actorRole, "deactivateUser");
  const canChangeRole = hasPermission(actorRole, "changeUserRole");
  const canSuspendCommenting = hasPermission(actorRole, "suspendCommenting");
  const canResetPassword = hasPermission(actorRole, "resetUserPassword");
  const canDelete = hasPermission(actorRole, "deleteUser");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (search.trim()) params.set("search", search.trim());
        if (roleFilter) params.set("role", roleFilter);
        if (statusFilter) params.set("status", statusFilter);

        const response = await fetch(`/api/admin/users?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load users");
        if (cancelled) return;
        setUsers(data.users || []);
        setPages(data.pagination?.pages || 1);
        setTotal(data.pagination?.total || 0);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Could not load users");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, search, roleFilter, statusFilter, reloadKey, toast]);

  const refresh = () => setReloadKey((value) => value + 1);

  const runAction = async (userId: string, action: UserAction, newRole?: string) => {
    setBusyId(userId);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, newRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Action failed");
      toast.success(data.message || "Updated");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="User Management"
        description="Search, deactivate, and manage accounts you are allowed to act on."
        actions={
          <Link href="/dashboard/admin">
            <Button variant="ghost" size="sm">
              <FiArrowLeft className="h-4 w-4" />
              Admin Panel
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl border border-neutral-200 bg-surface p-4 sm:p-5 shadow-soft">
        <Input
          id="user-search"
          label="Search"
          value={search}
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
          placeholder="Name or email"
          icon={<FiSearch className="h-4 w-4" />}
          className="md:col-span-2"
        />
        <Select
          id="role-filter"
          label="Role"
          options={ROLE_OPTIONS}
          value={roleFilter}
          onChange={(event) => {
            setPage(1);
            setRoleFilter(event.target.value);
          }}
        />
        <Select
          id="status-filter"
          label="Status"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value);
          }}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-accent-500 inline-flex items-center gap-2">
          <FiUsers className="h-4 w-4" />
          {loading ? "Loading…" : `${total} user${total === 1 ? "" : "s"}`}
        </p>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={loading}>
          <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-surface overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-accent-500">Loading users…</p>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <FiUsers className="mx-auto h-10 w-10 text-primary-400" />
            <p className="mt-3 font-medium text-ink">No users match these filters</p>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-neutral-200">
              {users.map((user) => {
                const manageable = canManageRole(actorRole, user.role);
                return (
                  <div key={user._id} className="p-4 space-y-3">
                    <div>
                      <p className="font-medium text-ink">{user.profile?.fullName || user.name}</p>
                      <p className="text-sm text-accent-500 break-all">{user.email}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {user.role} · {user.isActive ? "active" : "inactive"}
                        {user.commentSuspended ? " · comments suspended" : ""} · {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <UserActions
                      user={user}
                      manageable={manageable}
                      canDeactivate={canDeactivate}
                      canChangeRole={canChangeRole}
                      canSuspendCommenting={canSuspendCommenting}
                      canResetPassword={canResetPassword}
                      canDelete={canDelete}
                      busy={busyId === user._id}
                      roleDraft={roleDrafts[user._id] || user.role}
                      onRoleDraft={(value) => setRoleDrafts((current) => ({ ...current, [user._id]: value }))}
                      onAction={runAction}
                    />
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[48rem]">
                <thead className="bg-primary-50/60 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-accent-500">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-accent-500">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-accent-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-accent-500">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-accent-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {users.map((user) => {
                    const manageable = canManageRole(actorRole, user.role);
                    return (
                      <tr key={user._id} className="hover:bg-primary-50/30 transition-colors">
                        <td className="px-4 py-4">
                          <p className="font-medium text-ink">{user.profile?.fullName || user.name}</p>
                          <p className="text-sm text-accent-500">{user.email}</p>
                        </td>
                        <td className="px-4 py-4 text-sm capitalize text-neutral-700">{user.role}</td>
                        <td className="px-4 py-4 text-sm text-neutral-700">
                          <span className="inline-flex flex-wrap gap-1.5">
                            <StatusChip ok={user.isActive} yes="Active" no="Inactive" />
                            {user.commentSuspended ? (
                              <StatusChip ok={false} yes="" no="Comments Off" />
                            ) : null}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-accent-500">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <UserActions
                              user={user}
                              manageable={manageable}
                              canDeactivate={canDeactivate}
                              canChangeRole={canChangeRole}
                              canSuspendCommenting={canSuspendCommenting}
                              canResetPassword={canResetPassword}
                              canDelete={canDelete}
                              busy={busyId === user._id}
                              roleDraft={roleDrafts[user._id] || user.role}
                              onRoleDraft={(value) =>
                                setRoleDrafts((current) => ({ ...current, [user._id]: value }))
                              }
                              onAction={runAction}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
    </div>
  );
}

function StatusChip({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium border ${
        ok
          ? "bg-green-50 text-green-800 border-green-200"
          : "bg-amber-50 text-amber-800 border-amber-200"
      }`}
    >
      {ok ? yes : no}
    </span>
  );
}

function UserActions({
  user,
  manageable,
  canDeactivate,
  canChangeRole,
  canSuspendCommenting,
  canResetPassword,
  canDelete,
  busy,
  roleDraft,
  onRoleDraft,
  onAction,
}: {
  user: AdminUser;
  manageable: boolean;
  canDeactivate: boolean;
  canChangeRole: boolean;
  canSuspendCommenting: boolean;
  canResetPassword: boolean;
  canDelete: boolean;
  busy: boolean;
  roleDraft: string;
  onRoleDraft: (value: string) => void;
  onAction: (userId: string, action: UserAction, newRole?: string) => Promise<void>;
}) {
  if (!manageable) {
    return <span className="text-xs text-accent-400">No actions</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 justify-end">
      {canDeactivate && user.isActive && (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void onAction(user._id, "deactivate")}
        >
          Deactivate
        </Button>
      )}
      {canDeactivate && !user.isActive && (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void onAction(user._id, "activate")}
        >
          Activate
        </Button>
      )}
      {canSuspendCommenting && !user.commentSuspended && (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void onAction(user._id, "suspendCommenting")}
        >
          Suspend Comments
        </Button>
      )}
      {canSuspendCommenting && user.commentSuspended && (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void onAction(user._id, "unsuspendCommenting")}
        >
          Restore Comments
        </Button>
      )}
      {canResetPassword && (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Send a password reset for ${user.email}?`)) {
              void onAction(user._id, "resetPassword");
            }
          }}
        >
          Reset Password
        </Button>
      )}
      {canChangeRole && (
        <div className="flex items-center gap-2">
          <Select
            id={`role-${user._id}`}
            aria-label={`Change role for ${user.name}`}
            options={CHANGEABLE_ROLES}
            value={roleDraft}
            onChange={(event) => onRoleDraft(event.target.value)}
            size="sm"
            className="min-w-28"
          />
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || roleDraft === user.role}
            onClick={() => void onAction(user._id, "changeRole", roleDraft)}
          >
            Set Role
          </Button>
        </div>
      )}
      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600"
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Permanently delete ${user.email}? This cannot be undone.`)) {
              void onAction(user._id, "delete");
            }
          }}
        >
          Delete
        </Button>
      )}
    </div>
  );
}
