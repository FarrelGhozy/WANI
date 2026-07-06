import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = 'http://localhost:5173'
const OUT = join(__dirname, '..', 'screenshoot')
const EMAIL = 'farrelafif05@gmail.com'
const PASS = 'inisaya01'

const VIEWPORTS = [
  { label: '', width: 1280, height: 720 },
  { label: 'mobile/', width: 390, height: 844 },
]

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function screenshot(page, filepath) {
  await page.screenshot({ path: filepath, fullPage: true })
  console.log(`  ✓ ${filepath}`)
}

async function waitForLoad(page) {
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  await sleep(2000)
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await sleep(1500)
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')
  // wait for either redirect OR error message
  try {
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })
  } catch {
    // check if there's an error message on the page
    const errorEl = await page.$('.text-red-700, [class*="error"]')
    const errorText = errorEl ? await errorEl.textContent() : 'unknown error'
    console.error(`  ! Login failed: ${errorText}`)
    throw new Error(`Login failed: ${errorText}`)
  }
  await waitForLoad(page)
}

async function main() {
  const browser = await chromium.launch({ headless: true })

  for (const vp of VIEWPORTS) {
    const subDir = join(OUT, vp.label)
    mkdirSync(subDir, { recursive: true })
    console.log(`\n--- ${vp.label || 'Desktop'} (${vp.width}×${vp.height}) ---`)

    // ── Non-auth pages ──
    {
      const ctx = await browser.newContext()
      const page = await ctx.newPage()
      await page.setViewportSize({ width: vp.width, height: vp.height })

      await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '01-login.png'))

      await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '02-signup.png'))

      await page.goto(`${BASE}/forgot-password`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '03-forgot-password.png'))

      await page.close()
      await ctx.close()
    }

    // ── Auth pages ──
    {
      const ctx = await browser.newContext()
      const page = await ctx.newPage()
      await page.setViewportSize({ width: vp.width, height: vp.height })

      await login(page)

      await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '04-dashboard.png'))

      await page.goto(`${BASE}/products`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '05-products.png'))

      await page.goto(`${BASE}/products/new`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '06-product-form.png'))

      await page.goto(`${BASE}/orders`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '07-orders.png'))

      // order detail
      const orderLink = await page.$('a[href*="/orders/"]')
      if (orderLink) {
        const href = await orderLink.getAttribute('href')
        await page.goto(`${BASE}${href}`, { waitUntil: 'networkidle' })
      }
      await waitForLoad(page)
      await screenshot(page, join(subDir, '08-order-detail.png'))

      await page.goto(`${BASE}/customers`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '09-customers.png'))

      await page.goto(`${BASE}/website`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '10-website.png'))

      await page.goto(`${BASE}/settings?tab=store`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '11-settings-store.png'))

      await page.goto(`${BASE}/settings?tab=ai`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '12-settings-ai.png'))

      await page.goto(`${BASE}/settings?tab=wa`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '13-settings-wa.png'))

      await page.close()
      await ctx.close()
    }
  }

  console.log('\n✅ Semua screenshot selesai!')
  await browser.close()
}

main().catch(err => {
  console.error('❌', err.message)
  process.exit(1)
})
