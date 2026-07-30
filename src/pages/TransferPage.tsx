import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccountsStore } from '../store/accounts'
import { apiFetch } from '../utils/api'
import { isDemo } from '../utils/demo'
import { confirm } from '../store/confirm'
import { formatCurrency, isAccountOpen, normalizeCurrency } from '../utils/format'
import '../styles/pages.css'

const shortAccount = (num: string) => `…${num.slice(-4)}`

export function TransferPage() {
  const navigate = useNavigate()
  const { accounts, fetchAccounts, loading: accountsLoading } = useAccountsStore()

  const [fromAccount, setFromAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [purpose, setPurpose] = useState('Перевод между своими счетами. НДС не облагается.')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  // Переводить можно только между открытыми счетами
  const available = useMemo(() => accounts.filter(a => isAccountOpen(a.status)), [accounts])

  const from = available.find(a => a.number === fromAccount)
  const to = available.find(a => a.number === toAccount)

  // Счёт зачисления не может совпадать со счётом списания
  const targets = available.filter(a => a.number !== fromAccount)

  const amountValue = parseFloat(amount.replace(/\s/g, '').replace(',', '.')) || 0

  const validate = (): string => {
    if (!from) return 'Выберите счёт списания'
    if (!to) return 'Выберите счёт зачисления'
    if (from.number === to.number) return 'Счета списания и зачисления совпадают'
    if (amountValue <= 0) return 'Укажите сумму перевода'
    if (amountValue > from.balance) {
      return `На счёте ${shortAccount(from.number)} доступно ${formatCurrency(from.balance, from.currency)}`
    }
    // Конвертацию валют форма перевода между своими счетами не делает
    if (normalizeCurrency(from.currency) !== normalizeCurrency(to.currency)) {
      return 'Счета в разных валютах: такой перевод оформляется как валютная операция в ДБО'
    }
    if (!purpose.trim()) return 'Укажите назначение перевода'
    return ''
  }

  const send = async (sign: boolean) => {
    const problem = validate()
    if (problem) { setError(problem); return }
    setError(''); setSuccess('')

    if (sign) {
      const { ok } = await confirm({
        title: 'Отправить перевод в банк?',
        message: 'Деньги спишутся со счёта. Подтверждение подписи запросит сам банк.',
        details: [
          { label: 'Сумма', value: formatCurrency(amountValue, from!.currency) },
          { label: 'Со счёта', value: shortAccount(from!.number) },
          { label: 'На счёт', value: shortAccount(to!.number) },
        ],
        confirmLabel: 'Отправить',
        danger: true,
      })
      if (!ok) return
    }

    setBusy(true)
    try {
      if (isDemo()) {
        setSuccess(sign
          ? 'Демо-режим: перевод не отправлялся в банк'
          : 'Демо-режим: черновик не сохранялся в банк')
        return
      }

      const json = await apiFetch('/api/transfer-own', {
        method: 'POST',
        body: JSON.stringify({
          fromAccount: from!.number,
          toAccount: to!.number,
          amount: amountValue,
          purpose: purpose.trim(),
          sign,
        }),
      })

      if (json.success === false) throw new Error(json.error || 'Банк не принял перевод')

      // Прокси возвращает состояние формы и текст экрана ДБО — показываем его как есть,
      // чтобы не выдавать за успех то, что банк мог не провести.
      const screen: string = json.data?.screen || ''
      setSuccess(sign
        ? 'Перевод отправлен в банк. Проверьте статус в разделе «Платежи».'
        : 'Черновик перевода сохранён в ДБО.')
      if (/ошибк|не удалось|отклон/i.test(screen)) {
        setError('Ответ банка: ' + screen.slice(0, 300))
        setSuccess('')
      }
      setAmount('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при переводе')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Перевод между своими счетами</h1>
          <p className="page-subtitle">Внутри вашей организации, без комиссии</p>
        </div>
      </div>

      <div className="form-section" style={{ maxWidth: 620 }}>
        {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

        <div className="form-group">
          <label>Счёт списания</label>
          <select
            value={fromAccount}
            onChange={e => {
              setFromAccount(e.target.value)
              if (e.target.value === toAccount) setToAccount('')
            }}
            disabled={accountsLoading || busy}
          >
            <option value="">
              {accountsLoading ? 'Загружаем счета…' : 'Выберите счёт'}
            </option>
            {available.map(a => (
              <option key={a.number} value={a.number}>
                {shortAccount(a.number)} · {formatCurrency(a.balance, a.currency)}
              </option>
            ))}
          </select>
          {from && (
            <div className="form-hint">
              Доступно: {formatCurrency(from.balance, from.currency)}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Счёт зачисления</label>
          <select value={toAccount} onChange={e => setToAccount(e.target.value)} disabled={!fromAccount || busy}>
            <option value="">{fromAccount ? 'Выберите счёт' : 'Сначала выберите счёт списания'}</option>
            {targets.map(a => (
              <option key={a.number} value={a.number}>
                {shortAccount(a.number)} · {formatCurrency(a.balance, a.currency)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Сумма</label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^\d\s,.]/g, ''))}
            placeholder="0,00"
            disabled={busy}
          />
          {from && amountValue > 0 && amountValue <= from.balance && (
            <div className="form-hint">
              Остаток после перевода: {formatCurrency(from.balance - amountValue, from.currency)}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Назначение</label>
          <textarea
            value={purpose}
            onChange={e => setPurpose(e.target.value.slice(0, 210))}
            rows={3}
            disabled={busy}
          />
          <div className="form-hint">{purpose.length} / 210</div>
        </div>

        <div className="flex" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary flex-1" onClick={() => send(true)} disabled={busy}>
            {busy ? <span className="spinner" /> : null} Подписать и отправить
          </button>
          <button className="btn btn-secondary flex-1" onClick={() => send(false)} disabled={busy}>
            Сохранить черновик
          </button>
        </div>

        <button className="btn btn-ghost btn-block" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/payments')} disabled={busy}>
          К списку платежей
        </button>
      </div>
    </div>
  )
}
