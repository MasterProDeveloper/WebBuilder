import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as gamificationService from '../services/gamification.service';

const router = Router();

router.get(
  '/points',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const points = await gamificationService.getUserPoints(req.user!.userId);
      res.json(points || { points: 0, level: 1, streak_days: 0 });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/achievements',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const achievements = await gamificationService.getUserAchievements(req.user!.userId);
      res.json(achievements);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/leaderboard',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const leaderboard = await gamificationService.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/check-achievements',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const awarded = await gamificationService.checkAndAwardAchievements(req.user!.userId);
      res.json({ awarded });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
