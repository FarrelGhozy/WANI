import { expect, test, describe } from "bun:test"
import { sanitizeReply, hasLeak } from "@/src/guardrails/output"

describe("golden reply safety checks", () => {
  test("reply never contains canary", () => {
    const replies = [
      "Halo! Ada yang bisa dibantu?",
      "Total pesanan Anda Rp50.000",
      "Maaf, produk tidak tersedia",
      "Mohon tunggu sebentar ya",
    ]
    for (const reply of replies) {
      expect(hasLeak(reply)).toBe(false)
    }
  })

  test("sanitized replies are safe to send", () => {
    const dirty = "```json\n{\"intent\": \"greeting\"}\n```\nHalo ada yang bisa dibantu?"
    const clean = sanitizeReply(dirty)
    expect(clean).not.toContain("```")
    expect(clean.startsWith("{")).toBe(true)
    expect(clean).toContain("Halo ada yang bisa dibantu?")
  })

  test("guardrail blocked replies are polite", () => {
    const messages = [
      { label: "rate_limited", reply: "Mohon tunggu sebentar" },
      { label: "injection", reply: "tidak dapat diproses" },
      { label: "budget", reply: "lagi ramai" },
      { label: "error", reply: "sibuk" },
      { label: "leak", reply: "kesalahan teknis" },
    ]
    for (const { reply } of messages) {
      expect(hasLeak(reply)).toBe(false)
      expect(sanitizeReply(reply)).toBe(reply.trim())
    }
  })
})
