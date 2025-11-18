import express from 'express';
import { body, param } from 'express-validator';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin, requireSuperAdmin, auditLog } from '../middleware/rbac.middleware';

// Admin controllers
import {
  getDashboardStats,
  getRegistrationTrend,
  getPublicationTrend,
  getEngagementTrend,
  getTopBloggers,
  getTopBlogs,
  getRisingStars,
  getAllUsers,
  getUserDetails,
  updateUserRole,
  suspendUser,
  banUser,
  reinstateUser,
  deleteUser,
  getAllBlogs,
  adminUpdateBlog,
  adminDeleteBlog,
  toggleFeatureBlog
} from '../controllers/admin.controller';

import {
  getAllReports,
  resolveReport,
  dismissReport,
  createReport,
  addModerationNote,
  getModerationNotes,
  getPlatformSettings,
  updatePlatformSetting,
  deletePlatformSetting,
  getAdminActions,
  bulkDeleteBlogs,
  bulkUnpublishBlogs,
  bulkFeatureBlogs
} from '../controllers/admin-reports.controller';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ========== DASHBOARD & ANALYTICS ==========

router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/registration-trend', getRegistrationTrend);
router.get('/dashboard/publication-trend', getPublicationTrend);
router.get('/dashboard/engagement-trend', getEngagementTrend);

// ========== LEADERBOARDS ==========

router.get('/leaderboard/top-bloggers', getTopBloggers);
router.get('/leaderboard/top-blogs', getTopBlogs);
router.get('/leaderboard/rising-stars', getRisingStars);

// ========== USER MANAGEMENT ==========

router.get('/users', getAllUsers);
router.get('/users/:userId', [param('userId').isUUID()], getUserDetails);

router.put(
  '/users/:userId/role',
  requireSuperAdmin,
  [
    param('userId').isUUID(),
    body('role').isIn(['USER', 'MODERATOR', 'SUPER_ADMIN'])
  ],
  auditLog('USER_ROLE_UPDATED'),
  updateUserRole
);

router.post(
  '/users/:userId/suspend',
  [
    param('userId').isUUID(),
    body('reason').notEmpty()
  ],
  auditLog('USER_SUSPENDED'),
  suspendUser
);

router.post(
  '/users/:userId/ban',
  requireSuperAdmin,
  [
    param('userId').isUUID(),
    body('reason').notEmpty()
  ],
  auditLog('USER_BANNED'),
  banUser
);

router.post(
  '/users/:userId/reinstate',
  [param('userId').isUUID()],
  auditLog('USER_REINSTATED'),
  reinstateUser
);

router.delete(
  '/users/:userId',
  requireSuperAdmin,
  [param('userId').isUUID()],
  auditLog('USER_DELETED'),
  deleteUser
);

// ========== CONTENT MODERATION ==========

router.get('/blogs', getAllBlogs);

router.put(
  '/blogs/:blogId',
  [
    param('blogId').isUUID(),
    body('title').optional().notEmpty(),
    body('content').optional(),
    body('excerpt').optional(),
    body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
    body('isFeatured').optional().isBoolean()
  ],
  auditLog('BLOG_UPDATED'),
  adminUpdateBlog
);

router.delete(
  '/blogs/:blogId',
  [param('blogId').isUUID()],
  auditLog('BLOG_DELETED'),
  adminDeleteBlog
);

router.post(
  '/blogs/:blogId/toggle-feature',
  [param('blogId').isUUID()],
  auditLog('BLOG_FEATURED_TOGGLED'),
  toggleFeatureBlog
);

// ========== BULK OPERATIONS ==========

router.post(
  '/blogs/bulk-delete',
  [body('blogIds').isArray()],
  auditLog('BULK_BLOG_DELETE'),
  bulkDeleteBlogs
);

router.post(
  '/blogs/bulk-unpublish',
  [body('blogIds').isArray()],
  auditLog('BULK_BLOG_UNPUBLISH'),
  bulkUnpublishBlogs
);

router.post(
  '/blogs/bulk-feature',
  [
    body('blogIds').isArray(),
    body('isFeatured').isBoolean()
  ],
  auditLog('BULK_BLOG_FEATURE'),
  bulkFeatureBlogs
);

// ========== REPORTS MANAGEMENT ==========

router.get('/reports', getAllReports);

router.post(
  '/reports',
  [
    body('targetType').notEmpty(),
    body('targetId').notEmpty(),
    body('reason').notEmpty(),
    body('reportType').isIn(['SPAM', 'INAPPROPRIATE', 'HARASSMENT', 'COPYRIGHT', 'OTHER']),
    body('reportedUserId').isUUID()
  ],
  createReport
);

router.post(
  '/reports/:reportId/resolve',
  [
    param('reportId').isUUID(),
    body('resolution').notEmpty()
  ],
  auditLog('REPORT_RESOLVED'),
  resolveReport
);

router.post(
  '/reports/:reportId/dismiss',
  [param('reportId').isUUID()],
  auditLog('REPORT_DISMISSED'),
  dismissReport
);

// ========== MODERATION NOTES ==========

router.get('/notes/:targetType/:targetId', getModerationNotes);

router.post(
  '/notes',
  [
    body('targetType').notEmpty(),
    body('targetId').notEmpty(),
    body('note').notEmpty()
  ],
  auditLog('MODERATION_NOTE_ADDED'),
  addModerationNote
);

// ========== PLATFORM SETTINGS ==========

router.get('/settings', getPlatformSettings);

router.put(
  '/settings',
  requireSuperAdmin,
  [
    body('key').notEmpty(),
    body('value').notEmpty()
  ],
  auditLog('SETTINGS_UPDATED'),
  updatePlatformSetting
);

router.delete(
  '/settings/:key',
  requireSuperAdmin,
  [param('key').notEmpty()],
  auditLog('SETTING_DELETED'),
  deletePlatformSetting
);

// ========== AUDIT LOG ==========

router.get('/audit-log', getAdminActions);

export default router;
