import { BotInstance } from "@/src/instance"
import { prisma } from "@/src/config/db"
import pino from "pino"
import pretty from "pino-pretty"
import axios from "axios"

const SYNC_INTERVAL = Number(process.env.TENANT_SYNC_INTERVAL ?? 10000)

export class BotManager {
  private instances = new Map<string, BotInstance>()
  private syncTimer: ReturnType<typeof setInterval> | null = null
  private shutdownRegistered = false
  private api = axios.create({
    baseURL: process.env.API_URL!,
    headers: { Authorization: `Bearer ${process.env.API_TOKEN}` }
  })
  private logger = pino(
    pretty({
      colorize: true,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname",
    }),
  )

  async start(): Promise<void> {
    this.logger.info("starting bot manager")
    await this.syncTenants()
    this.syncTimer = setInterval(() => this.syncTenants(), SYNC_INTERVAL)
    this.registerShutdown()
  }

  async stop(): Promise<void> {
    this.logger.info("stopping bot manager")
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
    await Promise.all(
      Array.from(this.instances.keys()).map((ownerId) => this.stopInstance(ownerId)),
    )
    try {
      await prisma.$disconnect()
    } catch (err) {
      this.logger.error({ err: String(err) }, "prisma disconnect failed")
    }
  }

  private registerShutdown(): void {
    if (this.shutdownRegistered) return
    this.shutdownRegistered = true
    const shutdown = async (signal: string) => {
      this.logger.info({ signal }, "shutting down")
      await this.stop()
      process.exit(0)
    }
    process.on("SIGINT", () => shutdown("SIGINT"))
    process.on("SIGTERM", () => shutdown("SIGTERM"))
  }

  private async syncTenants(): Promise<void> {
    try {
      const { data } = await this.api.get("/api/qr/active-tenants")
      const activeOwnerIds: string[] = data?.data?.ownerIds ?? []
      const currentOwnerIds = new Set(this.instances.keys())

      for (const ownerId of activeOwnerIds) {
        if (!currentOwnerIds.has(ownerId)) {
          await this.startInstance(ownerId)
        }
      }

      for (const ownerId of currentOwnerIds) {
        if (!activeOwnerIds.includes(ownerId)) {
          await this.stopInstance(ownerId)
        }
      }
    } catch (err) {
      this.logger.error({ err: String(err) }, "syncTenants failed")
    }
  }

  private async startInstance(ownerId: string): Promise<void> {
    this.logger.info({ ownerId }, "starting bot instance")
    const instance = new BotInstance(ownerId)
    this.instances.set(ownerId, instance)
    try {
      await instance.start()
    } catch (err) {
      this.logger.error({ ownerId, err: String(err) }, "failed to start bot instance")
      this.instances.delete(ownerId)
    }
  }

  private async stopInstance(ownerId: string): Promise<void> {
    this.logger.info({ ownerId }, "stopping bot instance")
    const instance = this.instances.get(ownerId)
    if (instance) {
      await instance.stop()
      this.instances.delete(ownerId)
    }
  }
}
