'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { adminAuditAPI } from '@/lib/admin-api';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  action: string;
  performedBy: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  targetType?: string;
  targetId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
}

export default function AdminAuditLogPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('');

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'MODERATOR') {
        toast.error('Access denied. Admin privileges required.');
        router.push('/');
      } else {
        loadAuditLogs();
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'SUPER_ADMIN' || user?.role === 'MODERATOR')) {
      loadAuditLogs();
    }
  }, [pagination.page, actionFilter, adminFilter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await adminAuditAPI.getActions({
        page: pagination.page,
        limit: 50,
        action: actionFilter || undefined,
        adminId: adminFilter || undefined,
      });
      setLogs(response.data.logs || []);
      setPagination(response.data.pagination || { page: 1, total: 0, pages: 0 });
    } catch (error: any) {
      console.error('Failed to load audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('BANNED')) {
      return 'bg-red-100 text-red-700';
    }
    if (action.includes('SUSPENDED')) {
      return 'bg-yellow-100 text-yellow-700';
    }
    if (action.includes('REINSTATED') || action.includes('RESOLVED')) {
      return 'bg-green-100 text-green-700';
    }
    if (action.includes('UPDATED') || action.includes('ROLE')) {
      return 'bg-blue-100 text-blue-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderDetails = (details: any) => {
    if (!details) return null;

    if (typeof details === 'string') {
      return <p className="text-sm text-gray-600">{details}</p>;
    }

    return (
      <div className="text-sm text-gray-600">
        <pre className="bg-gray-50 p-2 rounded overflow-x-auto">
          {JSON.stringify(details, null, 2)}
        </pre>
      </div>
    );
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading audit logs...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
              <p className="text-sm text-gray-600 mt-1">
                Track all administrative actions performed on the platform
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Actions</option>
                <optgroup label="User Actions">
                  <option value="USER_ROLE_UPDATED">User Role Updated</option>
                  <option value="USER_SUSPENDED">User Suspended</option>
                  <option value="USER_BANNED">User Banned</option>
                  <option value="USER_REINSTATED">User Reinstated</option>
                  <option value="USER_DELETED">User Deleted</option>
                </optgroup>
                <optgroup label="Blog Actions">
                  <option value="BLOG_UPDATED">Blog Updated</option>
                  <option value="BLOG_DELETED">Blog Deleted</option>
                  <option value="BLOG_FEATURED">Blog Featured</option>
                  <option value="BLOG_UNFEATURED">Blog Unfeatured</option>
                  <option value="BULK_BLOG_DELETE">Bulk Blog Delete</option>
                  <option value="BULK_BLOG_UNPUBLISH">Bulk Blog Unpublish</option>
                  <option value="BULK_BLOG_FEATURE">Bulk Blog Feature</option>
                </optgroup>
                <optgroup label="Report Actions">
                  <option value="REPORT_RESOLVED">Report Resolved</option>
                  <option value="REPORT_DISMISSED">Report Dismissed</option>
                </optgroup>
                <optgroup label="Other Actions">
                  <option value="MODERATION_NOTE_ADDED">Moderation Note Added</option>
                  <option value="SETTINGS_UPDATED">Settings Updated</option>
                  <option value="SETTING_DELETED">Setting Deleted</option>
                </optgroup>
              </select>
            </div>

            {/* Admin Filter (optional - could be enhanced) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin ID (Optional)
              </label>
              <input
                type="text"
                value={adminFilter}
                onChange={(e) => {
                  setAdminFilter(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                placeholder="Filter by admin user ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-lg border border-gray-200">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <>
              {/* Logs List */}
              <div className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <div key={log.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Action and Badge */}
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {formatActionName(log.action)}
                          </span>
                          {log.performedBy && (
                            <span className="text-sm text-gray-600">
                              by <span className="font-medium">{log.performedBy.fullName}</span>
                              <span
                                className={`ml-2 px-2 py-0.5 rounded text-xs ${
                                  log.performedBy.role === 'SUPER_ADMIN'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {log.performedBy.role}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Target Info */}
                        {log.targetType && log.targetId && (
                          <div className="text-sm text-gray-600 mb-2">
                            Target: {log.targetType} ({log.targetId})
                          </div>
                        )}

                        {/* Details */}
                        {log.details && (
                          <div className="mt-2">
                            {renderDetails(log.details)}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                          {log.ipAddress && (
                            <>
                              <span>•</span>
                              <span>IP: {log.ipAddress}</span>
                            </>
                          )}
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
                      Page {pagination.page} of {pagination.pages} (Total: {pagination.total} logs)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setPagination({ ...pagination, page: pagination.page - 1 })
                        }
                        disabled={pagination.page === 1}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setPagination({ ...pagination, page: pagination.page + 1 })
                        }
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

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">About Audit Logs</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Every administrative action is automatically logged here for accountability and
                  security. Logs include the admin who performed the action, what was changed, when
                  it happened, and the IP address from which the action was performed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
