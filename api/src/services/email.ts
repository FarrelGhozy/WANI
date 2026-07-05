import nodemailer from "nodemailer"
import { env } from "@/src/config/env"

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter
  if (!env.email.smtpHost || !env.email.smtpUser || !env.email.smtpPassword) {
    return null
  }
  transporter = nodemailer.createTransport({
    host: env.email.smtpHost,
    port: env.email.smtpPort,
    secure: env.email.smtpPort === 465,
    auth: {
      user: env.email.smtpUser,
      pass: env.email.smtpPassword,
    },
  })
  return transporter
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const t = getTransporter()
  if (!t) {
    console.warn("[EMAIL] SMTP not configured — skipping email send")
    return
  }
  await t.sendMail({
    from: env.email.smtpFrom,
    to,
    subject,
    html,
  })
}

export function isEmailConfigured(): boolean {
  return !!(
    env.email.smtpHost &&
    env.email.smtpUser &&
    env.email.smtpPassword
  )
}
