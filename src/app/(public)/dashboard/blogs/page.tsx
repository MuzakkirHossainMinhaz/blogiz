"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
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

export default function BlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    filterBlogs();
  }, [blogs, searchTerm, statusFilter]);

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/blogs");
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.blogs || []);
      }
    } catch (error) {
      console.error("Failed to fetch blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterBlogs = () => {
    let filtered = blogs;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(blog => blog.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.author_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBlogs(filtered);
  };

  const handleDelete = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this blog? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBlogs(blogs.filter(blog => blog._id !== blogId));
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

    if (!confirm(`Are you sure you want to ${action} this blog?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/blogs/${blogId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setBlogs(blogs.map(blog =>
          blog._id === blogId ? { ...blog, status: newStatus as "draft" | "published" } : blog
        ));
      } else {
        alert(`Failed to ${action} blog`);
      }
    } catch (error) {
      console.error(`Failed to ${action} blog:`, error);
      alert(`Failed to ${action} blog`);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Blogs</h1>
          <p className="text-neutral-600">Manage your blog posts</p>
        </div>
        <Link href="/dashboard/blogs/create">
          <Button variant="primary" className="rounded-full">
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
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-neutral-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "draft")}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-neutral-300 rounded-lg">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 flex items-center gap-2 ${
                viewMode === "table"
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <FiList className="w-4 h-4" />
              Table
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 flex items-center gap-2 ${
                viewMode === "grid"
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <FiGrid className="w-4 h-4" />
              Grid
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
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Author
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
                {filteredBlogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-neutral-900 line-clamp-1">
                          {blog.title}
                        </div>
                        <div className="text-sm text-neutral-500 line-clamp-1">
                          {blog.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900">{blog.author_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(blog.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-neutral-600">
                        <FiHeart className="w-4 h-4 mr-1 text-red-500" />
                        {blog.total_likes}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-neutral-600">
                        <FiCalendar className="w-4 h-4 mr-1" />
                        {formatDate(blog.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
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
                          onClick={() => handleToggleStatus(blog._id, blog.status)}
                          className={blog.status === "published" ? "text-yellow-600" : "text-green-600"}
                        >
                          {blog.status === "published" ? "Unpublish" : "Publish"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(blog._id)}
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
                      onClick={() => handleToggleStatus(blog._id, blog.status)}
                      className={blog.status === "published" ? "text-yellow-600" : "text-green-600"}
                    >
                      {blog.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(blog._id)}
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
    </div>
  );
}
