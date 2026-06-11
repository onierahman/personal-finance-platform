// Server-side cryptography helpers (never import into client code).
// Provides HMAC-signed tokens, AES-256-GCM encryption-at-rest, and HTML escaping.
import crypto from 'crypto';

// A single high-entropy secret drives all derived keys. Set APP_SECRET in the
// environment (e.g. `openssl rand -base64 48`). We fail closed if it is missing.
function rootSecret(): string {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 16) {
    throw new Error('APP_SECRET is not set (or too short). Refusing to perform crypto operations.');
  }
  return s;
}

// Derive a 32-byte key scoped to a purpose so signing and encryption keys differ.
function derivedKey(purpose: string): Buffer {
  return crypto.createHmac('sha256', rootSecret()).update(purpose).digest();
}

// ── HMAC-signed tokens ───────────────────────────────────────
// Format: base64url(payloadJSON).base64url(hmac)
export function signPayload(payload: unknown, purpose = 'token'): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', derivedKey(`sign:${purpose}`)).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function verifyPayload<T = Record<string, unknown>>(token: string, purpose = 'token'): T | null {
  if (typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', derivedKey(`sign:${purpose}`)).update(body).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString()) as T;
  } catch {
    return null;
  }
}

// ── AES-256-GCM encryption at rest ───────────────────────────
// Format: v1.iv.tag.ciphertext (all base64url)
const ENC_PREFIX = 'v1';

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey('enc'), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [ENC_PREFIX, iv.toString('base64url'), tag.toString('base64url'), enc.toString('base64url')].join('.');
}

// Decrypts a value produced by encryptSecret. For backward compatibility, any
// value not in the v1 envelope format is treated as legacy plaintext and
// returned unchanged (lets existing rows keep working until re-saved).
export function decryptSecret(value: string): string {
  if (typeof value !== 'string') return value;
  const parts = value.split('.');
  if (parts.length !== 4 || parts[0] !== ENC_PREFIX) return value;
  const [, iv, tag, data] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey('enc'), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}

// ── HTML escaping for values interpolated into outbound emails ─
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}
