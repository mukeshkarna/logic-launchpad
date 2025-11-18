import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createBlog,
  updateBlog,
  deleteBlog,
  getBlog,
  getBlogs,
  getMyBlogs,
  getUserBlogs,
  publishBlog,
  unpublishBlog
} from '../controllers/blog.controller';
import { authenticateToken, optionalAuthentication } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes
router.get('/', optionalAuthentication, getBlogs);
router.get('/slug/:slug', optionalAuthentication, getBlog);
router.get('/user/:username', getUserBlogs);

// Protected routes
router.get('/my/all', authenticateToken, getMyBlogs);

router.post(
  '/',
  authenticateToken,
  [
    body('title').notEmpty().trim(),
    body('content').notEmpty(),
  ],
  createBlog
);

router.put(
  '/:id',
  authenticateToken,
  [
    param('id').isUUID(),
    body('title').optional().notEmpty().trim(),
    body('content').optional().notEmpty(),
  ],
  updateBlog
);

router.delete(
  '/:id',
  authenticateToken,
  [param('id').isUUID()],
  deleteBlog
);

router.post(
  '/:id/publish',
  authenticateToken,
  [param('id').isUUID()],
  publishBlog
);

router.post(
  '/:id/unpublish',
  authenticateToken,
  [param('id').isUUID()],
  unpublishBlog
);

export default router;
