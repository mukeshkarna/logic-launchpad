'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { adminDashboardAPI } from '@/lib/admin-api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [registrationTrend, setRegistrationTrend] = useState<any[]>([]);
  const [publicationTrend, setPublicationTrend] = useState<any[]>([]);
  const [engagementTrend, setEngagementTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'MODERATOR') {
        toast.error('Access denied. Admin privileges required.');
        router.push('/');
      } else {
        loadDashboardData();
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, regTrendRes, pubTrendRes, engTrendRes] = await Promise.all([
        adminDashboardAPI.getStats(),
        adminDashboardAPI.getRegistrationTrend(period),
        adminDashboardAPI.getPublicationTrend(period),
        adminDashboardAPI.getEngagementTrend(period),
      ]);

      setStats(statsRes.data);
      setRegistrationTrend(regTrendRes.data.trend);
      setPublicationTrend(pubTrendRes.data.trend);
      setEngagementTrend(engTrendRes.data.trend);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied');
        router.push('/');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome back, {user?.fullName} ({user?.role})
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              ← Back to Site
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Link
            href="/admin/users"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-2">👥</div>
            <div className="font-semibold dark:text-gray-100">User Management</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Manage users & roles</div>
          </Link>
          <Link
            href="/admin/content"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-2">📝</div>
            <div className="font-semibold dark:text-gray-100">Content Moderation</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Review & moderate blogs</div>
          </Link>
          <Link
            href="/admin/leaderboards"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-2">🏆</div>
            <div className="font-semibold dark:text-gray-100">Leaderboards</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Top performers</div>
          </Link>
          <Link
            href="/admin/settings"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-2">⚙️</div>
            <div className="font-semibold dark:text-gray-100">Settings</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Platform configuration</div>
          </Link>
          {user?.role === 'SUPER_ADMIN' && (
            <Link
              href="/admin/audit-log"
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-2">📋</div>
              <div className="font-semibold dark:text-gray-100">Audit Log</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Track admin actions</div>
            </Link>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.users.total.toLocaleString()}
            change={`+${stats.users.growthPercentage}%`}
            subtitle={`${stats.users.last30Days} new this month`}
            icon="👥"
            changePositive={stats.users.growthPercentage >= 0}
          />
          <StatCard
            title="Published Blogs"
            value={stats.blogs.published.toLocaleString()}
            subtitle={`${stats.blogs.drafts} drafts`}
            icon="📝"
          />
          <StatCard
            title="Total Views"
            value={stats.engagement.totalViews.toLocaleString()}
            subtitle="Across all blogs"
            icon="👀"
          />
          <StatCard
            title="Total Engagement"
            value={stats.engagement.totalEngagement.toLocaleString()}
            subtitle={`${stats.engagement.totalLikes} likes, ${stats.engagement.totalComments} comments`}
            icon="💬"
          />
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Active Users</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Last 7 days</span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {stats.users.active7Days}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Last 30 days</span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {stats.users.active30Days}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Content Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Blogs</span>
                <span className="text-2xl font-bold dark:text-gray-100">{stats.blogs.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">New this month</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  +{stats.blogs.last30Days}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Registration Trend */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-gray-100">User Registration Trend</h3>
              <select
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-gray-100"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            <SimpleLineChart data={registrationTrend} dataKey="count" color="#22c55e" />
          </div>

          {/* Publication Trend */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-gray-100">Blog Publication Trend</h3>
            </div>
            <SimpleLineChart data={publicationTrend} dataKey="count" color="#3b82f6" />
          </div>
        </div>

        {/* Engagement Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Engagement Trend</h3>
          <MultiLineChart data={engagementTrend} />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  subtitle,
  icon,
  changePositive,
}: {
  title: string;
  value: string;
  change?: string;
  subtitle?: string;
  icon: string;
  changePositive?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold dark:text-gray-100">{value}</span>
        {change && (
          <span
            className={`text-sm font-medium ${
              changePositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {change}
          </span>
        )}
      </div>
      {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// Simple Line Chart Component (basic visualization)
function SimpleLineChart({
  data,
  dataKey,
  color,
}: {
  data: any[];
  dataKey: string;
  color: string;
}) {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No data available</div>;
  }

  const maxValue = Math.max(...data.map((d) => d[dataKey] || 0));
  const height = 150;

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      <svg width="100%" height="100%" className="overflow-visible">
        <polyline
          points={data
            .map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = height - (item[dataKey] / maxValue) * height;
              return `${x}%,${y}`;
            })
            .join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = height - (item[dataKey] / maxValue) * height;
          return (
            <circle
              key={index}
              cx={`${x}%`}
              cy={y}
              r="3"
              fill={color}
              className="hover:r-5"
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// Multi-line Chart Component
function MultiLineChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">No data available</div>;
  }

  const maxValue = Math.max(
    ...data.flatMap((d) => [d.views || 0, d.likes || 0, d.comments || 0])
  );
  const height = 200;

  return (
    <div>
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-sm dark:text-gray-300">Views</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-sm dark:text-gray-300">Likes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-sm dark:text-gray-300">Comments</span>
        </div>
      </div>
      <div className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Views line */}
          <polyline
            points={data
              .map((item, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = height - ((item.views || 0) / maxValue) * height;
                return `${x}%,${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          {/* Likes line */}
          <polyline
            points={data
              .map((item, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = height - ((item.likes || 0) / maxValue) * height;
                return `${x}%,${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
          />
          {/* Comments line */}
          <polyline
            points={data
              .map((item, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = height - ((item.comments || 0) / maxValue) * height;
                return `${x}%,${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}
