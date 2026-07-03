// ─── Consolidated injection / jailbreak detection patterns ──────────────
// Single source of truth — imported by both guardrails/input.ts (quick
// heuristic check) and guardrails/firewall/injection.ts (full T1 scan).

import { MSG_CLOSE } from "@/src/ai/prompts"

export function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// DELIMITER ESCAPE — attempts to close message fences early
export const DELIMITER_PATTERNS: readonly RegExp[] = [
  new RegExp(`${escapeRe(MSG_CLOSE)}\\s*\\S`, "i"),
  /<\/?(?:customer_message|system|assistant|user)>/i,
  /<\s*\|[^|]*\|>/,
]

// INSTRUCTION HIERARCHY OVERRIDE — "ignore all previous instructions"
export const OVERRIDE_PATTERNS: readonly RegExp[] = [
  /ignore\s+(?:all\s+|the\s+|any\s+)?(?:previous|above|prior|earlier)\s+(?:instructions?|prompts?|messages?|rules?|directions?)/i,
  /disregard\s+(?:all\s+|the\s+)?(?:previous|above|prior)\s+(?:instructions?|prompts?|rules?)/i,
  /abaikan\s+(?:semua\s+|saja\s+)?(?:instruksi|perintah|aturan|peraturan|pesan|arahan)/i,
  /lupakan\s+(?:semua\s+)?(?:instruksi|perintah|aturan|peraturan)/i,
  /(?:sekarang|mulai\s+(?:sekarang|saat\s+ini))\s+(?:kamu|lo|anda)\s+(?:akan|harus|boleh)/i,
  /(?: instruksi|perintah|aturan?)\s+(?:sebelumnya|diatas)\s+(?:diabaikan|diganti|dihapus|tidak\s+berlaku)/i,
  /(?:previous|above|prior)\s+(?:instructions?|prompts?|rules?)\s+(?:are|were|have\s+been)\s+(?:overridden|cancelled|replaced|ignored)/i,
]

// SYSTEM PROMPT EXTRACTION — attempts to reveal hidden instructions
export const EXTRACTION_PATTERNS: readonly RegExp[] = [
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

// ROLE / PERSONA HIJACKING — "you are now a..."
export const ROLE_HIJACK_PATTERNS: readonly RegExp[] = [
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

// AUTHORITY CLAIMS — "I'm your developer"
export const AUTHORITY_PATTERNS: readonly RegExp[] = [
  /(?:as\s+|i'm\s+)(?:your|the)\s+(?:developer|creator|admin|author|programmer|engineer)/i,
  /(?:this\s+is\s+)?(?:a\s+)?(?:test|debug|maintenance|update|security\s+check|system\s+audit)/i,
  /(?:saya|aku)\s+(?:adalah|sebagai)\s+(?:developer|pembuat|admin|programmer)/i,
  /(?:testing|audit|maintenance|update)\s+(?:mode|session|protocol)/i,
]

// TOKEN / COMMAND INJECTION — XSS, shell, SQL
export const TOKEN_INJECTION_PATTERNS: readonly RegExp[] = [
  /(?:javascript|script|alert|eval|exec)\s*[({]/i,
  /(?:onclick|onload|onerror|onmouseover)\s*=/i,
  /(?:<script|<\/script|<iframe|<img[^>]+onerror|<svg\s+onload)/i,
  /```\s*(?:bash|sh|zsh|powershell|cmd|python|ruby|php)/i,
  /(?:curl|wget|nc|netcat)\s+/i,
  /(?:DROP|DELETE|INSERT|UPDATE)\s+(?:TABLE|FROM|INTO)/i,
]

// CRESCENDO / MULTI-TURN DRIFT MARKERS
export const CRESCENDO_PATTERNS: readonly RegExp[] = [
  /(?:one\s+more|last|final|another\s+small|tiny)\s+(?:thing|question|request|favor)/i,
  /(?:before\s+you\s+(?:go|end|finish)|as\s+a\s+(?:final|last)\s+thing)/i,
  /just\s+(?:answer|try|say|do)\s+(?:this|it|one\s+thing)/i,
  /(?:hypothetically|theoretically)\s+(?:speaking|asking|just)/i,
  /(?:for\s+(?:science|research|educational|academic)\s+(?:purposes|reasons))/i,
  /(?:in\s+(?:a\s+)?(?:parallel|alternate|different|fictional|hypothetical)\s+(?:universe|reality|scenario|world))/i,
  /(?:CTF|capture\s+the\s+flag|cve-\d)/i,
]

// LIGHTWEIGHT SUBSET — quick heuristic check (used by input.ts)
// Keeps the most common patterns with low false-positive rate
export const QUICK_INJECTION_PATTERNS: readonly RegExp[] = [
  OVERRIDE_PATTERNS[0]!,
  OVERRIDE_PATTERNS[1]!,
  OVERRIDE_PATTERNS[2]!,
  OVERRIDE_PATTERNS[3]!,
  EXTRACTION_PATTERNS[0]!,
  /system\s+prompt/i,
  ROLE_HIJACK_PATTERNS[0]!,
  ROLE_HIJACK_PATTERNS[1]!,
  ROLE_HIJACK_PATTERNS[2]!,
  ROLE_HIJACK_PATTERNS[3]!,
  /developer\s+mode/i,
  /jailbreak/i,
  /\bDAN\s+mode\b/i,
  /<\|[^|]*\|>/,
  /\[\s*(?:system|assistant|user)\s*\]/i,
]

// Combined leet-check patterns (override + extraction + role hijack)
export const LEET_PATTERNS: readonly RegExp[] = [
  ...OVERRIDE_PATTERNS,
  ...EXTRACTION_PATTERNS,
  ...ROLE_HIJACK_PATTERNS,
]
