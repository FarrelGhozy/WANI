import { expect, test, describe } from "bun:test"

const hasSmtp = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASSWORD
)

describe("EmailService", () => {
  test.skipIf(hasSmtp)("isEmailConfigured returns false when env is empty", async () => {
    const { isEmailConfigured } = await import("@/services/email")
    expect(isEmailConfigured()).toBe(false)
  })

  test.skipIf(hasSmtp)("verifyConnection returns false when SMTP is not configured", async () => {
    const { verifyConnection } = await import("@/services/email")
    const ok = await verifyConnection()
    expect(ok).toBe(false)
  })
})
