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
  FiTrendingUp,
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
    createdAt: string;
    total_likes: number;
  }>;
}

// Extend session user type
declare module "next-auth" {
  interface User {
    role?: string;
  }
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user?.role as UserRole) || "user";
  const userName = session?.user?.email?.split("@")[0] || "User";

  const canCreateBlog = hasPermission(userRole, "createBlog");
  const canViewAdminDashboard = hasPermission(userRole, "viewAdminDashboard");
  const canViewUsers = hasPermission(userRole, "viewUsers");

  const [stats, setStats] = useState<DashboardStats>({
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    totalLikes: 0,
    recentBlogs: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (canCreateBlog) {
      fetchDashboardStats();
    } else {
      setIsLoading(false);
    }
  }, [canCreateBlog]);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/blogs/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      published: "bg-green-100 text-green-800 border-green-200",
      draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
      pending: "bg-orange-100 text-orange-800 border-orange-200",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          variants[status as keyof typeof variants] || variants.draft
        }`}
      >
        {status}
      </span>
    );
  };

  // Role-specific welcome messages
  const getWelcomeMessage = () => {
    switch (userRole) {
      case "superadmin":
        return "You have full control over the platform.";
      case "admin":
        return "Manage content and users from your admin dashboard.";
      case "author":
        return "Create and manage your blog posts.";
      default:
        return "Welcome to your personal dashboard.";
    }
  };

  // Render role-specific dashboard
  if (userRole === "user") {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Welcome back, {userName}! 👋</h1>
          <p className="mt-1 text-neutral-600">{getWelcomeMessage()}</p>
        </div>

        {/* User Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reading History */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <FiBookOpen className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="ml-3 font-semibold text-neutral-900">Reading History</h3>
            </div>
            <p className="text-sm text-neutral-600 mb-4">Track blogs you've read and engaged with.</p>
            <div className="text-center py-8 text-neutral-400">
              <FiBookOpen className="w-12 h-12 mx-auto mb-2" />
              <p>No reading history yet</p>
            </div>
          </div>

          {/* Liked Posts */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiHeart className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="ml-3 font-semibold text-neutral-900">Liked Posts</h3>
            </div>
            <p className="text-sm text-neutral-600 mb-4">Posts you've liked and enjoyed.</p>
            <div className="text-center py-8 text-neutral-400">
              <FiHeart className="w-12 h-12 mx-auto mb-2" />
              <p>No liked posts yet</p>
            </div>
          </div>
        </div>

        {/* Become an Author CTA */}
        <div className="bg-linear-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Want to become an author?</h3>
              <p className="text-primary-100 mt-1">Share your knowledge and stories with our community.</p>
            </div>
            <Link href="/dashboard/settings">
              <Button variant="secondary" className="bg-white text-primary-600 hover:bg-primary-50">
                Request Author Role
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Author, Admin, Superadmin Dashboard
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Welcome back, {userName}! {userRole === "superadmin" ? "👑" : userRole === "admin" ? "🛡️" : "✍️"}
        </h1>
        <p className="mt-1 text-neutral-600">{getWelcomeMessage()}</p>
      </div>

      {/* Admin Quick Actions */}
      {canViewAdminDashboard && (
        <div className="flex flex-wrap gap-3">
          {canViewUsers && (
            <Link href="/dashboard/admin/users">
              <Button variant="outline" className="rounded-full">
                <FiUser className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
            </Link>
          )}
          <Link href="/dashboard/admin">
            <Button variant="outline" className="rounded-full">
              <FiShield className="w-4 h-4 mr-2" />
              Admin Panel
            </Button>
          </Link>
        </div>
      )}

      {/* Author Quick Actions */}
      {canCreateBlog && (
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/blogs/create">
            <Button variant="primary" className="rounded-full">
              <FiPlusCircle className="w-4 h-4 mr-2" />
              Write New Post
            </Button>
          </Link>
          <Link href="/dashboard/blogs">
            <Button variant="outline" className="rounded-full">
              <FiFileText className="w-4 h-4 mr-2" />
              View All Posts
            </Button>
          </Link>
          <Link href="/dashboard/analytics">
            <Button variant="ghost" className="rounded-full">
              <FiBarChart2 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Grid - Only for authors/admins */}
      {canCreateBlog && (
        <Section title="Overview" subtitle="Key metrics about your blog performance">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Posts"
              value={isLoading ? "--" : stats.totalBlogs}
              icon={FiFileText}
              variant="primary"
              change={{
                value: "+12%",
                type: "increase",
              }}
            />
            <StatsCard
              title="Published"
              value={isLoading ? "--" : stats.publishedBlogs}
              icon={FiEye}
              variant="success"
              change={{
                value: "+8%",
                type: "increase",
              }}
            />
            <StatsCard
              title="Drafts"
              value={isLoading ? "--" : stats.draftBlogs}
              icon={FiEdit3}
              variant="warning"
              change={{
                value: "-2%",
                type: "decrease",
              }}
            />
            <StatsCard
              title="Total Likes"
              value={isLoading ? "--" : stats.totalLikes}
              icon={FiHeart}
              variant="accent"
              change={{
                value: "+24%",
                type: "increase",
              }}
            />
          </div>
        </Section>
      )}

      {/* Recent Activity - Only for authors/admins */}
      {canCreateBlog && (
        <Section title="Recent Posts" subtitle="Your latest blog posts and their status">
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm text-neutral-600">Loading recent posts...</p>
              </div>
            ) : stats.recentBlogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Likes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {stats.recentBlogs.map((blog) => (
                      <tr key={blog._id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-neutral-900 truncate max-w-xs">{blog.title}</div>
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(blog.status)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-neutral-600">
                            <FiHeart className="w-4 h-4 mr-1 text-red-500" />
                            {blog.total_likes}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-neutral-600">
                            <FiClock className="w-4 h-4 mr-1" />
                            {formatDate(blog.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
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
            ) : (
              <div className="p-8 text-center">
                <FiFileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No posts yet</h3>
                <p className="text-sm text-neutral-600 mb-4">Get started by creating your first blog post.</p>
                <Link href="/dashboard/blogs/create">
                  <Button variant="primary" className="rounded-full">
                    <FiPlusCircle className="w-4 h-4 mr-2" />
                    Create Your First Post
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Quick Tips - Only for authors */}
      {canCreateBlog && (
        <Section title="Quick Tips" subtitle="Helpful hints to make the most of your dashboard">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-linear-to-br from-primary-50 to-primary-100 p-6 rounded-lg border border-primary-200">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-primary-600 rounded-lg">
                  <FiEdit3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="ml-3 font-semibold text-primary-900">Write Engaging Content</h3>
              </div>
              <p className="text-sm text-primary-700">
                Use the rich text editor to create beautiful posts with formatting, images, and more.
              </p>
            </div>

            <div className="bg-linear-to-br from-accent-50 to-accent-100 p-6 rounded-lg border border-accent-200">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-accent-600 rounded-lg">
                  <FiTrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="ml-3 font-semibold text-accent-900">Track Performance</h3>
              </div>
              <p className="text-sm text-accent-700">
                Monitor your blog's performance with real-time analytics and engagement metrics.
              </p>
            </div>

            <div className="bg-linear-to-br from-neutral-50 to-neutral-100 p-6 rounded-lg border border-neutral-200">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-neutral-600 rounded-lg">
                  <FiHeart className="w-5 h-5 text-white" />
                </div>
                <h3 className="ml-3 font-semibold text-neutral-900">Build Engagement</h3>
              </div>
              <p className="text-sm text-neutral-700">
                Readers can like your posts and share them, helping you grow your audience.
              </p>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
