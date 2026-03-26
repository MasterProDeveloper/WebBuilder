import { Router, Response, NextFunction } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import * as analyticsService from '../services/analytics.service';

const router = Router();

// Dashboard metrics (admin only)
router.get(
  '/dashboard',
  authenticate,
  authorize('admin'),
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const metrics = await analyticsService.getDashboardMetrics();
      res.json(metrics);
    } catch (err) {
      next(err);
    }
  }
);

// Time series data
router.get(
  '/timeseries/:eventType',
  authenticate,
  authorize('admin'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const data = await analyticsService.getAnalyticsTimeSeries(req.params.eventType, days);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// User's own activity
router.get(
  '/my-activity',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const activity = await analyticsService.getUserActivity(req.user!.userId, limit);
      res.json(activity);
    } catch (err) {
      next(err);
    }
  }
);

// Track event
router.post(
  '/track',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await analyticsService.trackEvent(
        req.user!.userId,
        req.body.eventType,
        req.body.eventData || {},
        req.body.sessionId,
        req.ip,
        req.headers['user-agent']
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
