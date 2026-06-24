import { expect, test, describe } from "bun:test"
import { sendResponse } from "@/src/utils/response"

function mockRes() {
  let statusCode = 200
  let body: unknown
  return {
    status: (code: number) => {
      statusCode = code
      return { json: (data: unknown) => { body = data } }
    },
    getStatus: () => statusCode,
    getBody: () => body,
  }
}

describe("sendResponse", () => {
  test("returns success for status < 400", () => {
    const res = mockRes() as any
    sendResponse(res, 200, "ok", { id: 1 })
    expect(res.getStatus()).toBe(200)
    const body = res.getBody() as any
    expect(body.status).toBe("success")
    expect(body.message).toBe("ok")
    expect(body.data).toEqual({ id: 1 })
  })

  test("returns failure for status >= 400", () => {
    const res = mockRes() as any
    sendResponse(res, 400, "bad request")
    expect(res.getStatus()).toBe(400)
    const body = res.getBody() as any
    expect(body.status).toBe("failure")
    expect(body.message).toBe("bad request")
  })

  test("sets data to null when omitted", () => {
    const res = mockRes() as any
    sendResponse(res, 201, "created")
    const body = res.getBody() as any
    expect(body.data).toBeNull()
  })

  test("passes through data when provided", () => {
    const res = mockRes() as any
    const data = { items: [1, 2, 3], total: 3 }
    sendResponse(res, 200, "list", data)
    const body = res.getBody() as any
    expect(body.data).toEqual(data)
  })

  test("handles 500 status", () => {
    const res = mockRes() as any
    sendResponse(res, 500, "internal error")
    expect(res.getStatus()).toBe(500)
    const body = res.getBody() as any
    expect(body.status).toBe("failure")
  })

  test("handles 201 status", () => {
    const res = mockRes() as any
    sendResponse(res, 201, "created", { id: "abc" })
    expect(res.getStatus()).toBe(201)
    const body = res.getBody() as any
    expect(body.status).toBe("success")
  })
})
