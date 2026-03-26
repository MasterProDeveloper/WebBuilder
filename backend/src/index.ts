import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './config/logger';
import { testConnection } from './config/database';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import aiRoutes from './routes/ai.routes';
import taskRoutes from './routes/task.routes';
import analyticsRoutes from './routes/analytics.routes';
import notificationRoutes from './routes/notification.routes';
import gamificationRoutes from './routes/gamification.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Rate limiting
app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
}));

// Body parsing & compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Request logging
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) },
}));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorHandler);

// Start server
async function start() {
  await testConnection();

  app.listen(config.port, () => {
    logger.info(`SiteCloud API running on port ${config.port} [${config.env}]`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});

export default app;
