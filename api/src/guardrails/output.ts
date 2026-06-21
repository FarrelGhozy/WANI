import { env } from "@/src/config/env"
import { PROMPT_CANARY, MSG_OPEN } from "@/src/ai/prompts"

/** Clean an outbound reply: strip code fences, trim, cap length. */
export function sanitizeReply(text: string): string {
  let t = text.trim()
  // Strip a wrapping ```lang ... ``` fence if the model added one.
  t = t.replace(/^```[a-zA-Z0-9]*\s*\n?/, "").replace(/\n?```$/, "").trim()

  const max = env.guardrails.maxReplyChars
  if (t.length > max) {
    t = t.slice(0, max - 1).trimEnd() + "…"
  }
  return t
}

/**
 * Detect a prompt/system leak in an outbound reply. Catches the canary and the
 * raw delimiter/marker text that should never reach a customer.
 */
export function hasLeak(text: string): boolean {
  if (text.includes(PROMPT_CANARY)) return true
  const lower = text.toLowerCase()
  return (
    lower.includes(MSG_OPEN.toLowerCase()) ||
    lower.includes("## aturan keamanan") ||
    lower.includes("## aturan output")
  )
}
