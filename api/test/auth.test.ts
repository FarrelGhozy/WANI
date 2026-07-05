import { expect, test, describe } from "bun:test"
import jwt from "jsonwebtoken"
import { UserModel } from "@/src/models/user"

const JWT_SECRET = "test-jwt-secret"

// ── JWT sign/verify ──────────────────────────────────────────

describe("JWT token", () => {
  function signToken(user: { id: string; email: string; role: string }): string {
    return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" })
  }

  test("signs and verifies a valid token", () => {
    const user = { id: "u1", email: "admin@wani.com", role: "admin" }
    const token = signToken(user)

    const decoded = jwt.verify(token, JWT_SECRET) as any
    expect(decoded.id).toBe("u1")
    expect(decoded.email).toBe("admin@wani.com")
    expect(decoded.role).toBe("admin")
  })

  test("rejects token signed with wrong secret", () => {
    const token = signToken({ id: "u1", email: "a@b.com", role: "admin" })
    expect(() => jwt.verify(token, "wrong-secret")).toThrow()
  })

  test("rejects expired token", () => {
    const token = jwt.sign({ id: "u1" }, JWT_SECRET, { expiresIn: "0s" })
    expect(() => jwt.verify(token, JWT_SECRET)).toThrow("jwt expired")
  })

  test("decodes token payload without verification", () => {
    const token = signToken({ id: "u1", email: "a@b.com", role: "user" })
    const decoded = jwt.decode(token) as any
    expect(decoded.id).toBe("u1")
    expect(decoded.email).toBe("a@b.com")
  })

  test("handles malformed token", () => {
    expect(() => jwt.verify("not-a-token", JWT_SECRET)).toThrow()
  })

  test("token contains iat and exp claims", () => {
    const token = signToken({ id: "u1", email: "a@b.com", role: "admin" })
    const decoded = jwt.decode(token) as any
    expect(decoded.iat).toBeTruthy()
    expect(decoded.exp).toBeTruthy()
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60)
  })
})

// ── UserModel.toPublic ───────────────────────────────────────

describe("UserModel.toPublic", () => {
  test("strips password field", () => {
    const user = { id: "u1", name: "Budi", email: "b@b.com", password: "secret", role: "admin" }
    const pub = UserModel.toPublic(user as any)
    expect(pub).toEqual({ id: "u1", name: "Budi", email: "b@b.com", role: "admin" })
    expect((pub as any).password).toBeUndefined()
  })

  test("returns correct shape", () => {
    const user = { id: "u1", name: "Siti", email: "s@b.com", role: "admin" }
    const pub = UserModel.toPublic(user)
    expect(Object.keys(pub)).toEqual(["id", "name", "email", "role"])
  })
})

// ── Bun.password functionality (integration check) ─────────

describe("Bun password hashing", () => {
  test("hashes and verifies password", async () => {
    const password = "rahasia123"
    const hash = await Bun.password.hash(password, { algorithm: "bcrypt", cost: 5 })
    expect(hash).toBeTruthy()
    expect(hash).not.toBe(password)

    const match = await Bun.password.verify(password, hash)
    expect(match).toBe(true)
  })

  test("rejects wrong password", async () => {
    const hash = await Bun.password.hash("correct", { algorithm: "bcrypt", cost: 5 })
    const match = await Bun.password.verify("wrong", hash)
    expect(match).toBe(false)
  })

  test("produces different hashes for same password", async () => {
    const pw = "samepassword"
    const h1 = await Bun.password.hash(pw, { algorithm: "bcrypt", cost: 5 })
    const h2 = await Bun.password.hash(pw, { algorithm: "bcrypt", cost: 5 })
    expect(h1).not.toBe(h2)
  })
})
