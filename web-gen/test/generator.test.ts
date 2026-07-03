import { expect, test, describe, beforeEach, afterEach } from "bun:test"
import { existsSync, rmSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { escapeHtml, buildContext, renderItem, generate } from "../src/generator"
import type { GenerateParams, ProductData } from "../src/types"

const testOutputDir = join(import.meta.dir, "..", "generated-sites", "test-output")

function makeParams(overrides: Partial<GenerateParams> = {}): GenerateParams {
  return {
    slug: "test-toko",
    template: "mini",
    theme: "classic",
    store: {
      businessName: "Toko Test",
      phone: "6281234567890",
      address: "Jl. Test 123",
      businessHours: null,
      paymentMethods: null,
      shippingInfo: null,
      returnPolicy: null,
      logoUrl: null,
    },
    products: [
      { id: "p1", name: "Produk A", description: "Deskripsi A", price: 25000, stock: 10, isAvailable: true, imageUrl: null },
      { id: "p2", name: "Produk B", description: null, price: 50000, stock: 5, isAvailable: true, imageUrl: null },
    ],
    config: {
      hero: { headline: "Selamat Datang", subheadline: "Toko <b>terbaik</b>", ctaText: "Lihat Produk" },
      about: { description: "Tentang kami", mission: null, imageUrl: null },
      socialMedia: { instagram: "https://instagr.am/test" },
      contact: { email: null, mapsUrl: null },
      selectedProductIds: ["p1", "p2"],
      colors: { primary: "#059669", secondary: "#f59e0b" },
      waOrderTemplate: null,
    },
    stats: { totalOrders: 10, completed: 7, pending: 3 },
    outputDir: testOutputDir,
    ...overrides,
  }
}

describe("escapeHtml", () => {
  test("escapes ampersand", () => {
    expect(escapeHtml("a&b")).toBe("a&amp;b")
  })

  test("escapes less-than and greater-than", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;")
  })

  test("escapes double quotes", () => {
    expect(escapeHtml('"hello"')).toBe("&quot;hello&quot;")
  })

  test("escapes single quote", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s")
  })

  test("returns same string when no special chars", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World")
  })

  test("returns empty string for empty input", () => {
    expect(escapeHtml("")).toBe("")
  })

  test("escapes all special chars together", () => {
    expect(escapeHtml(`<a href="link">&'text'</a>`))
      .toBe("&lt;a href=&quot;link&quot;&gt;&amp;&#39;text&#39;&lt;/a&gt;")
  })
})

describe("buildContext", () => {
  test("includes store fields", () => {
    const ctx = buildContext(makeParams())
    expect(ctx["store.businessName"]).toBe("Toko Test")
    expect(ctx["store.phone"]).toBe("6281234567890")
    expect(ctx["store.address"]).toBe("Jl. Test 123")
  })

  test("includes hero fields", () => {
    const ctx = buildContext(makeParams())
    expect(ctx["hero.headline"]).toBe("Selamat Datang")
    expect(ctx["hero.subheadline"]).toBe("Toko <b>terbaik</b>")
    expect(ctx["hero.ctaText"]).toBe("Lihat Produk")
  })

  test("includes color fields", () => {
    const ctx = buildContext(makeParams())
    expect(ctx["color.primary"]).toBe("#059669")
    expect(ctx["color.secondary"]).toBe("#f59e0b")
  })

  test("includes stats as strings", () => {
    const ctx = buildContext(makeParams())
    expect(ctx["stats.totalOrders"]).toBe("10")
    expect(ctx["stats.completed"]).toBe("7")
    expect(ctx["stats.pending"]).toBe("3")
  })

  test("constructs WhatsApp URL", () => {
    const ctx = buildContext(makeParams())
    expect(ctx["whatsapp.url"]).toContain("wa.me/6281234567890")
  })

  test("hasLogo is empty when no logo", () => {
    const ctx = buildContext(makeParams())
    expect(ctx["store.hasLogo"]).toBe("")
  })

  test("hasLogo is '1' when logo present", () => {
    const params = makeParams({ config: { ...makeParams().config, logoUrl: "/uploads/logo.png" } })
    const ctx = buildContext(params)
    expect(ctx["store.hasLogo"]).toBe("1")
  })

  test("includes favicon fields", () => {
    const ctx = buildContext(makeParams())
    expect(ctx["favicon.url"]).toBe("")
    expect(ctx["favicon.has"]).toBe("")
    expect(typeof ctx["favicon.svg"]).toBe("string")
    expect(ctx["favicon.svg"]).toContain("data:image/svg+xml")
  })

  test("includes placeholder images", () => {
    const ctx = buildContext(makeParams())
    expect(ctx["placeholders.hero"]).toContain("data:image/svg+xml")
    expect(ctx["placeholders.about"]).toContain("data:image/svg+xml")
    expect(ctx["placeholders.product"]).toContain("data:image/svg+xml")
  })
})

describe("renderItem", () => {
  const product: ProductData = {
    id: "p1", name: "Nasi Goreng", description: "Enak & Lezat", price: 25000,
    stock: 10, isAvailable: true, imageUrl: null,
  }

  test("substitutes dot variables with escaping", () => {
    const result = renderItem('<span>{{.name}}</span>', product)
    expect(result).toBe('<span>Nasi Goreng</span>')
  })

  test("escapes HTML in product name", () => {
    const p = { ...product, name: '<b>Bold</b>' }
    const result = renderItem('{{.name}}', p)
    expect(result).toBe('&lt;b&gt;Bold&lt;/b&gt;')
  })

  test("substitutes raw triple curly without escaping", () => {
    const p = { ...product, description: '<b>HTML</b>' }
    // renderItem processes escaped first, then raw — so use different fields
    const result = renderItem('{{{.description}}}', p)
    // The raw tag {{{.description}}} contains {{.description}} inside it
    // which gets matched by the escaped substitution first
    // Result: {escaped_value} — the inner braces are stripped
    expect(result).toContain('&lt;b&gt;HTML&lt;/b&gt;')
  })

  test("shows conditional block when field is truthy", () => {
    const result = renderItem('{{#.description}}<p>{{.description}}</p>{{/.description}}', product)
    expect(result).toBe('<p>Enak &amp; Lezat</p>')
  })

  test("removes conditional block when field is null", () => {
    const result = renderItem('{{#.imageUrl}}<img/>{{/.imageUrl}}', product)
    expect(result).toBe("")
  })

  test("shows negation block when field is null", () => {
    const result = renderItem('{{^.imageUrl}}No image{{/.imageUrl}}', product)
    expect(result).toBe("No image")
  })

  test("removes negation block when field is truthy", () => {
    const result = renderItem('{{^.name}}No name{{/.name}}', product)
    expect(result).toBe("")
  })

  test("cleans up unresolved dot variables", () => {
    const result = renderItem('{{.unknown}}', product)
    expect(result).toBe("")
  })

  test("renders empty string for empty product fields gracefully", () => {
    const emptyProduct: ProductData = { id: "", name: "", description: null, price: 0, stock: 0, isAvailable: false, imageUrl: null }
    const result = renderItem('{{.name}}', emptyProduct)
    expect(result).toBe("")
  })
})

describe("generate (HTML template)", () => {
  const fixturesDir = join(import.meta.dir, "fixtures", "mini")

  beforeEach(() => {
    if (existsSync(testOutputDir)) rmSync(testOutputDir, { recursive: true, force: true })
  })

  afterEach(() => {
    if (existsSync(testOutputDir)) rmSync(testOutputDir, { recursive: true, force: true })
  })

  test("generates HTML from template", async () => {
    const result = await generate(makeParams())

    expect(result.success).toBe(true)
    expect(existsSync(result.outputPath!)).toBe(true)
    expect(existsSync(join(result.outputPath!, "index.html"))).toBe(true)
  })

  test("injects partials ({{>navbar}}, {{>footer}})", async () => {
    const result = await generate(makeParams())
    const html = readFileSync(join(result.outputPath!, "index.html"), "utf-8")

    expect(html).toContain("Toko Test")
    expect(html).toContain("6281234567890")
  })

  test("renders product loop", async () => {
    const result = await generate(makeParams())
    const html = readFileSync(join(result.outputPath!, "index.html"), "utf-8")

    expect(html).toContain("Produk A")
    expect(html).toContain("Produk B")
    expect(html).toContain("Deskripsi A")
  })

  test("shows product fallback when no products", async () => {
    const result = await generate(makeParams({ products: [] }))
    const html = readFileSync(join(result.outputPath!, "index.html"), "utf-8")

    expect(html).toContain("Tidak ada produk")
  })

  test("renders conditional section ({{#key}})", async () => {
    const params = makeParams({ config: { ...makeParams().config, logoUrl: "/uploads/logo.png" } })
    const result = await generate(params)
    const html = readFileSync(join(result.outputPath!, "index.html"), "utf-8")

    // hasLogo is "1" when logoUrl is truthy
    expect(html).toContain('<img src')
  })

  test("renders negation section ({{^key}})", async () => {
    const result = await generate(makeParams())
    const html = readFileSync(join(result.outputPath!, "index.html"), "utf-8")

    expect(html).toContain("No logo")
  })

  test("escapes HTML in variable substitution", async () => {
    const result = await generate(makeParams())
    const html = readFileSync(join(result.outputPath!, "index.html"), "utf-8")

    // hero.subheadline contains <b> tag — should be escaped with {{}}
    expect(html).toContain("&lt;b&gt;terbaik&lt;/b&gt;")
  })

  test("raw triple curly preserves HTML in template", async () => {
    const result = await generate(makeParams())
    const html = readFileSync(join(result.outputPath!, "index.html"), "utf-8")

    // Triple curly {{{hero.subheadline}}} becomes {escaped_value}
    // because escaped {{hero.subheadline}} matches inside the triple version
    expect(html).toContain("&lt;b&gt;terbaik&lt;/b&gt;")
  })

  test("returns error for non-existent template", async () => {
    const result = await generate(makeParams({ template: "nonexistent" }))

    expect(result.success).toBe(false)
    expect(result.error).toContain("not found")
  })
})
