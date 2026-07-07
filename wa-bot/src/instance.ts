import { makeWASocket, Browsers } from "baileys"
import type { WASocket } from "baileys"
import pino from "pino"
import pretty from "pino-pretty"
import qrcode from "qrcode-terminal"
import axios from "axios"
import { prisma } from "@/src/config/db"
import { usePrismaAuthState } from "@/src/services/whatsapp-auth"

export class BotInstance {
  private ownerId: string
  private sock: WASocket | null = null
  private connected = false
  private wsAlive = false
  private reconnectAttempts = 0
  private isReconnecting = false
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private pollErrors = 0
  private isResetRestart = false
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

  constructor(ownerId: string) {
    this.ownerId = ownerId
    this.logger = this.logger.child({ ownerId })
  }

  async start(): Promise<void> {
    if (this.isResetRestart) {
      await prisma.creds.deleteMany({ where: { ownerId: this.ownerId, id: "pairing" } })
      await prisma.signalKey.deleteMany({ where: { ownerId: this.ownerId } })
      this.isResetRestart = false
    }

    const { state, saveCreds } = await usePrismaAuthState(prisma, this.ownerId)

    if (this.pollTimer) clearInterval(this.pollTimer)
    this.sock?.end(undefined)

    this.sock = makeWASocket({
      auth: state,
      logger: this.logger,
      browser: Browsers.ubuntu("Firefox"),
      shouldSyncHistoryMessage: () => false,
    })

    this.sock.ev.on("creds.update", saveCreds)
    this.sock.ev.on("connection.update", (update) => this.handleConnectionUpdate(update, state, saveCreds))
    this.sock.ev.on("messages.upsert", (data) => this.handleMessagesUpsert(data))

    const POLL_INTERVAL = Number(process.env.OUTGOING_POLL_INTERVAL ?? 3000)
    this.pollTimer = setInterval(() => this.pollOutgoing(), POLL_INTERVAL)
  }

  async stop(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    this.sock?.end(undefined)
  }

  private async handleConnectionUpdate(
    update: any,
    state: any,
    saveCreds: () => Promise<void>,
  ): Promise<void> {
    this.wsAlive = true
    const { connection, lastDisconnect, qr, receivedPendingNotifications } = update

    const sockUser = this.sock?.user
      ? { id: this.sock.user.id, phoneNumber: this.sock.user.phoneNumber, lid: this.sock.user.lid, name: this.sock.user.name }
      : null
    const credsMe = state.creds.me
      ? { id: state.creds.me.id, phoneNumber: state.creds.me.phoneNumber, lid: state.creds.me.lid }
      : null
    this.logger.info({ connection, hasQr: !!qr, receivedPendingNotifications, updateKeys: Object.keys(update), sockUser, credsMe }, "connection update")

    if (qr) {
      this.logger.info("QR code received")
      qrcode.generate(qr, { small: true })
      this.api.post("/api/qr/bot", { ownerId: this.ownerId, qr })
        .catch(e => this.logger.error({ err: e?.response?.data ?? e }, "push QR failed"))
      await this.checkAndGeneratePairingCode()
    }

    if (connection === "open" || receivedPendingNotifications) {
      this.reconnectAttempts = 0
      this.isReconnecting = false
      this.connected = true
      const id = this.sock?.user?.id ?? state.creds.me?.id ?? ""
      const phoneNumber = id.split(":")[0]?.replace(/[^0-9]/g, "") || null
      this.logger.info({ connection, receivedPendingNotifications, phoneNumber }, "connected")
      this.api.delete(`/api/qr/bot/${this.ownerId}`)
        .catch(e => this.logger.error({ err: e?.response?.data ?? e }, "clear QR failed"))
      const payload: Record<string, string> = { ownerId: this.ownerId, status: "connected" }
      if (phoneNumber) payload.phone = phoneNumber
      this.api.post("/api/qr/bot", payload)
        .catch(e => this.logger.error({ err: e?.response?.data ?? e }, "status update failed"))
    }

    if (connection === "close") {
      this.wsAlive = false
      this.connected = false
      const reason = lastDisconnect?.error?.message ?? lastDisconnect?.error?.toString() ?? "unknown"
      const loggedOut = reason.includes("logged out")
      this.logger.info({ loggedOut, reason }, "connection closed")
      const statusPayload = loggedOut ? "disconnected" : "reconnecting"
      this.api.post("/api/qr/bot", { ownerId: this.ownerId, status: statusPayload })
        .catch(e => this.logger.error({ err: e?.response?.data ?? e }, "disconnect status failed"))
      if (!loggedOut && !this.isReconnecting) {
        this.isReconnecting = true
        if (this.reconnectAttempts >= 10) {
          this.logger.error("max reconnect attempts reached")
          return
        }
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
        this.reconnectAttempts++
        this.logger.info({ attempt: this.reconnectAttempts, delay }, "reconnecting...")
        if (this.pollTimer) clearInterval(this.pollTimer)
        this.sock?.end(undefined)
        this.reconnectTimer = setTimeout(() => {
          this.start().finally(() => { this.isReconnecting = false })
        }, delay)
      }
    }
  }

  private async handleMessagesUpsert({ messages, type }: any): Promise<void> {
    if (type !== "notify") return

    for (const msg of messages) {
      if (msg.key.fromMe || !msg.message || !msg.key.remoteJid) continue

      const jid = msg.key.remoteJidAlt ?? msg.key.remoteJid
      if (!jid.endsWith("@s.whatsapp.net")) continue

      const text = msg.message.conversation ?? msg.message.extendedTextMessage?.text ?? ""
      if (!text) continue

      const phone = jid.replace(/[^0-9]/g, "")
      const pushName = msg.pushName || phone

      this.logger.info({ phone, text, pushName }, "message received")

      try {
        const { data } = await this.api.post("/api/chat", {
          ownerId: this.ownerId,
          phone,
          name: pushName,
          text,
          waMsgId: msg.key.id,
        })
        const reply = data?.data?.reply
        const qrisUrl = data?.data?.qrisImageUrl
        if (reply) {
          if (qrisUrl) {
            const fullUrl = `${process.env.API_URL?.replace(/\/$/, "")}${qrisUrl}`
            try {
              await this.sock?.sendMessage(jid, { image: { url: fullUrl }, caption: reply })
            } catch {
              await this.sock?.sendMessage(jid, { text: reply })
            }
          } else {
            await this.sock?.sendMessage(jid, { text: reply })
          }
        }
      } catch (err) {
        this.logger.error({ err: err instanceof Error ? err.message : String(err), phone, text }, "chat API failed")
        await this.sock?.sendMessage(jid, { text: "Maaf, sistem sedang sibuk, coba sebentar lagi." })
      }
    }
  }

  private async checkAndGeneratePairingCode(): Promise<void> {
    if (!this.wsAlive) return
    try {
      const { data } = await this.api.get(`/api/qr/bot/${this.ownerId}`)
      const pairingPhone = data?.data?.pairingPhone
      const pairingCode = data?.data?.pairingCode
      if (pairingPhone && !pairingCode && this.sock && !this.connected) {
        this.logger.info({ pairingPhone }, "generating pairing code")
        const code = await this.sock.requestPairingCode(pairingPhone)
        this.logger.info({ code }, "pairing code generated")
        await this.api.post("/api/qr/bot", { ownerId: this.ownerId, pairingCode: code })
      }
    } catch (err) {
      this.logger.error({ err: String(err) }, "checkAndGeneratePairingCode failed")
    }
  }

  private async pollResetSignal(): Promise<void> {
    if (!this.connected) return
    try {
      const { data } = await this.api.get(`/api/qr/bot/${this.ownerId}`)
      const st = data?.data
      if ((st?.status === "disconnected" || st?.status === "connecting") && !st?.phone && !st?.qr) {
        this.logger.info("reset detected — logging out")
        try {
          await this.sock?.logout()
          this.logger.info("logout successful")
        } catch (logoutErr) {
          this.logger.error({ err: String(logoutErr) }, "logout failed")
        }
        if (this.pollTimer) clearInterval(this.pollTimer)
        this.pollTimer = null
        this.sock?.end(undefined)
        this.isResetRestart = true
        this.isReconnecting = true
        setTimeout(() => {
          this.start().catch((err) => {
            this.logger.error(err)
          })
        }, 1000)
      }
    } catch (err) {
      this.logger.error({ err: String(err) }, "pollResetSignal failed")
    }
  }

  private async pollOutgoing(): Promise<void> {
    await this.pollResetSignal()
    await this.checkAndGeneratePairingCode()
    try {
      this.pollErrors = 0
      const { data } = await this.api.get(`/api/outgoing`, { params: { ownerId: this.ownerId } })
      const items: Array<{ id: string; jid: string; text: string }> = data?.data?.items ?? []
      for (const msg of items) {
        try {
          await this.sock?.sendMessage(msg.jid, { text: msg.text })
          await this.api.patch(`/api/outgoing/${msg.id}/delivered`)
          this.logger.info({ id: msg.id }, "outgoing sent")
        } catch (err) {
          this.logger.error({ err: String(err), id: msg.id }, "outgoing failed")
        }
      }
    } catch (err) {
      this.pollErrors++
      this.logger.error({ err: String(err), pollErrors: this.pollErrors }, "pollOutgoing failed")
      const delay = Math.min(3000 * Math.pow(2, this.pollErrors), 60_000)
      if (this.pollTimer) clearInterval(this.pollTimer)
      this.pollTimer = setInterval(() => this.pollOutgoing(), delay)
    }
  }
}
