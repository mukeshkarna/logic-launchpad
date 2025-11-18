import express from 'express';
import { body, param } from 'express-validator';
import {
  createComment,
  updateComment,
  deleteComment,
  getBlogComments
} from '../controllers/comment.controller';
import { authenticateToken, optionalAuthentication } from '../middleware/auth.middleware';

const router = express.Router();

// Get comments for a blog
router.get('/blog/:blogId', optionalAuthentication, getBlogComments);

// Create comment (requires authentication)
router.post(
  '/',
  authenticateToken,
  [
    body('content').notEmpty().trim(),
    body('blogId').isUUID(),
    body('parentId').optional().isUUID(),
  ],
  createComment
);

// Update comment
router.put(
  '/:id',
  authenticateToken,
  [
    param('id').isUUID(),
    body('content').notEmpty().trim(),
  ],
  updateComment
);

// Delete comment
router.delete(
  '/:id',
  authenticateToken,
  [param('id').isUUID()],
  deleteComment
);

export default router;
