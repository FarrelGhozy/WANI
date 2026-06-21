import { app } from "@/src/server"
import { prisma } from "@/src/config/db"

const port = process.env.PORT ?? "3001"

const server = app.listen(port, () => {
  console.log(`API listening on :${port}`)
})

const shutdown = async () => {
  console.log("shutting down...")
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
