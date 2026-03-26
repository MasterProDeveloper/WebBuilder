import { query } from '../config/database';

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  event_data: Record<string, any>;
  session_id: string | null;
  created_at: Date;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  completedTasks: number;
  totalConversations: number;
  totalMessages: number;
  avgTaskCompletionTime: number;
  topEvents: Array<{ event_type: string; count: number }>;
}

export async function trackEvent(
  userId: string | null,
  eventType: string,
  eventData: Record<string, any> = {},
  sessionId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await query(
    `INSERT INTO analytics_events (user_id, event_type, event_data, session_id, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, eventType, JSON.stringify(eventData), sessionId || null, ipAddress || null, userAgent || null]
  );
}

export async function recordMetric(
  name: string,
  value: number,
  tags: Record<string, string> = {}
): Promise<void> {
  await query(
    'INSERT INTO performance_metrics (metric_name, metric_value, tags) VALUES ($1, $2, $3)',
    [name, value, JSON.stringify(tags)]
  );
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [users] = await query<{ total: string; active: string }>(
    `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '30 days') as active FROM users`
  );

  const [tasks] = await query<{ total: string; completed: string }>(
    `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'completed') as completed FROM tasks`
  );

  const [convos] = await query<{ total: string }>(
    'SELECT COUNT(*) as total FROM conversations'
  );

  const [msgs] = await query<{ total: string }>(
    'SELECT COUNT(*) as total FROM messages'
  );

  const [avgTime] = await query<{ avg_hours: string }>(
    `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600), 0) as avg_hours
     FROM tasks WHERE status = 'completed' AND completed_at IS NOT NULL`
  );

  const topEvents = await query<{ event_type: string; count: string }>(
    `SELECT event_type, COUNT(*) as count FROM analytics_events
     WHERE created_at > NOW() - INTERVAL '7 days'
     GROUP BY event_type ORDER BY count DESC LIMIT 10`
  );

  return {
    totalUsers: parseInt(users.total, 10),
    activeUsers: parseInt(users.active, 10),
    totalTasks: parseInt(tasks.total, 10),
    completedTasks: parseInt(tasks.completed, 10),
    totalConversations: parseInt(convos.total, 10),
    totalMessages: parseInt(msgs.total, 10),
    avgTaskCompletionTime: parseFloat(avgTime.avg_hours),
    topEvents: topEvents.map((e) => ({ event_type: e.event_type, count: parseInt(e.count, 10) })),
  };
}

export async function getAnalyticsTimeSeries(
  eventType: string,
  days: number = 30
): Promise<Array<{ date: string; count: number }>> {
  const rows = await query<{ date: string; count: string }>(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM analytics_events
     WHERE event_type = $1 AND created_at > NOW() - INTERVAL '1 day' * $2
     GROUP BY DATE(created_at) ORDER BY date`,
    [eventType, days]
  );

  return rows.map((r) => ({ date: r.date, count: parseInt(r.count, 10) }));
}

export async function getUserActivity(
  userId: string,
  limit: number = 50
): Promise<AnalyticsEvent[]> {
  return query<AnalyticsEvent>(
    'SELECT * FROM analytics_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );
}
