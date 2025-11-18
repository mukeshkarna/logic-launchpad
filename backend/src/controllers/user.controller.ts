import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

// Get user by username
export const getUser = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            blogs: true,
            followers: true,
            following: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { fullName, bio, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName && { fullName }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        bio: true,
        avatar: true,
        createdAt: true,
      }
    });

    return res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Follow user
export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const followerId = req.user.id;

    if (userId === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if user exists
    const userToFollow = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    await prisma.follow.create({
      data: {
        followerId,
        followingId: userId
      }
    });

    return res.json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Follow user error:', error);
    return res.status(500).json({ error: 'Failed to follow user' });
  }
};

// Unfollow user
export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId
        }
      }
    });

    if (!follow) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    await prisma.follow.delete({
      where: { id: follow.id }
    });

    return res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    return res.status(500).json({ error: 'Failed to unfollow user' });
  }
};

// Get followers
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            bio: true,
          }
        }
      }
    });

    return res.json({ followers: followers.map(f => f.follower) });
  } catch (error) {
    console.error('Get followers error:', error);
    return res.status(500).json({ error: 'Failed to fetch followers' });
  }
};

// Get following
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            bio: true,
          }
        }
      }
    });

    return res.json({ following: following.map(f => f.following) });
  } catch (error) {
    console.error('Get following error:', error);
    return res.status(500).json({ error: 'Failed to fetch following' });
  }
};
