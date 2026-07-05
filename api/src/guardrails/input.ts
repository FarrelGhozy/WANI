import { env } from "@/src/config/env"
import { QUICK_INJECTION_PATTERNS } from "@/src/guardrails/injection-patterns"

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

/** Normalize untrusted inbound text: strip control chars, NFKC (kills fullwidth/math homoglyphs), trim, cap length. */
export function normalizeInput(text: string): string {
  const cleaned = stripControlChars(text).normalize("NFKC").trim()
  const max = env.guardrails.maxInputChars
  return cleaned.length > max ? cleaned.slice(0, max) : cleaned
}

/** Heuristic prompt-injection / jailbreak check using quick patterns. */
export function detectInjection(text: string): boolean {
  return QUICK_INJECTION_PATTERNS.some((re) => re.test(text))
}