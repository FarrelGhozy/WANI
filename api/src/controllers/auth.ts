import type { Request, Response } from "express"
import type { z } from "zod"
import jwt from "jsonwebtoken"
import { UserModel } from "@/src/models/user"
import { sendResponse } from "@/src/utils/response"
import { hashPassword, verifyPassword } from "@/src/utils/auth"
import { BadRequestError, UnauthorizedError } from "@/src/utils/errors"
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/src/schemas/auth"

type RegisterBody = z.infer<typeof registerSchema>
type LoginBody = z.infer<typeof loginSchema>
type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>
type ResetPasswordBody = z.infer<typeof resetPasswordSchema>

const JWT_SECRET = process.env.JWT_SECRET ?? "wani-dev-secret-change-in-production"
const JWT_EXPIRES = "7d"

function signToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  })
}

export async function register(
  req: Request<Record<string, string>, any, RegisterBody>,
  res: Response,
): Promise<void> {
  const existing = await UserModel.findByEmail(req.body.email)
  if (existing) {
    throw new BadRequestError("email already registered")
  }

  const hashed = await hashPassword(req.body.password)

  const user = await UserModel.createUser({
    name: req.body.name,
    email: req.body.email,
    password: hashed,
  })

  const token = signToken({ id: user.id, email: user.email, role: user.role })

  sendResponse(res, 201, "registration successful", { token, user })
}

export async function login(
  req: Request<Record<string, string>, any, LoginBody>,
  res: Response,
): Promise<void> {
  const user = await UserModel.findByEmail(req.body.email)
  if (!user) {
    throw new UnauthorizedError("invalid email or password")
  }

  const valid = await verifyPassword(req.body.password, user.password)
  if (!valid) {
    throw new UnauthorizedError("invalid email or password")
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role })

  sendResponse(res, 200, "login successful", {
    token,
    user: UserModel.toPublic(user),
  })
}

export async function me(
  req: Request,
  res: Response,
): Promise<void> {
  const user = await UserModel.getById(req.user!.id)
  if (!user) {
    throw new UnauthorizedError("user not found")
  }
  sendResponse(res, 200, "user retrieved", UserModel.toPublic(user))
}

export async function logout(
  _req: Request,
  res: Response,
): Promise<void> {
  // Stateless JWT — client handles token removal
  sendResponse(res, 200, "logged out")
}

export async function forgotPassword(
  req: Request<Record<string, string>, any, ForgotPasswordBody>,
  res: Response,
): Promise<void> {
  const user = await UserModel.findByEmail(req.body.email)
  if (user) {
    const resetToken = crypto.randomUUID()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await UserModel.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: expires,
    })

    // TODO: send email with reset link
    // Log for development debugging
    console.log(`[DEV] Password reset token for ${req.body.email}: ${resetToken}`)
    sendResponse(res, 200, "reset link sent")
    return
  }

  // Always return success to prevent email enumeration
  sendResponse(res, 200, "reset link sent")
}

export async function resetPassword(
  req: Request<Record<string, string>, any, ResetPasswordBody>,
  res: Response,
): Promise<void> {
  const user = await UserModel.findByResetToken(req.body.token)
  if (!user) {
    throw new BadRequestError("invalid or expired reset token")
  }

  const hashed = await hashPassword(req.body.password)

  await UserModel.update(user.id, {
    password: hashed,
    resetPasswordToken: null,
    resetPasswordExpires: null,
  })

  sendResponse(res, 200, "password reset successful")
}
