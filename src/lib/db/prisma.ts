import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database } from '@cloudflare/workers-types';

interface CloudflareEnvWithD1 {
  DB?: D1Database;
}

function setupLocalDatabaseEnv(): string {
  let dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim() === '') {
    dbUrl = 'file:./data/racha.db';
    process.env.DATABASE_URL = dbUrl;
  }
  return dbUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getLocalPrismaClient(): PrismaClient {
  const dbUrl = setupLocalDatabaseEnv();
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }
  return globalForPrisma.prisma;
}

/**
 * Resolves a PrismaClient instance configured for the active runtime:
 * - On Cloudflare Workers / OpenNext dev with D1 binding (`env.DB`), uses `PrismaD1` driver adapter.
 * - Otherwise (unit tests, build time, standalone scripts), falls back to the local SQLite singleton.
 */
export function getPrismaClient(): PrismaClient {
  try {
    const context = getCloudflareContext();
    const env = context?.env as CloudflareEnvWithD1 | undefined;
    if (env?.DB) {
      const adapter = new PrismaD1(env.DB);
      return new PrismaClient({ adapter });
    }
  } catch {
    // Not running inside a Cloudflare request context; fall through to local SQLite client.
  }

  return getLocalPrismaClient();
}

export const prisma = getLocalPrismaClient();
