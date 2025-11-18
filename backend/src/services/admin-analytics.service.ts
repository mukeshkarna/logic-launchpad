import { PrismaClient, BlogStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminAnalyticsService {
  // Get platform overview statistics
  static async getPlatformStats() {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const [
      totalUsers,
      usersLast30Days,
      usersLastMonth,
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      blogsLast30Days,
      totalViews,
      totalLikes,
      totalComments,
      activeUsers7Days,
      activeUsers30Days,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonth, lt: last30Days } } }),
      prisma.blog.count(),
      prisma.blog.count({ where: { status: BlogStatus.PUBLISHED, published: true } }),
      prisma.blog.count({ where: { status: BlogStatus.DRAFT } }),
      prisma.blog.count({ where: { createdAt: { gte: last30Days } } }),
      prisma.view.count(),
      prisma.like.count(),
      prisma.comment.count(),
      prisma.user.count({
        where: {
          OR: [
            { blogs: { some: { createdAt: { gte: last7Days } } } },
            { comments: { some: { createdAt: { gte: last7Days } } } },
            { likes: { some: { createdAt: { gte: last7Days } } } },
          ]
        }
      }),
      prisma.user.count({
        where: {
          OR: [
            { blogs: { some: { createdAt: { gte: last30Days } } } },
            { comments: { some: { createdAt: { gte: last30Days } } } },
            { likes: { some: { createdAt: { gte: last30Days } } } },
          ]
        }
      }),
    ]);

    // Calculate growth percentages
    const userGrowth = usersLastMonth > 0
      ? ((usersLast30Days - usersLastMonth) / usersLastMonth) * 100
      : usersLast30Days > 0 ? 100 : 0;

    return {
      users: {
        total: totalUsers,
        last30Days: usersLast30Days,
        growthPercentage: Math.round(userGrowth * 10) / 10,
        active7Days: activeUsers7Days,
        active30Days: activeUsers30Days,
      },
      blogs: {
        total: totalBlogs,
        published: publishedBlogs,
        drafts: draftBlogs,
        last30Days: blogsLast30Days,
      },
      engagement: {
        totalViews,
        totalLikes,
        totalComments,
        totalEngagement: totalLikes + totalComments,
      }
    };
  }

  // Get user registration trend data
  static async getUserRegistrationTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date
    const trendData: { [key: string]: number } = {};
    users.forEach(user => {
      const date = user.createdAt.toISOString().split('T')[0];
      trendData[date] = (trendData[date] || 0) + 1;
    });

    return Object.entries(trendData).map(([date, count]) => ({
      date,
      count
    }));
  }

  // Get blog publication trend
  static async getBlogPublicationTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const blogs = await prisma.blog.findMany({
      where: {
        publishedAt: { gte: startDate },
        status: BlogStatus.PUBLISHED
      },
      select: { publishedAt: true },
      orderBy: { publishedAt: 'asc' }
    });

    const trendData: { [key: string]: number } = {};
    blogs.forEach(blog => {
      if (blog.publishedAt) {
        const date = blog.publishedAt.toISOString().split('T')[0];
        trendData[date] = (trendData[date] || 0) + 1;
      }
    });

    return Object.entries(trendData).map(([date, count]) => ({
      date,
      count
    }));
  }

  // Get engagement trend (views, likes, comments)
  static async getEngagementTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [views, likes, comments] = await Promise.all([
      prisma.view.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true }
      }),
      prisma.like.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true }
      }),
      prisma.comment.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true }
      })
    ]);

    const trendData: { [key: string]: { views: number; likes: number; comments: number } } = {};

    views.forEach(view => {
      const date = view.createdAt.toISOString().split('T')[0];
      if (!trendData[date]) trendData[date] = { views: 0, likes: 0, comments: 0 };
      trendData[date].views++;
    });

    likes.forEach(like => {
      const date = like.createdAt.toISOString().split('T')[0];
      if (!trendData[date]) trendData[date] = { views: 0, likes: 0, comments: 0 };
      trendData[date].likes++;
    });

    comments.forEach(comment => {
      const date = comment.createdAt.toISOString().split('T')[0];
      if (!trendData[date]) trendData[date] = { views: 0, likes: 0, comments: 0 };
      trendData[date].comments++;
    });

    return Object.entries(trendData).map(([date, data]) => ({
      date,
      ...data
    }));
  }

  // Get top bloggers by various metrics
  static async getTopBloggers(metric: 'views' | 'likes' | 'comments' | 'engagement', limit: number = 10, _days?: number) {
    // const dateFilter = days ? {
    //   createdAt: {
    //     gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    //   }
    // } : {};

    let users;

    switch (metric) {
      case 'views':
        users = await prisma.user.findMany({
          where: { blogs: { some: { status: BlogStatus.PUBLISHED } } },
          include: {
            blogs: {
              where: { status: BlogStatus.PUBLISHED },
              include: {
                _count: { select: { views: true } }
              }
            },
            _count: { select: { blogs: true } }
          },
          take: limit * 3 // Get more to filter properly
        });

        return users
          .map(user => ({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            avatar: user.avatar,
            totalBlogs: user._count.blogs,
            metric: user.blogs.reduce((sum, blog) => sum + blog._count.views, 0),
            metricName: 'Total Views'
          }))
          .sort((a, b) => b.metric - a.metric)
          .slice(0, limit);

      case 'likes':
        users = await prisma.user.findMany({
          where: { blogs: { some: { status: BlogStatus.PUBLISHED } } },
          include: {
            blogs: {
              where: { status: BlogStatus.PUBLISHED },
              include: {
                _count: { select: { likes: true } }
              }
            },
            _count: { select: { blogs: true } }
          },
          take: limit * 3
        });

        return users
          .map(user => ({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            avatar: user.avatar,
            totalBlogs: user._count.blogs,
            metric: user.blogs.reduce((sum, blog) => sum + blog._count.likes, 0),
            metricName: 'Total Likes'
          }))
          .sort((a, b) => b.metric - a.metric)
          .slice(0, limit);

      case 'comments':
        users = await prisma.user.findMany({
          where: { blogs: { some: { status: BlogStatus.PUBLISHED } } },
          include: {
            blogs: {
              where: { status: BlogStatus.PUBLISHED },
              include: {
                _count: { select: { comments: true } }
              }
            },
            _count: { select: { blogs: true } }
          },
          take: limit * 3
        });

        return users
          .map(user => ({
            id: user.id,
            username: user.username,
            fullName: user.fullName,
            avatar: user.avatar,
            totalBlogs: user._count.blogs,
            metric: user.blogs.reduce((sum, blog) => sum + blog._count.comments, 0),
            metricName: 'Total Comments'
          }))
          .sort((a, b) => b.metric - a.metric)
          .slice(0, limit);

      case 'engagement':
        users = await prisma.user.findMany({
          where: { blogs: { some: { status: BlogStatus.PUBLISHED } } },
          include: {
            blogs: {
              where: { status: BlogStatus.PUBLISHED },
              include: {
                _count: {
                  select: { views: true, likes: true, comments: true }
                }
              }
            },
            _count: { select: { blogs: true } }
          },
          take: limit * 3
        });

        return users
          .map(user => {
            const totalViews = user.blogs.reduce((sum, blog) => sum + blog._count.views, 0);
            const totalLikes = user.blogs.reduce((sum, blog) => sum + blog._count.likes, 0);
            const totalComments = user.blogs.reduce((sum, blog) => sum + blog._count.comments, 0);
            const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

            return {
              id: user.id,
              username: user.username,
              fullName: user.fullName,
              avatar: user.avatar,
              totalBlogs: user._count.blogs,
              metric: Math.round(engagementRate * 100) / 100,
              metricName: 'Engagement Rate %',
              totalViews,
              totalLikes,
              totalComments
            };
          })
          .sort((a, b) => b.metric - a.metric)
          .slice(0, limit);

      default:
        return [];
    }
  }

  // Get top performing blogs
  static async getTopBlogs(metric: 'views' | 'likes' | 'comments' | 'trending', limit: number = 10, days?: number) {
    const dateFilter = days ? {
      publishedAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    } : {};

    const blogs = await prisma.blog.findMany({
      where: {
        status: BlogStatus.PUBLISHED,
        published: true,
        ...dateFilter
      },
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
        }
      },
      take: limit * 2
    });

    let sortedBlogs;

    switch (metric) {
      case 'views':
        sortedBlogs = blogs.sort((a, b) => b._count.views - a._count.views);
        break;
      case 'likes':
        sortedBlogs = blogs.sort((a, b) => b._count.likes - a._count.likes);
        break;
      case 'comments':
        sortedBlogs = blogs.sort((a, b) => b._count.comments - a._count.comments);
        break;
      case 'trending':
        // Trending score: (likes + comments * 2) / days since published
        sortedBlogs = blogs
          .map(blog => {
            const daysSincePublished = blog.publishedAt
              ? (Date.now() - blog.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
              : 1;
            const trendingScore = (blog._count.likes + blog._count.comments * 2) / Math.max(daysSincePublished, 1);
            return { ...blog, trendingScore };
          })
          .sort((a, b) => b.trendingScore - a.trendingScore);
        break;
      default:
        sortedBlogs = blogs;
    }

    return sortedBlogs.slice(0, limit).map(blog => ({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      author: blog.author,
      publishedAt: blog.publishedAt,
      views: blog._count.views,
      likes: blog._count.likes,
      comments: blog._count.comments,
      metricValue: metric === 'views' ? blog._count.views :
        metric === 'likes' ? blog._count.likes :
          metric === 'comments' ? blog._count.comments :
            (blog as any).trendingScore || 0
    }));
  }

  // Get rising star users (new users with high engagement)
  static async getRisingStars(limit: number = 10) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const newUsers = await prisma.user.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        blogs: { some: { status: BlogStatus.PUBLISHED } }
      },
      include: {
        blogs: {
          where: { status: BlogStatus.PUBLISHED },
          include: {
            _count: {
              select: { views: true, likes: true, comments: true }
            }
          }
        },
        _count: { select: { blogs: true } }
      }
    });

    return newUsers
      .map(user => {
        const totalViews = user.blogs.reduce((sum, blog) => sum + blog._count.views, 0);
        const totalLikes = user.blogs.reduce((sum, blog) => sum + blog._count.likes, 0);
        const totalComments = user.blogs.reduce((sum, blog) => sum + blog._count.comments, 0);
        const avgViewsPerBlog = user._count.blogs > 0 ? totalViews / user._count.blogs : 0;

        return {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar,
          joinedAt: user.createdAt,
          totalBlogs: user._count.blogs,
          totalViews,
          totalLikes,
          totalComments,
          avgViewsPerBlog: Math.round(avgViewsPerBlog)
        };
      })
      .filter(user => user.totalViews > 100) // Minimum threshold
      .sort((a, b) => b.avgViewsPerBlog - a.avgViewsPerBlog)
      .slice(0, limit);
  }
}
