import { query, queryOne } from '../config/database';

export interface UserPoints {
  id: string;
  user_id: string;
  points: number;
  level: number;
  streak_days: number;
  last_activity_at: Date | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
}

export async function getUserPoints(userId: string): Promise<UserPoints | null> {
  return queryOne<UserPoints>('SELECT * FROM user_points WHERE user_id = $1', [userId]);
}

export async function addPoints(userId: string, points: number): Promise<UserPoints> {
  const [result] = await query<UserPoints>(
    `UPDATE user_points
     SET points = points + $2,
         level = GREATEST(1, FLOOR((points + $2) / 100) + 1),
         last_activity_at = NOW()
     WHERE user_id = $1 RETURNING *`,
    [userId, points]
  );
  return result;
}

export async function updateStreak(userId: string): Promise<number> {
  const current = await getUserPoints(userId);
  if (!current) return 0;

  const lastActivity = current.last_activity_at;
  const now = new Date();

  let newStreak = 1;
  if (lastActivity) {
    const diffHours = (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);
    if (diffHours < 48) {
      newStreak = current.streak_days + 1;
    }
  }

  await query(
    'UPDATE user_points SET streak_days = $2, last_activity_at = NOW() WHERE user_id = $1',
    [userId, newStreak]
  );

  return newStreak;
}

export async function getUserAchievements(
  userId: string
): Promise<Array<Achievement & { earned_at: Date }>> {
  return query<Achievement & { earned_at: Date }>(
    `SELECT a.*, ua.earned_at
     FROM user_achievements ua
     JOIN achievements a ON a.id = ua.achievement_id
     WHERE ua.user_id = $1
     ORDER BY ua.earned_at DESC`,
    [userId]
  );
}

export async function checkAndAwardAchievements(userId: string): Promise<Achievement[]> {
  // Get all achievements the user hasn't earned yet
  const unearned = await query<Achievement & { criteria: Record<string, any> }>(
    `SELECT a.* FROM achievements a
     WHERE a.id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = $1)`,
    [userId]
  );

  const awarded: Achievement[] = [];

  for (const achievement of unearned) {
    const earned = await evaluateCriteria(userId, achievement.criteria);
    if (earned) {
      await query(
        'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, achievement.id]
      );
      await addPoints(userId, achievement.points_reward);
      awarded.push(achievement);
    }
  }

  return awarded;
}

async function evaluateCriteria(userId: string, criteria: Record<string, any>): Promise<boolean> {
  const { type, threshold } = criteria;

  switch (type) {
    case 'login_count': {
      const result = await queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM audit_logs WHERE user_id = $1 AND action = 'login'",
        [userId]
      );
      return parseInt(result?.count || '0', 10) >= threshold;
    }
    case 'conversation_count': {
      const result = await queryOne<{ count: string }>(
        'SELECT COUNT(*) as count FROM conversations WHERE user_id = $1',
        [userId]
      );
      return parseInt(result?.count || '0', 10) >= threshold;
    }
    case 'tasks_completed': {
      const result = await queryOne<{ count: string }>(
        "SELECT COUNT(*) as count FROM tasks WHERE user_id = $1 AND status = 'completed'",
        [userId]
      );
      return parseInt(result?.count || '0', 10) >= threshold;
    }
    case 'streak_days': {
      const points = await getUserPoints(userId);
      return (points?.streak_days || 0) >= threshold;
    }
    default:
      return false;
  }
}

export async function getLeaderboard(
  limit: number = 10
): Promise<Array<{ user_id: string; first_name: string; last_name: string; points: number; level: number }>> {
  return query(
    `SELECT up.user_id, u.first_name, u.last_name, up.points, up.level
     FROM user_points up
     JOIN users u ON u.id = up.user_id
     ORDER BY up.points DESC LIMIT $1`,
    [limit]
  );
}
