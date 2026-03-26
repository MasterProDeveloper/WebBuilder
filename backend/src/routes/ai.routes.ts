import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as aiService from '../services/ai.service';
import { query } from '../config/database';
import { trackEvent } from '../services/analytics.service';

const router = Router();

const chatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(10000),
  model: z.string().optional(),
});

const recommendSchema = z.object({
  context: z.record(z.any()).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

const predictSchema = z.object({
  dataPoints: z.array(z.number()).min(3),
  horizon: z.number().int().min(1).max(100),
  type: z.enum(['trend', 'anomaly', 'forecast']),
});

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  context: z.string().optional(),
});

// AI Chat endpoint
router.post(
  '/chat',
  authenticate,
  validate(chatSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { conversationId, message, model } = req.body;
      const userId = req.user!.userId;

      // Create or reuse conversation
      let convId = conversationId;
      if (!convId) {
        const [conv] = await query(
          `INSERT INTO conversations (user_id, title, model)
           VALUES ($1, $2, $3) RETURNING id`,
          [userId, message.substring(0, 50), model || 'gpt-4']
        );
        convId = conv.id;
      }

      // Store user message
      await query(
        'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
        [convId, 'user', message]
      );

      // Get conversation history
      const history = await query<{ role: string; content: string }>(
        'SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at',
        [convId]
      );

      const messages: aiService.ChatMessage[] = [
        {
          role: 'system',
          content: 'You are SiteCloud AI, a helpful and intelligent assistant. Be concise, accurate, and friendly.',
        },
        ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];

      const response = await aiService.chatCompletion(messages, model);

      // Store assistant message
      await query(
        'INSERT INTO messages (conversation_id, role, content, tokens_used) VALUES ($1, $2, $3, $4)',
        [convId, 'assistant', response.content, response.tokensUsed]
      );

      await trackEvent(userId, 'ai.chat', { conversationId: convId, tokensUsed: response.tokensUsed });

      res.json({
        conversationId: convId,
        message: response.content,
        tokensUsed: response.tokensUsed,
        model: response.model,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Get conversations
router.get(
  '/conversations',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const conversations = await query(
        'SELECT * FROM conversations WHERE user_id = $1 AND is_archived = false ORDER BY updated_at DESC',
        [req.user!.userId]
      );
      res.json(conversations);
    } catch (err) {
      next(err);
    }
  }
);

// Get conversation messages
router.get(
  '/conversations/:id/messages',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const messages = await query(
        `SELECT m.* FROM messages m
         JOIN conversations c ON c.id = m.conversation_id
         WHERE m.conversation_id = $1 AND c.user_id = $2
         ORDER BY m.created_at`,
        [req.params.id, req.user!.userId]
      );
      res.json(messages);
    } catch (err) {
      next(err);
    }
  }
);

// Recommendations
router.post(
  '/recommendations',
  authenticate,
  validate(recommendSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const recommendations = await aiService.generateRecommendations({
        userId: req.user!.userId,
        context: req.body.context || {},
        limit: req.body.limit,
      });

      await trackEvent(req.user!.userId, 'ai.recommendations');
      res.json(recommendations);
    } catch (err) {
      next(err);
    }
  }
);

// Predictive analytics
router.post(
  '/predict',
  authenticate,
  validate(predictSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const prediction = await aiService.predictiveAnalysis(req.body);
      await trackEvent(req.user!.userId, 'ai.prediction', { type: req.body.type });
      res.json(prediction);
    } catch (err) {
      next(err);
    }
  }
);

// AI-enhanced search
router.post(
  '/search',
  authenticate,
  validate(searchSchema),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await aiService.enhanceSearch(req.body.query, req.body.context);
      await trackEvent(req.user!.userId, 'ai.search', { query: req.body.query });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
