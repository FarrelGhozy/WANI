import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync, cpSync, rmSync } from "node:fs"
import { join } from "node:path"
import { spawnSync } from "node:child_process"

const TEMPLATES_DIR = join(import.meta.dir, "templates")
const TMP = join(import.meta.dir, "..", "tmp-css")

function escapeVar(v: string) {
  return v.replace(/[^a-zA-Z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
}

const templates = readdirSync(TEMPLATES_DIR).filter((d) =>
  existsSync(join(TEMPLATES_DIR, d, "code.html"))
)

for (const t of templates) {
  const tp = join(TEMPLATES_DIR, t)
  const html = readFileSync(join(tp, "code.html"), "utf-8")

  // collect custom color names from tailwind config JS object in the HTML
  const colorRegex = /(["'])?([a-zA-Z][a-zA-Z0-9-]*)\1:\s*"([^"]+)"/g
  const colors: Record<string, string> = {}
  let m: RegExpExecArray | null
  while ((m = colorRegex.exec(html)) !== null) {
    const key = m[2]
    const val = m[3]
    // skip non-color keys inside tailwind config
    if (/^(darkMode|DEFAULT|base|lg|xl|2xl|full|xs|sm|md|gutter|margin-)/
      .test(key) || val.startsWith("--")) continue
    colors[key] = val
  }

  // replace dynamic placeholders with CSS var references
  const cssVars: string[] = []
  const themeEntries: string[] = []
  for (const [name, val] of Object.entries(colors)) {
    const cssName = `twc-${escapeVar(name)}`
    if (val.includes("{{")) {
      // dynamic color — use CSS variable
      cssVars.push(`  --color-${name}: var(--${cssName}, #cccccc);`)
    } else {
      // static color — embed directly
      cssVars.push(`  --color-${name}: ${val};`)
    }
    themeEntries.push(`  --color-${name}: ${val};`)
  }

  // input.css
  const input = `@import "tailwindcss";
@source "./*.html";
@theme {
${cssVars.join("\n")}
}
`
  const inputDir = join(TMP, t)
  mkdirSync(inputDir, { recursive: true })
  writeFileSync(join(inputDir, "input.css"), input)

  // reference all page files
  const pages = readdirSync(tp).filter((f) => f.endsWith(".html") && !f.startsWith("_"))
  for (const p of pages) {
    const content = readFileSync(join(tp, p), "utf-8")
    // strip placeholders so class scanner still works
    const cleaned = content
      .replace(/\{\{[#^/].*?\}\}/g, "")
      .replace(/\{\{[a-zA-Z. ]+\}\}/g, "")
    writeFileSync(join(inputDir, p), cleaned)
  }

  // write a dummy file referencing all colors + common classes
  // so Tailwind generates all utility variants
  const allColorClasses = Object.keys(colors).flatMap((c) =>
    [`bg-${c}`, `text-${c}`, `border-${c}`, `hover:bg-${c}`, `hover:text-${c}`,
     `bg-${c}/20`, `text-${c}/80`, `border-${c}/50`,
     `active:bg-${c}`, `focus:ring-${c}`, `focus:border-${c}`,
     `shadow-${c}`, `outline-${c}`, `ring-${c}`,
    ]
  ).join(" ")
  // common responsive/state variants that templates use
  const commonClasses = "md:flex lg:grid-cols-2 sm:grid-cols-2 sm:col-span-2 hover:scale-105 active:scale-95 dark:bg-on-background"
  writeFileSync(join(inputDir, "_colors.html"),
    `<div class="${allColorClasses} ${commonClasses}"></div>`)

  // run tailwind CLI
  const outFile = join(tp, "assets", "tailwind.css")
  mkdirSync(join(tp, "assets"), { recursive: true })

  const r = spawnSync("npx", ["@tailwindcss/cli", "-i", join(inputDir, "input.css"), "-o", outFile], {
    cwd: inputDir,
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 60_000,
    env: { ...process.env, NODE_ENV: "production" },
  })

  if (r.status !== 0) {
    console.error(`[${t}] tailwind build failed:`, r.stderr?.toString() || r.stdout?.toString())
  } else {
    const size = (existsSync(outFile) ? readFileSync(outFile).length : 0) / 1024
    console.log(`[${t}] tailwind.css — ${size.toFixed(0)}KB`)
  }
}

// cleanup
rmSync(TMP, { recursive: true, force: true })
