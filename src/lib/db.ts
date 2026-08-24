import { PrismaClient } from '@/generated/client'

const globalForPrisma = globalThis as unknown as {
  prisma_v4: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma_v4 ??
  new PrismaClient({
    log: ['error', 'warn']
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_v4 = db