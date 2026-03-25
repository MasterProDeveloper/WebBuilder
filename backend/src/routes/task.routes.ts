import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as taskService from '../services/task.service';
import { trackEvent } from '../services/analytics.service';
import { checkAndAwardAchievements } from '../services/gamification.service';

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  due_date: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  due_date: z.string().datetime().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

router.post(
  '/',
  authenticate,
  validate(createTaskSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.createTask(req.user!.userId, req.body);
      await trackEvent(req.user!.userId, 'task.created', { taskId: task.id });
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await taskService.getTasks(req.user!.userId, {
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.getTaskById(req.user!.userId, req.params.id);
      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id',
  authenticate,
  validate(updateTaskSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.updateTask(req.user!.userId, req.params.id, req.body);
      await trackEvent(req.user!.userId, 'task.updated', {
        taskId: task.id,
        status: task.status,
      });

      // Check achievements when task is completed
      if (req.body.status === 'completed') {
        await checkAndAwardAchievements(req.user!.userId);
      }

      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await taskService.deleteTask(req.user!.userId, req.params.id);
      await trackEvent(req.user!.userId, 'task.deleted', { taskId: req.params.id });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
