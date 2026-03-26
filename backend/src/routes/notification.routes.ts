import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as notificationService from '../services/notification.service';

const router = Router();

router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const unreadOnly = req.query.unread === 'true';
      const notifications = await notificationService.getNotifications(req.user!.userId, unreadOnly);
      res.json(notifications);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/unread-count',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const count = await notificationService.getUnreadCount(req.user!.userId);
      res.json({ count });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/:id/read',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await notificationService.markAsRead(req.user!.userId, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/read-all',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await notificationService.markAllAsRead(req.user!.userId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
