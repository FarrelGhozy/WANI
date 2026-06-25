// ─── Layer 2: Injection / jailbreak pattern detection ────────────────────

import { normalizeLeet } from "@/src/guardrails/firewall/encoding"
import type { ScanResult, ScanVerdict } from "@/src/guardrails/firewall/types"
import { MSG_CLOSE } from "@/src/ai/prompts"

// DELIMITER ESCAPE — attempts to close our <customer_message> fence early
const DELIMITER_PATTERNS = [
  // Close tag followed by non-newline content (injection after closing)
  new RegExp(`${escapeRe(MSG_CLOSE)}\\s*\\S`, "i"),
  /<\/?(?:customer_message|system|assistant|user)>/i,
  /<\s*\|[^|]*\|>/,
]

// INSTRUCTION HIERARCHY OVERRIDE
const OVERRIDE_PATTERNS = [
  /ignore\s+(?:all\s+|the\s+|any\s+)?(?:previous|above|prior|earlier)\s+(?:instructions?|prompts?|messages?|rules?|directions?)/i,
  /disregard\s+(?:all\s+|the\s+)?(?:previous|above|prior)\s+(?:instructions?|prompts?|rules?)/i,
  /abaikan\s+(?:semua\s+|saja\s+)?(?:instruksi|perintah|aturan|peraturan|pesan|arahan)/i,
  /lupakan\s+(?:semua\s+)?(?:instruksi|perintah|aturan|peraturan)/i,
  /(?:sekarang|mulai\s+(?:sekarang|saat\s+ini))\s+(?:kamu|lo|anda)\s+(?:akan|harus|boleh)/i,
  /(?: instruksi|perintah|aturan?)\s+(?:sebelumnya|diatas)\s+(?:diabaikan|diganti|dihapus|tidak\s+berlaku)/i,
  /(?:previous|above|prior)\s+(?:instructions?|prompts?|rules?)\s+(?:are|were|have\s+been)\s+(?:overridden|cancelled|replaced|ignored)/i,
]

// SYSTEM PROMPT EXTRACTION
const EXTRACTION_PATTERNS = [
  /(?:reveal|show|print|repeat|leak|output|display|bocorkan|tampilkan|sebutkan|tulis|ceritakan|jabarkan)\s+(?:me\s+|your\s+|the\s+)?(?:system\s+)?(?:prompt|instructions?|aturan\s+sistem|perintah|konfigurasi)/i,
  /system\s+prompt/i,
  /prompt\s+(?:anda|kamu|lu|asli|rahasia)/i,
  /instruksi\s+(?:awal|sistem|asli|rahasia)/i,
  /terjemahkan\s+(?:instruksi|perintah|prompt)\s+(?:awal|sistem|anda)/i,
  /translate\s+(?:your\s+)?(?:instructions?|prompt|system\s+prompt)/i,
  /your\s+(?:system\s+)?prompt\s+begins?\s+with/i,
  /your\s+(?:first\s+)?instructions?\s+were/i,
  /continue\s+(?:reading|writing)\s+(?:the\s+)?(?:above|previous)\s+(?:text|message|prompt)/i,
  /what\s+(?:are|where)\s+(?:your|the)\s+(?:core|initial|original|base)\s+(?:instructions?|rules?|guidelines?)/i,
  /(?:how\s+(?:are|do)|what's)\s+your\s+(?:system\s+)?prompt/i,
]

// ROLE / PERSONA HIJACKING
const ROLE_HIJACK_PATTERNS = [
  /you\s+are\s+now\s+(?:a|an|the)/i,
  /kamu\s+(?:sekarang\s+)?(?:adalah|berperan\s+sebagai|menjadi|jadi)/i,
  /(?:pretend|act)\s+(?:to\s+be|as)\s+/i,
  /berpura-?pura\s+(?:menjadi|jadi|sebagai)/i,
  /(?:mulai|sekarang)\s+(?:kamu|anda)\s+(?:adalah|berperan)/i,
  /from\s+now\s+on\s+(?:you\s+are|you'll\s+(?:be|act))/i,
  /(?:DAN|developer\s+mode|debug\s+mode|god\s+mode|admin\s+mode)\b/i,
  /jailbreak/i,
  /character\.(?:ai|persona)/i,
  /roleplay\s+(?:as|a\s+)?/i,
  /(?:new|another|different)\s+(?:identity|persona|role|character)/i,
  /(?:ganti|ubah|rubah)\s+(?:peran|identitas|karakter|persona)/i,
]

// AUTHORITY CLAIMS
const AUTHORITY_PATTERNS = [
  /(?:as\s+|i'm\s+)(?:your|the)\s+(?:developer|creator|admin|author|programmer|engineer)/i,
  /(?:this\s+is\s+)?(?:a\s+)?(?:test|debug|maintenance|update|security\s+check|system\s+audit)/i,
  /(?:saya|aku)\s+(?:adalah|sebagai)\s+(?:developer|pembuat|admin|programmer)/i,
  /(?:testing|audit|maintenance|update)\s+(?:mode|session|protocol)/i,
]

// TOKEN / COMMAND INJECTION
const TOKEN_INJECTION_PATTERNS = [
  /(?:javascript|script|alert|eval|exec)\s*[({]/i,
  /(?:onclick|onload|onerror|onmouseover)\s*=/i,
  /(?:<script|<\/script|<iframe|<img[^>]+onerror|<svg\s+onload)/i,
  /```\s*(?:bash|sh|zsh|powershell|cmd|python|ruby|php)/i,
  /(?:curl|wget|nc|netcat)\s+/i,
  /(?:DROP|DELETE|INSERT|UPDATE)\s+(?:TABLE|FROM|INTO)/i,
]

// MANY-SHOT / CONTEXT OVERFLOW
const MANY_SHOT_RE = /^(?:Q:|A:|User:|Assistant:|Human:|AI:|Example|Question|Answer|\d+\.)/i

function detectContextOverflow(text: string): boolean {
  const lines = text.split("\n").filter((l) => l.trim().length > 0)
  const instructionLines = lines.filter((l) => MANY_SHOT_RE.test(l.trim()))
  return lines.length > 20 && instructionLines.length / lines.length > 0.6
}

// CRESCENDO / MULTI-TURN DRIFT MARKERS
const CRESCENDO_PATTERNS = [
  /(?:one\s+more|last|final|another\s+small|tiny)\s+(?:thing|question|request|favor)/i,
  /(?:before\s+you\s+(?:go|end|finish)|as\s+a\s+(?:final|last)\s+thing)/i,
  /just\s+(?:answer|try|say|do)\s+(?:this|it|one\s+thing)/i,
  /(?:hypothetically|theoretically)\s+(?:speaking|asking|just)/i,
  /(?:for\s+(?:science|research|educational|academic)\s+(?:purposes|reasons))/i,
  /(?:in\s+(?:a\s+)?(?:parallel|alternate|different|fictional|hypothetical)\s+(?:universe|reality|scenario|world))/i,
  /(?:CTF|capture\s+the\s+flag|cve-\d)/i,
]

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const LEET_PATTERNS: readonly RegExp[] = [
  ...OVERRIDE_PATTERNS,
  ...EXTRACTION_PATTERNS,
  ...ROLE_HIJACK_PATTERNS,
]

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
