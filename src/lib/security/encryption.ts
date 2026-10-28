import crypto from 'crypto';

const DEFAULT_DEV_ENCRYPTION_SECRET = 'racha-dos-horriveis-encryption-key-2026-v1';

function resolveEncryptionSecret(): string {
  const configured = (process.env.ENCRYPTION_SECRET || process.env.SESSION_SECRET || '').trim();
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ENCRYPTION_SECRET or SESSION_SECRET environment variable is required in production.'
    );
  }
  return DEFAULT_DEV_ENCRYPTION_SECRET;
}

function getEncryptionKey(): Buffer {
  return crypto.createHash('sha256').update(resolveEncryptionSecret()).digest();
}

/**
 * Encrypts a plain text string using AES-256-GCM.
 * Returns formatted payload: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encryptText(plainText: string | null | undefined): string {
  if (!plainText) return plainText ?? '';
  if (plainText.startsWith('enc:v1:')) return plainText;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted text payload formatted as enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>.
 * If the input is not encrypted, returns the input string as-is.
 */
export function decryptText(cipherText: string | null | undefined): string | null {
  if (!cipherText || !cipherText.startsWith('enc:v1:')) {
    return cipherText ?? null;
  }

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 5) return cipherText;

    const [, , ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });

    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    console.warn(
      '[encryption] Failed to decrypt value; treating as missing. Check ENCRYPTION_SECRET/SESSION_SECRET.'
    );
    return null;
  }
}
