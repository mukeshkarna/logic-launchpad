import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all tags
export const getTags = async (_req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { blogs: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return res.json({ tags });
  } catch (error) {
    console.error('Get tags error:', error);
    return res.status(500).json({ error: 'Failed to fetch tags' });
  }
};

// Get popular tags (most used)
export const getPopularTags = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { blogs: true }
        }
      },
      orderBy: {
        blogs: {
          _count: 'desc'
        }
      },
      take: limit
    });

    return res.json({ tags });
  } catch (error) {
    console.error('Get popular tags error:', error);
    return res.status(500).json({ error: 'Failed to fetch popular tags' });
  }
};
