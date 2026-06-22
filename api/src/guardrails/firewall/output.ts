// ─── Layer 4: Output safety scanning ────────────────────────────────────

import type { OutputScanResult } from "./types"
import { PROMPT_CANARY, MSG_OPEN, MSG_CLOSE } from "@/src/ai/prompts"

const PII_PATTERNS = [
  /(?:api[_-]?key|apikey|secret[_-]?key|access[_-]?key|auth[_-]?token)\s*[:=]\s*\S+/i,
  /(?:sk-[a-zA-Z0-9]{20,}|pk-[a-zA-Z0-9]{20,})/,
  /(?:AKIA[0-9A-Z]{16})/, // AWS access keys
  /\b(?:\+?62|0)8[1-9][0-9]{7,11}\b/, // Indonesian phone
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // email
]

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

  for (const re of PII_PATTERNS) {
    if (re.test(text)) {
      return { blocked: true, reason: "pii_leak" }
    }
  }

  for (const re of EXFILTRATION_PATTERNS) {
    if (re.test(text)) {
      return { blocked: true, reason: "exfiltration" }
    }
  }

  return { blocked: false, reason: null }
}
