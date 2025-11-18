import { Response } from 'express';
import { PrismaClient, UserRole, UserStatus, BlogStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { logAdminAction } from '../middleware/rbac.middleware';

const prisma = new PrismaClient();

// ========== DASHBOARD & ANALYTICS ==========

export const getDashboardStats = async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await AdminAnalyticsService.getPlatformStats();
    return res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getRegistrationTrend = async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const trend = await AdminAnalyticsService.getUserRegistrationTrend(days);
    return res.json({ trend });
  } catch (error) {
    console.error('Get registration trend error:', error);
    return res.status(500).json({ error: 'Failed to fetch registration trend' });
  }
};

export const getPublicationTrend = async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const trend = await AdminAnalyticsService.getBlogPublicationTrend(days);
    return res.json({ trend });
  } catch (error) {
    console.error('Get publication trend error:', error);
    return res.status(500).json({ error: 'Failed to fetch publication trend' });
  }
};

export const getEngagementTrend = async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const trend = await AdminAnalyticsService.getEngagementTrend(days);
    return res.json({ trend });
  } catch (error) {
    console.error('Get engagement trend error:', error);
    return res.status(500).json({ error: 'Failed to fetch engagement trend' });
  }
};

// ========== LEADERBOARDS ==========

export const getTopBloggers = async (req: AuthRequest, res: Response) => {
  try {
    const metric = req.query.metric as 'views' | 'likes' | 'comments' | 'engagement' || 'views';
    const limit = parseInt(req.query.limit as string) || 10;
    const days = req.query.days ? parseInt(req.query.days as string) : undefined;

    const topBloggers = await AdminAnalyticsService.getTopBloggers(metric, limit, days);
    return res.json({ topBloggers, metric });
  } catch (error) {
    console.error('Get top bloggers error:', error);
    return res.status(500).json({ error: 'Failed to fetch top bloggers' });
  }
};

export const getTopBlogs = async (req: AuthRequest, res: Response) => {
  try {
    const metric = req.query.metric as 'views' | 'likes' | 'comments' | 'trending' || 'views';
    const limit = parseInt(req.query.limit as string) || 10;
    const days = req.query.days ? parseInt(req.query.days as string) : undefined;

    const topBlogs = await AdminAnalyticsService.getTopBlogs(metric, limit, days);
    return res.json({ topBlogs, metric });
  } catch (error) {
    console.error('Get top blogs error:', error);
    return res.status(500).json({ error: 'Failed to fetch top blogs' });
  }
};

export const getRisingStars = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const risingStars = await AdminAnalyticsService.getRisingStars(limit);
    return res.json({ risingStars });
  } catch (error) {
    console.error('Get rising stars error:', error);
    return res.status(500).json({ error: 'Failed to fetch rising stars' });
  }
};

// ========== USER MANAGEMENT ==========

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as UserRole;
    const status = req.query.status as UserStatus;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) where.role = role;
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          avatar: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
          suspendedAt: true,
          suspensionReason: true,
          _count: {
            select: {
              blogs: true,
              comments: true,
              likes: true,
              followers: true,
              following: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            blogs: true,
            comments: true,
            likes: true,
            followers: true,
            following: true
          }
        },
        blogs: {
          include: {
            _count: {
              select: { views: true, likes: true, comments: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        receivedNotes: {
          include: {
            moderator: {
              select: { id: true, username: true, fullName: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate stats
    const totalViews = user.blogs.reduce((sum, blog) => sum + blog._count.views, 0);
    const totalLikes = user.blogs.reduce((sum, blog) => sum + blog._count.likes, 0);
    const totalComments = user.blogs.reduce((sum, blog) => sum + blog._count.comments, 0);
    const avgViewsPerBlog = user._count.blogs > 0 ? totalViews / user._count.blogs : 0;
    const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

    return res.json({
      user: {
        ...user,
        password: undefined, // Don't send password
        googleId: undefined
      },
      stats: {
        totalViews,
        totalLikes,
        totalComments,
        avgViewsPerBlog: Math.round(avgViewsPerBlog),
        engagementRate: Math.round(engagementRate * 100) / 100
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    return res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true
      }
    });

    await logAdminAction(
      req.user.id,
      'USER_ROLE_UPDATED',
      'USER',
      userId,
      `Role changed to ${role}`
    );

    return res.json({ user, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
};

export const suspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.SUSPENDED,
        suspendedAt: new Date(),
        suspensionReason: reason
      }
    });

    await logAdminAction(
      req.user.id,
      'USER_SUSPENDED',
      'USER',
      userId,
      reason
    );

    return res.json({ user, message: 'User suspended successfully' });
  } catch (error) {
    console.error('Suspend user error:', error);
    return res.status(500).json({ error: 'Failed to suspend user' });
  }
};

export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.BANNED,
        suspendedAt: new Date(),
        suspensionReason: reason
      }
    });

    await logAdminAction(
      req.user.id,
      'USER_BANNED',
      'USER',
      userId,
      reason
    );

    return res.json({ user, message: 'User banned successfully' });
  } catch (error) {
    console.error('Ban user error:', error);
    return res.status(500).json({ error: 'Failed to ban user' });
  }
};

export const reinstateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        suspendedAt: null,
        suspensionReason: null
      }
    });

    await logAdminAction(
      req.user.id,
      'USER_REINSTATED',
      'USER',
      userId
    );

    return res.json({ user, message: 'User reinstated successfully' });
  } catch (error) {
    console.error('Reinstate user error:', error);
    return res.status(500).json({ error: 'Failed to reinstate user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Store user info before deletion for logging
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, email: true }
    });

    await prisma.user.delete({
      where: { id: userId }
    });

    await logAdminAction(
      req.user.id,
      'USER_DELETED',
      'USER',
      userId,
      `Deleted user: ${user?.username} (${user?.email})`
    );

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ========== CONTENT MODERATION ==========

export const getAllBlogs = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as BlogStatus;
    const authorId = req.query.authorId as string;
    const isReported = req.query.isReported === 'true';
    const isFeatured = req.query.isFeatured === 'true';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) where.status = status;
    if (authorId) where.authorId = authorId;
    if (isReported) where.isReported = true;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true
            }
          },
          _count: {
            select: { views: true, likes: true, comments: true }
          },
          tags: {
            include: { tag: true }
          }
        }
      }),
      prisma.blog.count({ where })
    ]);

    return res.json({
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all blogs error:', error);
    return res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

export const adminUpdateBlog = async (req: AuthRequest, res: Response) => {
  try {
    const { blogId } = req.params;
    const { title, content, excerpt, status, isFeatured } = req.body;

    const blog = await prisma.blog.update({
      where: { id: blogId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(status && { status }),
        ...(isFeatured !== undefined && { isFeatured })
      },
      include: {
        author: {
          select: { id: true, username: true, fullName: true }
        }
      }
    });

    await logAdminAction(
      req.user.id,
      'BLOG_UPDATED',
      'BLOG',
      blogId,
      `Updated blog: ${blog.title}`
    );

    return res.json({ blog, message: 'Blog updated successfully' });
  } catch (error) {
    console.error('Admin update blog error:', error);
    return res.status(500).json({ error: 'Failed to update blog' });
  }
};

export const adminDeleteBlog = async (req: AuthRequest, res: Response) => {
  try {
    const { blogId } = req.params;

    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      select: { title: true, slug: true }
    });

    await prisma.blog.delete({
      where: { id: blogId }
    });

    await logAdminAction(
      req.user.id,
      'BLOG_DELETED',
      'BLOG',
      blogId,
      `Deleted blog: ${blog?.title}`
    );

    return res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Admin delete blog error:', error);
    return res.status(500).json({ error: 'Failed to delete blog' });
  }
};

export const toggleFeatureBlog = async (req: AuthRequest, res: Response) => {
  try {
    const { blogId } = req.params;

    const currentBlog = await prisma.blog.findUnique({
      where: { id: blogId },
      select: { isFeatured: true }
    });

    const blog = await prisma.blog.update({
      where: { id: blogId },
      data: { isFeatured: !currentBlog?.isFeatured }
    });

    await logAdminAction(
      req.user.id,
      blog.isFeatured ? 'BLOG_FEATURED' : 'BLOG_UNFEATURED',
      'BLOG',
      blogId
    );

    return res.json({ blog, message: `Blog ${blog.isFeatured ? 'featured' : 'unfeatured'} successfully` });
  } catch (error) {
    console.error('Toggle feature blog error:', error);
    return res.status(500).json({ error: 'Failed to toggle feature status' });
  }
};

// Continued in next message due to length...
