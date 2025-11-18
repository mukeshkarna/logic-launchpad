import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Toggle like on a blog
export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { blogId } = req.params;
    const userId = req.user.id;

    // Verify blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: blogId }
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Check if user already liked the blog
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_blogId: {
          userId,
          blogId
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id }
      });

      res.json({ liked: false, message: 'Blog unliked' });
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId,
          blogId
        }
      });

      res.json({ liked: true, message: 'Blog liked' });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

// Get likes for a blog
export const getBlogLikes = async (req: Request, res: Response) => {
  try {
    const { blogId } = req.params;

    const likes = await prisma.like.findMany({
      where: { blogId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          }
        }
      }
    });

    res.json({ likes, count: likes.length });
  } catch (error) {
    console.error('Get blog likes error:', error);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
};
