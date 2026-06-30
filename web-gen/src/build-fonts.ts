import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
const OUT = join(dirname(import.meta.dir), "src", "assets", "fonts")

const SPECS = [
  ["Inter", "Inter:wght@100..900"],
  ["Plus Jakarta Sans", "Plus+Jakarta+Sans:wght@200..800"],
  ["JetBrains Mono", "JetBrains+Mono:wght@100..800"],
  ["Bodoni Moda", "Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900"],
  ["Playfair Display", "Playfair+Display:ital,wght@0,400;0,700;1,400"],
  ["Outfit", "Outfit:wght@100..900"],
  ["Material Symbols Outlined", "Material+Symbols+Outlined:wght,FILL@100..700,0..1"],
]

mkdirSync(OUT, { recursive: true })

const blocks: string[] = []
const downloaded = new Set<string>()

for (const [, spec] of SPECS) {
  const url = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`
  const resp = await fetch(url, { headers: { "User-Agent": UA } })
  if (!resp.ok) { console.warn(`fetch failed for ${spec}: ${resp.status}`); continue }
  const css = await resp.text()

  const regex = /@font-face\s*\{([\s\S]*?)\}/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(css))) {
    let block = m[1].trim()
    const urlM = block.match(/url\(([^)]+)\)/)
    if (!urlM) continue
    const remote = urlM[1]
    const name = remote.split("/").pop()!
    const local = join(OUT, name)
    if (!downloaded.has(name) && !existsSync(local)) {
      const fr = await fetch(remote)
      if (!fr.ok) { console.warn(`download failed for ${name}: ${fr.status}`); continue }
      writeFileSync(local, new Uint8Array(await fr.arrayBuffer()))
      downloaded.add(name)
    }
    block = block.replace(urlM[0], `url("./${name}")`)
    blocks.push(`@font-face {${block}}`)
  }
}

writeFileSync(join(OUT, "fonts.css"), blocks.join("\n\n") + "\n")
console.log(`fonts.css — ${blocks.length} @font-face rules, ${downloaded.size} files`)
