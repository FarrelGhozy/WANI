import express from "express"
import helmet from "helmet"
import cors from "cors"
import morgan from "morgan"
import path from "node:path"
import routes from "@/src/routes"
import { morganStream } from "@/src/config/logger"
import { errorHandler } from "@/src/middleware/error"
import { sendResponse } from "@/src/utils/response"

export const app = express()

app.disable("x-powered-by")
app.set("etag", false)

app.use(helmet())
app.use(cors())
app.use(morgan(":method :url :status :response-time ms", { stream: morganStream }))
app.use(express.json())
app.use("/api", routes)

const generatedDir = path.resolve(import.meta.dir, "..", "generated-sites")
app.use("/s", express.static(generatedDir))

const uploadsDir = path.resolve(import.meta.dir, "..", "uploads")
app.use("/uploads", express.static(uploadsDir))

app.use((_req, res) => {
  sendResponse(res, 404, "not found")
})

app.use(errorHandler)
