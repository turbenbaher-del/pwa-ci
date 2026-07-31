import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccountsStore } from '../store/accounts'
import { apiFetch, friendlyError } from '../utils/api'
import { isDemo } from '../utils/demo'
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

  // Перевод создаёт ДОКУМЕНТ. Подпись — отдельный шаг через окно ключа токена
  // в разделе «Платежи»: подписать перевод на форме нельзя, банк требует
  // интерактивный ключ eToken + подтверждение в PayControl.
  const send = async () => {
    const problem = validate()
    if (problem) { setError(problem); return }
    setError(''); setSuccess('')

    setBusy(true)
    try {
      if (isDemo()) {
        setSuccess('Демо-режим: документ не сохранялся в банк')
        return
      }

      const json = await apiFetch('/api/transfer-own', {
        method: 'POST',
        body: JSON.stringify({
          fromAccount: from!.number,
          toAccount: to!.number,
          amount: amountValue,
          purpose: purpose.trim(),
        }),
      })

      if (json.success === false) {
        throw new Error(json.error || 'Банк не принял перевод')
      }

      setSuccess('Документ создан. Чтобы деньги ушли — откройте его в «Платежах» и подпишите ключом токена.')
      setAmount('')
    } catch (e) {
      setError(friendlyError(e, 'Не удалось создать перевод'))
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
                {a.name ? a.name + " · " : ""}{shortAccount(a.number)} · {formatCurrency(a.balance, a.currency)}
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
                {a.name ? a.name + " · " : ""}{shortAccount(a.number)} · {formatCurrency(a.balance, a.currency)}
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

        <button className="btn btn-primary btn-block" onClick={send} disabled={busy}>
          {busy ? <span className="spinner" /> : null} Создать перевод
        </button>
        <p style={{ margin: '0.625rem 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
          Документ появится в «Платежах». Чтобы деньги ушли, откройте его и
          подпишите ключом с токена.
        </p>

        <button className="btn btn-ghost btn-block" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/payments')} disabled={busy}>
          К списку платежей
        </button>
      </div>
    </div>
  )
}
