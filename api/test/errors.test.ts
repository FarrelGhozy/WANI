import { expect, test, describe } from "bun:test"
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} from "@/src/utils/errors"

describe("AppError", () => {
  test("creates with message and status code", () => {
    const err = new AppError("test error", 418)
    expect(err.message).toBe("test error")
    expect(err.statusCode).toBe(418)
    expect(err.name).toBe("AppError")
  })

  test("stores optional details", () => {
    const details = { field: "name" }
    const err = new AppError("validation failed", 400, details)
    expect(err.details).toEqual(details)
  })

  test("is instance of Error", () => {
    const err = new AppError("err", 500)
    expect(err).toBeInstanceOf(Error)
  })
})

describe("BadRequestError", () => {
  test("has status 400 and default message", () => {
    const err = new BadRequestError()
    expect(err.statusCode).toBe(400)
    expect(err.message).toBe("bad request")
    expect(err.name).toBe("BadRequestError")
  })

  test("accepts custom message and details", () => {
    const err = new BadRequestError("invalid email", { field: "email" })
    expect(err.message).toBe("invalid email")
    expect(err.details).toEqual({ field: "email" })
  })

  test("is instance of AppError", () => {
    expect(new BadRequestError()).toBeInstanceOf(AppError)
  })
})

describe("UnauthorizedError", () => {
  test("has status 401 and default message", () => {
    const err = new UnauthorizedError()
    expect(err.statusCode).toBe(401)
    expect(err.message).toBe("unauthorized")
    expect(err.name).toBe("UnauthorizedError")
  })

  test("accepts custom message", () => {
    const err = new UnauthorizedError("invalid token")
    expect(err.message).toBe("invalid token")
  })

  test("is instance of AppError", () => {
    expect(new UnauthorizedError()).toBeInstanceOf(AppError)
  })
})

describe("ForbiddenError", () => {
  test("has status 403 and default message", () => {
    const err = new ForbiddenError()
    expect(err.statusCode).toBe(403)
    expect(err.message).toBe("forbidden")
    expect(err.name).toBe("ForbiddenError")
  })

  test("is instance of AppError", () => {
    expect(new ForbiddenError()).toBeInstanceOf(AppError)
  })
})

describe("NotFoundError", () => {
  test("has status 404 and default message", () => {
    const err = new NotFoundError()
    expect(err.statusCode).toBe(404)
    expect(err.message).toBe("not found")
    expect(err.name).toBe("NotFoundError")
  })

  test("is instance of AppError", () => {
    expect(new NotFoundError()).toBeInstanceOf(AppError)
  })
})

describe("InternalServerError", () => {
  test("has status 500 and default message", () => {
    const err = new InternalServerError()
    expect(err.statusCode).toBe(500)
    expect(err.message).toBe("internal server error")
    expect(err.name).toBe("InternalServerError")
  })

  test("is instance of AppError", () => {
    expect(new InternalServerError()).toBeInstanceOf(AppError)
  })
})
