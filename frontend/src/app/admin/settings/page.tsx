'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { adminSettingsAPI } from '@/lib/admin-api';
import toast from 'react-hot-toast';

interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // New setting form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'SUPER_ADMIN') {
        toast.error('Access denied. Super Admin privileges required.');
        router.push('/admin');
      } else {
        loadSettings();
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminSettingsAPI.getSettings();
      setSettings(response.data.settings || []);
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (setting: Setting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
    setEditDescription(setting.description || '');
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
    setEditDescription('');
  };

  const handleSaveEdit = async () => {
    if (!editingKey) return;

    try {
      await adminSettingsAPI.updateSetting(editingKey, editValue, editDescription);
      toast.success('Setting updated successfully');
      setEditingKey(null);
      setEditValue('');
      setEditDescription('');
      loadSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update setting');
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Are you sure you want to delete the setting "${key}"?`)) {
      return;
    }

    try {
      await adminSettingsAPI.deleteSetting(key);
      toast.success('Setting deleted successfully');
      loadSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete setting');
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newKey || !newValue) {
      toast.error('Key and value are required');
      return;
    }

    try {
      await adminSettingsAPI.updateSetting(newKey, newValue, newDescription);
      toast.success('Setting created successfully');
      setShowNewForm(false);
      setNewKey('');
      setNewValue('');
      setNewDescription('');
      loadSettings();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create setting');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
              <p className="text-sm text-gray-600 mt-1">
                Configure platform-wide settings and preferences
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
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
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
              <h3 className="text-sm font-medium text-blue-800">About Platform Settings</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Platform settings allow you to configure site-wide behavior and features. Common
                  settings include site name, registration options, moderation policies, and more.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add New Setting Button */}
        {!showNewForm && (
          <div className="mb-6">
            <button
              onClick={() => setShowNewForm(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add New Setting
            </button>
          </div>
        )}

        {/* New Setting Form */}
        {showNewForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Setting</h2>
            <form onSubmit={handleCreateNew}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="e.g., site_name, registration_enabled"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Setting value"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="What does this setting do?"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Create Setting
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewForm(false);
                      setNewKey('');
                      setNewValue('');
                      setNewDescription('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Settings List */}
        <div className="bg-white rounded-lg border border-gray-200">
          {settings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No settings configured yet</p>
              <button
                onClick={() => setShowNewForm(true)}
                className="text-primary-600 hover:underline"
              >
                Add your first setting
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {settings.length && settings?.map((setting) => (
                <div key={setting.id} className="p-6">
                  {editingKey === setting.key ? (
                    /* Edit Mode */
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Key
                        </label>
                        <input
                          type="text"
                          value={setting.key}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Value
                        </label>
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {setting.key}
                            </h3>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                              {setting.value}
                            </span>
                          </div>
                          {setting.description && (
                            <p className="text-sm text-gray-600 mb-2">{setting.description}</p>
                          )}
                          <div className="text-xs text-gray-500">
                            Last updated: {new Date(setting.updatedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleStartEdit(setting)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(setting.key)}
                            className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggested Settings */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Suggested Settings</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">site_name</span>
              <span className="text-gray-600">- Platform display name</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">site_description</span>
              <span className="text-gray-600">- SEO meta description</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">registration_enabled</span>
              <span className="text-gray-600">- Allow new user registrations (true/false)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                email_verification_required
              </span>
              <span className="text-gray-600">- Require email verification (true/false)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">comment_moderation</span>
              <span className="text-gray-600">
                - Comment moderation mode (auto_approve/review_all/review_first)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">max_upload_size</span>
              <span className="text-gray-600">- Maximum file upload size in bytes</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">featured_blogs_count</span>
              <span className="text-gray-600">- Number of featured blogs on homepage</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">trending_algorithm</span>
              <span className="text-gray-600">
                - Trending calculation method (views/engagement/recent)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
