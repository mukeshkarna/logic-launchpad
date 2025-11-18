'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { blogAPI, analyticsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');
  const [loading, setLoading] = useState(true);

  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, isLoading, router, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? undefined : activeTab === 'published' ? 'PUBLISHED' : 'DRAFT';
      const [blogsRes, analyticsRes] = await Promise.all([
        blogAPI.getMyBlogs(status),
        analyticsAPI.getUserAnalytics(),
      ]);
      setBlogs(blogsRes.data.blogs);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      await blogAPI.deleteBlog(id);
      toast.success('Blog deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete blog');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await blogAPI.publishBlog(id);
      toast.success('Blog published');
      loadData();
    } catch (error) {
      toast.error('Failed to publish blog');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await blogAPI.unpublishBlog(id);
      toast.success('Blog unpublished');
      loadData();
    } catch (error) {
      toast.error('Failed to unpublish blog');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Admin Dashboard Link */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'MODERATOR') && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 text-white p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Admin Access</h3>
                <p className="text-sm text-gray-600">Manage platform users, content, and settings</p>
              </div>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Go to Admin Dashboard →
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.fullName}!</p>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Blogs</div>
            <div className="text-3xl font-bold">{analytics.overview.totalBlogs}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Views</div>
            <div className="text-3xl font-bold">{analytics.overview.totalViews}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Likes</div>
            <div className="text-3xl font-bold">{analytics.overview.totalLikes}</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Comments</div>
            <div className="text-3xl font-bold">{analytics.overview.totalComments}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Blogs
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'published'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'draft'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Drafts
          </button>
        </div>
        <Link
          href="/write"
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          New Blog
        </Link>
      </div>

      {/* Blogs List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No blogs found</p>
            <Link href="/write" className="text-primary-600 hover:underline">
              Write your first blog →
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {blogs.map((blog) => (
              <div key={blog.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link href={`/blog/${blog.slug}`}>
                      <h3 className="text-xl font-bold mb-2 hover:text-primary-600">
                        {blog.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          blog.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {blog.status}
                      </span>
                      <span>{blog._count.views} views</span>
                      <span>{blog._count.likes} likes</span>
                      <span>{blog._count.comments} comments</span>
                      <span>
                        Updated {new Date(blog.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/write?id=${blog.id}`}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Edit
                    </Link>
                    {blog.status === 'DRAFT' ? (
                      <button
                        onClick={() => handlePublish(blog.id)}
                        className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnpublish(blog.id)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Unpublish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
