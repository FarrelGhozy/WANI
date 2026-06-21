import "dotenv/config"
import { defineConfig } from "prisma/config"

function buildDatabaseUrl(): string {
  const host = process.env.DATABASE_HOST ?? "localhost"
  const port = process.env.DATABASE_PORT ?? "5432"
  const user = process.env.DATABASE_USER ?? "postgres"
  const password = process.env.DATABASE_PASSWORD ?? ""
  const dbName = process.env.DATABASE_NAME ?? "wani_api"
  return `postgresql://${user}:${password}@${host}:${port}/${dbName}`
}

export default defineConfig({
  schema: "prisma/",
  datasource: {
    url: buildDatabaseUrl(),
  },
  migrations: {
    path: "prisma/migrations",
  },
})
