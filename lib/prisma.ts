import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create PrismaClient with explicit datasource URL for Vercel
function createPrismaClient() {
  // On Vercel, use the Supabase integration variables
  if (process.env.VERCEL && process.env.POSTGRES_PRISMA_URL) {
    console.log('[Prisma] Running on Vercel, using POSTGRES_PRISMA_URL with pooling');
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.POSTGRES_PRISMA_URL
        }
      }
    });
  }

  // Fallback to DATABASE_URL for local development
  if (process.env.DATABASE_URL) {
    console.log('[Prisma] Using DATABASE_URL');
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }

  // Default initialization
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;