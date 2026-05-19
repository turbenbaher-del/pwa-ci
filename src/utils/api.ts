export const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001'

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${PROXY_URL}${path}`, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}
