// Скриншоты приложения: и для проверки вёрстки, и для screenshots в манифесте
// (Chrome без них показывает урезанное окно установки).
// Запуск: node scripts/gen-screenshots.mjs [url]
//   PW_MODULES=<путь> — если playwright-chromium стоит в соседнем проекте
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
let chromium
for (const id of ['playwright-chromium', ...(process.env.PW_MODULES ? [resolve(process.env.PW_MODULES, 'playwright-chromium')] : [])]) {
  try { chromium = require(id).chromium; break } catch { /* дальше */ }
}
if (!chromium) throw new Error('playwright-chromium не найден. Задайте PW_MODULES=<путь к node_modules>')

const URL_BASE = (process.argv[2] || 'http://127.0.0.1:4173/pwa-ci/').replace(/\/$/, '') + '/'
const SHOTS = resolve(ROOT, 'public')          // screenshots для манифеста
const REVIEW = resolve(ROOT, '.review')        // рабочие скриншоты для глазами-проверки
mkdirSync(SHOTS, { recursive: true })
mkdirSync(REVIEW, { recursive: true })

const browser = await chromium.launch()

// iPhone 14/15 Pro: 393×852 CSS-пикселя, DPR 3
const phone = await browser.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'ru-RU',
})

const page = await phone.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))

await page.goto(URL_BASE, { waitUntil: 'networkidle' })
await page.screenshot({ path: resolve(REVIEW, '01-login.png') })

// Демо-режим: прокликать интерфейс без обращения к реальному банку
await page.getByRole('button', { name: /демо/i }).click()
await page.waitForTimeout(1200)

const ROUTES = [
  ['02-dashboard',   ''],
  ['03-accounts',    'accounts'],
  ['04-payments',    'payments'],
  ['05-create',      'payments/create'],
  ['06-contractors', 'contractors'],
  ['07-statements',  'statements'],
  ['08-analytics',   'analytics'],
  ['09-tariffs',     'tariffs'],
  ['10-settings',    'settings'],
]

for (const [name, route] of ROUTES) {
  await page.goto(URL_BASE + route, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await page.screenshot({ path: resolve(REVIEW, `${name}.png`) })
  console.log(`✓ ${name}`)
}

// Узкий скриншот для манифеста — с главной
await page.goto(URL_BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await page.screenshot({ path: resolve(SHOTS, 'screenshot-mobile.png') })
console.log('✓ screenshot-mobile.png (393×852)')

// Широкий скриншот для манифеста
const desktop = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'ru-RU' })
const dpage = await desktop.newPage()
await dpage.goto(URL_BASE, { waitUntil: 'networkidle' })
await dpage.getByRole('button', { name: /демо/i }).click().catch(() => {})
await dpage.waitForTimeout(1200)
await dpage.goto(URL_BASE, { waitUntil: 'networkidle' })
await dpage.waitForTimeout(600)
await dpage.screenshot({ path: resolve(SHOTS, 'screenshot-desktop.png') })
console.log('✓ screenshot-desktop.png (1280×720)')

await browser.close()

if (errors.length) {
  console.log('\n⚠ Ошибки в консоли:')
  for (const e of [...new Set(errors)]) console.log('  ' + e)
} else {
  console.log('\nОшибок в консоли нет.')
}
