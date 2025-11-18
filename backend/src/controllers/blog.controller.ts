import { Response } from 'express';
import { PrismaClient, BlogStatus } from '@prisma/client';
import { validationResult } from 'express-validator';
import slugify from 'slugify';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Create blog post
export const createBlog = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, excerpt, coverImage, tags } = req.body;
    const userId = req.user.id;

    // Generate unique slug
    let slug = slugify(title, { lower: true, strict: true });
    const existingBlog = await prisma.blog.findUnique({ where: { slug } });

    if (existingBlog) {
      slug = `${slug}-${Date.now()}`;
    }

    // Create blog
    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        coverImage,
        authorId: userId,
        status: BlogStatus.DRAFT,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true,
          }
        }
      }
    });

    // Handle tags if provided
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        let tag = await prisma.tag.findUnique({
          where: { name: tagName }
        });

        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              name: tagName,
              slug: slugify(tagName, { lower: true, strict: true })
            }
          });
        }

        await prisma.blogTag.create({
          data: {
            blogId: blog.id,
            tagId: tag.id
          }
        });
      }
    }

    return res.status(201).json({ blog });
  } catch (error) {
    console.error('Create blog error:', error);
    return res.status(500).json({ error: 'Failed to create blog' });
  }
};

// Update blog post
export const updateBlog = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, content, excerpt, coverImage, tags } = req.body;
    const userId = req.user.id;

    // Check if blog exists and user is the author
    const existingBlog = await prisma.blog.findUnique({
      where: { id }
    });

    if (!existingBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (existingBlog.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this blog' });
    }

    // Update slug if title changed
    let slug = existingBlog.slug;
    if (title && title !== existingBlog.title) {
      slug = slugify(title, { lower: true, strict: true });
      const slugExists = await prisma.blog.findFirst({
        where: { slug, id: { not: id } }
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Update blog
    const blog = await prisma.blog.update({
      where: { id },
      data: {
        ...(title && { title, slug }),
        ...(content && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(coverImage !== undefined && { coverImage }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true,
          }
        }
      }
    });

    return res.json({ blog });
  } catch (error) {
    console.error('Update blog error:', error);
    return res.status(500).json({ error: 'Failed to update blog' });
  }
};

// Delete blog post
export const deleteBlog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const blog = await prisma.blog.findUnique({
      where: { id }
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blog.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this blog' });
    }

    await prisma.blog.delete({
      where: { id }
    });

    return res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    return res.status(500).json({ error: 'Failed to delete blog' });
  }
};

// Get single blog by slug
export const getBlog = async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;

    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            bio: true,
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true,
          }
        }
      }
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Only allow viewing published blogs unless user is the author
    if (blog.status !== BlogStatus.PUBLISHED && blog.authorId !== req.user?.id) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Track view (but not for super admins, moderators, or the blog author)
    if (req.user) {
      const viewer = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true }
      });

      const shouldTrackView =
        viewer?.role !== 'SUPER_ADMIN' &&
        viewer?.role !== 'MODERATOR' &&
        blog.authorId !== req.user.id;

      if (shouldTrackView) {
        await prisma.view.create({
          data: {
            blogId: blog.id,
            userId: req.user.id,
          }
        });
      }
    } else {
      // Track anonymous views
      await prisma.view.create({
        data: {
          blogId: blog.id,
        }
      });
    }

    // Check if current user has liked the blog
    let isLiked = false;
    if (req.user) {
      const like = await prisma.like.findFirst({
        where: {
          blogId: blog.id,
          userId: req.user.id
        }
      });
      isLiked = !!like;
    }

    return res.json({ blog, isLiked });
  } catch (error) {
    console.error('Get blog error:', error);
    return res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

// Get all published blogs (with pagination and filters)
export const getBlogs = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const tag = req.query.tag as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const where: any = {
      status: BlogStatus.PUBLISHED,
      published: true
    };

    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag
          }
        }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              views: true,
            }
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
    console.error('Get blogs error:', error);
    return res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

// Get current user's blogs (including drafts)
export const getMyBlogs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const status = req.query.status as BlogStatus;

    const where: any = { authorId: userId };
    if (status) {
      where.status = status;
    }

    const blogs = await prisma.blog.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true,
          }
        }
      }
    });

    return res.json({ blogs });
  } catch (error) {
    console.error('Get my blogs error:', error);
    return res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

// Get user's published blogs by username
export const getUserBlogs = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const blogs = await prisma.blog.findMany({
      where: {
        authorId: user.id,
        status: BlogStatus.PUBLISHED,
        published: true
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true,
          }
        }
      }
    });

    return res.json({ blogs, user });
  } catch (error) {
    console.error('Get user blogs error:', error);
    return res.status(500).json({ error: 'Failed to fetch user blogs' });
  }
};

// Publish blog
export const publishBlog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const blog = await prisma.blog.findUnique({
      where: { id }
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blog.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        status: BlogStatus.PUBLISHED,
        published: true,
        publishedAt: new Date()
      }
    });

    return res.json({ blog: updatedBlog });
  } catch (error) {
    console.error('Publish blog error:', error);
    return res.status(500).json({ error: 'Failed to publish blog' });
  }
};

// Unpublish blog
export const unpublishBlog = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const blog = await prisma.blog.findUnique({
      where: { id }
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blog.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        status: BlogStatus.DRAFT,
        published: false
      }
    });

    return res.json({ blog: updatedBlog });
  } catch (error) {
    console.error('Unpublish blog error:', error);
    return res.status(500).json({ error: 'Failed to unpublish blog' });
  }
};
