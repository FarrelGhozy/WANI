import { env } from "@/src/config/env"

/**
 * Split text into overlapping chunks suitable for embedding.
 * Splits on sentence boundaries (., !, ?, newline) to keep semantic units intact.
 */
export function splitIntoChunks(
  text: string,
  opts?: { chunkSize?: number; overlap?: number },
): string[] {
  const chunkSize = opts?.chunkSize ?? env.rag.chunkSize
  const overlap = opts?.overlap ?? env.rag.chunkOverlap

  const sentences = text
    .split(/(?<=[.!?])\s+|\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (sentences.length === 0) return []

  const chunks: string[] = []
  let current = ""

  for (const sentence of sentences) {
    if (current.length + sentence.length + 1 > chunkSize && current.length > 0) {
      chunks.push(current.trim())
      const tail = current.slice(-overlap)
      current = tail + " " + sentence
    } else {
      current = current ? current + " " + sentence : sentence
    }
    // Hard split if a single sentence exceeds chunkSize
    while (current.length > chunkSize) {
      chunks.push(current.slice(0, chunkSize).trim())
      current = current.slice(chunkSize - overlap)
    }
  }

  if (current.trim()) chunks.push(current.trim())
  return chunks
}