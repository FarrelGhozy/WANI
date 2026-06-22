// ─── PII detection & redaction ──────────────────────────────────────────

export interface PiiMatch {
  type: "phone" | "email" | "api_key" | "nik" | "address"
  value: string
  start: number
  end: number
}

const PHONE_RE = /\b(?:\+?62|0)8[1-9][0-9]{6,11}\b/g
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
const API_KEY_RE = /\b(?:sk-[a-zA-Z0-9]{20,}|pk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|[\w-]{20,}={0,2})\b/g
const NIK_RE = /\b[1-9][0-9]{15}\b/g
const ADDRESS_RE = /\b(?:Jl\.|Jalan|Gg\.|Gang|Dusun|Desa|Kel\.|Kelurahan|Kec\.|Kecamatan|RT\s*\d+\s*\/?\s*RW\s*\d+)\s+.{3,80}/gi

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const REDACT_TOKENS = [
  "api_key", "apikey", "secret", "token", "password", "credential",
  "authorization", "x-api-key", "bearer",
].map(escapeRe)

const CREDENTIAL_RE = new RegExp(
  `\\b(?:${REDACT_TOKENS.join("|")})\\s*[:=]\\s*\\S+`,
  "gi",
)

const ALL_PATTERNS: Array<{ type: PiiMatch["type"]; re: RegExp }> = [
  { type: "api_key", re: API_KEY_RE },
  { type: "phone", re: PHONE_RE },
  { type: "email", re: EMAIL_RE },
  { type: "nik", re: NIK_RE },
  { type: "address", re: ADDRESS_RE },
  { type: "api_key", re: CREDENTIAL_RE },
]

/** Scan text for PII — returns all matches. */
export function scanPii(text: string): PiiMatch[] {
  const matches: PiiMatch[] = []

  for (const { type, re } of ALL_PATTERNS) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      matches.push({ type, value: m[0], start: m.index, end: m.index + m[0].length })
    }
  }

  return matches.sort((a, b) => a.start - b.start)
}

/** Check if text contains any PII. */
export function hasPii(text: string): boolean {
  for (const { re } of ALL_PATTERNS) {
    re.lastIndex = 0
    if (re.test(text)) return true
  }
  return false
}

/** Redact PII matches by replacing with type labels. Returns redacted text + audit trail. */
export function redactPii(text: string): { text: string; matches: PiiMatch[] } {
  const matches = scanPii(text)
  if (matches.length === 0) return { text, matches }

  const redacted = matches.reduceRight((acc, m) => {
    const label = `[${m.type.toUpperCase()}]`
    return acc.slice(0, m.start) + label + acc.slice(m.end)
  }, text)

  return { text: redacted, matches }
}
