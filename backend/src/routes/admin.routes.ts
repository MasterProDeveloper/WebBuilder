import { Router, Response, NextFunction } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import * as analyticsService from '../services/analytics.service';

const router = Router();

// All admin routes require admin role
router.use(authenticate, authorize('admin'));

// List all users
router.get(
  '/users',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const offset = (page - 1) * limit;

      const [{ count }] = await query<{ count: string }>('SELECT COUNT(*) as count FROM users');
      const users = await query(
        `SELECT id, email, first_name, last_name, role, is_active, email_verified, last_login_at, created_at
         FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      res.json({ users, total: parseInt(count, 10), page, limit });
    } catch (err) {
      next(err);
    }
  }
);

// Update user role/status
router.patch(
  '/users/:id',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { role, is_active } = req.body;
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (role !== undefined) {
        fields.push(`role = $${idx}`);
        values.push(role);
        idx++;
      }
      if (is_active !== undefined) {
        fields.push(`is_active = $${idx}`);
        values.push(is_active);
        idx++;
      }

      if (fields.length === 0) {
        res.status(400).json({ error: 'No fields to update' });
        return;
      }

      values.push(req.params.id);
      const [user] = await query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
         RETURNING id, email, first_name, last_name, role, is_active, created_at`,
        values
      );

      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

// System metrics
router.get(
  '/metrics',
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const metrics = await analyticsService.getDashboardMetrics();
      res.json(metrics);
    } catch (err) {
      next(err);
    }
  }
);

// Audit logs
router.get(
  '/audit-logs',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '50', 10);
      const offset = (page - 1) * limit;

      const logs = await query(
        `SELECT al.*, u.email as user_email
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.user_id
         ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      res.json(logs);
    } catch (err) {
      next(err);
    }
  }
);

// System health
router.get(
  '/health',
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [dbCheck] = await query('SELECT NOW() as time');
      res.json({
        status: 'healthy',
        database: 'connected',
        serverTime: dbCheck.time,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
