import axios from 'axios';
import * as local from './localBackend';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
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

// ---- Helper: try remote first, fall back to local ----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tryRemote(remoteFn: () => Promise<any>, localFn: () => any): Promise<any> {
  try {
    return await remoteFn();
  } catch {
    return await localFn();
  }
}

// ---- Auth ----
export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    tryRemote(
      () => api.post('/auth/register', data).then(r => r),
      async () => ({ data: await local.localRegister(data.email, data.password, data.firstName, data.lastName) })
    ),
  login: (data: { email: string; password: string }) =>
    tryRemote(
      () => api.post('/auth/login', data).then(r => r),
      async () => ({ data: await local.localLogin(data.email, data.password) })
    ),
  me: () =>
    tryRemote(
      () => api.get('/auth/me').then(r => r),
      () => {
        const user = local.localGetMe();
        if (!user) throw new Error('Not authenticated');
        return { data: user };
      }
    ),
  updateProfile: (data: Record<string, unknown>) =>
    tryRemote(
      () => api.patch('/auth/me', data).then(r => r),
      () => ({ data: local.localUpdateProfile(data) })
    ),
};

// ---- AI ----
export const aiApi = {
  chat: (data: { conversationId?: string; message: string; model?: string }) =>
    tryRemote(
      () => api.post('/ai/chat', data).then(r => r),
      async () => ({ data: await local.localChat(data) })
    ),
  conversations: () =>
    tryRemote(
      () => api.get('/ai/conversations').then(r => r),
      () => ({ data: local.localGetConversations() })
    ),
  messages: (conversationId: string) =>
    tryRemote(
      () => api.get(`/ai/conversations/${conversationId}/messages`).then(r => r),
      () => ({ data: local.localGetMessages(conversationId) })
    ),
  recommend: (data?: { context?: Record<string, unknown>; limit?: number }) =>
    tryRemote(
      () => api.post('/ai/recommendations', data || {}).then(r => r),
      () => ({ data: [] })
    ),
  predict: (data: { dataPoints: number[]; horizon: number; type: string }) =>
    tryRemote(
      () => api.post('/ai/predict', data).then(r => r),
      () => ({ data: { predictions: [], confidence: 0, summary: 'Local mode' } })
    ),
  search: (data: { query: string; context?: string }) =>
    tryRemote(
      () => api.post('/ai/search', data).then(r => r),
      () => ({ data: { enhancedQuery: data.query, keywords: data.query.split(' '), intent: 'general' } })
    ),
};

// ---- Tasks ----
export const taskApi = {
  list: (params?: Record<string, unknown>) =>
    tryRemote(
      () => api.get('/tasks', { params }).then(r => r),
      () => ({ data: local.localGetTasks(params) })
    ),
  get: (id: string) =>
    tryRemote(
      () => api.get(`/tasks/${id}`).then(r => r),
      () => ({ data: local.localGetTask(id) })
    ),
  create: (data: Record<string, unknown>) =>
    tryRemote(
      () => api.post('/tasks', data).then(r => r),
      () => ({ data: local.localCreateTask(data as { title: string; description?: string; priority?: string }) })
    ),
  update: (id: string, data: Record<string, unknown>) =>
    tryRemote(
      () => api.patch(`/tasks/${id}`, data).then(r => r),
      () => ({ data: local.localUpdateTask(id, data) })
    ),
  delete: (id: string) =>
    tryRemote(
      () => api.delete(`/tasks/${id}`).then(r => r),
      () => { local.localDeleteTask(id); return { data: null }; }
    ),
};

// ---- Analytics ----
export const analyticsApi = {
  dashboard: () =>
    tryRemote(
      () => api.get('/analytics/dashboard').then(r => r),
      () => ({ data: local.localGetDashboardMetrics() })
    ),
  timeseries: (eventType: string, days?: number) =>
    tryRemote(
      () => api.get(`/analytics/timeseries/${eventType}`, { params: { days } }).then(r => r),
      () => ({ data: [] })
    ),
  myActivity: (limit?: number) =>
    tryRemote(
      () => api.get('/analytics/my-activity', { params: { limit } }).then(r => r),
      () => ({ data: local.localGetUserActivity(limit) })
    ),
  track: (eventType: string, eventData?: Record<string, unknown>) =>
    tryRemote(
      () => api.post('/analytics/track', { eventType, eventData }).then(r => r),
      () => { local.localTrackEvent(eventType, eventData); return { data: null }; }
    ),
};

// ---- Notifications ----
export const notificationApi = {
  list: (unread?: boolean) =>
    tryRemote(
      () => api.get('/notifications', { params: { unread } }).then(r => r),
      () => ({ data: local.localGetNotifications(unread) })
    ),
  unreadCount: () =>
    tryRemote(
      () => api.get('/notifications/unread-count').then(r => r),
      () => ({ data: { count: local.localGetUnreadCount() } })
    ),
  markRead: (id: string) =>
    tryRemote(
      () => api.patch(`/notifications/${id}/read`).then(r => r),
      () => { local.localMarkNotificationRead(id); return { data: null }; }
    ),
  markAllRead: () =>
    tryRemote(
      () => api.post('/notifications/read-all').then(r => r),
      () => { local.localMarkAllRead(); return { data: null }; }
    ),
};

// ---- Gamification ----
export const gamificationApi = {
  points: () =>
    tryRemote(
      () => api.get('/gamification/points').then(r => r),
      () => ({ data: local.localGetPoints() })
    ),
  achievements: () =>
    tryRemote(
      () => api.get('/gamification/achievements').then(r => r),
      () => ({ data: local.localGetAchievements() })
    ),
  leaderboard: (limit?: number) =>
    tryRemote(
      () => api.get('/gamification/leaderboard', { params: { limit } }).then(r => r),
      () => ({ data: local.localGetLeaderboard() })
    ),
  checkAchievements: () =>
    tryRemote(
      () => api.post('/gamification/check-achievements').then(r => r),
      () => ({ data: { awarded: [] } })
    ),
};

// ---- Admin ----
export const adminApi = {
  users: (params?: Record<string, unknown>) =>
    tryRemote(
      () => api.get('/admin/users', { params }).then(r => r),
      () => ({ data: local.localGetUsers() })
    ),
  updateUser: (id: string, data: Record<string, unknown>) =>
    tryRemote(
      () => api.patch(`/admin/users/${id}`, data).then(r => r),
      () => ({ data: local.localUpdateUser(id, data) })
    ),
  metrics: () =>
    tryRemote(
      () => api.get('/admin/metrics').then(r => r),
      () => ({ data: local.localGetDashboardMetrics() })
    ),
  auditLogs: (params?: Record<string, unknown>) =>
    tryRemote(
      () => api.get('/admin/audit-logs', { params }).then(r => r),
      () => ({ data: local.localGetAuditLogs() })
    ),
  health: () =>
    tryRemote(
      () => api.get('/admin/health').then(r => r),
      () => ({ data: local.localGetHealth() })
    ),
};
