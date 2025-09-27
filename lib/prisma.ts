import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create PrismaClient with explicit datasource URL for Vercel
function createPrismaClient() {
  // On Vercel, explicitly use the DATABASE_URL with pooling connection
  if (process.env.VERCEL && process.env.DATABASE_URL) {
    console.log('[Prisma] Running on Vercel, using DATABASE_URL with pooling');
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }

  // Default initialization for local development
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;