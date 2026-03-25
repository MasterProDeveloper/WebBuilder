import { describe, it, expect } from 'vitest';
import { config } from '../config';

describe('Configuration', () => {
  it('should have default port', () => {
    expect(config.port).toBeDefined();
    expect(typeof config.port).toBe('number');
  });

  it('should have JWT configuration', () => {
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.expiresIn).toBeDefined();
  });

  it('should have database URL', () => {
    expect(config.database.url).toBeDefined();
    expect(config.database.url).toContain('postgresql');
  });

  it('should have rate limiting config', () => {
    expect(config.rateLimit.windowMs).toBeGreaterThan(0);
    expect(config.rateLimit.maxRequests).toBeGreaterThan(0);
  });
});

describe('AppError', () => {
  it('should create error with status code', async () => {
    const { AppError } = await import('../middleware/errorHandler');
    const error = new AppError('Not found', 404);
    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
  });

  it('should default to 500 status code', async () => {
    const { AppError } = await import('../middleware/errorHandler');
    const error = new AppError('Server error');
    expect(error.statusCode).toBe(500);
  });
});
