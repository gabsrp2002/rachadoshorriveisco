import { describe, it, expect } from 'vitest';
import {
  createSessionPayload,
  encodeSession,
  decodeSession,
  formatSessionUserTag,
} from '@/lib/auth/session';

describe('session auth utilities', () => {
  it('encodes and decodes a valid session payload', async () => {
    const payload = createSessionPayload(
      'user-1',
      'admin',
      'gabriel',
      'gabriel@example.com',
      ['MANAGE_MATCHES']
    );

    const token = await encodeSession(payload);
    const decoded = await decodeSession(token);

    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('user-1');
    expect(decoded?.role).toBe('admin');
    expect(decoded?.permissions).toEqual(['MANAGE_MATCHES']);
  });

  it('returns null for tampered or invalid tokens', async () => {
    const payload = createSessionPayload('user-1', 'player', 'player1', null);
    const token = await encodeSession(payload);

    expect(await decodeSession(`${token}tampered`)).toBeNull();
    expect(await decodeSession('invalid-token')).toBeNull();
    expect(await decodeSession('')).toBeNull();
  });

  it('formats session user tag cleanly', () => {
    const payload = createSessionPayload('u-10', 'admin', 'gabs', 'gabs@racha.com');
    expect(formatSessionUserTag(payload)).toBe('gabs@racha.com (u-10) [admin]');
    expect(formatSessionUserTag(null)).toBe('unauthenticated');
  });
});
