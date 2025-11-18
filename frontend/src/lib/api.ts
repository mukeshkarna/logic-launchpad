import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; password: string; username: string; fullName: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  getUser: (username: string) => api.get(`/users/${username}`),
  updateProfile: (data: { fullName?: string; bio?: string; avatar?: string }) =>
    api.put('/users/profile', data),
  followUser: (userId: string) => api.post(`/users/${userId}/follow`),
  unfollowUser: (userId: string) => api.delete(`/users/${userId}/follow`),
  getFollowers: (userId: string) => api.get(`/users/${userId}/followers`),
  getFollowing: (userId: string) => api.get(`/users/${userId}/following`),
};

// Blog API
export const blogAPI = {
  getBlogs: (params?: { page?: number; limit?: number; tag?: string; search?: string }) =>
    api.get('/blogs', { params }),
  getBlog: (slug: string) => api.get(`/blogs/slug/${slug}`),
  getMyBlogs: (status?: string) => api.get('/blogs/my/all', { params: { status } }),
  getUserBlogs: (username: string) => api.get(`/blogs/user/${username}`),
  createBlog: (data: any) => api.post('/blogs', data),
  updateBlog: (id: string, data: any) => api.put(`/blogs/${id}`, data),
  deleteBlog: (id: string) => api.delete(`/blogs/${id}`),
  publishBlog: (id: string) => api.post(`/blogs/${id}/publish`),
  unpublishBlog: (id: string) => api.post(`/blogs/${id}/unpublish`),
};

// Comment API
export const commentAPI = {
  getBlogComments: (blogId: string) => api.get(`/comments/blog/${blogId}`),
  createComment: (data: { content: string; blogId: string; parentId?: string }) =>
    api.post('/comments', data),
  updateComment: (id: string, data: { content: string }) =>
    api.put(`/comments/${id}`, data),
  deleteComment: (id: string) => api.delete(`/comments/${id}`),
};

// Like API
export const likeAPI = {
  toggleLike: (blogId: string) => api.post(`/likes/blog/${blogId}`),
  getBlogLikes: (blogId: string) => api.get(`/likes/blog/${blogId}`),
};

// Upload API
export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Analytics API
export const analyticsAPI = {
  getBlogAnalytics: (blogId: string) => api.get(`/analytics/blog/${blogId}`),
  getUserAnalytics: () => api.get('/analytics/user'),
};

// Tag API
export const tagAPI = {
  getTags: () => api.get('/tags'),
  getPopularTags: (limit?: number) => api.get('/tags/popular', { params: { limit } }),
};
