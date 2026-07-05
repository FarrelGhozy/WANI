// ─── Layer 1: Encoding / obfuscation detection ──────────────────────────

// Detect potential base64 (long alphanumeric+padding sequences)
const BASE64_RE = /(?:[A-Za-z0-9+/]{40,}={0,2})(?:[^.]|$)/

// Detect hex-encoded text (long hex strings)
const HEX_RE = /\b(?:[0-9a-fA-F]{2}\s?){20,}\b/

const LEET_DIGIT_MAP: Record<string, string> = {
  "0": "o", "1": "i", "2": "z", "3": "e", "4": "a",
  "5": "s", "6": "g", "7": "t", "8": "b", "9": "p",
}

// Common leetspeak substitutions map for normalisation (symbols always applied)
const LEET_SYMBOL_MAP: Record<string, string> = {
  "@": "a", "$": "s", "!": "i", "+": "t",
}

// Unicode homoglyph ranges that survive NFKC normalization.
// Fullwidth (FF01-FF5E) and Mathematical Alphanumerics (1D400-1D7FF) are
// converted to ASCII by NFKC, so they don't need to be here. But Cyrillic,
// Greek, Letterlike Symbols, etc. are NOT normalized by NFKC — we catch them.
const HOMOGLYPH_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x00c0, 0x024f], // Latin Extended-A/B (À-ɏ)
  [0x0250, 0x02af], // IPA Extensions
  [0x0370, 0x03ff], // Greek & Coptic
  [0x0400, 0x04ff], // Cyrillic
  [0x0500, 0x052f], // Cyrillic Supplement
  [0x1d00, 0x1d7f], // Phonetic Extensions
  [0x1e00, 0x1eff], // Latin Extended Additional
  [0x1f00, 0x1fff], // Greek Extended
  [0x2100, 0x214f], // Letterlike Symbols (ℂℍℕℙℚℝℤ)
  [0x2460, 0x24ff], // Enclosed Alphanumerics (①②③)
  [0x2c60, 0x2c7f], // Latin Extended-C
  [0xa720, 0xa7ff], // Latin Extended-D
  [0xab30, 0xab6f], // Latin Extended-E
]

/** Check if text contains obfuscated / encoded payloads. */
export function detectObfuscation(text: string): boolean {
  if (BASE64_RE.test(text)) return true

  const hexMatches = text.match(HEX_RE)
  if (hexMatches && hexMatches.some((m) => m.replace(/\s/g, "").length >= 24)) return true

  let homoglyphCount = 0
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0
    if (HOMOGLYPH_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi)) homoglyphCount++
  }
  if (text.length > 10 && homoglyphCount / text.length > 0.2) return true

  return false
}

/** Normalise leetspeak to plain text for pattern matching (NFKC first). */
export function normalizeLeet(text: string): string {
  const normalized = text.normalize("NFKC")

  // Tokenize: split on non-alphanumeric boundaries to isolate words/numbers.
  // Digits are only mapped to letters when they appear mixed with actual letters
  // (e.g. "1gn0r3" → "ignore"), not in purely numeric tokens ("2025", "Rp 25.000").
  const tokens: string[] = []
  let current = ""
  for (const ch of normalized) {
    const isAlphaNum = /[a-zA-Z0-9]/.test(ch)
    if (isAlphaNum) {
      current += ch
    } else {
      if (current) tokens.push(current)
      tokens.push(ch)
      current = ""
    }
  }
  if (current) tokens.push(current)

  const processed = tokens.map((token) => {
    // Purely numeric tokens pass through unchanged (preserve prices, years, etc.)
    if (/^[0-9]+$/.test(token)) return token
    // Apply symbol map to all tokens; digit map only to mixed/alphabetic tokens
    return token
      .split("")
      .map((ch) => {
        const lower = ch.toLowerCase()
        const symbolMapped = LEET_SYMBOL_MAP[lower]
        if (symbolMapped) return symbolMapped
        // Only apply digit-to-letter mapping when the token has at least one letter
        if (/[a-zA-Z]/.test(token)) {
          const digitMapped = LEET_DIGIT_MAP[lower]
          if (digitMapped) return digitMapped
        }
        return ch
      })
      .join("")
  })

  return processed.join("").toLowerCase()
}
