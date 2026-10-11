"use client";

import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { FiClock, FiUserCheck, FiUsers } from "react-icons/fi";

interface RoleUpgrade {
  _id: string;
  requestedRole: string;
  reason?: string;
  createdAt?: string;
  userId?: {
    name?: string;
    email?: string;
    profile?: { fullName?: string };
  };
}

const QUEUE_PAGE_SIZE = 10;

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="min-w-0">
      <h2 className="font-display text-base font-semibold tracking-tight text-ink">{title}</h2>
      {description ? <p className="mt-0.5 text-sm text-accent-500">{description}</p> : null}
    </div>
  );
}

function MetricTile({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: string;
  value: string | number;
  icon: IconType;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-primary-50 p-2.5 text-primary-700 shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-accent-500">{title}</p>
        <p className="font-display text-2xl font-semibold text-ink">{value}</p>
      </div>
    </div>
  );

  const className =
    "rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 block transition-colors" +
    (href ? " hover:border-primary-200" : "");

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

function QueueEmpty({
  icon: Icon,
  title,
  description,
}: {
  icon: IconType;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 text-center">
      <Icon className="mx-auto h-10 w-10 text-primary-400" />
      <p className="mt-3 font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-accent-500">{description}</p>
    </div>
  );
}

export default function AdminPanelPage() {
  const { data: session } = useSession();
  const userRole = (session?.user?.role as UserRole) || "reader";
  const canViewUsers = hasPermission(userRole, "viewUsers");
  const canReviewUpgrades = hasPermission(userRole, "reviewRoleUpgrades");

  const [upgrades, setUpgrades] = useState<RoleUpgrade[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [upgradesTotal, setUpgradesTotal] = useState(0);
  const [upgradesPages, setUpgradesPages] = useState(1);
  const [upgradesPage, setUpgradesPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setError("");
      setLoading(true);
      try {
        let nextUserCount: number | null = null;
        let nextUpgrades: RoleUpgrade[] = [];
        let nextUpgradesTotal = 0;
        let nextUpgradesPages = 1;

        if (canViewUsers) {
          const response = await fetch("/api/admin/users?limit=1");
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not load users");
          nextUserCount = data.pagination?.total ?? 0;
        }

        if (canReviewUpgrades) {
          const params = new URLSearchParams({
            status: "pending",
            page: String(upgradesPage),
            limit: String(QUEUE_PAGE_SIZE),
          });
          const response = await fetch(`/api/admin/role-upgrades?${params.toString()}`);
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not load role requests");
          nextUpgrades = data.requests || [];
          nextUpgradesTotal = data.pagination?.total ?? nextUpgrades.length;
          nextUpgradesPages = data.pagination?.pages ?? 1;
        }

        if (cancelled) return;
        setUserCount(nextUserCount);
        setUpgrades(nextUpgrades);
        setUpgradesTotal(nextUpgradesTotal);
        setUpgradesPages(nextUpgradesPages);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load admin data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canViewUsers, canReviewUpgrades, upgradesPage, reloadKey]);

  const reviewUpgrade = async (requestId: string, action: "approve" | "reject") => {
    setBusyId(requestId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/role-upgrades/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Could not ${action} request`);
      setMessage(`Role request ${action}d`);
      if (upgrades.length === 1 && upgradesPage > 1) setUpgradesPage((p) => p - 1);
      else refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not ${action} request`);
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
        title="Admin Panel"
        description="Review author upgrades and manage accounts."
      />

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>
      ) : null}

      {(canViewUsers || canReviewUpgrades) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {canReviewUpgrades ? (
            <MetricTile
              title="Pending Upgrades"
              value={loading ? "—" : upgradesTotal}
              icon={FiUserCheck}
              href="#role-upgrades"
            />
          ) : null}
          {canViewUsers ? (
            <MetricTile
              title="Users"
              value={loading || userCount === null ? "—" : userCount}
              icon={FiUsers}
              href="/dashboard/admin/users"
            />
          ) : null}
        </div>
      )}

      {canReviewUpgrades ? (
        <section id="role-upgrades" className="space-y-4 scroll-mt-24">
          <SectionHeading
            title="Role Upgrade Requests"
            description="Approve readers who want to become authors."
          />
          <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
            {loading ? (
              <p className="p-6 text-sm text-accent-500">Loading role requests…</p>
            ) : upgrades.length === 0 ? (
              <QueueEmpty
                icon={FiUserCheck}
                title="No Pending Requests"
                description="Role upgrade requests will appear here."
              />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {upgrades.map((request) => (
                  <li
                    key={request._id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-ink">
                        {request.userId?.profile?.fullName || request.userId?.name || "User"} →{" "}
                        {request.requestedRole}
                      </p>
                      <p className="text-sm text-accent-500 flex items-center gap-1.5 flex-wrap">
                        <FiClock className="h-3.5 w-3.5 shrink-0" />
                        {formatDate(request.createdAt)}
                        {request.userId?.email ? ` · ${request.userId.email}` : ""}
                      </p>
                      {request.reason ? <p className="text-sm text-neutral-600">{request.reason}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={busyId === request._id}
                        onClick={() => void reviewUpgrade(request._id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === request._id}
                        onClick={() => void reviewUpgrade(request._id, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {upgradesPages > 1 ? (
            <div className="rounded-xl border border-neutral-200 bg-white px-4 sm:px-5 py-3">
              <Pagination
                page={upgradesPage}
                pages={upgradesPages}
                total={upgradesTotal}
                onPageChange={setUpgradesPage}
              />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
