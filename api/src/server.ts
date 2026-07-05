import express from "express"
import helmet from "helmet"
import cors from "cors"
import morgan from "morgan"
import { rateLimit } from "express-rate-limit"
import path from "node:path"
import routes from "@/src/routes"
import { morganStream } from "@/src/config/logger"
import { errorHandler } from "@/src/middleware/error"
import { sendResponse } from "@/src/utils/response"
import { metricsMiddleware } from "@/src/config/metrics"

export const app = express()

app.disable("x-powered-by")
app.set("etag", false)

app.use(metricsMiddleware)

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: {
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "fonts.gstatic.com"],
        fontSrc: ["'self'", "fonts.gstatic.com", "fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  })
)
app.use(cors())

const globalRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/api/monitoring/health",
})
app.use(globalRateLimit)

// Stricter rate limit for auth endpoints (brute force protection)
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login/register attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: "Too many auth attempts, please try again later",
})
app.use("/api/auth/login", authRateLimit)
app.use("/api/auth/register", authRateLimit)

// Stricter rate limit for forgot password (prevents email enumeration abuse)
const forgotPasswordRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 forgot password requests per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many password reset requests, please try again later",
})
app.use("/api/auth/forgot-password", forgotPasswordRateLimit)

app.use(morgan(":method :url :status :response-time ms", { stream: morganStream }))
app.use(express.json())
app.use("/api", routes)

const generatedDir = path.resolve(import.meta.dir, "..", "generated-sites")

app.use("/s/preview", (_req, res) => {
  res.redirect("/s/latest/")
})

app.use("/s", express.static(generatedDir))

const uploadsDir = path.resolve(process.cwd(), "uploads")
app.use("/uploads", express.static(uploadsDir))

app.use((_req, res) => {
  sendResponse(res, 404, "not found")
})

app.use(errorHandler)
