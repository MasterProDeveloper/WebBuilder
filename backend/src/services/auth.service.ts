import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  preferred_language: string;
  created_at: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<{ user: User; tokens: AuthTokens }> {
  const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);

  const [user] = await query<User>(
    `INSERT INTO users (email, password_hash, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, first_name, last_name, avatar_url, role, is_active, preferred_language, created_at`,
    [email, passwordHash, firstName, lastName]
  );

  // Initialize gamification points
  await query('INSERT INTO user_points (user_id) VALUES ($1)', [user.id]);

  const tokens = await generateTokens(user);
  return { user, tokens };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: User; tokens: AuthTokens }> {
  const row = await queryOne<User & { password_hash: string }>(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    [email]
  );

  if (!row) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [row.id]);

  const { password_hash, ...user } = row;
  const tokens = await generateTokens(user);
  return { user, tokens };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const stored = await queryOne<{ user_id: string; expires_at: Date }>(
    'SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1',
    [refreshToken]
  );

  if (!stored || new Date(stored.expires_at) < new Date()) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  await query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

  const user = await queryOne<User>(
    'SELECT id, email, first_name, last_name, avatar_url, role, is_active, preferred_language, created_at FROM users WHERE id = $1',
    [stored.user_id]
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return generateTokens(user);
}

async function generateTokens(user: User): Promise<AuthTokens> {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as string }
  );

  const refreshToken = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshToken, expiresAt]
  );

  return { accessToken, refreshToken };
}

export async function getUserById(id: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT id, email, first_name, last_name, avatar_url, role, is_active, preferred_language, created_at FROM users WHERE id = $1',
    [id]
  );
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, 'first_name' | 'last_name' | 'avatar_url' | 'preferred_language'>>
): Promise<User | null> {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  if (fields.length === 0) return getUserById(id);

  values.push(id);
  const result = await queryOne<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
     RETURNING id, email, first_name, last_name, avatar_url, role, is_active, preferred_language, created_at`,
    values
  );

  return result;
}
