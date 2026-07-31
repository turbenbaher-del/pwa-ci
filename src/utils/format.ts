// Банк отдаёт устаревший код RUR — в ISO-4217 и Intl это RUB.
export function normalizeCurrency(currency?: string): string {
  const c = (currency || 'RUB').toUpperCase()
  return c === 'RUR' ? 'RUB' : c
}

export function formatCurrency(amount: number, currency: string = 'RUB'): string {
  const code = normalizeCurrency(currency)
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  } catch {
    // Незнакомый код валюты не должен ломать экран — показываем сумму с кодом
    return `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} ${code}`
  }
}

/** Счёт открыт? Банк отдаёт статус по-разному: 'active', 'Открыт', 'ОТКРЫТ'. */
export function isAccountOpen(status?: string): boolean {
  const s = (status || '').trim().toLowerCase()
  return s === 'active' || s === 'открыт' || s === 'действующий'
}

/** Русская подпись статуса счёта вместо сырого 'active' из API. */
export function accountStatusLabel(status?: string): string {
  const s = (status || '').trim().toLowerCase()
  if (isAccountOpen(status)) return 'Открыт'
  if (s === 'closed' || s === 'закрыт') return 'Закрыт'
  if (s === 'blocked' || s === 'заблокирован') return 'Заблокирован'
  return status || '—'
}

/**
 * Суммарный остаток по рублёвым счетам.
 * Валюты складывать нельзя: без курса это не сумма, а бессмысленное число.
 */
export function sumRubleBalance(accounts: { currency: string; balance: number }[]): number {
  return accounts
    .filter(a => normalizeCurrency(a.currency) === 'RUB')
    .reduce((sum, a) => sum + a.balance, 0)
}

/** Склонение существительного при числе: 1 счёт, 2 счёта, 5 счетов. */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return many
  if (last > 1 && last < 5) return few
  if (last === 1) return one
  return many
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length !== 11) return phone
  return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`
}

export function formatAccountNumber(account: string): string {
  return account.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()
}

export function formatBIC(bic: string): string {
  return bic.replace(/\D/g, '')
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ru-RU')
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('ru-RU')
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function abbreviateName(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n.charAt(0).toUpperCase())
    .join('')
}

// Convert ALL-CAPS Russian name to Title Case: "ПОПЕНКОВ СЕРГЕЙ" → "Попенков Сергей".
// Аббревиатуры правовых форм остаются капсом: "ООО РОМАШКА" → "ООО Ромашка", а не "Ооо Ромашка".
export function toTitleCase(name: string): string {
  return name
    .split(' ')
    .map(w => {
      if (w.length === 0) return ''
      if (isOrgForm(w)) return w.toUpperCase()
      return w[0].toUpperCase() + w.slice(1).toLowerCase()
    })
    .join(' ')
}

// Extract first name from "SURNAME FIRSTNAME [PATRONYMIC]" bank format
export function getFirstName(name: string): string {
  const parts = toTitleCase(name).split(' ')
  return parts[1] ?? parts[0] ?? name
}

// Организационно-правовые формы: по ним отличаем название компании от ФИО человека.
// Список, а не регэксп с \b: в JS \b опирается на латинский \w, поэтому /\bООО\b/ по кириллице не срабатывает.
const ORG_FORMS = new Set([
  'ООО', 'ОАО', 'ЗАО', 'ПАО', 'АО', 'ИП', 'НАО', 'АНО', 'НКО',
  'ТСЖ', 'ГУП', 'МУП', 'КФХ', 'ПК', 'СНТ', 'ФГУП', 'ОП',
])

/** Слово — это правовая форма (ООО, ИП, ПАО…)? Скобки и точки игнорируем: «(ИП)» тоже считается. */
function isOrgForm(word: string): boolean {
  return ORG_FORMS.has(word.replace(/[^А-ЯЁA-Z]/gi, '').toUpperCase())
}

/**
 * Как обратиться к вошедшему.
 * У физлица-подписанта банк отдаёт «ФАМИЛИЯ ИМЯ ОТЧЕСТВО» — здороваемся по имени.
 * У организации имя обрезать нельзя: «Демо-компания ООО» → «Ооо» выглядело как баг.
 */
export function getGreetingName(name?: string): string {
  const raw = (name || '').trim()
  if (!raw) return ''

  // Банк часто пишет ИП полной формой: «ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ ИВАНОВ ИВАН ИВАНОВИЧ».
  // Отбрасываем префикс и здороваемся по имени, как с человеком.
  const withoutIpPrefix = raw.replace(/^индивидуальн\S*\s+предпринимател\S*\s+/i, '')

  const parts = withoutIpPrefix.split(/\s+/)

  if (parts.some(isOrgForm) || /[«"]/.test(withoutIpPrefix)) {
    // Юридическое название не переформатируем: любой авторегистр портит «ПАО КБ "ЦЕНТР-ИНВЕСТ"»
    return raw
  }

  // ФИО — три слова (Фамилия Имя Отчество) или два (Фамилия Имя)
  if (parts.length >= 2 && parts.length <= 3) return getFirstName(withoutIpPrefix)

  return withoutIpPrefix === withoutIpPrefix.toUpperCase() ? toTitleCase(withoutIpPrefix) : withoutIpPrefix
}
