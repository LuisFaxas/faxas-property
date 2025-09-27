import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Initialize Prisma Client with explicit configuration for Vercel
function createPrismaClient() {
  // Log what environment variables are available
  if (process.env.VERCEL) {
    console.log('[Prisma] Running on Vercel');
    console.log('[Prisma] POSTGRES_PRISMA_URL exists:', !!process.env.POSTGRES_PRISMA_URL);
    console.log('[Prisma] POSTGRES_URL_NON_POOLING exists:', !!process.env.POSTGRES_URL_NON_POOLING);
  }

  // If the required environment variables exist, use them explicitly
  if (process.env.POSTGRES_PRISMA_URL) {
    // Ensure the URL has pgbouncer=true and statement_cache_size=0
    let url = process.env.POSTGRES_PRISMA_URL;

    // Add pgbouncer=true if not present
    if (!url.includes('pgbouncer=true')) {
      url += url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
    }

    // Add statement_cache_size=0 to disable prepared statements
    if (!url.includes('statement_cache_size=')) {
      url += '&statement_cache_size=0';
    }

    return new PrismaClient({
      datasources: {
        db: {
          url
        }
      }
    });
  }

  // Otherwise, let Prisma use the schema configuration
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;