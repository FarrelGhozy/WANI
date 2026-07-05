import { expect, test, describe } from "bun:test"
import { isEmailConfigured, verifyConnection } from "@/src/services/email"

describe("EmailService", () => {
  test("isEmailConfigured returns false when env is empty", () => {
    expect(isEmailConfigured()).toBe(false)
  })

  test("verifyConnection returns false when SMTP is not configured", async () => {
    const ok = await verifyConnection()
    expect(ok).toBe(false)
  })
})
