import Link from 'next/link';
import Image from 'next/image';

interface BlogCardProps {
  blog: any;
}

export default function BlogCard({ blog }: BlogCardProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    <article className="border-b border-gray-200 dark:border-gray-700 pb-8">
      <Link href={`/${blog.author.username}`} className="flex items-center gap-2 mb-4">
        {blog.author.avatar ? (
          <Image
            src={`${API_URL}${blog.author.avatar}`}
            alt={blog.author.fullName}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center font-semibold">
            {blog.author.fullName.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-medium text-sm dark:text-gray-200">{blog.author.fullName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(blog.publishedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </Link>

      <Link href={`/blog/${blog.slug}`}>
        <div className="flex gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              {blog.title}
            </h2>
            {blog.excerpt && (
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{blog.excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {blog._count.views}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {blog._count.likes}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {blog._count.comments}
              </span>
            </div>
          </div>
          {blog.coverImage && (
            <div className="w-32 h-32 relative flex-shrink-0">
              <Image
                src={`${API_URL}${blog.coverImage}`}
                alt={blog.title}
                fill
                className="object-cover rounded"
              />
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
