import { PrismaClient } from '@/generated/client'

// Hardcode the Singapore pooler URL temporarily to bypass dev server env caching
const dbUrl = "postgresql://postgres.uxukdfbqynnlkcykqozu:%40JasAdmin2026@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

// console.log('🔌 Prisma FORCED connection with Singapore host:', dbUrl.split('@')[1].split(':')[0]);

const globalForPrisma = globalThis as unknown as {
  prisma_v4: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma_v4 ??
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: dbUrl
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v4 = db