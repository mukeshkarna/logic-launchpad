'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { adminUserAPI } from '@/lib/admin-api';
import toast from 'react-hot-toast';

export default function AdminUserDetailsPage() {
  const { user: currentUser, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'MODERATOR') {
        toast.error('Access denied. Admin privileges required.');
        router.push('/');
      } else {
        loadUserDetails();
      }
    }
  }, [isAuthenticated, isLoading, currentUser, router, userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const response = await adminUserAPI.getUserDetails(userId);
      setUserDetails(response.data);
    } catch (error: any) {
      console.error('Failed to load user details:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied');
        router.push('/admin');
      } else {
        toast.error('Failed to load user details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminUserAPI.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      loadUserDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    const reason = prompt('Enter reason for suspension:');
    if (!reason) return;

    try {
      setActionLoading(true);
      await adminUserAPI.suspendUser(userId, reason);
      toast.success('User suspended successfully');
      loadUserDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to suspend user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBan = async () => {
    const reason = prompt('Enter reason for ban:');
    if (!reason) return;

    if (!confirm('Are you sure you want to BAN this user? This is a serious action.')) {
      return;
    }

    try {
      setActionLoading(true);
      await adminUserAPI.banUser(userId, reason);
      toast.success('User banned successfully');
      loadUserDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to ban user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReinstate = async () => {
    if (!confirm('Reinstate this user?')) return;

    try {
      setActionLoading(true);
      await adminUserAPI.reinstateUser(userId);
      toast.success('User reinstated successfully');
      loadUserDetails();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reinstate user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to DELETE this user? This action cannot be undone!')) {
      return;
    }

    const confirmation = prompt('Type "DELETE" to confirm:');
    if (confirmation !== 'DELETE') {
      toast.error('Deletion cancelled');
      return;
    }

    try {
      setActionLoading(true);
      await adminUserAPI.deleteUser(userId);
      toast.success('User deleted successfully');
      router.push('/admin/users');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
      setActionLoading(false);
    }
  };

  if (isLoading || loading || !userDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  const { user, stats } = userDetails;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/users"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Users
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
                      {user.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{user.fullName}</h3>
                    <p className="text-gray-600">@{user.username}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Role</label>
                    <p className="font-medium">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'MODERATOR'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.role}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <p className="font-medium">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : user.status === 'SUSPENDED'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Joined</label>
                    <p className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {user.lastLoginAt && (
                    <div>
                      <label className="text-sm text-gray-600">Last Login</label>
                      <p className="font-medium">
                        {new Date(user.lastLoginAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {user.bio && (
                  <div className="pt-4 border-t">
                    <label className="text-sm text-gray-600">Bio</label>
                    <p className="mt-1">{user.bio}</p>
                  </div>
                )}

                {user.status !== 'ACTIVE' && user.suspensionReason && (
                  <div className="pt-4 border-t bg-yellow-50 p-4 rounded">
                    <label className="text-sm font-medium text-yellow-800">
                      Suspension Reason
                    </label>
                    <p className="mt-1 text-yellow-700">{user.suspensionReason}</p>
                    {user.suspendedAt && (
                      <p className="text-sm text-yellow-600 mt-1">
                        Suspended on: {new Date(user.suspendedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-primary-600">
                    {user._count.blogs}
                  </div>
                  <div className="text-sm text-gray-600">Blogs</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
                  <div className="text-sm text-gray-600">Total Views</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalLikes}
                  </div>
                  <div className="text-sm text-gray-600">Total Likes</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.totalComments}
                  </div>
                  <div className="text-sm text-gray-600">Comments</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold">{user._count.followers}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold">{user._count.following}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold">{stats.avgViewsPerBlog}</div>
                  <div className="text-sm text-gray-600">Avg Views/Blog</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="text-2xl font-bold">{stats.engagementRate}%</div>
                  <div className="text-sm text-gray-600">Engagement</div>
                </div>
              </div>
            </div>

            {/* Recent Blogs */}
            {user.blogs && user.blogs.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Blogs</h2>
                <div className="space-y-3">
                  {user.blogs.map((blog: any) => (
                    <div
                      key={blog.id}
                      className="flex justify-between items-start p-3 hover:bg-gray-50 rounded"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{blog.title}</h4>
                        <div className="flex gap-3 text-sm text-gray-600 mt-1">
                          <span>{blog._count.views} views</span>
                          <span>{blog._count.likes} likes</span>
                          <span>{blog._count.comments} comments</span>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          blog.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {blog.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Role Management */}
            {currentUser?.role === 'SUPER_ADMIN' && user.id !== currentUser.id && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold mb-4">Role Management</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleUpdateRole('USER')}
                    disabled={actionLoading || user.role === 'USER'}
                    className="w-full px-4 py-2 text-left border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set as User
                  </button>
                  <button
                    onClick={() => handleUpdateRole('MODERATOR')}
                    disabled={actionLoading || user.role === 'MODERATOR'}
                    className="w-full px-4 py-2 text-left border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set as Moderator
                  </button>
                  <button
                    onClick={() => handleUpdateRole('SUPER_ADMIN')}
                    disabled={actionLoading || user.role === 'SUPER_ADMIN'}
                    className="w-full px-4 py-2 text-left border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set as Super Admin
                  </button>
                </div>
              </div>
            )}

            {/* Account Actions */}
            {user.id !== currentUser?.id && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold mb-4">Account Actions</h3>
                <div className="space-y-2">
                  {user.status === 'ACTIVE' ? (
                    <>
                      <button
                        onClick={handleSuspend}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                      >
                        Suspend User
                      </button>
                      <button
                        onClick={handleBan}
                        disabled={actionLoading}
                        className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                      >
                        Ban User
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleReinstate}
                      disabled={actionLoading}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Reinstate User
                    </button>
                  )}
                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <button
                      onClick={handleDelete}
                      disabled={actionLoading}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete User
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href={`/${user.username}`}
                  className="block px-4 py-2 text-primary-600 border border-primary-300 rounded hover:bg-primary-50 text-center"
                >
                  View Public Profile
                </Link>
              </div>
            </div>

            {/* Moderation Notes */}
            {user.receivedNotes && user.receivedNotes.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold mb-4">Moderation Notes</h3>
                <div className="space-y-3">
                  {user.receivedNotes.map((note: any) => (
                    <div key={note.id} className="text-sm border-l-2 border-yellow-400 pl-3 py-1">
                      <p className="text-gray-700">{note.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        By {note.moderator.fullName} on{' '}
                        {new Date(note.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
