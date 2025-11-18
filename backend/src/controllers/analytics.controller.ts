import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Get analytics for a specific blog
export const getBlogAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { blogId } = req.params;
    const userId = req.user.id;

    // Verify blog exists and user is the author
    const blog = await prisma.blog.findUnique({
      where: { id: blogId }
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blog.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to view analytics for this blog' });
    }

    // Get analytics data
    const [viewsCount, likesCount, commentsCount, viewsOverTime] = await Promise.all([
      prisma.view.count({ where: { blogId } }),
      prisma.like.count({ where: { blogId } }),
      prisma.comment.count({ where: { blogId } }),
      prisma.view.groupBy({
        by: ['createdAt'],
        where: { blogId },
        _count: true,
        orderBy: { createdAt: 'asc' }
      })
    ]);

    // Get unique viewers
    const uniqueViewers = await prisma.view.findMany({
      where: { blogId },
      distinct: ['userId', 'ipAddress'],
      select: { userId: true }
    });

    return res.json({
      blogId,
      analytics: {
        totalViews: viewsCount,
        uniqueViews: uniqueViewers.length,
        totalLikes: likesCount,
        totalComments: commentsCount,
        viewsOverTime: viewsOverTime.map(v => ({
          date: v.createdAt,
          count: v._count
        }))
      }
    });
  } catch (error) {
    console.error('Get blog analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch blog analytics' });
  }
};

// Get overall analytics for user's blogs
export const getUserAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

    // Get user's blogs
    const blogs = await prisma.blog.findMany({
      where: { authorId: userId },
      include: {
        _count: {
          select: {
            views: true,
            likes: true,
            comments: true
          }
        }
      }
    });

    // Calculate total stats
    const totalStats = blogs.reduce(
      (acc, blog) => ({
        totalBlogs: acc.totalBlogs + 1,
        totalViews: acc.totalViews + blog._count.views,
        totalLikes: acc.totalLikes + blog._count.likes,
        totalComments: acc.totalComments + blog._count.comments,
        publishedBlogs: acc.publishedBlogs + (blog.published ? 1 : 0),
        draftBlogs: acc.draftBlogs + (!blog.published ? 1 : 0),
      }),
      {
        totalBlogs: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        publishedBlogs: 0,
        draftBlogs: 0,
      }
    );

    // Get top performing blogs
    const topBlogs = blogs
      .sort((a, b) => b._count.views - a._count.views)
      .slice(0, 5)
      .map(blog => ({
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        views: blog._count.views,
        likes: blog._count.likes,
        comments: blog._count.comments,
      }));

    return res.json({
      overview: totalStats,
      topBlogs,
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
};
