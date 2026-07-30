import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Payment } from './payments'

// Уведомления строятся из реальных данных банка (список операций), а не из
// заранее прописанного списка. Локально храним только состояние «прочитано»
// и удалённые события — сами события каждый раз выводятся из выписки.

export type NotificationType = 'info' | 'success' | 'warning' | 'danger'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  timestamp: Date
  read: boolean
  /** Куда ведёт нажатие */
  link?: string
}

interface NotificationsState {
  readIds: string[]
  dismissedIds: string[]
  /** Показывать системные уведомления браузера при новых событиях */
  systemEnabled: boolean
  /** id событий, о которых система уже сообщала — чтобы не дублировать */
  notifiedIds: string[]

  markRead: (id: string) => void
  markAllRead: (ids: string[]) => void
  dismiss: (id: string) => void
  setSystemEnabled: (on: boolean) => void
  rememberNotified: (ids: string[]) => void
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      readIds: [],
      dismissedIds: [],
      systemEnabled: false,
      notifiedIds: [],

      markRead: (id) => set((s) => ({ readIds: [...new Set([...s.readIds, id])] })),
      markAllRead: (ids) => set((s) => ({ readIds: [...new Set([...s.readIds, ...ids])] })),
      dismiss: (id) => set((s) => ({ dismissedIds: [...new Set([...s.dismissedIds, id])] })),
      setSystemEnabled: (on) => set({ systemEnabled: on }),
      rememberNotified: (ids) =>
        set((s) => ({
          // Держим только последние 300 — иначе список растёт бесконечно
          notifiedIds: [...new Set([...s.notifiedIds, ...ids])].slice(-300),
        })),
    }),
    { name: 'centrinvest-notifications' }
  )
)

const fmtAmount = (amount: number, currency: string) => {
  const code = (currency || 'RUB').toUpperCase() === 'RUR' ? 'RUB' : (currency || 'RUB').toUpperCase()
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(Math.abs(amount))
  } catch {
    return `${Math.abs(amount)} ${code}`
  }
}

/**
 * Превращает операции из банка в события для экрана уведомлений.
 * Показываем то, что действительно требует внимания: подпись, отклонения,
 * поступления и недавно исполненные платежи.
 */
export function buildNotifications(payments: Payment[]): AppNotification[] {
  const events: AppNotification[] = []
  const RECENT_DAYS = 30
  const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000

  for (const p of payments) {
    const date = p.date instanceof Date ? p.date : new Date(p.date)
    const party = p.recipient?.name || 'контрагент'
    const sum = fmtAmount(p.amount, p.currency)

    if (p.status === 'created') {
      // Ожидает подписи — важно независимо от давности
      events.push({
        id: `sign:${p.id}`,
        title: 'Требуется подпись',
        message: `Платёж ${p.number ? `№${p.number} ` : ''}на ${sum} в адрес ${party} ожидает подписи`,
        type: 'warning',
        timestamp: date,
        read: false,
        link: `/payments/${encodeURIComponent(p.id)}`,
      })
      continue
    }

    if (p.status === 'rejected') {
      events.push({
        id: `rejected:${p.id}`,
        title: 'Платёж отклонён',
        message: `Платёж на ${sum} в адрес ${party} отклонён банком`,
        type: 'danger',
        timestamp: date,
        read: false,
        link: `/payments/${encodeURIComponent(p.id)}`,
      })
      continue
    }

    // Остальное — только за последний месяц, чтобы список не превращался в архив
    if (date.getTime() < cutoff) continue

    if (p.direction === 'in' || p.amount > 0) {
      events.push({
        id: `in:${p.id}`,
        title: 'Поступление',
        message: `${sum} от ${party}`,
        type: 'success',
        timestamp: date,
        read: false,
        link: `/payments/${encodeURIComponent(p.id)}`,
      })
    } else if (p.status === 'executed') {
      events.push({
        id: `out:${p.id}`,
        title: 'Платёж исполнен',
        message: `${sum} в адрес ${party}`,
        type: 'info',
        timestamp: date,
        read: false,
        link: `/payments/${encodeURIComponent(p.id)}`,
      })
    }
  }

  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/** Запрос разрешения на системные уведомления. Требует жеста пользователя. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

/**
 * Показывает системные уведомления о новых событиях.
 * Работает через service worker: на iOS уведомления доступны только
 * для установленного на домашний экран приложения (iOS 16.4+).
 */
export async function showSystemNotifications(items: AppNotification[]): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const registration = await navigator.serviceWorker.getRegistration().catch(() => null)

  for (const n of items.slice(0, 3)) {
    const options: NotificationOptions = {
      body: n.message,
      tag: n.id,
      data: { link: n.link },
      icon: `${import.meta.env.BASE_URL}icon-192.png`,
      badge: `${import.meta.env.BASE_URL}favicon-32.png`,
    }
    if (registration) {
      await registration.showNotification(n.title, options).catch(() => {})
    } else {
      // Без service worker'а (например, в обычной вкладке) — прямое уведомление
      try { new Notification(n.title, options) } catch { /* не поддерживается */ }
    }
  }
}
