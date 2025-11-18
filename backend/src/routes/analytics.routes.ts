import express from 'express';
import { param } from 'express-validator';
import { getBlogAnalytics, getUserAnalytics } from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Get analytics for a specific blog
router.get(
  '/blog/:blogId',
  authenticateToken,
  [param('blogId').isUUID()],
  getBlogAnalytics
);

// Get overall analytics for user's blogs
router.get('/user', authenticateToken, getUserAnalytics);

export default router;
