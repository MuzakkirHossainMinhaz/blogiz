"use client";

import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { hasPermission, UserRole } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  FiAlertCircle,
  FiArrowRight,
  FiBookOpen,
  FiClock,
  FiEdit3,
  FiEye,
  FiFileText,
  FiHeart,
  FiPlusCircle,
  FiUserCheck,
  FiUsers,
  type IconType,
} from "react-icons/fi";

interface DashboardStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalLikes: number;
  recentBlogs: Array<{
    _id: string;
    title: string;
    status: string;
    createdAt?: string;
    publish_date?: string;
    total_likes: number;
  }>;
}

interface ReaderDashboard {
  stats: {
    comments?: number;
    likes?: number;
    readBlogsCount?: number;
    likedBlogsCount?: number;
  };
  activity: {
    readBlogs?: Array<{ _id: string; title: string; author_name?: string }>;
    likedBlogs?: Array<{ _id: string; title: string; author_name?: string }>;
    recentComments?: Array<{ _id: string; content: string }>;
  };
}

interface AdminAttention {
  pendingPosts: number | null;
  pendingUsers: number | null;
  pendingUpgrades: number | null;
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-accent-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function MetricTile({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: IconType;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary-50 p-2.5 text-primary-700 shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-accent-500">{title}</p>
          <p className="font-display text-2xl font-semibold text-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  const variants: Record<string, string> = {
    published: "bg-green-50 text-green-800 border-green-200",
    draft: "bg-yellow-50 text-yellow-800 border-yellow-200",
    pending: "bg-orange-50 text-orange-800 border-orange-200",
    rejected: "bg-red-50 text-red-800 border-red-200",
  };
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Draft";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium border",
        variants[status] || variants.draft
      )}
    >
      {label}
    </span>
  );
}

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user?.role as UserRole) || "user";
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";

  const canCreateBlog = hasPermission(userRole, "createBlog");
  const canViewAdmin = hasPermission(userRole, "viewAdminDashboard");
  const canApproveBlog = hasPermission(userRole, "approveBlog");
  const canViewUsers = hasPermission(userRole, "viewUsers");
  const canChangeRole = hasPermission(userRole, "changeUserRole");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reader, setReader] = useState<ReaderDashboard | null>(null);
  const [attention, setAttention] = useState<AdminAttention | null>(null);
  const isLoading = canCreateBlog ? stats === null : reader === null;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (canCreateBlog) {
          const response = await fetch("/api/blogs/stats");
          if (cancelled) return;
          if (response.ok) {
            const data = await response.json();
            setStats({
              totalBlogs: data.stats?.totalBlogs ?? 0,
              publishedBlogs: data.stats?.publishedBlogs ?? 0,
              draftBlogs: data.stats?.draftBlogs ?? 0,
              totalLikes: data.stats?.totalLikes ?? 0,
              recentBlogs: Array.isArray(data.recentBlogs) ? data.recentBlogs : [],
            });
          } else {
            setStats({ totalBlogs: 0, publishedBlogs: 0, draftBlogs: 0, totalLikes: 0, recentBlogs: [] });
          }
          return;
        }

        const response = await fetch("/api/user/dashboard");
        if (cancelled) return;
        if (response.ok) {
          const data = await response.json();
          setReader({
            stats: data.stats || {},
            activity: data.activity || {},
          });
        } else {
          setReader({ stats: {}, activity: {} });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch dashboard:", error);
          if (canCreateBlog) {
            setStats({ totalBlogs: 0, publishedBlogs: 0, draftBlogs: 0, totalLikes: 0, recentBlogs: [] });
          } else {
            setReader({ stats: {}, activity: {} });
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canCreateBlog]);

  useEffect(() => {
    if (!canViewAdmin) return;
    let cancelled = false;

    (async () => {
      try {
        const [postsRes, usersRes, upgradesRes] = await Promise.all([
          canApproveBlog
            ? fetch("/api/blogs?status=pending&limit=1").then((r) => r.json().then((d) => ({ ok: r.ok, d })))
            : Promise.resolve(null),
          canViewUsers
            ? fetch("/api/admin/users?status=pending&limit=1").then((r) => r.json().then((d) => ({ ok: r.ok, d })))
            : Promise.resolve(null),
          canChangeRole
            ? fetch("/api/admin/role-upgrades?status=pending&limit=1").then((r) =>
                r.json().then((d) => ({ ok: r.ok, d }))
              )
            : Promise.resolve(null),
        ]);

        if (cancelled) return;
        setAttention({
          pendingPosts: postsRes?.ok ? (postsRes.d.pagination?.total ?? 0) : canApproveBlog ? 0 : null,
          pendingUsers: usersRes?.ok ? (usersRes.d.pagination?.total ?? 0) : canViewUsers ? 0 : null,
          pendingUpgrades: upgradesRes?.ok
            ? (upgradesRes.d.pagination?.total ?? 0)
            : canChangeRole
              ? 0
              : null,
        });
      } catch {
        if (!cancelled) {
          setAttention({
            pendingPosts: canApproveBlog ? 0 : null,
            pendingUsers: canViewUsers ? 0 : null,
            pendingUpgrades: canChangeRole ? 0 : null,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canViewAdmin, canApproveBlog, canViewUsers, canChangeRole]);

  const welcome =
    userRole === "superadmin"
      ? "Full platform control — users, banners, and review queues."
      : userRole === "admin"
        ? "Review content, manage users, and keep the public feed intentional."
        : userRole === "author"
          ? "Draft, publish, and track how your posts perform."
          : "Your reading activity, likes, and upgrade path live here.";

  const attentionItems = [
    attention?.pendingPosts != null && attention.pendingPosts > 0
      ? {
          label: `${attention.pendingPosts} Pending Post${attention.pendingPosts === 1 ? "" : "s"}`,
          href: "/dashboard/admin#pending-posts",
          icon: FiFileText,
        }
      : null,
    attention?.pendingUsers != null && attention.pendingUsers > 0
      ? {
          label: `${attention.pendingUsers} Pending User${attention.pendingUsers === 1 ? "" : "s"}`,
          href: "/dashboard/admin/users",
          icon: FiUsers,
        }
      : null,
    attention?.pendingUpgrades != null && attention.pendingUpgrades > 0
      ? {
          label: `${attention.pendingUpgrades} Role Request${attention.pendingUpgrades === 1 ? "" : "s"}`,
          href: "/dashboard/admin#role-upgrades",
          icon: FiUserCheck,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; href: string; icon: IconType }>;

  const needsAttention =
    canViewAdmin &&
    attention &&
    ((attention.pendingPosts ?? 0) > 0 ||
      (attention.pendingUsers ?? 0) > 0 ||
      (attention.pendingUpgrades ?? 0) > 0);

  if (!canCreateBlog) {
    const liked = reader?.activity.likedBlogs || [];
    const read = reader?.activity.readBlogs || [];

    return (
      <div className="w-full space-y-6">
        <DashboardPageHeader title={`Welcome back, ${userName}`} description={welcome} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricTile
            title="Posts Read"
            value={isLoading ? "—" : (reader?.stats.readBlogsCount ?? 0)}
            icon={FiBookOpen}
          />
          <MetricTile
            title="Liked"
            value={isLoading ? "—" : (reader?.stats.likedBlogsCount ?? 0)}
            icon={FiHeart}
          />
          <MetricTile
            title="Comments"
            value={isLoading ? "—" : (reader?.stats.comments ?? 0)}
            icon={FiFileText}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-3">
            <SectionHeading title="Reading Activity" description="Posts you’ve opened recently." />
            {isLoading ? (
              <p className="text-sm text-accent-500">Loading…</p>
            ) : read.length === 0 ? (
              <div className="py-8 text-center">
                <FiBookOpen className="mx-auto h-10 w-10 text-primary-400" />
                <p className="mt-3 font-medium text-ink">No Reading History Yet</p>
                <p className="mt-1 text-sm text-accent-500">Browse the feed to start building activity.</p>
                <Link
                  href="/blogs"
                  className="inline-flex mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 min-h-9 items-center"
                >
                  Browse Blogs
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {read.slice(0, 5).map((blog) => (
                  <li key={blog._id} className="py-3">
                    <Link
                      href={`/blogs/${blog._id}`}
                      className="text-sm font-medium text-ink hover:text-primary-600 wrap-break-word"
                    >
                      {blog.title}
                    </Link>
                    {blog.author_name ? <p className="text-xs text-accent-500 mt-0.5">{blog.author_name}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 space-y-3">
            <SectionHeading title="Liked Posts" description="Stories you’ve reacted to." />
            {isLoading ? (
              <p className="text-sm text-accent-500">Loading…</p>
            ) : liked.length === 0 ? (
              <div className="py-8 text-center">
                <FiHeart className="mx-auto h-10 w-10 text-primary-400" />
                <p className="mt-3 font-medium text-ink">No Liked Posts Yet</p>
                <p className="mt-1 text-sm text-accent-500">Like posts while reading to collect them here.</p>
                <Link
                  href="/blogs"
                  className="inline-flex mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 min-h-9 items-center"
                >
                  Browse Blogs
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {liked.slice(0, 5).map((blog) => (
                  <li key={blog._id} className="py-3">
                    <Link
                      href={`/blogs/${blog._id}`}
                      className="text-sm font-medium text-ink hover:text-primary-600 wrap-break-word"
                    >
                      {blog.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-display text-base font-semibold tracking-tight text-primary-900">
                Want To Become An Author?
              </h3>
              <p className="text-sm text-primary-700 mt-0.5">
                Request an upgrade from Settings. An admin reviews each request.
              </p>
            </div>
            <Link href="/dashboard/settings#role-upgrade">
              <Button variant="primary" size="sm">
                Request Author Role
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader title={`Welcome back, ${userName}`} description={welcome} />

      {needsAttention ? (
        <section className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-2">
            <FiAlertCircle className="h-5 w-5 text-orange-700 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold tracking-tight text-ink">Needs Attention</h2>
              <p className="mt-0.5 text-sm text-accent-500">Open the admin queues for items waiting on you.</p>
            </div>
          </div>
          <ul className="flex flex-col sm:flex-row flex-wrap gap-2">
            {attentionItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm font-medium text-ink hover:border-primary-200 transition-colors min-h-9"
                >
                  <item.icon className="h-4 w-4 text-primary-700" />
                  {item.label}
                  <FiArrowRight className="h-3.5 w-3.5 text-accent-400" />
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/admin" className="inline-flex text-sm font-medium text-primary-700 hover:text-primary-800">
            Open Admin Panel
          </Link>
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionHeading title="Overview" description="Key metrics about your posts." />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricTile title="Total Posts" value={isLoading ? "—" : (stats?.totalBlogs ?? 0)} icon={FiFileText} />
          <MetricTile title="Published" value={isLoading ? "—" : (stats?.publishedBlogs ?? 0)} icon={FiEye} />
          <MetricTile title="Drafts" value={isLoading ? "—" : (stats?.draftBlogs ?? 0)} icon={FiEdit3} />
          <MetricTile title="Total Likes" value={isLoading ? "—" : (stats?.totalLikes ?? 0)} icon={FiHeart} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Recent Posts"
          description="Your latest drafts and published stories."
          action={
            <Link href="/dashboard/blogs" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              My Posts
            </Link>
          }
        />

        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
              <p className="mt-2 text-sm text-accent-500">Loading recent posts…</p>
            </div>
          ) : stats && stats.recentBlogs.length > 0 ? (
            <>
              <div className="md:hidden divide-y divide-neutral-100">
                {stats.recentBlogs.map((blog) => (
                  <div key={blog._id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-ink wrap-break-word min-w-0">{blog.title}</p>
                      {statusBadge(blog.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-accent-500">
                      <span className="inline-flex items-center gap-1">
                        <FiHeart className="w-4 h-4 text-primary-500" />
                        {blog.total_likes}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FiClock className="w-4 h-4" />
                        {formatDate(blog.publish_date || blog.createdAt)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/dashboard/blogs/edit/${blog._id}`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/blogs/${blog._id}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-xl">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-4 lg:px-5 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 lg:px-5 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 lg:px-5 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                        Likes
                      </th>
                      <th className="px-4 lg:px-5 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 lg:px-5 py-3 text-right text-xs font-medium text-accent-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {stats.recentBlogs.map((blog) => (
                      <tr key={blog._id} className="hover:bg-primary-50/30 transition-colors">
                        <td className="px-4 lg:px-5 py-4">
                          <div className="text-sm font-medium text-ink truncate max-w-xs">{blog.title}</div>
                        </td>
                        <td className="px-4 lg:px-5 py-4">{statusBadge(blog.status)}</td>
                        <td className="px-4 lg:px-5 py-4">
                          <div className="flex items-center text-sm text-accent-600">
                            <FiHeart className="w-4 h-4 mr-1 text-primary-500" />
                            {blog.total_likes}
                          </div>
                        </td>
                        <td className="px-4 lg:px-5 py-4">
                          <div className="flex items-center text-sm text-accent-600">
                            <FiClock className="w-4 h-4 mr-1" />
                            {formatDate(blog.publish_date || blog.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 lg:px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/blogs/edit/${blog._id}`}>
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                            </Link>
                            <Link href={`/blogs/${blog._id}`} target="_blank">
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <FiFileText className="w-10 h-10 text-primary-400 mx-auto" />
              <p className="mt-3 font-medium text-ink">No Posts Yet</p>
              <p className="mt-1 text-sm text-accent-500 mb-4">Start with a draft — you can publish when ready.</p>
              <Link href="/dashboard/blogs/create">
                <Button variant="primary" size="sm">
                  <FiPlusCircle className="w-4 h-4" />
                  Create Your First Post
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
