import type { Request, Response } from "express"
import path from "node:path"
import fs from "node:fs/promises"
import multer from "multer"
import { sendResponse } from "@/src/utils/response"
import { BadRequestError } from "@/src/utils/errors"

const UPLOADS_DIR = path.resolve(import.meta.dir, "..", "..", "uploads")

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(UPLOADS_DIR, { recursive: true })
    cb(null, UPLOADS_DIR)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".png"
    const prefix = typeof req.body?.prefix === "string" && /^[a-z0-9]+$/.test(req.body.prefix)
      ? req.body.prefix
      : "qris"
    cb(null, `${prefix}-${crypto.randomUUID()}${ext}`)
  },
})

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new BadRequestError("tipe file tidak valid. Hanya PNG, JPEG, WebP"))
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
})

export async function uploadFile(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new BadRequestError("file wajib diupload")
  }

  sendResponse(res, 201, "file uploaded", { url: `/uploads/${req.file.filename}` })
}
