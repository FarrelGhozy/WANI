import { describe, expect, test } from "bun:test"
import { splitIntoChunks } from "@/src/ai/chunker"

describe("chunker", () => {
  test("empty string → empty array", () => {
    expect(splitIntoChunks("")).toEqual([])
    expect(splitIntoChunks("   ")).toEqual([])
  })

  test("single short sentence → one chunk", () => {
    expect(splitIntoChunks("Hello world.")).toEqual(["Hello world."])
  })

  test("multiple sentences within chunkSize → one chunk", () => {
    const text = "Foo bar. Baz qux. Hello world."
    const result = splitIntoChunks(text, { chunkSize: 500, overlap: 100 })
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(text)
  })

  test("splits when exceeding chunkSize", () => {
    const text = "Sentence one. Sentence two. Sentence three. Sentence four."
    const result = splitIntoChunks(text, { chunkSize: 25, overlap: 5 })
    expect(result.length).toBeGreaterThan(1)
    for (const chunk of result) {
      // Each chunk (except possibly the last) should not exceed chunkSize by much
      expect(chunk.length).toBeLessThanOrEqual(30)
    }
  })

  test("overlap is included between chunks", () => {
    const text = "Alpha beta gamma. Delta epsilon zeta. Eta theta iota."
    const result = splitIntoChunks(text, { chunkSize: 30, overlap: 10 })
    if (result.length > 1) {
      const tail = result[0]!.slice(-10).trim()
      // Second chunk should start with some overlap from the first
      expect(result[1]).toContain(tail.slice(-5))
    }
  })

  test("hard splits long sentence exceeding chunkSize", () => {
    const long = "A".repeat(1200)
    const result = splitIntoChunks(long, { chunkSize: 500, overlap: 100 })
    expect(result.length).toBeGreaterThan(1)
    expect(result[0]!.length).toBe(500)
  })

  test("newline breaks treated as sentence boundaries", () => {
    const text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
    const result = splitIntoChunks(text, { chunkSize: 25, overlap: 5 })
    expect(result.length).toBeGreaterThanOrEqual(2)
  })
})