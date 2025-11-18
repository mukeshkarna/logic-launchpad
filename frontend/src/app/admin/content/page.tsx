'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { adminContentAPI } from '@/lib/admin-api';
import toast from 'react-hot-toast';

export default function AdminContentPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [selectedBlogs, setSelectedBlogs] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reportedOnly, setReportedOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'MODERATOR') {
        toast.error('Access denied. Admin privileges required.');
        router.push('/');
      } else {
        loadBlogs();
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'SUPER_ADMIN' || user?.role === 'MODERATOR')) {
      loadBlogs();
    }
  }, [pagination.page, search, statusFilter, reportedOnly, featuredOnly]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const response = await adminContentAPI.getAllBlogs({
        page: pagination.page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        isReported: reportedOnly || undefined,
        isFeatured: featuredOnly || undefined,
      });
      setBlogs(response.data.blogs);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Failed to load blogs:', error);
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = async (blogId: string) => {
    try {
      await adminContentAPI.toggleFeature(blogId);
      toast.success('Blog feature status updated');
      loadBlogs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update blog');
    }
  };

  const handleDelete = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog? This action cannot be undone!')) {
      return;
    }

    try {
      await adminContentAPI.deleteBlog(blogId);
      toast.success('Blog deleted successfully');
      loadBlogs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete blog');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBlogs.length === 0) {
      toast.error('No blogs selected');
      return;
    }

    if (!confirm(`Delete ${selectedBlogs.length} blog(s)? This cannot be undone!`)) {
      return;
    }

    try {
      await adminContentAPI.bulkDelete(selectedBlogs);
      toast.success(`${selectedBlogs.length} blog(s) deleted successfully`);
      setSelectedBlogs([]);
      loadBlogs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete blogs');
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedBlogs.length === 0) {
      toast.error('No blogs selected');
      return;
    }

    try {
      await adminContentAPI.bulkUnpublish(selectedBlogs);
      toast.success(`${selectedBlogs.length} blog(s) unpublished successfully`);
      setSelectedBlogs([]);
      loadBlogs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to unpublish blogs');
    }
  };

  const handleBulkFeature = async (isFeatured: boolean) => {
    if (selectedBlogs.length === 0) {
      toast.error('No blogs selected');
      return;
    }

    try {
      await adminContentAPI.bulkFeature(selectedBlogs, isFeatured);
      toast.success(
        `${selectedBlogs.length} blog(s) ${isFeatured ? 'featured' : 'unfeatured'} successfully`
      );
      setSelectedBlogs([]);
      loadBlogs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update blogs');
    }
  };

  const toggleSelectAll = () => {
    if (selectedBlogs.length === blogs.length) {
      setSelectedBlogs([]);
    } else {
      setSelectedBlogs(blogs.map((blog) => blog.id));
    }
  };

  const toggleSelectBlog = (blogId: string) => {
    if (selectedBlogs.includes(blogId)) {
      setSelectedBlogs(selectedBlogs.filter((id) => id !== blogId));
    } else {
      setSelectedBlogs([...selectedBlogs, blogId]);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage all blogs and content across the platform
              </p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by title or content
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                placeholder="Search blogs..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* Reported Only */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="reportedOnly"
                checked={reportedOnly}
                onChange={(e) => {
                  setReportedOnly(e.target.checked);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="reportedOnly" className="ml-2 block text-sm text-gray-700">
                Show only reported content
              </label>
            </div>

            {/* Featured Only */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="featuredOnly"
                checked={featuredOnly}
                onChange={(e) => {
                  setFeaturedOnly(e.target.checked);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="featuredOnly" className="ml-2 block text-sm text-gray-700">
                Show only featured content
              </label>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedBlogs.length > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-900">
                {selectedBlogs.length} blog(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkFeature(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Feature Selected
                </button>
                <button
                  onClick={() => handleBulkFeature(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                >
                  Unfeature Selected
                </button>
                <button
                  onClick={handleBulkUnpublish}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                >
                  Unpublish Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Blogs List */}
        <div className="bg-white rounded-lg border border-gray-200">
          {blogs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No blogs found</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedBlogs.length === blogs.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All
                  </span>
                </div>
              </div>

              {/* Blogs */}
              <div className="divide-y divide-gray-200">
                {blogs.map((blog) => (
                  <div key={blog.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedBlogs.includes(blog.id)}
                        onChange={() => toggleSelectBlog(blog.id)}
                        className="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />

                      {/* Blog Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link
                              href={`/blog/${blog.slug}`}
                              className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                            >
                              {blog.title}
                            </Link>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                              <span>By {blog.author.fullName}</span>
                              <span>•</span>
                              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{blog._count.views} views</span>
                              <span>{blog._count.likes} likes</span>
                              <span>{blog._count.comments} comments</span>
                            </div>
                            {blog.excerpt && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {blog.excerpt}
                              </p>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex flex-col gap-2 items-end">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                blog.status === 'PUBLISHED'
                                  ? 'bg-green-100 text-green-700'
                                  : blog.status === 'DRAFT'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {blog.status}
                            </span>
                            {blog.isFeatured && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                Featured
                              </span>
                            )}
                            {blog.isReported && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                Reported
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                          <Link
                            href={`/blog/${blog.slug}`}
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleToggleFeature(blog.id)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            {blog.isFeatured ? 'Unfeature' : 'Feature'}
                          </button>
                          <button
                            onClick={() => handleDelete(blog.id)}
                            className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.pages} (Total: {pagination.total} blogs)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                        disabled={pagination.page === pagination.pages}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
