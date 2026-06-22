export interface ScanResult {
  blocked: boolean
  reasons: string[]
}

export type ScanVerdict = "SAFE" | "UNCERTAIN" | "BLOCK"

export interface OutputScanResult {
  blocked: boolean
  reason: string | null
}
