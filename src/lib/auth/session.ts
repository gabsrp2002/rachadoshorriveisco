import { cookies } from 'next/headers';
import type { UserRole, FunctionalPermission, SessionPayload } from '@/core/types/auth.types';

export type { SessionPayload };

export const SESSION_COOKIE_NAME = 'racha_session';
const DEFAULT_DEV_SESSION_SECRET = 'racha-dos-horriveis-dev-secret-key-2026-v1';

let cachedHmacSecret: string | null = null;
let cachedHmacKeyPromise: Promise<CryptoKey> | null = null;

function resolveSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is required in production.');
  }
  return DEFAULT_DEV_SESSION_SECRET;
}

function getHmacKey(): Promise<CryptoKey> {
  const secret = resolveSessionSecret();
  if (!cachedHmacKeyPromise || cachedHmacSecret !== secret) {
    const enc = new TextEncoder();
    cachedHmacSecret = secret;
    cachedHmacKeyPromise = crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  }
  return cachedHmacKeyPromise;
}

export async function encodeSession(payload: SessionPayload): Promise<string> {
  const jsonStr = JSON.stringify(payload);
  const base64 = Buffer.from(jsonStr).toString('base64url');

  const key = await getHmacKey();
  const signatureBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(base64));
  const signature = Buffer.from(signatureBuf).toString('base64url');

  return `${base64}.${signature}`;
}

export async function decodeSession(token: string): Promise<SessionPayload | null> {
  if (!token || !token.includes('.')) return null;

  const [base64, signature] = token.split('.');
  if (!base64 || !signature) return null;

  try {
    const key = await getHmacKey();
    const sigBuf = Buffer.from(signature, 'base64url');
    const dataBuf = new TextEncoder().encode(base64);

    const isValid = await crypto.subtle.verify('HMAC', key, sigBuf, dataBuf);
    if (!isValid) return null;

    const jsonStr = Buffer.from(base64, 'base64url').toString('utf-8');
    const payload: SessionPayload = JSON.parse(jsonStr);

    if (Date.now() > payload.exp) {
      return null;
    }

    if (!Array.isArray(payload.permissions)) {
      payload.permissions = [];
    }

    return payload;
  } catch {
    return null;
  }
}

export function createSessionPayload(
  userId: string,
  role: UserRole,
  username: string | null,
  email: string | null,
  permissions: FunctionalPermission[] = []
): SessionPayload {
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  return {
    userId,
    role,
    permissions,
    username,
    email,
    iat: now,
    exp: now + SEVEN_DAYS_MS,
  };
}

export function formatSessionUserTag(session: SessionPayload | null): string {
  if (!session) return 'unauthenticated';
  const name = session.email || session.username;
  const userTag = name ? `${name} (${session.userId})` : session.userId;
  return `${userTag} [${session.role}]`;
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!cookie || !cookie.value) return null;
    return await decodeSession(cookie.value);
  } catch {
    return null;
  }
}
