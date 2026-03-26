/**
 * Local storage backend - provides full offline functionality
 * when the real backend API is unavailable.
 */

import { v4 } from './uuid';

// Simple UUID v4 generator (no external dependency needed)
function uuid(): string {
  return v4();
}

// ---- Storage helpers ----

function getStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStore<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---- Types ----

export interface LocalUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  preferred_language: string;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  password_hash: string;
}

export interface LocalTask {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LocalConversation {
  id: string;
  user_id: string;
  title: string;
  model: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number;
  created_at: string;
}

export interface LocalNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface LocalUserPoints {
  user_id: string;
  points: number;
  level: number;
  streak_days: number;
  last_activity_at: string | null;
}

export interface LocalAnalyticsEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

// ---- Storage Keys ----
const KEYS = {
  users: 'sc_users',
  tasks: 'sc_tasks',
  conversations: 'sc_conversations',
  messages: 'sc_messages',
  notifications: 'sc_notifications',
  userPoints: 'sc_user_points',
  events: 'sc_events',
  currentUser: 'sc_current_user',
  openaiKey: 'sc_openai_key',
};

// ---- Simple password hashing (for local mode only, not secure) ----
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'sitecloud-salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

// ---- Auth ----

export async function localRegister(email: string, password: string, firstName: string, lastName: string) {
  const users = getStore<LocalUser[]>(KEYS.users, []);
  const existing = users.find(u => u.email === email);
  if (existing) {
    throw new Error('Email already registered');
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const user: LocalUser = {
    id: uuid(),
    email,
    first_name: firstName,
    last_name: lastName,
    avatar_url: null,
    role: users.length === 0 ? 'admin' : 'user', // First user is admin
    is_active: true,
    preferred_language: 'en',
    email_verified: true,
    last_login_at: now,
    created_at: now,
    password_hash: passwordHash,
  };

  users.push(user);
  setStore(KEYS.users, users);

  // Initialize points
  const points = getStore<LocalUserPoints[]>(KEYS.userPoints, []);
  points.push({ user_id: user.id, points: 0, level: 1, streak_days: 0, last_activity_at: now });
  setStore(KEYS.userPoints, points);

  // Create welcome notification
  const notifications = getStore<LocalNotification[]>(KEYS.notifications, []);
  notifications.push({
    id: uuid(),
    user_id: user.id,
    title: 'Welcome to SiteCloud!',
    message: 'Your account has been created successfully. Start exploring all features.',
    type: 'success',
    is_read: false,
    action_url: '/dashboard',
    created_at: now,
  });
  setStore(KEYS.notifications, notifications);

  // Track event
  trackLocalEvent(user.id, 'user.registered');

  const { password_hash: _, ...safeUser } = user;
  const token = btoa(JSON.stringify({ userId: user.id, email: user.email, role: user.role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));

  return {
    user: safeUser,
    tokens: { accessToken: token, refreshToken: uuid() },
  };
}

export async function localLogin(email: string, password: string) {
  const users = getStore<LocalUser[]>(KEYS.users, []);
  const user = users.find(u => u.email === email && u.is_active);

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  user.last_login_at = new Date().toISOString();
  setStore(KEYS.users, users);

  trackLocalEvent(user.id, 'user.login');

  const { password_hash: _, ...safeUser } = user;
  const token = btoa(JSON.stringify({ userId: user.id, email: user.email, role: user.role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));

  return {
    user: safeUser,
    tokens: { accessToken: token, refreshToken: uuid() },
  };
}

export function localGetMe() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp < Date.now()) return null;

    const users = getStore<LocalUser[]>(KEYS.users, []);
    const user = users.find(u => u.id === payload.userId);
    if (!user) return null;

    const { password_hash: _, ...safeUser } = user;
    return safeUser;
  } catch {
    return null;
  }
}

export function localUpdateProfile(data: Record<string, unknown>) {
  const me = localGetMe();
  if (!me) throw new Error('Not authenticated');

  const users = getStore<LocalUser[]>(KEYS.users, []);
  const idx = users.findIndex(u => u.id === me.id);
  if (idx === -1) throw new Error('User not found');

  if (data.first_name !== undefined) users[idx].first_name = data.first_name as string;
  if (data.last_name !== undefined) users[idx].last_name = data.last_name as string;
  if (data.avatar_url !== undefined) users[idx].avatar_url = data.avatar_url as string;
  if (data.preferred_language !== undefined) users[idx].preferred_language = data.preferred_language as string;

  setStore(KEYS.users, users);
  const { password_hash: _, ...safeUser } = users[idx];
  return safeUser;
}

// ---- Helper to get current user ID ----
function getCurrentUserId(): string {
  const me = localGetMe();
  if (!me) throw new Error('Not authenticated');
  return me.id;
}

// ---- Tasks ----

export function localCreateTask(data: { title: string; description?: string; priority?: string; due_date?: string }) {
  const userId = getCurrentUserId();
  const now = new Date().toISOString();
  const task: LocalTask = {
    id: uuid(),
    user_id: userId,
    title: data.title,
    description: data.description || null,
    status: 'pending',
    priority: data.priority || 'medium',
    due_date: data.due_date || null,
    completed_at: null,
    metadata: {},
    created_at: now,
    updated_at: now,
  };

  const tasks = getStore<LocalTask[]>(KEYS.tasks, []);
  tasks.push(task);
  setStore(KEYS.tasks, tasks);

  trackLocalEvent(userId, 'task.created', { taskId: task.id });

  // Add points for creating a task
  addLocalPoints(userId, 5);

  return task;
}

export function localGetTasks(params?: Record<string, unknown>) {
  const userId = getCurrentUserId();
  let tasks = getStore<LocalTask[]>(KEYS.tasks, []).filter(t => t.user_id === userId);

  if (params?.status && params.status !== 'all') {
    tasks = tasks.filter(t => t.status === params.status);
  }
  if (params?.priority) {
    tasks = tasks.filter(t => t.priority === params.priority);
  }

  tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { tasks, total: tasks.length };
}

export function localGetTask(id: string) {
  const userId = getCurrentUserId();
  const tasks = getStore<LocalTask[]>(KEYS.tasks, []);
  const task = tasks.find(t => t.id === id && t.user_id === userId);
  if (!task) throw new Error('Task not found');
  return task;
}

export function localUpdateTask(id: string, data: Record<string, unknown>) {
  const userId = getCurrentUserId();
  const tasks = getStore<LocalTask[]>(KEYS.tasks, []);
  const idx = tasks.findIndex(t => t.id === id && t.user_id === userId);
  if (idx === -1) throw new Error('Task not found');

  const now = new Date().toISOString();
  if (data.title !== undefined) tasks[idx].title = data.title as string;
  if (data.description !== undefined) tasks[idx].description = data.description as string;
  if (data.status !== undefined) {
    tasks[idx].status = data.status as string;
    if (data.status === 'completed') {
      tasks[idx].completed_at = now;
      addLocalPoints(userId, 10);
    }
  }
  if (data.priority !== undefined) tasks[idx].priority = data.priority as string;
  if (data.due_date !== undefined) tasks[idx].due_date = data.due_date as string;
  tasks[idx].updated_at = now;

  setStore(KEYS.tasks, tasks);
  trackLocalEvent(userId, 'task.updated', { taskId: id, status: tasks[idx].status });

  return tasks[idx];
}

export function localDeleteTask(id: string) {
  const userId = getCurrentUserId();
  const tasks = getStore<LocalTask[]>(KEYS.tasks, []);
  const filtered = tasks.filter(t => !(t.id === id && t.user_id === userId));
  if (filtered.length === tasks.length) throw new Error('Task not found');
  setStore(KEYS.tasks, filtered);
  trackLocalEvent(userId, 'task.deleted', { taskId: id });
}

// ---- AI Chat ----

export function localGetConversations() {
  const userId = getCurrentUserId();
  return getStore<LocalConversation[]>(KEYS.conversations, [])
    .filter(c => c.user_id === userId && !c.is_archived)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export function localGetMessages(conversationId: string) {
  const userId = getCurrentUserId();
  const conv = getStore<LocalConversation[]>(KEYS.conversations, []).find(
    c => c.id === conversationId && c.user_id === userId
  );
  if (!conv) throw new Error('Conversation not found');

  return getStore<LocalMessage[]>(KEYS.messages, [])
    .filter(m => m.conversation_id === conversationId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export async function localChat(data: { conversationId?: string; message: string; model?: string }) {
  const userId = getCurrentUserId();
  const now = new Date().toISOString();

  let convId = data.conversationId;
  const conversations = getStore<LocalConversation[]>(KEYS.conversations, []);
  const messages = getStore<LocalMessage[]>(KEYS.messages, []);

  if (!convId) {
    const conv: LocalConversation = {
      id: uuid(),
      user_id: userId,
      title: data.message.substring(0, 50),
      model: data.model || 'gpt-4',
      is_archived: false,
      created_at: now,
      updated_at: now,
    };
    conversations.push(conv);
    convId = conv.id;
    setStore(KEYS.conversations, conversations);
  } else {
    const idx = conversations.findIndex(c => c.id === convId);
    if (idx !== -1) {
      conversations[idx].updated_at = now;
      setStore(KEYS.conversations, conversations);
    }
  }

  // Store user message
  messages.push({
    id: uuid(),
    conversation_id: convId,
    role: 'user',
    content: data.message,
    tokens_used: 0,
    created_at: now,
  });

  // Try OpenAI direct call
  const openaiKey = localStorage.getItem(KEYS.openaiKey);
  let aiResponse: string;
  let tokensUsed = 0;

  if (openaiKey) {
    try {
      const convMessages = messages
        .filter(m => m.conversation_id === convId)
        .map(m => ({ role: m.role, content: m.content }));

      const result = await callOpenAI(openaiKey, [
        { role: 'system', content: 'You are SiteCloud AI, a helpful and intelligent assistant. Be concise, accurate, and friendly.' },
        ...convMessages,
      ], data.model);

      aiResponse = result.content;
      tokensUsed = result.tokensUsed;
    } catch (err) {
      aiResponse = `I encountered an error calling OpenAI: ${(err as Error).message}. Please check your API key in Settings.`;
    }
  } else {
    aiResponse = getSmartLocalResponse(data.message);
  }

  // Store assistant message
  messages.push({
    id: uuid(),
    conversation_id: convId,
    role: 'assistant',
    content: aiResponse,
    tokens_used: tokensUsed,
    created_at: new Date().toISOString(),
  });

  setStore(KEYS.messages, messages);
  trackLocalEvent(userId, 'ai.chat', { conversationId: convId, tokensUsed });
  addLocalPoints(userId, 2);

  return {
    conversationId: convId,
    message: aiResponse,
    tokensUsed,
    model: data.model || 'gpt-4',
  };
}

async function callOpenAI(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model?: string
): Promise<{ content: string; tokensUsed: number }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  return {
    content: result.choices[0]?.message?.content || '',
    tokensUsed: result.usage?.total_tokens || 0,
  };
}

function getSmartLocalResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hello! I'm SiteCloud AI. To enable full AI capabilities with GPT-4, please add your OpenAI API key in Settings > AI Configuration. In the meantime, I can help with basic questions about the platform.";
  }
  if (lower.includes('help')) {
    return "Here's what you can do on SiteCloud:\n\n1. **Dashboard** - View your activity overview and quick stats\n2. **AI Chat** - Chat with GPT-4 (requires OpenAI API key in Settings)\n3. **Tasks** - Create, manage, and track your tasks\n4. **Analytics** - View platform usage metrics\n5. **Settings** - Configure your profile, language, and AI settings\n\nTo unlock AI features, go to Settings > AI Configuration and enter your OpenAI API key.";
  }
  if (lower.includes('task')) {
    return "You can manage tasks from the Tasks page. Create new tasks, set priorities (low, medium, high, critical), and track their status. Completing tasks earns you points!";
  }
  if (lower.includes('api key') || lower.includes('openai') || lower.includes('gpt')) {
    return "To enable AI features, go to **Settings > AI Configuration** and enter your OpenAI API key. You can get one from https://platform.openai.com/api-keys. Once configured, I'll be powered by GPT-4 and can help with anything!";
  }
  if (lower.includes('analytics') || lower.includes('stats')) {
    return "The Analytics page shows your platform metrics including task completion rates, activity tracking, and performance overview. All data is computed from your local activity.";
  }
  if (lower.includes('settings') || lower.includes('profile')) {
    return "In Settings you can:\n- Update your profile name\n- Change language (5 languages supported)\n- Configure AI settings (OpenAI API key)\n- View security information";
  }

  return "I'm running in local mode without an OpenAI API key. To get full AI capabilities with GPT-4, please add your API key in **Settings > AI Configuration**.\n\nI can still help with basic platform questions. Try asking about tasks, analytics, settings, or type 'help' for an overview.";
}

// ---- Notifications ----

export function localGetNotifications(unreadOnly = false) {
  const userId = getCurrentUserId();
  let notifications = getStore<LocalNotification[]>(KEYS.notifications, [])
    .filter(n => n.user_id === userId);

  if (unreadOnly) {
    notifications = notifications.filter(n => !n.is_read);
  }

  return notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function localGetUnreadCount() {
  const userId = getCurrentUserId();
  return getStore<LocalNotification[]>(KEYS.notifications, [])
    .filter(n => n.user_id === userId && !n.is_read).length;
}

export function localMarkNotificationRead(id: string) {
  const userId = getCurrentUserId();
  const notifications = getStore<LocalNotification[]>(KEYS.notifications, []);
  const idx = notifications.findIndex(n => n.id === id && n.user_id === userId);
  if (idx !== -1) {
    notifications[idx].is_read = true;
    setStore(KEYS.notifications, notifications);
  }
}

export function localMarkAllRead() {
  const userId = getCurrentUserId();
  const notifications = getStore<LocalNotification[]>(KEYS.notifications, []);
  notifications.forEach(n => {
    if (n.user_id === userId) n.is_read = true;
  });
  setStore(KEYS.notifications, notifications);
}

// ---- Gamification ----

export function localGetPoints() {
  const userId = getCurrentUserId();
  const points = getStore<LocalUserPoints[]>(KEYS.userPoints, []);
  return points.find(p => p.user_id === userId) || { points: 0, level: 1, streak_days: 0, last_activity_at: null };
}

function addLocalPoints(userId: string, amount: number) {
  const points = getStore<LocalUserPoints[]>(KEYS.userPoints, []);
  const idx = points.findIndex(p => p.user_id === userId);
  if (idx !== -1) {
    points[idx].points += amount;
    points[idx].level = Math.max(1, Math.floor(points[idx].points / 100) + 1);
    points[idx].last_activity_at = new Date().toISOString();

    // Update streak
    const lastActivity = points[idx].last_activity_at;
    if (lastActivity) {
      const diffHours = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
      if (diffHours < 48) {
        points[idx].streak_days = Math.max(1, points[idx].streak_days + 1);
      } else {
        points[idx].streak_days = 1;
      }
    }
    setStore(KEYS.userPoints, points);
  }
}

export function localGetAchievements() {
  return []; // No achievements earned yet in local mode
}

export function localGetLeaderboard() {
  const points = getStore<LocalUserPoints[]>(KEYS.userPoints, []);
  const users = getStore<LocalUser[]>(KEYS.users, []);

  return points
    .map(p => {
      const user = users.find(u => u.id === p.user_id);
      return {
        user_id: p.user_id,
        first_name: user?.first_name || 'Unknown',
        last_name: user?.last_name || '',
        points: p.points,
        level: p.level,
      };
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);
}

// ---- Analytics ----

function trackLocalEvent(userId: string | null, eventType: string, eventData: Record<string, unknown> = {}) {
  const events = getStore<LocalAnalyticsEvent[]>(KEYS.events, []);
  events.push({
    id: uuid(),
    user_id: userId,
    event_type: eventType,
    event_data: eventData,
    created_at: new Date().toISOString(),
  });
  // Keep only last 1000 events
  if (events.length > 1000) events.splice(0, events.length - 1000);
  setStore(KEYS.events, events);
}

export function localGetDashboardMetrics() {
  const userId = getCurrentUserId();
  const users = getStore<LocalUser[]>(KEYS.users, []);
  const tasks = getStore<LocalTask[]>(KEYS.tasks, []);
  const conversations = getStore<LocalConversation[]>(KEYS.conversations, []);
  const messages = getStore<LocalMessage[]>(KEYS.messages, []);
  const events = getStore<LocalAnalyticsEvent[]>(KEYS.events, []);

  const userTasks = tasks.filter(t => t.user_id === userId);
  const completedTasks = userTasks.filter(t => t.status === 'completed');

  // Calculate avg completion time
  let avgHours = 0;
  if (completedTasks.length > 0) {
    const totalHours = completedTasks.reduce((sum, t) => {
      if (t.completed_at) {
        return sum + (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60);
      }
      return sum;
    }, 0);
    avgHours = totalHours / completedTasks.length;
  }

  // Top events in last 7 days
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentEvents = events.filter(e => new Date(e.created_at).getTime() > weekAgo);
  const eventCounts: Record<string, number> = {};
  recentEvents.forEach(e => {
    eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
  });
  const topEvents = Object.entries(eventCounts)
    .map(([event_type, count]) => ({ event_type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
    totalTasks: userTasks.length,
    completedTasks: completedTasks.length,
    totalConversations: conversations.filter(c => c.user_id === userId).length,
    totalMessages: messages.filter(m => {
      const conv = conversations.find(c => c.id === m.conversation_id);
      return conv && conv.user_id === userId;
    }).length,
    avgTaskCompletionTime: avgHours,
    topEvents,
  };
}

export function localGetUserActivity(limit = 50) {
  const userId = getCurrentUserId();
  return getStore<LocalAnalyticsEvent[]>(KEYS.events, [])
    .filter(e => e.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function localTrackEvent(eventType: string, eventData: Record<string, unknown> = {}) {
  const userId = getCurrentUserId();
  trackLocalEvent(userId, eventType, eventData);
}

// ---- Admin ----

export function localGetUsers() {
  const users = getStore<LocalUser[]>(KEYS.users, []);
  return {
    users: users.map(({ password_hash: _, ...u }) => u),
    total: users.length,
    page: 1,
    limit: 20,
  };
}

export function localUpdateUser(id: string, data: Record<string, unknown>) {
  const users = getStore<LocalUser[]>(KEYS.users, []);
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('User not found');

  if (data.role !== undefined) users[idx].role = data.role as string;
  if (data.is_active !== undefined) users[idx].is_active = data.is_active as boolean;

  setStore(KEYS.users, users);
  const { password_hash: _, ...safeUser } = users[idx];
  return safeUser;
}

export function localGetHealth() {
  return {
    status: 'healthy',
    database: 'local-storage',
    serverTime: new Date().toISOString(),
    uptime: Math.floor((Date.now() - (parseInt(localStorage.getItem('sc_start_time') || String(Date.now()), 10))) / 1000),
    memoryUsage: { heapUsed: 0, heapTotal: 0, rss: 0 },
  };
}

export function localGetAuditLogs() {
  return getStore<LocalAnalyticsEvent[]>(KEYS.events, [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 50);
}

// ---- OpenAI key management ----

export function getOpenAIKey(): string {
  return localStorage.getItem(KEYS.openaiKey) || import.meta.env.VITE_OPENAI_API_KEY || '';
}

export function setOpenAIKey(key: string): void {
  if (key) {
    localStorage.setItem(KEYS.openaiKey, key);
  } else {
    localStorage.removeItem(KEYS.openaiKey);
  }
}

// Initialize start time for uptime tracking
if (!localStorage.getItem('sc_start_time')) {
  localStorage.setItem('sc_start_time', String(Date.now()));
}
