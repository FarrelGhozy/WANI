import { env } from "@/src/config/env"

// Code-point ranges for control + zero-width characters that have no place in
// chat text and are commonly used to smuggle hidden instructions. Newline
// (0x0A) and tab (0x09) are intentionally excluded so they survive.
const STRIP_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x00, 0x08], // C0 controls before tab
  [0x0b, 0x0c], // vertical tab, form feed
  [0x0e, 0x1f], // C0 controls after carriage return
  [0x7f, 0x7f], // delete
  [0x200b, 0x200d], // zero-width space / non-joiner / joiner
  [0x202a, 0x202e], // bidi embedding/override controls
  [0x2060, 0x2060], // word joiner
  [0xfeff, 0xfeff], // zero-width no-break space (BOM)
]

function stripControlChars(text: string): string {
  let out = ""
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0
    const strip = STRIP_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi)
    if (!strip) out += ch
  }
  return out
}

/** Normalize untrusted inbound text: strip control chars, trim, cap length. */
export function normalizeInput(text: string): string {
  const cleaned = stripControlChars(text).trim()
  const max = env.guardrails.maxInputChars
  return cleaned.length > max ? cleaned.slice(0, max) : cleaned
}

// Heuristic prompt-injection / jailbreak signatures (EN + ID). Intentionally
// conservative to limit false positives; a hit short-circuits the LLM call.
const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:all\s+|the\s+|any\s+)?(?:previous|above|prior|earlier)\s+(?:instructions?|prompts?|messages?|rules?)/i,
  /disregard\s+(?:all\s+|the\s+)?(?:previous|above|prior)\s+(?:instructions?|prompts?|rules?)/i,
  /abaikan\s+(?:semua\s+)?(?:instruksi|perintah|aturan|pesan)/i,
  /lupakan\s+(?:semua\s+)?(?:instruksi|perintah|aturan)/i,
  /(?:reveal|show|print|repeat|leak|bocorkan|tampilkan)\s+(?:me\s+)?(?:your\s+|the\s+)?(?:system\s+)?(?:prompt|instructions?|aturan\s+sistem)/i,
  /system\s+prompt/i,
  /you\s+are\s+now\s+(?:a|an|the)?/i,
  /kamu\s+(?:sekarang\s+)?(?:adalah|berperan\s+sebagai)/i,
  /(?:pretend|act)\s+(?:to\s+be|as)\s+/i,
  /berpura-?pura\s+(?:menjadi|jadi)/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /\bDAN\s+mode\b/i,
  /<\|[^|]*\|>/,
  /\[\s*(?:system|assistant|user)\s*\]/i,
]

export function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(text))
}
