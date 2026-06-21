import express from "express"
import helmet from "helmet"
import cors from "cors"
import morgan from "morgan"
import routes from "@/src/routes"
import { morganStream } from "@/src/config/logger"
import { errorHandler } from "@/src/middleware/error"
import { sendResponse } from "@/src/utils/response"

export const app = express()

app.disable("x-powered-by")
app.set("etag", false)

app.use(helmet())
app.use(cors())
app.use(morgan("short", { stream: morganStream }))
app.use(express.json())
app.use("/api", routes)

app.use((_req, res) => {
  sendResponse(res, 404, "not found")
})

app.use(errorHandler)
