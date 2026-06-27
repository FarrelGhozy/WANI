import { app } from "@/src/server"
import { prisma } from "@/src/config/db"
import { logger } from "@/src/config/logger"

const port = process.env.PORT ?? "3001"

const server = app.listen(port, () => {
  logger.info(`server started on port ${port}`)
})

const shutdown = async () => {
  logger.info("shutting down...")
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
