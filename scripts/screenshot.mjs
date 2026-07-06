import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
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

async function main() {
  const browser = await chromium.launch({ headless: true })

  for (const vp of VIEWPORTS) {
    const subDir = join(OUT, vp.label)
    mkdirSync(subDir, { recursive: true })
    console.log(`\n--- ${vp.label || 'Desktop'} (${vp.width}×${vp.height}) ---`)

    // ── Non-auth pages (separate context, no login) ──
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

    // ── Auth pages (login first) ──
    {
      const ctx = await browser.newContext()
      const page = await ctx.newPage()
      await page.setViewportSize({ width: vp.width, height: vp.height })

      // Login
      await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
      await sleep(1000)
      await page.fill('input[type="email"]', EMAIL)
      await page.fill('input[type="password"]', PASS)
      await page.click('button[type="submit"]')
      await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20000 })
      await waitForLoad(page)

      // 04-dashboard
      await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '04-dashboard.png'))

      // 05-products
      await page.goto(`${BASE}/products`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '05-products.png'))

      // 06-product-form
      await page.goto(`${BASE}/products/new`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '06-product-form.png'))

      // 07-orders
      await page.goto(`${BASE}/orders`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '07-orders.png'))

      // 08-order-detail — try to get first order ID
      let orderUrl = `${BASE}/orders`
      const orderLink = await page.$('a[href*="/orders/"]')
      if (orderLink) {
        const href = await orderLink.getAttribute('href')
        const id = href.split('/orders/')[1]
        if (id) orderUrl = `${BASE}/orders/${id}`
      }
      await page.goto(orderUrl, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '08-order-detail.png'))

      // 09-customers
      await page.goto(`${BASE}/customers`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '09-customers.png'))

      // 10-website
      await page.goto(`${BASE}/website`, { waitUntil: 'networkidle' })
      await waitForLoad(page)
      await screenshot(page, join(subDir, '10-website.png'))

      // 11-settings-store, 12-settings-ai, 13-settings-wa
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
  console.error('❌', err)
  process.exit(1)
})
