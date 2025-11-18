'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { blogAPI, likeAPI, commentAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function BlogPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [blog, setBlog] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);

  const { isAuthenticated, user } = useAuthStore();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadBlog();
    loadComments();
  }, [slug]);

  const loadBlog = async () => {
    try {
      const response = await blogAPI.getBlog(slug);
      setBlog(response.data.blog);
      setIsLiked(response.data.isLiked);
    } catch (error) {
      toast.error('Failed to load blog');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await commentAPI.getBlogComments(slug);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Failed to load comments');
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to like this blog');
      return;
    }

    try {
      const response = await likeAPI.toggleLike(blog.id);
      setIsLiked(response.data.liked);
      setBlog((prev: any) => ({
        ...prev,
        _count: {
          ...prev._count,
          likes: prev._count.likes + (response.data.liked ? 1 : -1),
        },
      }));
    } catch (error) {
      toast.error('Failed to like blog');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to comment');
      return;
    }

    if (!commentContent.trim()) return;

    try {
      await commentAPI.createComment({
        content: commentContent,
        blogId: blog.id,
      });
      setCommentContent('');
      loadComments();
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-500"></div>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {/* Title */}
      <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-gray-100">{blog.title}</h1>

      {/* Author Info */}
      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
        <Link href={`/${blog.author.username}`}>
          {blog.author.avatar ? (
            <Image
              src={`${API_URL}${blog.author.avatar}`}
              alt={blog.author.fullName}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center font-semibold text-lg">
              {blog.author.fullName.charAt(0)}
            </div>
          )}
        </Link>
        <div className="flex-1">
          <Link href={`/${blog.author.username}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">
            {blog.author.fullName}
          </Link>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(blog.publishedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
        <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>{blog._count.views} views</span>
          <span>{blog._count.likes} likes</span>
          <span>{blog._count.comments} comments</span>
        </div>
      </div>

      {/* Cover Image */}
      {blog.coverImage && (
        <div className="mb-8">
          <Image
            src={`${API_URL}${blog.coverImage}`}
            alt={blog.title}
            width={800}
            height={400}
            className="w-full rounded-lg"
          />
        </div>
      )}

      {/* Content */}
      <div
        className="prose dark:prose-invert max-w-none mb-12"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* Actions */}
      <div className="flex gap-4 py-6 border-t border-b border-gray-200 dark:border-gray-700 mb-12">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
            isLiked
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {blog._count.likes}
        </button>
      </div>

      {/* Comments Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Comments ({comments.length})
        </h2>

        {/* Comment Form */}
        {isAuthenticated ? (
          <form onSubmit={handleComment} className="mb-8">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-3 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
              rows={3}
            />
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600"
            >
              Post Comment
            </button>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">
              <Link href="/login" className="text-primary-600 dark:text-primary-400 hover:underline">
                Sign in
              </Link>{' '}
              to comment on this blog
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">{comment.author.fullName}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-6 mt-4 space-y-4">
                  {comment.replies.map((reply: any) => (
                    <div key={reply.id} className="border-l-2 border-gray-100 dark:border-gray-700 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{reply.author.fullName}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(reply.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
