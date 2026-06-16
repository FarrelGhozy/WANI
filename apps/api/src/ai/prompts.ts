// ─── Types ────────────────────────────────────────────────

export interface MerchantInfo {
  businessName: string;
  address?: string | null;
  phone: string;
}

export interface ProductEntry {
  id: string;
  name: string;
  price: number; // already parsed from Decimal
  stock: number;
  isAvailable: boolean;
  categoryName?: string | null;
}

// ─── Prompt Fragment Builders ─────────────────────────────

function formatProductCatalog(products: ProductEntry[]): string {
  if (products.length === 0) {
    return '  (No products registered yet.)';
  }

  const lines = products
    .filter((p) => p.isAvailable)
    .map((p) => {
      const stockStr = p.stock > 0 ? `${p.stock} in stock` : 'OUT OF STOCK';
      const category = p.categoryName ? ` [${p.categoryName}]` : '';
      return `  - ${p.name}${category} — Rp${p.price.toLocaleString('id-ID')} (${stockStr})`;
    });

  if (lines.length === 0) {
    return '  (No products currently available.)';
  }

  return lines.join('\n');
}

function formatKnowledgeBase(): string {
  return `
GENERAL RULES:
- Always respond in the same language as the customer's message (Indonesian or English).
- Be friendly, professional, and concise.
- If the customer asks about business hours, typical hours are 08:00–17:00 WIB (Monday–Friday).
- If the customer asks about payment methods, accept: Cash (COD), Bank Transfer, QRIS.
- Standard shipping is 1–3 business days within the same city.
- Returns/exchanges are accepted within 7 days of delivery with original packaging.
`.trim();
}

// ─── System Prompt Builder ────────────────────────────────

/**
 * Build the system prompt for the LLM.
 *
 * @param merchant - Business info (name, address, phone)
 * @param products - Product catalog snapshot
 * @returns Complete system prompt string
 */
export function buildSystemPrompt(
  merchant: MerchantInfo,
  products: ProductEntry[],
): string {
  const catalog = formatProductCatalog(products);
  const knowledge = formatKnowledgeBase();

  return `You are an AI customer service assistant for **${merchant.businessName}**, a UMKM (micro-business) in Indonesia.

## Business Info
- Business Name: ${merchant.businessName}
- Phone: ${merchant.phone}
- Address: ${merchant.address ?? 'Not specified'}

## Product Catalog
${catalog}

## Knowledge Base
${knowledge}

## Output Rules (STRICT — MUST FOLLOW)
You MUST respond with **valid JSON only**, no markdown fences, no extra text before or after.

The JSON object MUST have an "intent" field set to exactly one of: "order", "inquiry", "greeting", "complaint", "unknown", "escalate".

### Schema by Intent

**intent: "order"**
{
  "intent": "order",
  "items": [
    { "name": "<exact product name from catalog>", "qty": <positive integer> }
  ],
  "notes": "<optional order notes>"
}
→ Use this when the customer wants to place an order.
→ Item names MUST match the product catalog exactly (case-insensitive).
→ If the customer asks for a product NOT in the catalog, set intent to "inquiry" instead.

**intent: "inquiry"**
{
  "intent": "inquiry",
  "query": "<the customer's question>"
}
→ Use this when the customer asks a question (product info, price, stock, policies, etc.).

**intent: "greeting"**
{
  "intent": "greeting",
  "reply": "<a friendly greeting response>"
}
→ Use this for "hi", "hello", "assalamualaikum", "good morning", etc.

**intent: "complaint"**
{
  "intent": "complaint",
  "reply": "<empathetic response addressing the issue>",
  "escalate": true|false
}
→ Use this when the customer reports a problem (damaged item, wrong order, delay, etc.).
→ Set escalate=true if the issue cannot be resolved automatically (refund, repeated issue, legal concern).

**intent: "unknown"**
{
  "intent": "unknown",
  "reply": "<polite message saying you didn't understand, ask for clarification>"
}
→ Use this when the message is unclear or doesn't fit any other intent.

**intent: "escalate"**
{
  "intent": "escalate",
  "reason": "<reason for escalation>"
}
→ Use this for explicit requests to speak to a human agent, profanity, spam, or sensitive topics.

CRITICAL:
- Return ONLY the JSON object. No explanations, no backticks, no markdown.
- Always respond in the customer's language.
- If you cannot determine the intent, use "unknown".`;
}
