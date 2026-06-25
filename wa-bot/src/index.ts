import makeWASocket from "@whiskeysockets/baileys"
import pino from "pino"
import qrcode from "qrcode-terminal"
import axios from "axios"
import { prisma } from "@/src/config/db"
import { usePrismaAuthState } from "@/src/services/whatsapp-auth"

const logger = pino({ level: "info" })

const api = axios.create({
  baseURL: process.env.API_URL!,
  headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
})

async function main() {
  const { state, saveCreds } = await usePrismaAuthState(prisma)

  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: true,
    browser: ["WANI Bot", "Chrome", "1.0.0"],
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrcode.generate(qr, { small: true })
      api.post("/api/qr", { qr }).catch(() => {})
    }
    if (connection === "close") {
      const loggedOut = lastDisconnect?.error?.toString()?.includes("logged out")
      logger.info({ loggedOut }, "connection closed")
      api.post("/api/qr", { status: "disconnected" }).catch(() => {})
      if (!loggedOut) main()
    } else if (connection === "open") {
      logger.info("connected!")
      api.delete("/api/qr").catch(() => {})
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.key.fromMe && msg.message && msg.key.remoteJid) {
        const text =
          msg.message.conversation ??
          msg.message.extendedTextMessage?.text ??
          ""
        if (!text) continue

        const jid = msg.key.remoteJid
        if (jid.endsWith("@g.us")) continue

        const phone = jid.replace(/[^0-9]/g, "")
        const pushName = msg.pushName || phone

        try {
          const { data } = await api.post("/api/chat", {
            phone,
            name: pushName,
            text,
            waMsgId: msg.key.id,
          })
          const reply = data?.data?.reply
          if (reply) {
            await sock.sendMessage(jid, { text: reply })
          }
        } catch {
          await sock.sendMessage(jid, { text: "Maaf, sistem sedang sibuk, coba sebentar lagi." }).catch(() => {})
        }
      }
    }
  })
}

process.on("SIGINT", async () => {
  await prisma.$disconnect()
  process.exit(0)
})
process.on("SIGTERM", async () => {
  await prisma.$disconnect()
  process.exit(0)
})

main().catch((err) => {
  logger.error(err)
  prisma.$disconnect()
  process.exit(1)
})
