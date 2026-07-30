export const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001'

// Токен доступа к прокси (PROXY_TOKEN на сервере). Без него прокси отвечает 401.
const PROXY_TOKEN = import.meta.env.VITE_PROXY_TOKEN || ''

/** Заголовки авторизации прокси. Используются всеми запросами к банку. */
export function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  if (PROXY_TOKEN) headers.set('Authorization', `Bearer ${PROXY_TOKEN}`)
  return headers
}

/** URL эндпоинта прокси — для случаев, когда нужен не JSON. */
export function proxyUrl(path: string): string {
  return `${PROXY_URL}${path}`
}

/** Запрос к прокси с авторизацией и разбором ошибок в человеческий текст. */
export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = authHeaders(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(proxyUrl(path), { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({} as { error?: string }))
    if (res.status === 401) {
      throw new Error(body.error || 'Прокси отклонил запрос: проверьте VITE_PROXY_TOKEN')
    }
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  return res.json()
}

/** Тот же запрос, но возвращает файл: выписка приходит потоком, а не JSON. */
export async function apiFetchBlob(path: string, options: RequestInit = {}) {
  const res = await fetch(proxyUrl(path), { ...options, headers: authHeaders(options.headers) })
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as { error?: string }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  const blob = await res.blob()
  // Имя файла банк присылает в Content-Disposition (RFC 5987, UTF-8)
  const disposition = res.headers.get('content-disposition') || ''
  const match = disposition.match(/filename\*=UTF-8''([^;]+)/i) || disposition.match(/filename="?([^";]+)"?/i)
  const filename = match ? decodeURIComponent(match[1]) : ''
  return { blob, filename }
}
