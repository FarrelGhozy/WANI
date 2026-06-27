import { makeWASocket, Browsers } from "baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import axios from "axios";
import { prisma } from "@/src/config/db";
import { usePrismaAuthState } from "@/src/services/whatsapp-auth";

const logger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname",
    },
  },
});

const api = axios.create({
  baseURL: process.env.API_URL!,
  headers: { Authorization: `Bearer ${process.env.API_TOKEN}` }
});

async function main() {
  const { state, saveCreds } = await usePrismaAuthState(prisma);

  const sock = makeWASocket({
    auth: state,
    logger,
    browser: Browsers.ubuntu("Firefox")
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr, receivedPendingNotifications }) => {
    if (qr) {
      logger.info("QR code received");
      qrcode.generate(qr, { small: true });
      api.post("/api/qr", { qr }).catch(e => logger.error({ err: e?.response?.data ?? e }, "push QR failed"));
    }

    if (connection === "open" || receivedPendingNotifications) {
      const phoneNumber = sock.user?.phoneNumber ?? state.creds.me?.phoneNumber ?? null;
      logger.info({ connection, receivedPendingNotifications, phoneNumber }, "connected — clearing QR");
      api.delete("/api/qr").catch(e => logger.error({ err: e?.response?.data ?? e }, "clear QR failed"));
      api.post("/api/qr", { status: "connected", phone: phoneNumber }).catch(e => logger.error({ err: e?.response?.data ?? e }, "status update failed"));
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.message ?? lastDisconnect?.error?.toString() ?? "unknown";
      const loggedOut = reason.includes("logged out");
      logger.info({ loggedOut, reason }, "connection closed");
      api.post("/api/qr", { status: "disconnected" }).catch(e => logger.error({ err: e?.response?.data ?? e }, "disconnect status failed"));
      if (!loggedOut) {
        logger.info("reconnecting...");
        main();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (msg.key.fromMe || !msg.message || !msg.key.remoteJid) continue;

      const text = msg.message.conversation ?? msg.message.extendedTextMessage?.text ?? "";
      if (!text) continue;

      const jid = msg.key.remoteJidAlt ?? msg.key.remoteJid;
      if (jid.endsWith("@g.us")) continue;

      const phone = jid.replace(/[^0-9]/g, "");
      const pushName = msg.pushName || phone;

      // Safety net: receiving messages confirms connection
      api.delete("/api/qr").catch(() => {});
      api.post("/api/qr", { status: "connected" }).catch(() => {});

      logger.info({ phone, text, pushName }, "message received");

      try {
        const { data } = await api.post("/api/chat", {
          phone,
          name: pushName,
          text,
          waMsgId: msg.key.id
        });
        const reply = data?.data?.reply;
        const qrisUrl = data?.data?.qrisImageUrl;
        if (reply) {
          if (qrisUrl) {
            const fullUrl = `${process.env.API_URL?.replace(/\/$/, "")}${qrisUrl}`;
            try {
              await sock.sendMessage(jid, { image: { url: fullUrl }, caption: reply });
            } catch {
              await sock.sendMessage(jid, { text: reply });
            }
          } else {
            await sock.sendMessage(jid, { text: reply });
          }
        }
      } catch (err) {
        logger.error({ err: err instanceof Error ? err.message : String(err), phone, text }, "chat API failed");
        await sock.sendMessage(jid, { text: "Maaf, sistem sedang sibuk, coba sebentar lagi." });
      }
    }
  });
}

process.on("SIGINT", () => {
  process.exit(0);
});
process.on("SIGTERM", () => {
  process.exit(0);
});

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
