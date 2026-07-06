import { Router } from "express"
import * as authController from "@/src/controllers/auth"
import { requireJwt } from "@/src/middleware/jwt"
import { validate } from "@/src/middleware/validate"
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
} from "@/src/schemas/auth"

const router = Router()

router.post("/register", validate({ body: registerSchema }), authController.register)
router.post("/login", validate({ body: loginSchema }), authController.login)
router.get("/me", requireJwt, authController.me)
router.post("/logout", authController.logout)
router.get("/verify-email", authController.verifyEmail)
router.post("/resend-verification", validate({ body: resendVerificationSchema }), authController.resendVerification)
router.post("/forgot-password", validate({ body: forgotPasswordSchema }), authController.forgotPassword)
router.post("/reset-password", validate({ body: resetPasswordSchema }), authController.resetPassword)

export default router
