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
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.POSTGRES_PRISMA_URL
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