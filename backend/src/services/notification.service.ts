import { query, queryOne } from '../config/database';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  action_url: string | null;
  created_at: Date;
}

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: Notification['type'] = 'info',
  actionUrl?: string
): Promise<Notification> {
  const [notification] = await query<Notification>(
    `INSERT INTO notifications (user_id, title, message, type, action_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, title, message, type, actionUrl || null]
  );
  return notification;
}

export async function getNotifications(
  userId: string,
  unreadOnly: boolean = false,
  limit: number = 50
): Promise<Notification[]> {
  const where = unreadOnly
    ? 'user_id = $1 AND is_read = false'
    : 'user_id = $1';

  return query<Notification>(
    `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
}

export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  await query(
    'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
    [notificationId, userId]
  );
}

export async function markAllAsRead(userId: string): Promise<void> {
  await query(
    'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
    [userId]
  );
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  return parseInt(result?.count || '0', 10);
}
