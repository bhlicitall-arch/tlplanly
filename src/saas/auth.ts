import crypto from 'crypto';

const PBKDF2_ITERATIONS = 210_000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')): {
  salt: string;
  hash: string;
} {
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST)
    .toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actual = hashPassword(password, salt).hash;
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function assertPassword(password: string): void {
  if (!password || password.length < 8) {
    throw new Error('A senha deve ter pelo menos 8 caracteres.');
  }
}
