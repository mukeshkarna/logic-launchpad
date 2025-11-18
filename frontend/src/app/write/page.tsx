'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import TiptapEditor from '@/components/TiptapEditor';
import { blogAPI, uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [blogId, setBlogId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (editId) {
      loadBlog(editId);
    }
  }, [editId]);

  const loadBlog = async (id: string) => {
    try {
      setLoading(true);
      const response = await blogAPI.getBlog(id);
      const blog = response.data.blog;
      setTitle(blog.title);
      setContent(blog.content);
      setExcerpt(blog.excerpt || '');
      setCoverImage(blog.coverImage || '');
      setBlogId(blog.id);
      setIsPublished(blog.published);
    } catch (error) {
      toast.error('Failed to load blog');
    } finally {
      setLoading(false);
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadAPI.uploadImage(file);
      const imageUrl = response.data.url;
      setCoverImage(imageUrl);
      toast.success('Cover image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      setLoading(true);
      if (blogId) {
        await blogAPI.updateBlog(blogId, { title, content, excerpt, coverImage });
        toast.success('Draft updated');
      } else {
        const response = await blogAPI.createBlog({ title, content, excerpt, coverImage });
        setBlogId(response.data.blog.id);
        toast.success('Draft saved');
      }
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      setLoading(true);
      let currentBlogId = blogId;

      if (!currentBlogId) {
        const response = await blogAPI.createBlog({ title, content, excerpt, coverImage });
        currentBlogId = response.data.blog.id;
        setBlogId(currentBlogId);
      } else {
        await blogAPI.updateBlog(currentBlogId, { title, content, excerpt, coverImage });
      }

      await blogAPI.publishBlog(currentBlogId);
      setIsPublished(true);
      toast.success('Blog published successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to publish blog');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Actions */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => router.back()}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50"
          >
            {isPublished ? 'Update & Publish' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Cover Image */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cover Image (Optional)
        </label>
        <div className="flex gap-4 items-center">
          {coverImage && (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL}${coverImage}`}
              alt="Cover"
              className="w-32 h-32 object-cover rounded border border-gray-200 dark:border-gray-700"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverImageUpload}
            className="text-sm text-gray-700 dark:text-gray-300"
          />
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full text-4xl font-bold border-none outline-none mb-4 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600"
      />

      {/* Excerpt */}
      <textarea
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        placeholder="Write a brief excerpt (optional)..."
        className="w-full text-lg border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        rows={2}
      />

      {/* Editor */}
      <TiptapEditor
        content={content}
        onChange={setContent}
        placeholder="Tell your story..."
      />
    </div>
  );
}
