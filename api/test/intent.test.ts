import { expect, test, describe } from "bun:test"
import type { LLMOutput } from "@/src/types/ai"

interface TestCase {
  text: string
  expectedIntent: LLMOutput["intent"]
  lang: "en" | "id"
}

const testCases: TestCase[] = [
  // Greetings
  { text: "Halo", expectedIntent: "greeting", lang: "id" },
  { text: "Assalamualaikum", expectedIntent: "greeting", lang: "id" },
  { text: "Selamat pagi", expectedIntent: "greeting", lang: "id" },
  { text: "Hi", expectedIntent: "greeting", lang: "en" },
  { text: "Good morning", expectedIntent: "greeting", lang: "en" },

  // Orders
  { text: "Mau pesan nasi goreng 2", expectedIntent: "order", lang: "id" },
  { text: "Saya mau order ayam geprek 1 dan es teh 2", expectedIntent: "order", lang: "id" },
  { text: "I want to order 1 coffee", expectedIntent: "order", lang: "en" },
  { text: "Pesan 3 pisang goreng", expectedIntent: "order", lang: "id" },

  // Inquiries
  { text: "Berapa harga nasi goreng?", expectedIntent: "inquiry", lang: "id" },
  { text: "Apa saja menu yang tersedia?", expectedIntent: "inquiry", lang: "id" },
  { text: "Jam buka sampai jam berapa?", expectedIntent: "inquiry", lang: "id" },
  { text: "How much is the coffee?", expectedIntent: "inquiry", lang: "en" },
  { text: "Apakah ada menu vegetarian?", expectedIntent: "inquiry", lang: "id" },

  // Complaints
  { text: "Pesanan saya salah, saya pesan nasi goreng tapi dikasih mie", expectedIntent: "complaint", lang: "id" },
  { text: "Makanannya dingin dan tidak enak", expectedIntent: "complaint", lang: "id" },
  { text: "The food is cold and late", expectedIntent: "complaint", lang: "en" },
  { text: "Saya mau refund pesanan saya", expectedIntent: "complaint", lang: "id" },

  // Escalate
  { text: "Saya mau bicara dengan manusia", expectedIntent: "escalate", lang: "id" },
  { text: "Customer service nya dimana? Saya mau komplain langsung", expectedIntent: "escalate", lang: "id" },
  { text: "Talk to a human now", expectedIntent: "escalate", lang: "en" },

  // Unknown
  { text: "Kfjslkdjf jfklsdjf", expectedIntent: "unknown", lang: "id" },
  { text: "12345", expectedIntent: "unknown", lang: "en" },
]

describe("intent classification evaluation", () => {
  const apiKey = process.env.OPENROUTER_API_KEY

  test("test cases exist", () => {
    expect(testCases.length).toBeGreaterThan(0)
    expect(testCases.every((tc) => tc.expectedIntent)).toBe(true)
  })

  test("all intents are covered", () => {
    const intents = new Set(testCases.map((tc) => tc.expectedIntent))
    expect(intents.has("greeting")).toBe(true)
    expect(intents.has("order")).toBe(true)
    expect(intents.has("inquiry")).toBe(true)
    expect(intents.has("complaint")).toBe(true)
    expect(intents.has("escalate")).toBe(true)
    expect(intents.has("unknown")).toBe(true)
  })

  test.skipIf(!apiKey)("requires OPENROUTER_API_KEY for live eval", () => {
    expect(apiKey).toBeTruthy()
  })
})
