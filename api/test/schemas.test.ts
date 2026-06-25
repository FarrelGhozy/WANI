import { expect, test, describe } from "bun:test"
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/src/schemas/auth"
import { createProductSchema, updateProductSchema, productQuerySchema, createCategorySchema, updateCategorySchema } from "@/src/schemas/product"
import { orderQuerySchema, updateOrderStatusSchema, updateOrderNotesSchema, updateOrderPaymentSchema } from "@/src/schemas/order"
import { customerQuerySchema, updateCustomerSchema, updateConversationStatusSchema, sendMessageSchema } from "@/src/schemas/customer"
import { updateWebsiteSchema, generateWebsiteSchema } from "@/src/schemas/website"

// ── Auth Schemas ─────────────────────────────────────────

describe("registerSchema", () => {
  test("validates valid registration", async () => {
    const result = await registerSchema.safeParseAsync({ name: "Budi", email: "budi@test.com", password: "secret123" })
    expect(result.success).toBe(true)
  })

  test("rejects short password", async () => {
    const result = await registerSchema.safeParseAsync({ name: "Budi", email: "budi@test.com", password: "123" })
    expect(result.success).toBe(false)
  })

  test("rejects invalid email", async () => {
    const result = await registerSchema.safeParseAsync({ name: "Budi", email: "not-email", password: "secret123" })
    expect(result.success).toBe(false)
  })

  test("rejects empty name", async () => {
    const result = await registerSchema.safeParseAsync({ name: "", email: "b@b.com", password: "secret123" })
    expect(result.success).toBe(false)
  })
})

describe("loginSchema", () => {
  test("validates valid login", async () => {
    const result = await loginSchema.safeParseAsync({ email: "b@b.com", password: "x" })
    expect(result.success).toBe(true)
  })

  test("rejects missing email", async () => {
    const result = await loginSchema.safeParseAsync({ password: "x" })
    expect(result.success).toBe(false)
  })
})

describe("forgotPasswordSchema", () => {
  test("validates email", async () => {
    expect((await forgotPasswordSchema.safeParseAsync({ email: "a@b.com" })).success).toBe(true)
    expect((await forgotPasswordSchema.safeParseAsync({ email: "bad" })).success).toBe(false)
  })
})

describe("resetPasswordSchema", () => {
  test("validates token + password", async () => {
    expect((await resetPasswordSchema.safeParseAsync({ token: "abc", password: "newpass123" })).success).toBe(true)
    expect((await resetPasswordSchema.safeParseAsync({ token: "", password: "newpass123" })).success).toBe(false)
    expect((await resetPasswordSchema.safeParseAsync({ token: "abc", password: "short" })).success).toBe(false)
  })
})

// ── Product Schemas ──────────────────────────────────────

describe("createProductSchema", () => {
  test("validates valid product", async () => {
    const result = await createProductSchema.safeParseAsync({ name: "Nasi Goreng", price: 25000 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.stock).toBe(0)
      expect(result.data.isAvailable).toBe(true)
    }
  })

  test("rejects missing name", async () => {
    const result = await createProductSchema.safeParseAsync({ price: 25000 })
    expect(result.success).toBe(false)
  })

  test("rejects negative price", async () => {
    const result = await createProductSchema.safeParseAsync({ name: "X", price: -1 })
    expect(result.success).toBe(false)
  })

  test("accepts optional fields", async () => {
    const result = await createProductSchema.safeParseAsync({
      name: "Kopi",
      price: 15000,
      categoryId: "cat-1",
      description: "Enak",
      stock: 10,
      isAvailable: false,
      imageUrl: "https://example.com/img.jpg",
    })
    expect(result.success).toBe(true)
  })
})

describe("updateProductSchema", () => {
  test("allows partial update", async () => {
    const result = await updateProductSchema.safeParseAsync({ price: 30000 })
    expect(result.success).toBe(true)
  })

  test("rejects empty object (all fields optional)", async () => {
    const result = await updateProductSchema.safeParseAsync({})
    expect(result.success).toBe(true)
  })
})

describe("productQuerySchema", () => {
  test("applies defaults", async () => {
    const result = await productQuerySchema.safeParseAsync({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe("1")
      expect(result.data.limit).toBe("20")
      expect(result.data.sort).toBe("createdAt")
      expect(result.data.order).toBe("desc")
    }
  })

  test("validates isAvailable as enum string", async () => {
    const r1 = await productQuerySchema.safeParseAsync({ isAvailable: "true" })
    expect(r1.success).toBe(true)
    const r2 = await productQuerySchema.safeParseAsync({ isAvailable: "false" })
    expect(r2.success).toBe(true)
    const r3 = await productQuerySchema.safeParseAsync({ isAvailable: "yes" })
    expect(r3.success).toBe(false)
  })

  test("validates page as string digit pattern", async () => {
    const result = await productQuerySchema.safeParseAsync({ page: "3" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe("3")
    }
  })
})

describe("createCategorySchema", () => {
  test("validates name required", async () => {
    expect((await createCategorySchema.safeParseAsync({ name: "Minuman" })).success).toBe(true)
    expect((await createCategorySchema.safeParseAsync({})).success).toBe(false)
  })
})

describe("updateCategorySchema", () => {
  test("allows partial update", async () => {
    expect((await updateCategorySchema.safeParseAsync({ name: "Baru" })).success).toBe(true)
    expect((await updateCategorySchema.safeParseAsync({})).success).toBe(true)
  })
})

// ── Order Schemas ─────────────────────────────────────────

describe("orderQuerySchema", () => {
  test("applies defaults", async () => {
    const result = await orderQuerySchema.safeParseAsync({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe("1")
      expect(result.data.sort).toBe("createdAt")
    }
  })

  test("validates valid status", async () => {
    const result = await orderQuerySchema.safeParseAsync({ status: "PENDING" })
    expect(result.success).toBe(true)
  })

  test("rejects invalid status", async () => {
    const result = await orderQuerySchema.safeParseAsync({ status: "INVALID" })
    expect(result.success).toBe(false)
  })
})

describe("updateOrderStatusSchema", () => {
  test("validates valid statuses", async () => {
    for (const s of ["PENDING", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"]) {
      const result = await updateOrderStatusSchema.safeParseAsync({ status: s })
      expect(result.success).toBe(true)
    }
  })

  test("rejects invalid status", async () => {
    const result = await updateOrderStatusSchema.safeParseAsync({ status: "SHIPPED" })
    expect(result.success).toBe(false)
  })
})

describe("updateOrderNotesSchema", () => {
  test("validates notes required", async () => {
    expect((await updateOrderNotesSchema.safeParseAsync({ notes: "tolong cepat" })).success).toBe(true)
    expect((await updateOrderNotesSchema.safeParseAsync({})).success).toBe(false)
  })
})

describe("updateOrderPaymentSchema", () => {
  test("validates valid payment", async () => {
    const result = await updateOrderPaymentSchema.safeParseAsync({
      method: "TRANSFER",
      amount: 50000,
      status: "PAID",
    })
    expect(result.success).toBe(true)
  })

  test("rejects invalid method", async () => {
    const result = await updateOrderPaymentSchema.safeParseAsync({
      method: "CREDIT_CARD",
      amount: 50000,
      status: "PAID",
    })
    expect(result.success).toBe(false)
  })

  test("rejects negative amount", async () => {
    const result = await updateOrderPaymentSchema.safeParseAsync({
      method: "CASH",
      amount: -100,
      status: "PENDING",
    })
    expect(result.success).toBe(false)
  })
})

// ── Customer Schemas ──────────────────────────────────────

describe("customerQuerySchema", () => {
  test("applies defaults", async () => {
    const result = await customerQuerySchema.safeParseAsync({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe("1")
      expect(result.data.sort).toBe("createdAt")
    }
  })
})

describe("updateCustomerSchema", () => {
  test("validates name or notes", async () => {
    expect((await updateCustomerSchema.safeParseAsync({ name: "Baru" })).success).toBe(true)
    expect((await updateCustomerSchema.safeParseAsync({ notes: "pelanggan tetap" })).success).toBe(true)
    expect((await updateCustomerSchema.safeParseAsync({ name: "" })).success).toBe(false)
  })
})

describe("updateConversationStatusSchema", () => {
  test("validates valid statuses", async () => {
    for (const s of ["ACTIVE", "RESOLVED", "ARCHIVED", "ESCALATED"]) {
      const result = await updateConversationStatusSchema.safeParseAsync({ status: s })
      expect(result.success).toBe(true)
    }
  })

  test("rejects invalid status", async () => {
    const result = await updateConversationStatusSchema.safeParseAsync({ status: "CLOSED" })
    expect(result.success).toBe(false)
  })
})

describe("sendMessageSchema", () => {
  test("validates text required", async () => {
    expect((await sendMessageSchema.safeParseAsync({ text: "Halo" })).success).toBe(true)
    expect((await sendMessageSchema.safeParseAsync({ text: "" })).success).toBe(false)
    expect((await sendMessageSchema.safeParseAsync({})).success).toBe(false)
  })
})

// ── Website Schemas ───────────────────────────────────────

describe("updateWebsiteSchema", () => {
  test("validates full config", async () => {
    const result = await updateWebsiteSchema.safeParseAsync({
      heroHeadline: "Selamat Datang",
      heroSubheadline: "Toko Kami",
      aboutText: "Tentang kami",
      primaryColor: "#059669",
      secondaryColor: "#f59e0b",
      phone: "08123456789",
      selectedProductIds: ["p1", "p2"],
      template: "default",
    })
    expect(result.success).toBe(true)
  })

  test("rejects invalid hex color", async () => {
    const r1 = await updateWebsiteSchema.safeParseAsync({ primaryColor: "red" })
    expect(r1.success).toBe(false)
    const r2 = await updateWebsiteSchema.safeParseAsync({ primaryColor: "#GGGGGG" })
    expect(r2.success).toBe(false)
  })

  test("allows partial update", async () => {
    const result = await updateWebsiteSchema.safeParseAsync({ heroHeadline: "Halo" })
    expect(result.success).toBe(true)
  })
})

describe("generateWebsiteSchema", () => {
  test("defaults to default template", async () => {
    const result = await generateWebsiteSchema.safeParseAsync({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.template).toBe("default")
    }
  })

  test("accepts custom template", async () => {
    const result = await generateWebsiteSchema.safeParseAsync({ template: "minimal" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.template).toBe("minimal")
    }
  })
})
