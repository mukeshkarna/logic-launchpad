import express from 'express';
import { body, param } from 'express-validator';
import {
  getUser,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing
} from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Get user by username
router.get('/:username', getUser);

// Update profile (authenticated)
router.put(
  '/profile',
  authenticateToken,
  [
    body('fullName').optional().notEmpty().trim(),
    body('bio').optional().trim(),
    body('avatar').optional(),
  ],
  updateProfile
);

// Follow user
router.post(
  '/:userId/follow',
  authenticateToken,
  [param('userId').isUUID()],
  followUser
);

// Unfollow user
router.delete(
  '/:userId/follow',
  authenticateToken,
  [param('userId').isUUID()],
  unfollowUser
);

// Get followers
router.get('/:userId/followers', getFollowers);

// Get following
router.get('/:userId/following', getFollowing);

export default router;
