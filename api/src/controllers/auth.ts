import type { Request, Response } from "express"
import type { z } from "zod"
import jwt from "jsonwebtoken"
import { UserModel } from "@/src/models/user"
import { StoreModel } from "@/src/models/store"
import { sendResponse } from "@/src/utils/response"
import { hashPassword, verifyPassword } from "@/src/utils/auth"
import { sendEmail } from "@/src/services/email"
import { BadRequestError, ForbiddenError, UnauthorizedError } from "@/src/utils/errors"
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} from "@/src/schemas/auth"

type RegisterBody = z.infer<typeof registerSchema>
type LoginBody = z.infer<typeof loginSchema>
type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>
type ResetPasswordBody = z.infer<typeof resetPasswordSchema>
type ResendVerificationBody = z.infer<typeof resendVerificationSchema>

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (secret) return secret
  throw new Error("JWT_SECRET not configured")
}

function createResetUrl(origin: string | undefined, token: string): string {
  const base = origin ?? "https://wani.app"
  return `${base}/reset-password?token=${token}`
}

function createVerificationUrl(origin: string | undefined, token: string): string {
  const base = origin ?? "https://wani.app"
  return `${base}/verify-email?token=${token}`
}

function signToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES || "7d" } as jwt.SignOptions,
  )
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

  await StoreModel.upsertByOwner(user.id, {
    businessName: req.body.name || "Toko",
    phone: "",
  })

  const verificationToken = crypto.randomUUID()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await UserModel.update(user.id, {
    emailVerificationToken: verificationToken,
    emailVerificationExpires: expires,
  })

  const verifyUrl = createVerificationUrl(req.headers.origin, verificationToken)
  await sendEmail(
    user.email,
    "Selamat Datang di WANI — Verifikasi Email Anda",
    `<p>Hai ${user.name},</p>
<p>Terima kasih telah mendaftar di WANI! Silakan verifikasi email Anda dengan mengklik link di bawah:</p>
<p><a href="${verifyUrl}">${verifyUrl}</a></p>
<p>Link ini berlaku 24 jam. Jika Anda tidak mendaftar di WANI, abaikan email ini.</p>
<br>
<p>Salam,<br>Tim WANI</p>`,
  )

  sendResponse(res, 201, "registration successful, please check your email", null)
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

  if (!user.emailVerified) {
    throw new ForbiddenError("email not verified, please check your email")
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
  if (!req.user) throw new UnauthorizedError("not authenticated")
  const user = await UserModel.getById<{ id: string; name: string; email: string; role: string }>(req.user.id)
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

    const resetUrl = createResetUrl(req.headers.origin, resetToken)
    await sendEmail(
      user.email,
      "Reset Password WANI",
      `<p>Hai ${user.name},</p>
<p>Kamu meminta reset password. Klik link berikut untuk melanjutkan:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Link ini berlaku 1 jam. Jika kamu tidak meminta reset password, abaikan email ini.</p>
<br>
<p>Salam,<br>Tim WANI</p>`,
    )
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

export async function verifyEmail(
  req: Request<Record<string, string>, any, any, { token?: string }>,
  res: Response,
): Promise<void> {
  const token = req.query.token
  if (!token) {
    throw new BadRequestError("verification token is required")
  }

  const user = await UserModel.findByVerificationToken(token)
  if (!user) {
    throw new BadRequestError("invalid or expired verification token")
  }

  await UserModel.update(user.id, {
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpires: null,
  })

  sendResponse(res, 200, "email verified successfully, you can now login")
}

export async function resendVerification(
  req: Request<Record<string, string>, any, ResendVerificationBody>,
  res: Response,
): Promise<void> {
  const user = await UserModel.findByEmail(req.body.email)

  if (user && !user.emailVerified) {
    const verificationToken = crypto.randomUUID()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await UserModel.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: expires,
    })

    const verifyUrl = createVerificationUrl(req.headers.origin, verificationToken)
    await sendEmail(
      user.email,
      "Verifikasi Email WANI",
      `<p>Hai ${user.name},</p>
<p>Berikut link verifikasi email yang baru:</p>
<p><a href="${verifyUrl}">${verifyUrl}</a></p>
<p>Link ini berlaku 24 jam. Jika Anda tidak meminta ulang, abaikan email ini.</p>
<br>
<p>Salam,<br>Tim WANI</p>`,
    )
  }

  // Always return success to prevent email enumeration
  sendResponse(res, 200, "verification email sent")
}
