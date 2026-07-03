// ─── Layer 2: Injection / jailbreak pattern detection ────────────────────

import { normalizeLeet } from "@/src/guardrails/firewall/encoding"
import type { ScanResult, ScanVerdict } from "@/src/guardrails/firewall/types"
import {
  DELIMITER_PATTERNS,
  OVERRIDE_PATTERNS,
  EXTRACTION_PATTERNS,
  ROLE_HIJACK_PATTERNS,
  AUTHORITY_PATTERNS,
  TOKEN_INJECTION_PATTERNS,
  CRESCENDO_PATTERNS,
  LEET_PATTERNS,
} from "@/src/guardrails/injection-patterns"

// MANY-SHOT / CONTEXT OVERFLOW
const MANY_SHOT_RE = /^(?:Q:|A:|User:|Assistant:|Human:|AI:|Example|Question|Answer|\d+\.)/i

function detectContextOverflow(text: string): boolean {
  const lines = text.split("\n").filter((l) => l.trim().length > 0)
  const instructionLines = lines.filter((l) => MANY_SHOT_RE.test(l.trim()))
  return lines.length > 20 && instructionLines.length / lines.length > 0.6
}

// ─── Verdict tiers ──────────────────────────────────────────────────────

const HIGH_CONFIDENCE = new Set(["delimiter_escape", "token_injection", "leet_obfuscated"])
const MEDIUM_CONFIDENCE = new Set(["instruction_override", "prompt_extraction", "role_hijack", "authority_claim"])
const LOW_CONFIDENCE = new Set(["crescendo_marker", "context_overflow"])

/** Map raw reasons to a verdict tier. HIGH/MEDIUM → BLOCK, LOW-only → UNCERTAIN. */
export function classifyVerdict(reasons: string[]): ScanVerdict {
  if (reasons.length === 0) return "SAFE"
  if (reasons.some((r) => HIGH_CONFIDENCE.has(r) || MEDIUM_CONFIDENCE.has(r))) return "BLOCK"
  return "UNCERTAIN"
}

/** Comprehensive injection scan — returns list of triggered rule names.
 *  NFKC-normalizes input first to defeat fullwidth/math-alphanumeric bypass. */
export function scanInput(text: string): ScanResult {
  const normalized = text.normalize("NFKC")
  const reasons: string[] = []

  for (const re of DELIMITER_PATTERNS) {
    if (re.test(normalized)) { reasons.push("delimiter_escape"); break }
  }

  for (const re of OVERRIDE_PATTERNS) {
    if (re.test(normalized)) { reasons.push("instruction_override"); break }
  }

  for (const re of EXTRACTION_PATTERNS) {
    if (re.test(normalized)) { reasons.push("prompt_extraction"); break }
  }

  for (const re of ROLE_HIJACK_PATTERNS) {
    if (re.test(normalized)) { reasons.push("role_hijack"); break }
  }

  for (const re of AUTHORITY_PATTERNS) {
    if (re.test(normalized)) { reasons.push("authority_claim"); break }
  }

  for (const re of TOKEN_INJECTION_PATTERNS) {
    if (re.test(normalized)) { reasons.push("token_injection"); break }
  }

  const leet = normalizeLeet(normalized)
  for (const re of LEET_PATTERNS) {
    if (re.test(leet)) { reasons.push("leet_obfuscated"); break }
  }

  if (detectContextOverflow(normalized)) reasons.push("context_overflow")

  for (const re of CRESCENDO_PATTERNS) {
    if (re.test(normalized)) { reasons.push("crescendo_marker"); break }
  }

  return { blocked: reasons.length > 0, reasons }
}
