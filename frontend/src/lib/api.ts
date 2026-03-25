import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data: Record<string, any>) => api.patch('/auth/me', data),
};

// AI
export const aiApi = {
  chat: (data: { conversationId?: string; message: string; model?: string }) =>
    api.post('/ai/chat', data),
  conversations: () => api.get('/ai/conversations'),
  messages: (conversationId: string) => api.get(`/ai/conversations/${conversationId}/messages`),
  recommend: (data?: { context?: Record<string, any>; limit?: number }) =>
    api.post('/ai/recommendations', data || {}),
  predict: (data: { dataPoints: number[]; horizon: number; type: string }) =>
    api.post('/ai/predict', data),
  search: (data: { query: string; context?: string }) => api.post('/ai/search', data),
};

// Tasks
export const taskApi = {
  list: (params?: Record<string, any>) => api.get('/tasks', { params }),
  get: (id: string) => api.get(`/tasks/${id}`),
  create: (data: Record<string, any>) => api.post('/tasks', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// Analytics
export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  timeseries: (eventType: string, days?: number) =>
    api.get(`/analytics/timeseries/${eventType}`, { params: { days } }),
  myActivity: (limit?: number) => api.get('/analytics/my-activity', { params: { limit } }),
  track: (eventType: string, eventData?: Record<string, any>) =>
    api.post('/analytics/track', { eventType, eventData }),
};

// Notifications
export const notificationApi = {
  list: (unread?: boolean) => api.get('/notifications', { params: { unread } }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

// Gamification
export const gamificationApi = {
  points: () => api.get('/gamification/points'),
  achievements: () => api.get('/gamification/achievements'),
  leaderboard: (limit?: number) => api.get('/gamification/leaderboard', { params: { limit } }),
  checkAchievements: () => api.post('/gamification/check-achievements'),
};

// Admin
export const adminApi = {
  users: (params?: Record<string, any>) => api.get('/admin/users', { params }),
  updateUser: (id: string, data: Record<string, any>) => api.patch(`/admin/users/${id}`, data),
  metrics: () => api.get('/admin/metrics'),
  auditLogs: (params?: Record<string, any>) => api.get('/admin/audit-logs', { params }),
  health: () => api.get('/admin/health'),
};
