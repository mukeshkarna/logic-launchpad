import { Response } from 'express';
import { PrismaClient, ReportStatus, ReportType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { logAdminAction } from '../middleware/rbac.middleware';

const prisma = new PrismaClient();

// ========== REPORTS MANAGEMENT ==========

export const getAllReports = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as ReportStatus;
    const reportType = req.query.reportType as ReportType;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (reportType) where.reportType = reportType;

    const [reports, total] = await Promise.all([
      prisma.userReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: { id: true, username: true, fullName: true, avatar: true }
          },
          reportedUser: {
            select: { id: true, username: true, fullName: true, avatar: true }
          },
          blog: {
            select: { id: true, title: true, slug: true, status: true }
          }
        }
      }),
      prisma.userReport.count({ where })
    ]);

    return res.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const resolveReport = async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const { resolution } = req.body;

    const report = await prisma.userReport.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.RESOLVED,
        resolvedAt: new Date(),
        resolution
      },
      include: {
        reporter: { select: { username: true } },
        reportedUser: { select: { username: true } }
      }
    });

    await logAdminAction(
      req.user.id,
      'REPORT_RESOLVED',
      'REPORT',
      reportId,
      resolution
    );

    return res.json({ report, message: 'Report resolved successfully' });
  } catch (error) {
    console.error('Resolve report error:', error);
    return res.status(500).json({ error: 'Failed to resolve report' });
  }
};

export const dismissReport = async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const { reason } = req.body;

    const report = await prisma.userReport.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.DISMISSED,
        resolvedAt: new Date(),
        resolution: reason || 'Report dismissed by moderator'
      }
    });

    await logAdminAction(
      req.user.id,
      'REPORT_DISMISSED',
      'REPORT',
      reportId,
      reason
    );

    return res.json({ report, message: 'Report dismissed successfully' });
  } catch (error) {
    console.error('Dismiss report error:', error);
    return res.status(500).json({ error: 'Failed to dismiss report' });
  }
};

export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId, reason, reportType, reportedUserId, blogId } = req.body;

    const report = await prisma.userReport.create({
      data: {
        targetType,
        targetId,
        reason,
        reportType,
        reporterId: req.user.id,
        reportedUserId,
        blogId
      },
      include: {
        reporter: {
          select: { id: true, username: true, fullName: true }
        },
        reportedUser: {
          select: { id: true, username: true, fullName: true }
        }
      }
    });

    // Update blog report count if it's a blog report
    if (blogId) {
      await prisma.blog.update({
        where: { id: blogId },
        data: {
          isReported: true,
          reportCount: { increment: 1 }
        }
      });
    }

    return res.status(201).json({ report, message: 'Report created successfully' });
  } catch (error) {
    console.error('Create report error:', error);
    return res.status(500).json({ error: 'Failed to create report' });
  }
};

// ========== MODERATION NOTES ==========

export const addModerationNote = async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId, note, userId, blogId } = req.body;

    const moderationNote = await prisma.moderationNote.create({
      data: {
        targetType,
        targetId,
        note,
        moderatorId: req.user.id,
        userId,
        blogId
      },
      include: {
        moderator: {
          select: { id: true, username: true, fullName: true }
        }
      }
    });

    await logAdminAction(
      req.user.id,
      'MODERATION_NOTE_ADDED',
      targetType,
      targetId,
      note
    );

    return res.status(201).json({ moderationNote, message: 'Moderation note added successfully' });
  } catch (error) {
    console.error('Add moderation note error:', error);
    return res.status(500).json({ error: 'Failed to add moderation note' });
  }
};

export const getModerationNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId } = req.params;

    const notes = await prisma.moderationNote.findMany({
      where: {
        targetType,
        targetId
      },
      include: {
        moderator: {
          select: { id: true, username: true, fullName: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ notes });
  } catch (error) {
    console.error('Get moderation notes error:', error);
    return res.status(500).json({ error: 'Failed to fetch moderation notes' });
  }
};

// ========== PLATFORM SETTINGS ==========

export const getPlatformSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.platformSettings.findMany({
      orderBy: { key: 'asc' }
    });

    // Convert to key-value object
    const settingsObj: { [key: string]: any } = {};
    settings.forEach(setting => {
      try {
        settingsObj[setting.key] = JSON.parse(setting.value);
      } catch {
        settingsObj[setting.key] = setting.value;
      }
    });

    return res.json({ settings: settingsObj, rawSettings: settings });
  } catch (error) {
    console.error('Get platform settings error:', error);
    return res.status(500).json({ error: 'Failed to fetch platform settings' });
  }
};

export const updatePlatformSetting = async (req: AuthRequest, res: Response) => {
  try {
    const { key, value, description } = req.body;

    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);

    const setting = await prisma.platformSettings.upsert({
      where: { key },
      update: { value: valueStr, description },
      create: { key, value: valueStr, description }
    });

    await logAdminAction(
      req.user.id,
      'SETTINGS_UPDATED',
      'SETTING',
      setting.id,
      `Updated ${key} to ${valueStr}`
    );

    return res.json({ setting, message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Update platform setting error:', error);
    return res.status(500).json({ error: 'Failed to update setting' });
  }
};

export const deletePlatformSetting = async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;

    await prisma.platformSettings.delete({
      where: { key }
    });

    await logAdminAction(
      req.user.id,
      'SETTING_DELETED',
      'SETTING',
      key,
      `Deleted setting: ${key}`
    );

    return res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Delete platform setting error:', error);
    return res.status(500).json({ error: 'Failed to delete setting' });
  }
};

// ========== ADMIN ACTIONS AUDIT LOG ==========

export const getAdminActions = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const action = req.query.action as string;
    const adminId = req.query.adminId as string;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (action) where.action = action;
    if (adminId) where.adminId = adminId;

    const [actions, total] = await Promise.all([
      prisma.adminAction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { id: true, email: true, username: true, fullName: true, avatar: true, role: true }
          }
        }
      }),
      prisma.adminAction.count({ where })
    ]);

    // Transform response to match frontend expectations
    const logs = actions.map(action => ({
      id: action.id,
      action: action.action,
      performedBy: action.admin,
      targetType: action.targetType,
      targetId: action.targetId,
      details: action.details,
      ipAddress: action.ipAddress,
      createdAt: action.createdAt
    }));

    return res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get admin actions error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin actions' });
  }
};

// ========== BULK OPERATIONS ==========

export const bulkDeleteBlogs = async (req: AuthRequest, res: Response) => {
  try {
    const { blogIds } = req.body;

    if (!Array.isArray(blogIds) || blogIds.length === 0) {
      return res.status(400).json({ error: 'Invalid blog IDs' });
    }

    const result = await prisma.blog.deleteMany({
      where: { id: { in: blogIds } }
    });

    await logAdminAction(
      req.user.id,
      'BULK_BLOG_DELETE',
      'BLOG',
      undefined,
      `Deleted ${result.count} blogs`
    );

    return res.json({ message: `${result.count} blogs deleted successfully`, count: result.count });
  } catch (error) {
    console.error('Bulk delete blogs error:', error);
    return res.status(500).json({ error: 'Failed to delete blogs' });
  }
};

export const bulkUnpublishBlogs = async (req: AuthRequest, res: Response) => {
  try {
    const { blogIds } = req.body;

    if (!Array.isArray(blogIds) || blogIds.length === 0) {
      return res.status(400).json({ error: 'Invalid blog IDs' });
    }

    const result = await prisma.blog.updateMany({
      where: { id: { in: blogIds } },
      data: {
        status: 'DRAFT',
        published: false
      }
    });

    await logAdminAction(
      req.user.id,
      'BULK_BLOG_UNPUBLISH',
      'BLOG',
      undefined,
      `Unpublished ${result.count} blogs`
    );

    return res.json({ message: `${result.count} blogs unpublished successfully`, count: result.count });
  } catch (error) {
    console.error('Bulk unpublish blogs error:', error);
    return res.status(500).json({ error: 'Failed to unpublish blogs' });
  }
};

export const bulkFeatureBlogs = async (req: AuthRequest, res: Response) => {
  try {
    const { blogIds, isFeatured } = req.body;

    if (!Array.isArray(blogIds) || blogIds.length === 0) {
      return res.status(400).json({ error: 'Invalid blog IDs' });
    }

    const result = await prisma.blog.updateMany({
      where: { id: { in: blogIds } },
      data: { isFeatured: isFeatured !== false }
    });

    await logAdminAction(
      req.user.id,
      isFeatured ? 'BULK_BLOG_FEATURE' : 'BULK_BLOG_UNFEATURE',
      'BLOG',
      undefined,
      `${isFeatured ? 'Featured' : 'Unfeatured'} ${result.count} blogs`
    );

    return res.json({
      message: `${result.count} blogs ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
      count: result.count
    });
  } catch (error) {
    console.error('Bulk feature blogs error:', error);
    return res.status(500).json({ error: 'Failed to update blogs' });
  }
};
