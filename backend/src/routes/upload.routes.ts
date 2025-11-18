import express from 'express';
import { uploadImage, uploadMiddleware } from '../controllers/upload.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Upload image
router.post(
  '/image',
  authenticateToken,
  uploadMiddleware,
  uploadImage
);

export default router;
