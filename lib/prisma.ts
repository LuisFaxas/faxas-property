import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create PrismaClient with explicit datasource URL for Vercel
function createPrismaClient() {
  // Priority 1: Use Supabase integration variables if available
  if (process.env.POSTGRES_PRISMA_URL) {
    console.log('[Prisma] Using POSTGRES_PRISMA_URL from Supabase integration');
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.POSTGRES_PRISMA_URL
        }
      }
    });
  }

  // Priority 2: Use DATABASE_URL (works for both Vercel and local)
  if (process.env.DATABASE_URL) {
    console.log('[Prisma] Using DATABASE_URL');
    // Check if it's the old format and warn
    if (process.env.DATABASE_URL.includes('db.') && process.env.DATABASE_URL.includes('.supabase.co')) {
      console.warn('[Prisma] WARNING: Using old Supabase connection format. Update to pooler.supabase.com format!');
    }
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }

  // Default initialization
  console.log('[Prisma] Using default initialization');
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;