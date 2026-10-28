import { describe, it, expect } from 'vitest';
import { encryptText, decryptText } from '@/lib/security/encryption';

describe('AES-256-GCM encryption utilities', () => {
  it('encrypts and decrypts text round-trip', () => {
    const secret = 'sensitive-token-value-123';
    const encrypted = encryptText(secret);

    expect(encrypted).toMatch(/^enc:v1:[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
    expect(decryptText(encrypted)).toBe(secret);
  });

  it('returns plain text as-is when not prefixed with enc:v1:', () => {
    expect(decryptText('plain-value')).toBe('plain-value');
    expect(decryptText(null)).toBeNull();
  });
});
