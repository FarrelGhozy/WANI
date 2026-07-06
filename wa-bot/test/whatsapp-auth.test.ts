import { expect, test, describe, mock } from "bun:test"
import type { PrismaClient } from "@db/client"
import { usePrismaAuthState } from "@/src/services/whatsapp-auth"

function createMockDb(): PrismaClient {
  const db = {
    creds: {
      findUnique: mock<any>(() => null),
      upsert: mock<any>(() => ({ id: "pairing" })),
    },
    signalKey: {
      findMany: mock<any>(() => []),
      deleteMany: mock<any>(() => ({ count: 1 })),
      upsert: mock<any>(() => ({})),
    },
    $transaction: mock(() => {}),
    $disconnect: mock(() => {}),
  }
  return db as unknown as PrismaClient
}

describe("usePrismaAuthState", () => {
  test("returns state and saveCreds", async () => {
    const db = createMockDb()
    const { state, saveCreds } = await usePrismaAuthState(db)

    expect(state.creds).toBeDefined()
    expect(typeof (state.creds as any).registrationId).toBe("number")
    expect(state.keys).toBeDefined()
    expect(typeof state.keys.get).toBe("function")
    expect(typeof state.keys.set).toBe("function")
    expect(typeof saveCreds).toBe("function")
  })

  test("initializes creds when DB is empty", async () => {
    const db = createMockDb()
    await usePrismaAuthState(db)

    const findCall = (db as any).creds.findUnique.mock.calls[0]?.[0]
    expect(findCall).toBeDefined()
    expect(findCall.where).toEqual({ id: "pairing" })

    const upsertCall = (db as any).creds.upsert.mock.calls[0]?.[0]
    expect(upsertCall).toBeDefined()
    expect(upsertCall.where).toEqual({ id: "pairing" })
  })

  test("reads existing creds from DB", async () => {
    const credsData = { registrationId: 123, me: { id: "test-user" } }
    const db = createMockDb()
    ;(db.creds.findUnique as any) = mock(() => ({
      id: "pairing",
      data: JSON.stringify(credsData),
    }))

    const { state } = await usePrismaAuthState(db)

    expect((state.creds as any).registrationId).toBe(123)
    expect((state.creds as any).me?.id).toBe("test-user")
  })

  test("keys.get returns correct shape", async () => {
    const db = createMockDb()
    ;(db.signalKey.findMany as any) = mock(() => [
      { id: "k1", data: JSON.stringify({ key: "value1" }) },
      { id: "k2", data: JSON.stringify({ key: "value2" }) },
    ])

    const { state } = await usePrismaAuthState(db)
    const result = await state.keys.get("session", ["k1", "k2", "k3"])

    expect((result as any).k1).toEqual({ key: "value1" })
    expect((result as any).k2).toEqual({ key: "value2" })
    expect((result as any).k3).toBeNull()
  })

  test("keys.get with unknown type returns empty mapping", async () => {
    const db = createMockDb()
    const { state } = await usePrismaAuthState(db)

    const result = await state.keys.get("session", [])

    expect(result).toEqual({})
  })

  test("keys.set upserts non-null values", async () => {
    const db = createMockDb()
    const { state } = await usePrismaAuthState(db)

    await state.keys.set({
      session: {
        k1: new Uint8Array([1, 2, 3]),
        k2: new Uint8Array([4, 5, 6]),
      },
    })

    expect((db.signalKey.upsert as any)).toHaveBeenCalledTimes(2)
    expect((db.signalKey.upsert as any)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type_id: { type: "session", id: "k1" } },
        create: expect.objectContaining({ type: "session", id: "k1" }),
      }),
    )
  })

  test("keys.set deletes null values", async () => {
    const db = createMockDb()
    const { state } = await usePrismaAuthState(db)

    await state.keys.set({
      session: {
        k1: null,
      },
    })

    expect((db.signalKey.deleteMany as any)).toHaveBeenCalledTimes(1)
    expect((db.signalKey.deleteMany as any)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { type: "session", id: { in: ["k1"] } } }),
    )
  })

  test("keys.set handles mixed null and non-null", async () => {
    const db = createMockDb()
    const { state } = await usePrismaAuthState(db)

    await state.keys.set({
      session: {
        keep: new Uint8Array([1]),
        remove: null,
      },
    })

    expect((db.signalKey.upsert as any)).toHaveBeenCalledTimes(1)
    expect((db.signalKey.deleteMany as any)).toHaveBeenCalledTimes(1)
  })

  test("keys.set handles empty data", async () => {
    const db = createMockDb()
    const { state } = await usePrismaAuthState(db)

    await state.keys.set({})

    expect((db.signalKey.upsert as any)).not.toHaveBeenCalled()
    expect((db.signalKey.deleteMany as any)).not.toHaveBeenCalled()
  })

  test("saveCreds calls creds.upsert", async () => {
    const db = createMockDb()
    const { saveCreds } = await usePrismaAuthState(db)

    ;(db.creds.upsert as any).mockClear()
    await saveCreds()

    expect((db.creds.upsert as any)).toHaveBeenCalledTimes(1)
    expect((db.creds.upsert as any)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "pairing" } }),
    )
  })

  test("saveCreds serializes with BufferJSON.replacer", async () => {
    const db = createMockDb()
    const { saveCreds } = await usePrismaAuthState(db)

    ;(db.creds.upsert as any).mockClear()
    await saveCreds()

    const call = (db.creds.upsert as any).mock.calls[0]?.[0]
    expect(call).toBeDefined()
    expect(typeof call.create.data).toBe("string")
    expect(typeof call.update.data).toBe("string")
    expect(() => JSON.parse(call.create.data)).not.toThrow()
  })
})
