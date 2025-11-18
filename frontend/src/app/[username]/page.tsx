'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { userAPI, blogAPI } from '@/lib/api';
import BlogCard from '@/components/BlogCard';
import toast from 'react-hot-toast';

export default function UserProfilePage() {
  const params = useParams();
  const username = (params.username as string);

  const [user, setUser] = useState<any>(null);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadUserProfile();
  }, [username]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const [userRes, blogsRes] = await Promise.all([
        userAPI.getUser(username),
        blogAPI.getUserBlogs(username),
      ]);
      setUser(userRes.data.user);
      setBlogs(blogsRes.data.blogs);
    } catch (error) {
      toast.error('Failed to load user profile');
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

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Profile Header */}
      <div className="flex items-start gap-8 mb-12 pb-8 border-b">
        {user.avatar ? (
          <Image
            src={`${API_URL}${user.avatar}`}
            alt={user.fullName}
            width={120}
            height={120}
            className="rounded-full"
          />
        ) : (
          <div className="w-30 h-30 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-4xl">
            {user.fullName.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">{user.fullName}</h1>
          <p className="text-gray-600 mb-4">@{user.username}</p>
          {user.bio && <p className="text-gray-700 mb-4">{user.bio}</p>}
          <div className="flex gap-6 text-sm text-gray-600">
            <span>{user._count.blogs} Blogs</span>
            <span>{user._count.followers} Followers</span>
            <span>{user._count.following} Following</span>
          </div>
        </div>
      </div>

      {/* Blogs */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          Blogs by {user.fullName} ({blogs.length})
        </h2>
        {blogs.length === 0 ? (
          <p className="text-center text-gray-500 py-12">
            This user hasn't published any blogs yet.
          </p>
        ) : (
          <div className="space-y-8">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
