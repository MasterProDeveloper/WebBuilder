import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: Date | null;
  completed_at: Date | null;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export async function createTask(
  userId: string,
  data: { title: string; description?: string; priority?: string; due_date?: string; metadata?: Record<string, any> }
): Promise<Task> {
  const [task] = await query<Task>(
    `INSERT INTO tasks (user_id, title, description, priority, due_date, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, data.title, data.description || null, data.priority || 'medium', data.due_date || null, JSON.stringify(data.metadata || {})]
  );
  return task;
}

export async function getTasks(
  userId: string,
  filters: { status?: string; priority?: string; page?: number; limit?: number }
): Promise<{ tasks: Task[]; total: number }> {
  const conditions = ['user_id = $1'];
  const params: any[] = [userId];
  let idx = 2;

  if (filters.status) {
    conditions.push(`status = $${idx}`);
    params.push(filters.status);
    idx++;
  }

  if (filters.priority) {
    conditions.push(`priority = $${idx}`);
    params.push(filters.priority);
    idx++;
  }

  const where = conditions.join(' AND ');
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  const [countResult] = await query<{ count: string }>(`SELECT COUNT(*) as count FROM tasks WHERE ${where}`, params);
  const total = parseInt(countResult.count, 10);

  params.push(limit, offset);
  const tasks = await query<Task>(
    `SELECT * FROM tasks WHERE ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
    params
  );

  return { tasks, total };
}

export async function getTaskById(userId: string, taskId: string): Promise<Task> {
  const task = await queryOne<Task>('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
  if (!task) throw new AppError('Task not found', 404);
  return task;
}

export async function updateTask(
  userId: string,
  taskId: string,
  data: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'metadata'>>
): Promise<Task> {
  await getTaskById(userId, taskId);

  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(key === 'metadata' ? JSON.stringify(value) : value);
      idx++;
    }
  }

  if (data.status === 'completed') {
    fields.push(`completed_at = NOW()`);
  }

  values.push(taskId, userId);
  const [task] = await query<Task>(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
    values
  );

  return task;
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  await getTaskById(userId, taskId);
  await query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
}
