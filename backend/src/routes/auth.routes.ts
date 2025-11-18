import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  googleAuth,
  googleAuthCallback,
  getMe,
  logout
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// Local authentication
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('username').isLength({ min: 3 }).trim(),
    body('fullName').notEmpty().trim(),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  login
);

// Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

// Get current user
router.get('/me', authenticateToken, getMe);

// Logout
router.post('/logout', authenticateToken, logout);

export default router;
