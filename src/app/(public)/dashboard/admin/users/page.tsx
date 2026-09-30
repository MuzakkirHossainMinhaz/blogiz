"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
  isApproved: boolean;
  createdAt?: string;
  profile?: { fullName?: string };
}

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "user", label: "User" },
  { value: "author", label: "Author" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Superadmin" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending approval" },
  { value: "approved", label: "Approved" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const CHANGEABLE_ROLES = [
  { value: "user", label: "User" },
  { value: "author", label: "Author" },
  { value: "admin", label: "Admin" },
];

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const actorRole = (session?.user?.role as UserRole) || "user";
  const canApprove = hasPermission(actorRole, "approveUser");
  const canDeactivate = hasPermission(actorRole, "deactivateUser");
  const canChangeRole = hasPermission(actorRole, "changeUserRole");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
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
          setError(err instanceof Error ? err.message : "Could not load users");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, search, roleFilter, statusFilter, reloadKey]);

  const refresh = () => setReloadKey((value) => value + 1);

  const runAction = async (
    userId: string,
    action: "approve" | "activate" | "deactivate" | "changeRole",
    newRole?: string
  ) => {
    setBusyId(userId);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, newRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Action failed");
      setMessage(data.message || "Updated");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
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
    <div className="w-full space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            User Management
          </h1>
          <p className="text-sm sm:text-base text-accent-500">
            Search, approve, and manage accounts you are allowed to act on.
          </p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="ghost" size="sm">
            <FiArrowLeft className="h-4 w-4" />
            Admin panel
          </Button>
        </Link>
      </header>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {message && (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>
      )}

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
                        {user.role} · {user.isApproved ? "approved" : "pending"} ·{" "}
                        {user.isActive ? "active" : "inactive"} · {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <UserActions
                      user={user}
                      manageable={manageable}
                      canApprove={canApprove}
                      canDeactivate={canDeactivate}
                      canChangeRole={canChangeRole}
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
                            <StatusChip ok={user.isApproved} yes="Approved" no="Pending" />
                            <StatusChip ok={user.isActive} yes="Active" no="Inactive" />
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-accent-500">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <UserActions
                              user={user}
                              manageable={manageable}
                              canApprove={canApprove}
                              canDeactivate={canDeactivate}
                              canChangeRole={canChangeRole}
                              busy={busyId === user._id}
                              roleDraft={roleDrafts[user._id] || (user.role === "superadmin" ? "admin" : user.role)}
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

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-accent-500">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
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
  canApprove,
  canDeactivate,
  canChangeRole,
  busy,
  roleDraft,
  onRoleDraft,
  onAction,
}: {
  user: AdminUser;
  manageable: boolean;
  canApprove: boolean;
  canDeactivate: boolean;
  canChangeRole: boolean;
  busy: boolean;
  roleDraft: string;
  onRoleDraft: (value: string) => void;
  onAction: (
    userId: string,
    action: "approve" | "activate" | "deactivate" | "changeRole",
    newRole?: string
  ) => Promise<void>;
}) {
  if (!manageable) {
    return <span className="text-xs text-accent-400">No actions</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 justify-end">
      {canApprove && !user.isApproved && (
        <Button variant="primary" size="sm" disabled={busy} onClick={() => void onAction(user._id, "approve")}>
          Approve
        </Button>
      )}
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
      {canChangeRole && user.role !== "superadmin" && (
        <div className="flex items-center gap-2">
          <Select
            id={`role-${user._id}`}
            aria-label={`Change role for ${user.name}`}
            options={CHANGEABLE_ROLES}
            value={roleDraft === "superadmin" ? "admin" : roleDraft}
            onChange={(event) => onRoleDraft(event.target.value)}
            className="min-w-28"
          />
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || roleDraft === user.role}
            onClick={() => void onAction(user._id, "changeRole", roleDraft)}
          >
            Set role
          </Button>
        </div>
      )}
    </div>
  );
}
