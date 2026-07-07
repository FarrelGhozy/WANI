import { BotManager } from "@/src/manager"

const manager = new BotManager()

manager.start().catch((err) => {
  console.error(err)
  process.exit(1)
})
