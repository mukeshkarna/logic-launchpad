'use client';

import { useEffect, useState } from 'react';
import { blogAPI } from '@/lib/api';
import BlogCard from '@/components/BlogCard';
import Link from 'next/link';

export default function HomePage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadBlogs();
  }, [page]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      const response = await blogAPI.getBlogs({ page, limit: 10 });
      setBlogs(response.data.blogs);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4 dark:text-gray-100">Welcome to BlogHub</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Discover stories, thinking, and expertise from writers on any topic.
        </p>
        <Link
          href="/write"
          className="inline-block bg-primary-600 dark:bg-primary-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
        >
          Start Writing
        </Link>
      </div>

      {/* Blog List */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 dark:text-gray-100">Latest Stories</h2>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No blogs yet. Be the first to write!</p>
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {blogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 dark:text-gray-200">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
