import { expect, test, describe, mock, afterEach } from "bun:test"

const mockUpsert = mock((args: any) =>
  Promise.resolve({ id: "default", qr: null, status: "disconnected", phone: null, updatedAt: new Date() }),
)

mock.module("@/src/config/db", () => ({
  prisma: {
    waSession: {
      upsert: mockUpsert,
      findUnique: mock((args: any) =>
        Promise.resolve({ id: "default", qr: null, status: "disconnected", phone: "628123456789", updatedAt: new Date() }),
      ),
    },
  } as any,
}))

import { WaSessionModel } from "@/src/models/wa-session"

describe("WaSessionModel.upsert", () => {
  afterEach(() => {
    mockUpsert.mockClear()
  })

  test("upsert with phone passes phone to prisma", async () => {
    await WaSessionModel.upsert({ qr: null, status: "disconnected", phone: null })

    expect(mockUpsert).toHaveBeenCalledTimes(1)
    const call = mockUpsert.mock.calls[0]?.[0]
    expect(call.where).toEqual({ id: "default" })
    expect(call.update).toMatchObject({
      qr: null,
      status: "disconnected",
      phone: null,
    })
  })

  test("upsert without phone does not include phone in update", async () => {
    await WaSessionModel.upsert({ qr: null, status: "disconnected" })

    expect(mockUpsert).toHaveBeenCalledTimes(1)
    const call = mockUpsert.mock.calls[0]?.[0]
    expect(call.update).toEqual({
      qr: null,
      status: "disconnected",
    })
    expect(call.update).not.toHaveProperty("phone")
  })

  test("upsert status connecting has defaults in create", async () => {
    await WaSessionModel.upsert({ status: "connecting" })

    expect(mockUpsert).toHaveBeenCalledTimes(1)
    const call = mockUpsert.mock.calls[0]?.[0]
    expect(call.create).toMatchObject({
      id: "default",
      qr: null,
      status: "connecting",
      phone: null,
    })
  })
})
