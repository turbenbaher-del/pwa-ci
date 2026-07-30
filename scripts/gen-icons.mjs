// Генератор иконок и splash-экранов PWA из брендового знака Центр-инвеста.
// Знак — левая часть логотипа (viewBox 0 0 27 30), цвета из брендбука v1.0.1.
// Запуск: node scripts/gen-icons.mjs   (нужен playwright-chromium)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

// playwright-chromium может стоять не в этом проекте, а рядом (в прокси).
// Путь к его node_modules можно передать через PW_MODULES.
const require = createRequire(import.meta.url)
const pwCandidates = [
  'playwright-chromium',
  ...(process.env.PW_MODULES ? [resolve(process.env.PW_MODULES, 'playwright-chromium')] : []),
]
let chromium
for (const id of pwCandidates) {
  try { chromium = require(id).chromium; break } catch { /* пробуем следующий */ }
}
if (!chromium) {
  throw new Error('playwright-chromium не найден. Задайте PW_MODULES=<путь к node_modules>')
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'public')
mkdirSync(OUT, { recursive: true })

const BRAND = {
  green: '#50B848',
  greenDark: '#3D8F37',
  white: '#FFFFFF',
}

// Вытаскиваем d= знака из готового Logo.tsx, чтобы иконки не расходились с логотипом в шапке.
const logoSrc = readFileSync(resolve(ROOT, 'src/components/Logo.tsx'), 'utf8')
const pathData = logoSrc.match(/d="([^"]+)"/)?.[1]
if (!pathData) throw new Error('Не нашёл path знака в src/components/Logo.tsx')

// viewBox 0 0 27 30 обрезает словесную часть логотипа, оставляя только знак.
const mark = (color) => `
  <svg viewBox="0 0 27 30" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    <path d="${pathData}" fill="${color}" />
  </svg>`

// pad — доля отступа от края (для maskable нужна безопасная зона)
const iconPage = (size, { pad, bg, fg, radius = 0 }) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${size}px; height:${size}px; }
  .box {
    width:${size}px; height:${size}px; border-radius:${radius}px;
    background:${bg}; display:flex; align-items:center; justify-content:center;
  }
  .mark { width:${Math.round(size * (1 - pad * 2))}px; height:${Math.round(size * (1 - pad * 2))}px;
          display:flex; align-items:center; justify-content:center; }
</style></head><body>
  <div class="box"><div class="mark">${mark(fg)}</div></div>
</body></html>`

const splashPage = (w, h) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:${w}px; height:${h}px; }
  .box { width:${w}px; height:${h}px; background:${BRAND.white};
         display:flex; flex-direction:column; align-items:center; justify-content:center; gap:${Math.round(h * 0.03)}px; }
  .mark { width:${Math.round(Math.min(w, h) * 0.28)}px; height:${Math.round(Math.min(w, h) * 0.28)}px; }
  .name { font-family:-apple-system,BlinkMacSystemFont,'Montserrat',sans-serif;
          font-weight:700; font-size:${Math.round(Math.min(w, h) * 0.055)}px; color:${BRAND.greenDark};
          letter-spacing:0.02em; }
</style></head><body>
  <div class="box">
    <div class="mark">${mark(BRAND.green)}</div>
    <div class="name">Центр-инвест</div>
  </div>
</body></html>`

const ICONS = [
  // Обычные иконки: брендовый зелёный фон, белый знак.
  { file: 'icon-192.png',          size: 192, opts: { pad: 0.18, bg: BRAND.green, fg: BRAND.white } },
  { file: 'icon-512.png',          size: 512, opts: { pad: 0.18, bg: BRAND.green, fg: BRAND.white } },
  // Maskable: знак внутри безопасной зоны (Android обрезает края по своей маске).
  { file: 'icon-maskable-192.png', size: 192, opts: { pad: 0.28, bg: BRAND.green, fg: BRAND.white } },
  { file: 'icon-maskable-512.png', size: 512, opts: { pad: 0.28, bg: BRAND.green, fg: BRAND.white } },
  // iOS: без прозрачности, система сама скругляет углы.
  { file: 'apple-touch-icon.png',  size: 180, opts: { pad: 0.18, bg: BRAND.green, fg: BRAND.white } },
  // Favicon-растр для старых браузеров.
  { file: 'favicon-32.png',        size: 32,  opts: { pad: 0.10, bg: BRAND.green, fg: BRAND.white } },
]

// Splash под актуальные iPhone (portrait): ширина × высота в CSS-пикселях × DPR.
const SPLASHES = [
  { file: 'splash-1290x2796.png', w: 1290, h: 2796 }, // 15/16 Pro Max, 14 Plus
  { file: 'splash-1179x2556.png', w: 1179, h: 2556 }, // 15/16 Pro
  { file: 'splash-1170x2532.png', w: 1170, h: 2532 }, // 13/14, 12
  { file: 'splash-1125x2436.png', w: 1125, h: 2436 }, // X, XS, 11 Pro
  { file: 'splash-750x1334.png',  w: 750,  h: 1334 }, // SE 2/3, 8
]

const browser = await chromium.launch()
try {
  for (const { file, size, opts } of ICONS) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 })
    await page.setContent(iconPage(size, opts))
    await page.screenshot({ path: resolve(OUT, file), omitBackground: false })
    await page.close()
    console.log(`✓ ${file} (${size}×${size})`)
  }

  for (const { file, w, h } of SPLASHES) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
    await page.setContent(splashPage(w, h))
    await page.screenshot({ path: resolve(OUT, file) })
    await page.close()
    console.log(`✓ ${file} (${w}×${h})`)
  }
} finally {
  await browser.close()
}

// Векторный favicon — самый качественный вариант для современных браузеров.
writeFileSync(
  resolve(OUT, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="${BRAND.green}"/>
  <svg x="5" y="4.5" width="22" height="23" viewBox="0 0 27 30">
    <path d="${pathData}" fill="${BRAND.white}"/>
  </svg>
</svg>\n`
)
console.log('✓ favicon.svg')
