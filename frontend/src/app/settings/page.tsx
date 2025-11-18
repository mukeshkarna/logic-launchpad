'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { userAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    avatar: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (user) {
      setFormData({
        fullName: user.fullName || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const response = await userAPI.updateProfile(formData);
      setUser(response.data.user);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Admin Dashboard Link */}
      {(user?.role === 'SUPER_ADMIN' || user?.role === 'MODERATOR') && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 dark:bg-purple-500 text-white p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Admin Access</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage platform users, content, and settings</p>
              </div>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors font-medium"
            >
              Go to Admin Dashboard →
            </Link>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account settings and preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Email cannot be changed</p>
            </div>

            {/* Username (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Username cannot be changed</p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                required
              />
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Tell us about yourself..."
              />
            </div>

            {/* Avatar URL */}
            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Avatar URL
              </label>
              <input
                type="url"
                id="avatar"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="https://example.com/avatar.jpg"
              />
              {formData.avatar && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                  <img
                    src={formData.avatar}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Role (read-only) */}
            {user?.role && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={user.role}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
