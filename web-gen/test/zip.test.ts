import { expect, test, describe, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { createZipStream, createZipFile } from "../src/zip"

const testZipDir = join(import.meta.dir, "fixtures", "zip-test")
const testOutput = join(import.meta.dir, "fixtures", "output.zip")

describe("createZipStream", () => {
  beforeEach(() => {
    if (!existsSync(testZipDir)) {
      mkdirSync(testZipDir, { recursive: true })
      writeFileSync(join(testZipDir, "index.html"), "<html>Toko Test</html>")
      writeFileSync(join(testZipDir, "style.css"), "body { color: red; }")
    }
  })

  afterEach(() => {
    if (existsSync(testOutput)) rmSync(testOutput, { force: true })
  })

  test("returns a ReadableStream", () => {
    const stream = createZipStream({ sourceDir: testZipDir, slug: "test-toko" })
    expect(stream).toBeDefined()
    expect(typeof (stream as any).read).toBe("function")
    expect(typeof (stream as any).on).toBe("function")
  })

  test("throws error when source directory does not exist", () => {
    expect(() => createZipStream({ sourceDir: "/nonexistent/path", slug: "test" }))
      .toThrow("Source directory not found")
  })
})

describe("createZipFile", () => {
  beforeEach(() => {
    if (!existsSync(testZipDir)) {
      mkdirSync(testZipDir, { recursive: true })
      writeFileSync(join(testZipDir, "index.html"), "<html>Toko Test</html>")
    }
  })

  afterEach(() => {
    if (existsSync(testOutput)) rmSync(testOutput, { force: true })
  })

  test("writes a zip file to disk", async () => {
    await createZipFile({
      sourceDir: testZipDir,
      slug: "test-toko",
      outputPath: testOutput,
    })

    expect(existsSync(testOutput)).toBe(true)

    // Verify it's a valid ZIP file (starts with PK magic bytes)
    const buffer = await Bun.file(testOutput).arrayBuffer()
    const header = new Uint8Array(buffer).slice(0, 2)
    expect(header[0]).toBe(0x50) // 'P'
    expect(header[1]).toBe(0x4b) // 'K'
  })
})
