import { api } from './api';

// ========== DASHBOARD & ANALYTICS ==========

export const adminDashboardAPI = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getRegistrationTrend: (days?: number) =>
    api.get('/admin/dashboard/registration-trend', { params: { days } }),
  getPublicationTrend: (days?: number) =>
    api.get('/admin/dashboard/publication-trend', { params: { days } }),
  getEngagementTrend: (days?: number) =>
    api.get('/admin/dashboard/engagement-trend', { params: { days } }),
};

// ========== LEADERBOARDS ==========

export const adminLeaderboardAPI = {
  getTopBloggers: (metric: string, limit?: number, days?: number) =>
    api.get('/admin/leaderboard/top-bloggers', { params: { metric, limit, days } }),
  getTopBlogs: (metric: string, limit?: number, days?: number) =>
    api.get('/admin/leaderboard/top-blogs', { params: { metric, limit, days } }),
  getRisingStars: (limit?: number) =>
    api.get('/admin/leaderboard/rising-stars', { params: { limit } }),
};

// ========== USER MANAGEMENT ==========

export const adminUserAPI = {
  getAllUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get('/admin/users', { params }),
  getUserDetails: (userId: string) => api.get(`/admin/users/${userId}`),
  updateUserRole: (userId: string, role: string) =>
    api.put(`/admin/users/${userId}/role`, { role }),
  suspendUser: (userId: string, reason: string) =>
    api.post(`/admin/users/${userId}/suspend`, { reason }),
  banUser: (userId: string, reason: string) =>
    api.post(`/admin/users/${userId}/ban`, { reason }),
  reinstateUser: (userId: string) => api.post(`/admin/users/${userId}/reinstate`),
  deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
};

// ========== CONTENT MODERATION ==========

export const adminContentAPI = {
  getAllBlogs: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    authorId?: string;
    isReported?: boolean;
    isFeatured?: boolean;
  }) => api.get('/admin/blogs', { params }),
  updateBlog: (blogId: string, data: any) => api.put(`/admin/blogs/${blogId}`, data),
  deleteBlog: (blogId: string) => api.delete(`/admin/blogs/${blogId}`),
  toggleFeature: (blogId: string) => api.post(`/admin/blogs/${blogId}/toggle-feature`),
  bulkDelete: (blogIds: string[]) => api.post('/admin/blogs/bulk-delete', { blogIds }),
  bulkUnpublish: (blogIds: string[]) => api.post('/admin/blogs/bulk-unpublish', { blogIds }),
  bulkFeature: (blogIds: string[], isFeatured: boolean) =>
    api.post('/admin/blogs/bulk-feature', { blogIds, isFeatured }),
};

// ========== REPORTS MANAGEMENT ==========

export const adminReportAPI = {
  getAllReports: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    reportType?: string;
  }) => api.get('/admin/reports', { params }),
  createReport: (data: {
    targetType: string;
    targetId: string;
    reason: string;
    reportType: string;
    reportedUserId: string;
    blogId?: string;
  }) => api.post('/admin/reports', data),
  resolveReport: (reportId: string, resolution: string) =>
    api.post(`/admin/reports/${reportId}/resolve`, { resolution }),
  dismissReport: (reportId: string, reason?: string) =>
    api.post(`/admin/reports/${reportId}/dismiss`, { reason }),
};

// ========== MODERATION NOTES ==========

export const adminNoteAPI = {
  getNotes: (targetType: string, targetId: string) =>
    api.get(`/admin/notes/${targetType}/${targetId}`),
  addNote: (data: {
    targetType: string;
    targetId: string;
    note: string;
    userId?: string;
    blogId?: string;
  }) => api.post('/admin/notes', data),
};

// ========== PLATFORM SETTINGS ==========

export const adminSettingsAPI = {
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key: string, value: any, description?: string) =>
    api.put('/admin/settings', { key, value, description }),
  deleteSetting: (key: string) => api.delete(`/admin/settings/${key}`),
};

// ========== AUDIT LOG ==========

export const adminAuditAPI = {
  getActions: (params?: { page?: number; limit?: number; action?: string; adminId?: string }) =>
    api.get('/admin/audit-log', { params }),
};
