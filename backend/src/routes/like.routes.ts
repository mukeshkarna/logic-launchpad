import express from 'express';
import { param } from 'express-validator';
import { toggleLike, getBlogLikes } from '../controllers/like.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Toggle like on a blog
router.post(
  '/blog/:blogId',
  authenticateToken,
  [param('blogId').isUUID()],
  toggleLike
);

// Get likes for a blog
router.get(
  '/blog/:blogId',
  [param('blogId').isUUID()],
  getBlogLikes
);

export default router;
