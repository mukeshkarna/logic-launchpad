'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { adminLeaderboardAPI } from '@/lib/admin-api';
import toast from 'react-hot-toast';

export default function AdminLeaderboardsPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const [topBloggers, setTopBloggers] = useState<any[]>([]);
  const [topBlogs, setTopBlogs] = useState<any[]>([]);
  const [risingStars, setRisingStars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [bloggerMetric, setBloggerMetric] = useState('views');
  const [blogMetric, setBlogMetric] = useState('views');
  const [period, setPeriod] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || (user?.role !== 'SUPER_ADMIN' && user?.role !== 'MODERATOR')) {
        toast.error('Access denied');
        router.push('/');
      } else {
        loadLeaderboards();
      }
    }
  }, [isAuthenticated, isLoading, user, bloggerMetric, blogMetric, period]);

  const loadLeaderboards = async () => {
    try {
      setLoading(true);
      const [bloggersRes, blogsRes, starsRes] = await Promise.all([
        adminLeaderboardAPI.getTopBloggers(bloggerMetric, 10, period),
        adminLeaderboardAPI.getTopBlogs(blogMetric, 10, period),
        adminLeaderboardAPI.getRisingStars(10),
      ]);

      setTopBloggers(bloggersRes.data.topBloggers);
      setTopBlogs(blogsRes.data.topBlogs);
      setRisingStars(starsRes.data.risingStars);
    } catch (error) {
      toast.error('Failed to load leaderboards');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Leaderboards</h1>
            <div className="flex gap-4 items-center">
              <select
                value={period || 'all'}
                onChange={(e) => setPeriod(e.target.value === 'all' ? undefined : parseInt(e.target.value))}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
              <Link href="/admin" className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                ← Back
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Bloggers */}
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">🏆 Top Bloggers</h2>
              <select
                value={bloggerMetric}
                onChange={(e) => setBloggerMetric(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="views">Most Views</option>
                <option value="likes">Most Likes</option>
                <option value="comments">Most Comments</option>
                <option value="engagement">Highest Engagement</option>
              </select>
            </div>
            <div className="space-y-3">
              {topBloggers.map((blogger, index) => (
                <div key={blogger.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-400 w-8">{index + 1}</div>
                  <div className="flex-1">
                    <div className="font-medium">{blogger.fullName}</div>
                    <div className="text-sm text-gray-500">@{blogger.username}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary-600">{blogger.metric.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{blogger.metricName}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Blogs */}
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">📝 Top Blogs</h2>
              <select
                value={blogMetric}
                onChange={(e) => setBlogMetric(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="views">Most Views</option>
                <option value="likes">Most Likes</option>
                <option value="comments">Most Comments</option>
                <option value="trending">Trending</option>
              </select>
            </div>
            <div className="space-y-3">
              {topBlogs.map((blog, index) => (
                <div key={blog.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-400 w-8">{index + 1}</div>
                  <div className="flex-1">
                    <div className="font-medium line-clamp-2">{blog.title}</div>
                    <div className="text-sm text-gray-500">by @{blog.author.username}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {blog.views} views • {blog.likes} likes • {blog.comments} comments
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rising Stars */}
          <div className="bg-white p-6 rounded-lg border lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">🌟 Rising Stars (New Users with High Engagement)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {risingStars.map((star) => (
                <div key={star.id} className="flex items-center gap-3 p-3 border rounded hover:border-primary-500">
                  <div>
                    <div className="font-medium">{star.fullName}</div>
                    <div className="text-sm text-gray-500">@{star.username}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Joined {new Date(star.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-sm font-semibold">{star.totalBlogs} blogs</div>
                    <div className="text-xs text-gray-500">{star.avgViewsPerBlog} avg views</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
