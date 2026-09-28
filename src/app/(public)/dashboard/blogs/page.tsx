"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { 
  FiFileText, 
  FiEdit3, 
  FiTrash2, 
  FiEye,
  FiPlusCircle,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiCalendar,
  FiHeart
} from "react-icons/fi";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface Blog {
  _id: string;
  title: string;
  description: string;
  status: "draft" | "published";
  total_likes: number;
  createdAt: string;
  publish_date?: string;
  author_name: string;
}

type PendingAction =
  | { type: "delete"; blogId: string }
  | { type: "toggle"; blogId: string; currentStatus: string }
  | null;

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/blogs?scope=mine&limit=50");
        if (cancelled) return;
        if (response.ok) {
          const data = await response.json();
          setBlogs(data.blogs || []);
        }
      } catch (error) {
        if (!cancelled) console.error("Failed to fetch blogs:", error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredBlogs = useMemo(() => {
    let filtered = blogs;

    if (statusFilter !== "all") {
      filtered = filtered.filter((blog) => blog.status === statusFilter);
    }

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (blog) =>
          blog.title.toLowerCase().includes(query) ||
          blog.description.toLowerCase().includes(query) ||
          blog.author_name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [blogs, searchTerm, statusFilter]);

  const handleDelete = async (blogId: string) => {
    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBlogs((current) => current.filter((blog) => blog._id !== blogId));
      } else {
        alert("Failed to delete blog");
      }
    } catch (error) {
      console.error("Failed to delete blog:", error);
      alert("Failed to delete blog");
    }
  };

  const handleToggleStatus = async (blogId: string, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    const action = newStatus === "published" ? "publish" : "unpublish";

    try {
      const response = await fetch(`/api/blogs/${blogId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        const status = data.blog?.status || newStatus;
        setBlogs((current) =>
          current.map((blog) => (blog._id === blogId ? { ...blog, status } : blog))
        );
      } else {
        alert(`Failed to ${action} blog`);
      }
    } catch (error) {
      console.error(`Failed to ${action} blog:`, error);
      alert(`Failed to ${action} blog`);
    }
  };

  const confirmPendingAction = async () => {
    const action = pendingAction;
    setPendingAction(null);
    if (!action) return;
    if (action.type === "delete") await handleDelete(action.blogId);
    else await handleToggleStatus(action.blogId, action.currentStatus);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      published: "bg-green-100 text-green-800 border-green-200",
      draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[status as keyof typeof variants] || variants.draft}`}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Blogs</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Blogs</h1>
          <p className="text-neutral-600">Manage your blog posts</p>
        </div>
        <Link href="/dashboard/blogs/create" className="w-full sm:w-auto">
          <Button variant="primary" className="rounded-full w-full sm:w-auto">
            <FiPlusCircle className="w-4 h-4 mr-2" />
            Create New Post
          </Button>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-neutral-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              type="search"
              aria-label="Search blogs"
              placeholder="Search blogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<FiSearch className="w-4 h-4" />}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 lg:w-56">
            <FiFilter className="text-neutral-400 w-4 h-4 shrink-0" />
            <Select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "draft")}
              className="flex-1"
              options={[
                { value: "all", label: "All Status" },
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
              ]}
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-neutral-300 rounded-lg self-start overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={`min-h-11 px-3 py-2 flex items-center gap-2 touch-manipulation ${
                viewMode === "table"
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <FiList className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`min-h-11 px-3 py-2 flex items-center gap-2 touch-manipulation ${
                viewMode === "grid"
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <FiGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-neutral-600">
        <span>Showing {filteredBlogs.length} of {blogs.length} blogs</span>
        <span>{statusFilter === "all" ? "All" : statusFilter} blogs</span>
      </div>

      {/* Blog List */}
      {filteredBlogs.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <FiFileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            {searchTerm || statusFilter !== "all" ? "No blogs found" : "No blogs yet"}
          </h3>
          <p className="text-sm text-neutral-600 mb-4">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first blog post."
            }
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Link href="/dashboard/blogs/create">
              <Button variant="primary" className="rounded-full">
                <FiPlusCircle className="w-4 h-4 mr-2" />
                Create Your First Post
              </Button>
            </Link>
          )}
        </div>
      ) : viewMode === "table" ? (
        <>
          {/* Mobile card list — avoids page-level horizontal overflow */}
          <div className="md:hidden space-y-3">
            {filteredBlogs.map((blog) => (
              <div key={blog._id} className="bg-white rounded-lg border border-neutral-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 break-words">{blog.title}</p>
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{blog.description}</p>
                  </div>
                  {getStatusBadge(blog.status)}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
                  <span className="inline-flex items-center gap-1">
                    <FiHeart className="w-4 h-4 text-red-500" />
                    {blog.total_likes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FiCalendar className="w-4 h-4" />
                    {formatDate(blog.createdAt)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Link href={`/blogs/${blog._id}`} target="_blank">
                    <Button variant="ghost" size="sm" aria-label="View post">
                      <FiEye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/dashboard/blogs/edit/${blog._id}`}>
                    <Button variant="ghost" size="sm" aria-label="Edit post">
                      <FiEdit3 className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingAction({ type: "toggle", blogId: blog._id, currentStatus: blog.status })}
                    className={blog.status === "published" ? "text-yellow-600" : "text-green-600"}
                  >
                    {blog.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingAction({ type: "delete", blogId: blog._id })}
                    className="text-red-600 hover:text-red-700"
                    aria-label="Delete post"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem]">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Likes
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredBlogs.map((blog) => (
                    <tr key={blog._id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 lg:px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-neutral-900 line-clamp-1">
                            {blog.title}
                          </div>
                          <div className="text-sm text-neutral-500 line-clamp-1">
                            {blog.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="text-sm text-neutral-900">{blog.author_name}</div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {getStatusBadge(blog.status)}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center text-sm text-neutral-600">
                          <FiHeart className="w-4 h-4 mr-1 text-red-500" />
                          {blog.total_likes}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center text-sm text-neutral-600">
                          <FiCalendar className="w-4 h-4 mr-1" />
                          {formatDate(blog.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/blogs/${blog._id}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <FiEye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/blogs/edit/${blog._id}`}>
                            <Button variant="ghost" size="sm">
                              <FiEdit3 className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingAction({ type: "toggle", blogId: blog._id, currentStatus: blog.status })}
                            className={blog.status === "published" ? "text-yellow-600" : "text-green-600"}
                          >
                            {blog.status === "published" ? "Unpublish" : "Publish"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPendingAction({ type: "delete", blogId: blog._id })}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <div key={blog._id} className="bg-white rounded-lg border border-neutral-200 overflow-hidden card-hover">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  {getStatusBadge(blog.status)}
                  <div className="flex items-center text-sm text-neutral-600">
                    <FiHeart className="w-4 h-4 mr-1 text-red-500" />
                    {blog.total_likes}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 line-clamp-2">
                  {blog.title}
                </h3>
                <p className="text-sm text-neutral-600 mb-4 line-clamp-3">
                  {blog.description}
                </p>
                <div className="flex items-center text-sm text-neutral-500 mb-4">
                  <FiCalendar className="w-4 h-4 mr-1" />
                  {formatDate(blog.createdAt)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Link href={`/blogs/${blog._id}`} target="_blank">
                      <Button variant="ghost" size="sm">
                        <FiEye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/blogs/edit/${blog._id}`}>
                      <Button variant="ghost" size="sm">
                        <FiEdit3 className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingAction({ type: "toggle", blogId: blog._id, currentStatus: blog.status })}
                      className={blog.status === "published" ? "text-yellow-600" : "text-green-600"}
                    >
                      {blog.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPendingAction({ type: "delete", blogId: blog._id })}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingAction?.type === "delete"}
        title="Delete blog post"
        message="Are you sure you want to delete this blog? This action cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={confirmPendingAction}
        onCancel={() => setPendingAction(null)}
      />
      <ConfirmDialog
        open={pendingAction?.type === "toggle"}
        title={pendingAction?.type === "toggle" && pendingAction.currentStatus === "published" ? "Unpublish post" : "Publish post"}
        message={
          pendingAction?.type === "toggle" && pendingAction.currentStatus === "published"
            ? "Are you sure you want to unpublish this blog?"
            : "Are you sure you want to publish this blog?"
        }
        confirmLabel={pendingAction?.type === "toggle" && pendingAction.currentStatus === "published" ? "Unpublish" : "Publish"}
        onConfirm={confirmPendingAction}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
