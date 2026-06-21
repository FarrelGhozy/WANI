import { PrismaClient } from "@db/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function buildDatabaseUrl(): string {
  const host = process.env.DATABASE_HOST!
  const port = process.env.DATABASE_PORT!
  const user = process.env.DATABASE_USER!
  const password = process.env.DATABASE_PASSWORD!
  const dbName = process.env.DATABASE_NAME!
  return `postgresql://${user}:${password}@${host}:${port}/${dbName}`
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: buildDatabaseUrl(),
      max: 1,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 300_000,
    }),
  })

if (import.meta.env.PROD == null) {
  globalForPrisma.prisma = prisma
}
