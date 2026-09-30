"use client";

import StatsCard from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { hasPermission, UserRole } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FiBarChart2,
  FiBookOpen,
  FiClock,
  FiEdit3,
  FiEye,
  FiFileText,
  FiHeart,
  FiPlusCircle,
  FiShield,
  FiUser,
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user?.role as UserRole) || "user";
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";

  const canCreateBlog = hasPermission(userRole, "createBlog");
  const canViewAdminDashboard = hasPermission(userRole, "viewAdminDashboard");
  const canViewUsers = hasPermission(userRole, "viewUsers");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reader, setReader] = useState<ReaderDashboard | null>(null);
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      published: "bg-green-100 text-green-800 border-green-200",
      draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
      pending: "bg-orange-100 text-orange-800 border-orange-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          variants[status] || variants.draft
        }`}
      >
        {status}
      </span>
    );
  };

  const welcome =
    userRole === "superadmin"
      ? "Full platform control — users, banners, and review queues."
      : userRole === "admin"
        ? "Review content, manage users, and keep the public feed intentional."
        : userRole === "author"
          ? "Draft, publish, and track how your posts perform."
          : "Your reading activity, likes, and upgrade path live here.";

  if (userRole === "user") {
    const liked = reader?.activity.likedBlogs || [];
    const read = reader?.activity.readBlogs || [];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
            Welcome back, {userName}
          </h1>
          <p className="mt-1 text-accent-500">{welcome}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard title="Posts read" value={isLoading ? "—" : reader?.stats.readBlogsCount ?? 0} icon={FiBookOpen} variant="primary" />
          <StatsCard title="Liked" value={isLoading ? "—" : reader?.stats.likedBlogsCount ?? 0} icon={FiHeart} variant="accent" />
          <StatsCard title="Comments" value={isLoading ? "—" : reader?.stats.comments ?? 0} icon={FiFileText} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface rounded-2xl border border-neutral-200 p-5 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-primary-100 rounded-xl">
                <FiBookOpen className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="ml-3 font-display font-semibold text-ink">Reading activity</h3>
            </div>
            {isLoading ? (
              <p className="text-sm text-accent-500">Loading…</p>
            ) : read.length === 0 ? (
              <div className="text-center py-10 text-accent-400">
                <FiBookOpen className="w-10 h-10 mx-auto mb-2 opacity-60" />
                <p className="text-sm">No reading history yet</p>
                <Link href="/blogs" className="inline-flex mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 min-h-11 items-center">
                  Browse blogs
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {read.slice(0, 5).map((blog) => (
                  <li key={blog._id} className="py-3">
                    <Link href={`/blogs/${blog._id}`} className="text-sm font-medium text-ink hover:text-primary-600 break-words">
                      {blog.title}
                    </Link>
                    {blog.author_name && <p className="text-xs text-accent-500 mt-0.5">{blog.author_name}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-surface rounded-2xl border border-neutral-200 p-5 sm:p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-primary-100 rounded-xl">
                <FiHeart className="w-5 h-5 text-primary-700" />
              </div>
              <h3 className="ml-3 font-display font-semibold text-ink">Liked posts</h3>
            </div>
            {isLoading ? (
              <p className="text-sm text-accent-500">Loading…</p>
            ) : liked.length === 0 ? (
              <div className="text-center py-10 text-accent-400">
                <FiHeart className="w-10 h-10 mx-auto mb-2 opacity-60" />
                <p className="text-sm">No liked posts yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {liked.slice(0, 5).map((blog) => (
                  <li key={blog._id} className="py-3">
                    <Link href={`/blogs/${blog._id}`} className="text-sm font-medium text-ink hover:text-primary-600 break-words">
                      {blog.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-primary-900">Want to become an author?</h3>
              <p className="text-sm text-primary-700 mt-1">Request an upgrade from Settings. An admin reviews each request.</p>
            </div>
            <Link href="/dashboard/settings#role-upgrade">
              <Button variant="primary" className="rounded-xl min-h-11">
                Request author role
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
          Welcome back, {userName}
        </h1>
        <p className="mt-1 text-accent-500">{welcome}</p>
      </div>

      {canViewAdminDashboard && (
        <div className="flex flex-wrap gap-3">
          {canViewUsers && (
            <Link href="/dashboard/admin/users">
              <Button variant="outline" className="rounded-xl min-h-11">
                <FiUser className="w-4 h-4 mr-2" />
                Manage users
              </Button>
            </Link>
          )}
          <Link href="/dashboard/admin">
            <Button variant="outline" className="rounded-xl min-h-11">
              <FiShield className="w-4 h-4 mr-2" />
              Admin panel
            </Button>
          </Link>
        </div>
      )}

      {canCreateBlog && (
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/blogs/create">
            <Button variant="primary" className="rounded-xl min-h-11">
              <FiPlusCircle className="w-4 h-4 mr-2" />
              Write new post
            </Button>
          </Link>
          <Link href="/dashboard/blogs">
            <Button variant="outline" className="rounded-xl min-h-11">
              <FiFileText className="w-4 h-4 mr-2" />
              My posts
            </Button>
          </Link>
          <Link href="/dashboard/analytics">
            <Button variant="ghost" className="rounded-xl min-h-11">
              <FiBarChart2 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </Link>
        </div>
      )}

      {canCreateBlog && (
        <Section title="Overview" subtitle="Key metrics about your posts">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            <StatsCard title="Total posts" value={isLoading ? "—" : stats?.totalBlogs ?? 0} icon={FiFileText} variant="primary" />
            <StatsCard title="Published" value={isLoading ? "—" : stats?.publishedBlogs ?? 0} icon={FiEye} variant="success" />
            <StatsCard title="Drafts" value={isLoading ? "—" : stats?.draftBlogs ?? 0} icon={FiEdit3} variant="warning" />
            <StatsCard title="Total likes" value={isLoading ? "—" : stats?.totalLikes ?? 0} icon={FiHeart} variant="accent" />
          </div>
        </Section>
      )}

      {canCreateBlog && (
        <Section title="Recent posts" subtitle="Your latest drafts and published stories">
          <div className="bg-surface rounded-2xl border border-neutral-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                <p className="mt-2 text-sm text-accent-500">Loading recent posts…</p>
              </div>
            ) : stats && stats.recentBlogs.length > 0 ? (
              <>
                <div className="md:hidden divide-y divide-neutral-200">
                  {stats.recentBlogs.map((blog) => (
                    <div key={blog._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-ink break-words min-w-0">{blog.title}</p>
                        {getStatusBadge(blog.status)}
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
                  <table className="w-full min-w-[36rem]">
                    <thead className="bg-primary-50/60 border-b border-neutral-200">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                          Likes
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-accent-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-accent-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {stats.recentBlogs.map((blog) => (
                        <tr key={blog._id} className="hover:bg-primary-50/40 transition-colors">
                          <td className="px-4 lg:px-6 py-4">
                            <div className="text-sm font-medium text-ink truncate max-w-xs">{blog.title}</div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">{getStatusBadge(blog.status)}</td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center text-sm text-accent-600">
                              <FiHeart className="w-4 h-4 mr-1 text-primary-500" />
                              {blog.total_likes}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4">
                            <div className="flex items-center text-sm text-accent-600">
                              <FiClock className="w-4 h-4 mr-1" />
                              {formatDate(blog.publish_date || blog.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-4 text-right">
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
                <FiFileText className="w-12 h-12 text-accent-300 mx-auto mb-4" />
                <h3 className="font-display text-lg font-semibold text-ink mb-2">No posts yet</h3>
                <p className="text-sm text-accent-500 mb-4">Start with a draft — you can publish when ready.</p>
                <Link href="/dashboard/blogs/create">
                  <Button variant="primary" className="rounded-xl min-h-11">
                    <FiPlusCircle className="w-4 h-4 mr-2" />
                    Create your first post
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
