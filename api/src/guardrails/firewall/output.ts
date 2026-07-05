// ─── Layer 4: Output safety scanning ────────────────────────────────────

import type { OutputScanResult } from "@/src/guardrails/firewall/types"
import { PROMPT_CANARY, MSG_OPEN, MSG_CLOSE } from "@/src/ai/prompts"
import { hasPii } from "@/src/guardrails/pii"

const EXFILTRATION_PATTERNS = [
  /!\[.*?\]\(https?:\/\/.*?\)/, // markdown image with URL
  /(?:https?:\/\/.*?(?:log|collect|track|analytics|telemetry|beacon|pixel|callback))/i,
  /(?:base64|b64|hex)\s*(?:encode|decode|string|data)/i,
]

const SYSTEM_PROMPT_SECTIONS = [
  "## aturan keamanan",
  "## aturan output",
  "## info bisnis",
  "## katalog produk",
]

/** Scan outbound reply for leaks, PII, or exfiltration attempts. */
export function scanOutput(text: string): OutputScanResult {
  if (text.includes(PROMPT_CANARY)) {
    return { blocked: true, reason: "canary_leak" }
  }

  const lower = text.toLowerCase()

  if (lower.includes(MSG_OPEN.toLowerCase()) || lower.includes(MSG_CLOSE.toLowerCase())) {
    return { blocked: true, reason: "delimiter_leak" }
  }

  for (const section of SYSTEM_PROMPT_SECTIONS) {
    if (lower.includes(section)) {
      return { blocked: true, reason: "system_prompt_reconstruction" }
    }
  }

  if (hasPii(text)) {
    return { blocked: true, reason: "pii_leak" }
  }

  for (const re of EXFILTRATION_PATTERNS) {
    if (re.test(text)) {
      return { blocked: true, reason: "exfiltration" }
    }
  }

  return { blocked: false, reason: null }
}
