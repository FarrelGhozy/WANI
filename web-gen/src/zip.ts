import { createWriteStream, existsSync } from "node:fs"
import archiver from "archiver"
import type { ZipParams } from "./types.ts"

export function createZipStream(params: ZipParams): NodeJS.ReadableStream {
  if (!existsSync(params.sourceDir)) {
    throw new Error(`Source directory not found: ${params.sourceDir}`)
  }

  const archive = archiver("zip", { zlib: { level: 9 } })
  archive.directory(params.sourceDir, params.slug)
  archive.finalize()
  return archive
}

export async function createZipFile(params: ZipParams & { outputPath: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(params.outputPath)
    const archive = archiver("zip", { zlib: { level: 9 } })

    output.on("close", resolve)
    archive.on("error", reject)

    archive.pipe(output)
    archive.directory(params.sourceDir, params.slug)
    archive.finalize()
  })
}
