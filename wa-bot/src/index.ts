import { makeWASocket, Browsers } from "baileys";
import type { WASocket } from "baileys";
import pino from "pino";
import pretty from "pino-pretty";
import qrcode from "qrcode-terminal";
import axios from "axios";
import { prisma } from "@/src/config/db";
import { usePrismaAuthState } from "@/src/services/whatsapp-auth";

const logger = pino(
  pretty({
    colorize: true,
    translateTime: "HH:MM:ss",
    ignore: "pid,hostname",
  }),
);

const api = axios.create({
  baseURL: process.env.API_URL!,
  headers: { Authorization: `Bearer ${process.env.API_TOKEN}` }
});

let sock: WASocket | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let connected = false;
let cleanupRegistered = false;
let isReconnecting = false;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let pollErrors = 0;

async function main() {
  const { state, saveCreds } = await usePrismaAuthState(prisma);

  if (pollTimer) clearInterval(pollTimer);
  sock?.end(undefined);

  sock = makeWASocket({
    auth: state,
    logger,
    browser: Browsers.ubuntu("Firefox"),
    shouldSyncHistoryMessage: () => false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr, receivedPendingNotifications } = update;

    const sockUser = sock?.user ? { id: sock.user.id, phoneNumber: sock.user.phoneNumber, lid: sock.user.lid, name: sock.user.name } : null;
    const credsMe = state.creds.me ? { id: state.creds.me.id, phoneNumber: state.creds.me.phoneNumber, lid: state.creds.me.lid } : null;
    logger.info({ connection, hasQr: !!qr, receivedPendingNotifications, updateKeys: Object.keys(update), sockUser, credsMe }, "connection update");

    if (qr) {
      logger.info("QR code received");
      qrcode.generate(qr, { small: true });
      api.post("/api/qr", { qr }).catch(e => logger.error({ err: e?.response?.data ?? e }, "push QR failed"));

      // Check if pairing code was requested via dashboard
      checkAndGeneratePairingCode();
    }

    if (connection === "open" || receivedPendingNotifications) {
      reconnectAttempts = 0;
      isReconnecting = false;
      connected = true;
      const id = sock?.user?.id ?? state.creds.me?.id ?? "";
      const phoneNumber = id.split(":")[0]?.replace(/[^0-9]/g, "") || null;
      logger.info({ connection, receivedPendingNotifications, phoneNumber }, "connected — clearing QR");
      api.delete("/api/qr").catch(e => logger.error({ err: e?.response?.data ?? e }, "clear QR failed"));
      const payload: Record<string, string> = { status: "connected" };
      if (phoneNumber) payload.phone = phoneNumber;
      api.post("/api/qr", payload).catch(e => logger.error({ err: e?.response?.data ?? e }, "status update failed"));
    }

    if (connection === "close") {
      connected = false;
      const reason = lastDisconnect?.error?.message ?? lastDisconnect?.error?.toString() ?? "unknown";
      const loggedOut = reason.includes("logged out");
      logger.info({ loggedOut, reason }, "connection closed");
      api.post("/api/qr", { status: "disconnected" }).catch(e => logger.error({ err: e?.response?.data ?? e }, "disconnect status failed"));
      if (!loggedOut && !isReconnecting) {
        isReconnecting = true;
        if (reconnectAttempts >= 10) {
          logger.error("max reconnect attempts reached");
          process.exit(1);
        }
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectAttempts++;
        logger.info({ attempt: reconnectAttempts, delay }, "reconnecting...");
        if (pollTimer) clearInterval(pollTimer);
        sock?.end(undefined);
        reconnectTimer = setTimeout(() => {
          main().finally(() => { isReconnecting = false; });
        }, delay);
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.key.fromMe || !msg.message || !msg.key.remoteJid) continue;

      const jid = msg.key.remoteJidAlt ?? msg.key.remoteJid;
      if (!jid.endsWith("@s.whatsapp.net")) continue;

      const text = msg.message.conversation ?? msg.message.extendedTextMessage?.text ?? "";
      if (!text) continue;

      const phone = jid.replace(/[^0-9]/g, "");
      const pushName = msg.pushName || phone;

      // Safety net: receiving messages confirms connection
      api.delete("/api/qr").catch(e => logger.warn({ err: e?.response?.data ?? String(e) }, "qr safety net: clear failed"));
      api.post("/api/qr", { status: "connected" }).catch(e => logger.warn({ err: e?.response?.data ?? String(e) }, "qr safety net: status update failed"));

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
              await sock?.sendMessage(jid, { image: { url: fullUrl }, caption: reply });
            } catch {
              await sock?.sendMessage(jid, { text: reply });
            }
          } else {
            await sock?.sendMessage(jid, { text: reply });
          }
        }
      } catch (err) {
        logger.error({ err: err instanceof Error ? err.message : String(err), phone, text }, "chat API failed");
        await sock?.sendMessage(jid, { text: "Maaf, sistem sedang sibuk, coba sebentar lagi." });
      }
    }
  });

  async function checkAndGeneratePairingCode() {
    try {
      const { data } = await api.get("/api/qr/status");
      const pairingPhone = data?.data?.pairingPhone;
      const pairingCode = data?.data?.pairingCode;
      if (pairingPhone && !pairingCode && sock) {
        logger.info({ pairingPhone }, "generating pairing code");
        const code = await sock.requestPairingCode(pairingPhone);
        logger.info({ code }, "pairing code generated");
        await api.post("/api/qr", { pairingCode: code, pairingPhone: null });
      }
    } catch (err) {
      logger.error({ err: String(err) }, "checkAndGeneratePairingCode failed");
    }
  }

  async function pollResetSignal() {
    if (!connected) return;
    try {
      const { data } = await api.get("/api/qr/status");
      const st = data?.data;
      if (st?.status === "disconnected" && !st?.phone && !st?.qr) {
        logger.info("reset detected — logging out");
        try {
          await sock?.logout();
          logger.info("logout successful");
        } catch (logoutErr) {
          logger.error({ err: String(logoutErr) }, "logout failed");
        }
        if (pollTimer) clearInterval(pollTimer);
        sock?.end(undefined);
        process.exit(0);
      }
    } catch (err) {
      logger.error({ err: String(err) }, "pollResetSignal failed");
    }
  }

  async function pollOutgoing() {
    await pollResetSignal();
    try {
      pollErrors = 0
      const { data } = await api.get("/api/outgoing");
      const items: Array<{ id: string; jid: string; text: string }> = data?.data?.items ?? [];
      for (const msg of items) {
        try {
          await sock?.sendMessage(msg.jid, { text: msg.text });
          await api.patch(`/api/outgoing/${msg.id}/delivered`);
          logger.info({ id: msg.id }, "outgoing sent");
        } catch (err) {
          logger.error({ err: String(err), id: msg.id }, "outgoing failed");
        }
      }
    } catch (err) {
      pollErrors++
      logger.error({ err: String(err), pollErrors }, "pollOutgoing failed")
      // Exponential backoff on repeated failures: max 60s
      const delay = Math.min(3000 * Math.pow(2, pollErrors), 60_000)
      if (pollTimer) clearInterval(pollTimer)
      pollTimer = setInterval(pollOutgoing, delay)
    }
  }

  const POLL_INTERVAL = Number(process.env.OUTGOING_POLL_INTERVAL ?? 3000);
  pollTimer = setInterval(pollOutgoing, POLL_INTERVAL);

  if (!cleanupRegistered) {
    cleanupRegistered = true;
    async function shutdown(signal: string): Promise<void> {
      logger.info({ signal }, "received signal — shutting down gracefully");
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      try {
        await prisma.$disconnect();
        logger.info("prisma disconnected");
      } catch (err) {
        logger.error({ err: String(err) }, "prisma disconnect failed");
      }
      process.exit(0);
    }

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  }
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
