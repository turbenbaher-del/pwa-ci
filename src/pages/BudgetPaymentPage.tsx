import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccountsStore } from '../store/accounts'
import { usePaymentsStore, type Payment } from '../store/payments'
import { SignModal } from '../components/SignModal'
import { apiFetch, friendlyError } from '../utils/api'
import { formatCurrency, isAccountOpen } from '../utils/format'
import '../styles/pages.css'

const shortAccount = (n: string) => `…${n.slice(-4)}`

// Статус плательщика (поле 101). Полный справочник у банка большой, здесь —
// то, чем реально пользуется ИП и малый бизнес. Остальное вводится вручную.
const DRAWER_STATUS = [
  { code: '01', label: '01 — юридическое лицо' },
  { code: '02', label: '02 — налоговый агент' },
  { code: '13', label: '13 — физлицо, ИП, нотариус, адвокат, глава КФХ' },
]

export function BudgetPaymentPage() {
  const navigate = useNavigate()
  const { accounts, fetchAccounts, loading: accountsLoading } = useAccountsStore()
  const { fetchPayments } = usePaymentsStore()

  const [form, setForm] = useState({
    payerAccount: '',
    amount: '',
    purpose: '',
    receiverName: '',
    receiverInn: '',
    receiverKpp: '',
    receiverAccount: '',
    receiverBic: '',
    drawerStatus: '13',
    cbc: '',
    oktmo: '',
    payReason: '',
    taxPeriod: '',
    taxDocNumber: '',
    uin: '',
  })

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [created, setCreated] = useState<Payment | null>(null)
  const [signedOk, setSignedOk] = useState(false)

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  const available = accounts.filter(a => isAccountOpen(a.status))
  const from = available.find(a => a.number === form.payerAccount)
  const amountValue = parseFloat(form.amount.replace(/\s/g, '').replace(',', '.')) || 0

  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const validate = (): string => {
    if (!from) return 'Выберите счёт списания'
    if (amountValue <= 0) return 'Укажите сумму'
    if (amountValue > from.balance) {
      return `На счёте доступно ${formatCurrency(from.balance, from.currency)}`
    }
    if (!form.receiverName.trim()) return 'Укажите получателя'
    if (form.receiverAccount.replace(/\D/g, '').length !== 20) return 'Счёт получателя — 20 цифр'
    if (form.receiverBic.replace(/\D/g, '').length !== 9) return 'БИК — 9 цифр'
    if (form.cbc.replace(/\D/g, '').length !== 20) return 'КБК — 20 цифр'
    if (!form.purpose.trim()) return 'Укажите назначение платежа'
    return ''
  }

  const send = async () => {
    const problem = validate()
    if (problem) { setError(problem); return }
    setError(''); setSuccess(''); setBusy(true)
    try {
      const json = await apiFetch('/api/pay-budget', {
        method: 'POST',
        body: JSON.stringify({
          fromAccount: from!.number,
          amount: amountValue,
          purpose: form.purpose.trim(),
          receiverName: form.receiverName.trim(),
          receiverInn: form.receiverInn,
          receiverKpp: form.receiverKpp,
          receiverAccount: form.receiverAccount,
          receiverBic: form.receiverBic,
          drawerStatus: form.drawerStatus,
          cbc: form.cbc,
          oktmo: form.oktmo,
          payReason: form.payReason,
          taxPeriod: form.taxPeriod,
          taxDocNumber: form.taxDocNumber,
          uin: form.uin,
        }),
      })
      if (json.success === false) throw new Error(json.error || 'Банк не принял платёж')

      const id = json.data?.id
      if (id) {
        setCreated({
          id, number: undefined, status: 'draft',
          amount: -amountValue, currency: from!.currency, date: new Date(),
          recipient: {
            name: form.receiverName.trim(), account: form.receiverAccount,
            bank: '', bic: form.receiverBic,
          },
          payer: { name: '', account: from!.number },
          purpose: form.purpose.trim(),
        } as Payment)
      } else {
        setSuccess('Платёж создан. Откройте его в «Платежах» и подпишите — иначе деньги не уйдут.')
      }
    } catch (e) {
      setError(friendlyError(e, 'Не удалось создать платёж'))
    } finally {
      setBusy(false)
    }
  }

  const field = (
    label: string, key: keyof typeof form, placeholder = '', hint = '', numeric = false,
  ) => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type="text"
        inputMode={numeric ? 'numeric' : 'text'}
        value={form[key]}
        onChange={e => set(key, numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
        placeholder={placeholder}
        disabled={busy}
      />
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Платёж в бюджет</h1>
          <p className="page-subtitle">Налоги, взносы, пошлины</p>
        </div>
      </div>

      <div className="form-section" style={{ maxWidth: 620 }}>
        {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

        <div className="form-group">
          <label>Счёт списания</label>
          <select
            value={form.payerAccount}
            onChange={e => set('payerAccount', e.target.value)}
            disabled={accountsLoading || busy}
          >
            <option value="">{accountsLoading ? 'Загружаем счета…' : 'Выберите счёт'}</option>
            {available.map(a => (
              <option key={a.number} value={a.number}>
                {a.name ? a.name + ' · ' : ''}{shortAccount(a.number)} · {formatCurrency(a.balance, a.currency)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Сумма</label>
          <input
            type="text" inputMode="decimal" value={form.amount}
            onChange={e => set('amount', e.target.value.replace(/[^\d\s,.]/g, ''))}
            placeholder="0,00" disabled={busy}
          />
        </div>

        <h3 style={{ margin: '1.5rem 0 0.75rem', fontSize: 'var(--text-md)' }}>Получатель</h3>
        {field('Наименование', 'receiverName', 'УФК по ... (Межрайонная ИФНС ...)')}
        {field('ИНН', 'receiverInn', '', '', true)}
        {field('КПП', 'receiverKpp', '', '', true)}
        {field('Счёт', 'receiverAccount', '', '20 цифр', true)}
        {field('БИК', 'receiverBic', '', '9 цифр', true)}

        <h3 style={{ margin: '1.5rem 0 0.75rem', fontSize: 'var(--text-md)' }}>Налоговые реквизиты</h3>

        <div className="form-group">
          <label>Статус плательщика (поле 101)</label>
          <select value={form.drawerStatus} onChange={e => set('drawerStatus', e.target.value)} disabled={busy}>
            {DRAWER_STATUS.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
          </select>
        </div>

        {field('КБК (поле 104)', 'cbc', '', '20 цифр — код бюджетной классификации', true)}
        {field('ОКТМО (поле 105)', 'oktmo', '', '8 или 11 цифр', true)}
        {field('Основание платежа (поле 106)', 'payReason', 'ТП, ЗД, ТР…')}
        {field('Налоговый период (поле 107)', 'taxPeriod', 'МС.01.2026 / КВ.01.2026 / ГД.00.2026')}
        {field('Номер документа-основания (поле 108)', 'taxDocNumber', '0')}
        {field('УИН (поле 22)', 'uin', '0', 'Если не указан в требовании — оставьте 0', true)}

        <div className="form-group">
          <label>Назначение платежа</label>
          <textarea
            value={form.purpose}
            onChange={e => set('purpose', e.target.value.slice(0, 210))}
            rows={3} disabled={busy}
            placeholder="Например: Страховые взносы на ОПС за 2026 год"
          />
          <div className="form-hint">{form.purpose.length} / 210</div>
        </div>

        <button className="btn btn-primary btn-block" onClick={send} disabled={busy}>
          {busy ? <span className="spinner" /> : null} Подписать и отправить
        </button>
        <p style={{ margin: '0.625rem 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
          Банк проверяет налоговые реквизиты строже обычного платежа. Если что-то
          не так, он ответит текстом — я покажу его целиком.
        </p>

        <button className="btn btn-ghost btn-block" style={{ marginTop: '0.75rem' }}
          onClick={() => navigate('/payments')} disabled={busy}>
          К списку платежей
        </button>
      </div>

      {created && (
        <SignModal
          payment={created}
          onClose={() => {
            setCreated(null)
            if (signedOk) { navigate('/payments'); return }
            setSuccess('Платёж создан. Его можно подписать позже в «Платежах».')
          }}
          onSigned={() => { setSignedOk(true); fetchPayments() }}
        />
      )}
    </div>
  )
}
