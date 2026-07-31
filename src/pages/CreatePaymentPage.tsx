import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaymentsStore } from '../store/payments'
import { useAccountsStore } from '../store/accounts'
import { useAuthStore } from '../store/auth'
import { useContractorsStore } from '../store/contractors'
import { useTemplatesStore, type PaymentTemplate } from '../store/templates'
import { confirm } from '../store/confirm'
import { formatCurrency } from '../utils/format'
import '../styles/pages.css'

// Центр-Инвест БИК — платёж внутри банка идёт без комиссии.
const CI_BIC = '046015207'

// Лёгкая ОЦЕНКА комиссии (не заменяет расчёт банка при подписании).
function estimateCommission(amount: number, bic: string, currency: string): string {
  if (!amount || amount <= 0) return ''
  if (currency !== 'RUB') return 'по тарифу ВЭД (уточняется при подписании)'
  const clean = (bic || '').replace(/\D/g, '')
  if (clean && clean === CI_BIC) return 'без комиссии (платёж внутри банка)'
  const fee = Math.min(Math.max(amount * 0.001, 25), 150) // ~0.1%, 25–150 ₽ (оценка)
  return `≈ ${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(fee)} · межбанковский`
}

export function CreatePaymentPage() {
  const navigate = useNavigate()
  const { createPayment, error, clearError } = usePaymentsStore()
  const { accounts, fetchAccounts } = useAccountsStore()
  const { contractors } = useContractorsStore()
  const { templates, addTemplate, removeTemplate, touchTemplate } = useTemplatesStore()
  const user = useAuthStore(s => s.user)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)   // прогрессивное раскрытие (из Т)

  const [formData, setFormData] = useState<{
    payerAccount: string; amount: string; currency: string; date: string
    recipientName: string; recipientAccount: string; recipientBank: string; recipientBic: string
    recipientInn: string; recipientKpp: string
    purpose: string; priority: 'normal' | 'urgent'; commissionPayment: 'payer' | 'recipient'
  }>({
    payerAccount:      '',
    amount:            '',
    currency:          'RUB',
    date:              new Date().toISOString().split('T')[0],
    recipientName:     '',
    recipientAccount:  '',
    recipientBank:     '',
    recipientBic:      '',
    recipientInn:      '',
    recipientKpp:      '',
    purpose:           '',
    priority:          'normal',
    commissionPayment: 'payer',
  })

  // Выбранный счёт списания — под списком показываем полный номер и остаток
  const selectedPayer = accounts.find(a => a.number === formData.payerAccount)

  useEffect(() => {
    fetchAccounts()
    clearError()
  }, [fetchAccounts, clearError])

  // Pre-select first account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !formData.payerAccount) {
      setFormData(prev => ({ ...prev, payerAccount: accounts[0].number }))
    }
  }, [accounts])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // ——— Шаблоны платежей (перенос из Т: favorites/шаблоны) ———
  const applyTemplate = (t: PaymentTemplate) => {
    setFormData(prev => ({
      ...prev,
      recipientName:     t.recipientName,
      recipientAccount:  t.recipientAccount,
      recipientBank:     t.recipientBank,
      recipientBic:      t.recipientBic,
      purpose:           t.purpose,
      amount:            t.amount || prev.amount,
      currency:          t.currency,
      priority:          t.priority,
      commissionPayment: t.commissionPayment,
    }))
    touchTemplate(t.id)
    setFormError(''); setSuccessMsg('')
  }

  const saveAsTemplate = () => {
    if (!formData.recipientName.trim() || !formData.recipientAccount.trim()) {
      setFormError('Заполните получателя, чтобы сохранить шаблон')
      return
    }
    const suggested = formData.recipientName.slice(0, 40)
    const name = window.prompt('Название шаблона:', suggested)
    if (!name) return
    addTemplate({
      name,
      recipientName:     formData.recipientName,
      recipientAccount:  formData.recipientAccount,
      recipientBank:     formData.recipientBank,
      recipientBic:      formData.recipientBic,
      purpose:           formData.purpose,
      amount:            formData.amount || undefined,
      currency:          formData.currency,
      priority:          formData.priority,
      commissionPayment: formData.commissionPayment,
    })
    setSuccessMsg(`Шаблон «${name}» сохранён`)
  }

  const commissionHint = estimateCommission(parseFloat(formData.amount), formData.recipientBic, formData.currency)

  const validate = (): boolean => {
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      setFormError('Введите корректную сумму платежа')
      return false
    }
    if (!formData.recipientName.trim()) {
      setFormError('Введите наименование получателя')
      return false
    }
    if (!formData.recipientAccount.trim() || formData.recipientAccount.replace(/\D/g,'').length !== 20) {
      setFormError('Введите корректный расчётный счёт получателя (20 цифр)')
      return false
    }
    if (!formData.recipientBic.trim() || formData.recipientBic.replace(/\D/g,'').length !== 9) {
      setFormError('Введите корректный БИК банка (9 цифр)')
      return false
    }
    if (!formData.purpose.trim()) {
      setFormError('Введите назначение платежа')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    clearError()
    if (!validate()) return

    // Подпись здесь НЕ запрашиваем: этот банк подписывает ключом с токена и
    // подтверждением в PayControl, а не кодом из SMS. Сохраняем документ, а
    // подпись — отдельным шагом через окно ввода ключа на странице платежа.
    const amountFmt = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: formData.currency }).format(parseFloat(formData.amount))
    const res = await confirm({
      title: 'Сохранить платёж?',
      message: 'Документ будет сохранён в банке. Подписать его можно на странице платежа — ключом с токена.',
      details: [
        { label: 'Получатель', value: formData.recipientName },
        { label: 'Счёт', value: formData.recipientAccount },
        { label: 'Сумма', value: amountFmt },
        { label: 'Назначение', value: formData.purpose.slice(0, 60) + (formData.purpose.length > 60 ? '…' : '') },
      ],
      confirmLabel: 'Сохранить',
    })
    if (!res.ok) return

    setLoading(true)
    setSuccessMsg('')
    try {
      const selectedAccount = accounts.find(a => a.number === formData.payerAccount)
      const created = await createPayment({
        status: 'draft',
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        date: new Date(formData.date),
        recipient: {
          name:    formData.recipientName,
          account: formData.recipientAccount.replace(/\s/g, ''),
          bank:    formData.recipientBank,
          bic:     formData.recipientBic.replace(/\D/g, ''),
          inn:     formData.recipientInn.replace(/\D/g, ''),
          kpp:     formData.recipientKpp.replace(/\D/g, ''),
        },
        payer: {
          name:    user?.name ?? 'Организация',
          account: formData.payerAccount,
        },
        purpose:           formData.purpose,
        priority:          formData.priority,
        commissionPayment: formData.commissionPayment,
        details:           { payerCurrency: selectedAccount?.currency ?? 'RUB' },
      })
      if (created.status === 'created' || created.status === 'sent') {
        navigate('/payments')
      } else {
        setSuccessMsg('Платёж сохранён как черновик. Откройте ДБО банка для подписи и отправки.')
      }
    } catch {
      // error from store is shown below
    } finally {
      setLoading(false)
    }
  }

  const displayError = formError || error

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Создать платёж</h1>
          <p className="page-subtitle">Оформление новой платёжной операции</p>
        </div>
      </div>

      <div style={{ maxWidth: 680 }}>
        {successMsg && (
          <div className="alert alert-success" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {successMsg}
          </div>
        )}

        {displayError && (
          <div className="alert alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Templates bar (ported from T «favorites/шаблоны») */}
          {templates.length > 0 && (
            <div className="form-section">
              <div className="form-section-title">Шаблоны</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {templates.map(t => (
                  <span key={t.id} className="tpl-chip">
                    <button type="button" className="tpl-chip-apply" onClick={() => applyTemplate(t)} disabled={loading} title="Подставить шаблон">
                      {t.name}
                    </button>
                    <button type="button" className="tpl-chip-del" onClick={() => removeTemplate(t.id)} disabled={loading} title="Удалить шаблон" aria-label="Удалить">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Payer section */}
          <div className="form-section">
            <div className="form-section-title">Плательщик</div>

            <div className="form-group">
              <label>Счёт списания *</label>
              <select
                name="payerAccount"
                value={formData.payerAccount}
                onChange={handleChange}
                disabled={loading || accounts.length === 0}
              >
                {accounts.length === 0 && (
                  <option value="">Загрузка счетов...</option>
                )}
                {accounts.map(acc => (
                  // Полный номер со всей суммой не помещается в выпадающий список
                  // на телефоне — показываем хвост счёта и остаток
                  <option key={acc.number} value={acc.number}>
                    {acc.name ? `${acc.name} · ` : ''}·· {acc.number.slice(-4)} · {formatCurrency(acc.balance, acc.currency)}
                  </option>
                ))}
              </select>
              {selectedPayer && (
                <div className="form-hint">
                  {selectedPayer.number} · доступно {formatCurrency(selectedPayer.balance, selectedPayer.currency)}
                </div>
              )}
            </div>
          </div>

          {/* Recipient section */}
          <div className="form-section">
            <div className="form-section-title">Получатель</div>

            {contractors.length > 0 && (
              <div className="form-group">
                <label>Выбрать из контрагентов</label>
                <select
                  value=""
                  onChange={(e) => {
                    const c = contractors.find(x => x.id === e.target.value)
                    if (c) setFormData(prev => ({
                      ...prev,
                      recipientName: c.name,
                      recipientAccount: c.account,
                      recipientBic: c.bic ?? '',
                      recipientBank: c.bank ?? '',
                      recipientInn: (c as any).inn ?? '',
                      recipientKpp: (c as any).kpp ?? '',
                    }))
                  }}
                  disabled={loading}
                >
                  <option value="">— Выбрать контрагента —</option>
                  {contractors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Наименование получателя *</label>
              <input
                type="text"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleChange}
                placeholder="ООО «Компания» или ИП Фамилия Имя"
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Расчётный счёт получателя *</label>
                <input
                  type="text"
                  name="recipientAccount"
                  value={formData.recipientAccount}
                  onChange={handleChange}
                  placeholder="40702810500000000000"
                  maxLength={22}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>БИК банка *</label>
                <input
                  type="text"
                  name="recipientBic"
                  value={formData.recipientBic}
                  onChange={handleChange}
                  placeholder="044525999"
                  maxLength={9}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ИНН получателя *</label>
                <input
                  type="text"
                  name="recipientInn"
                  value={formData.recipientInn}
                  onChange={handleChange}
                  placeholder="7710140679"
                  maxLength={12}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>КПП получателя</label>
                <input
                  type="text"
                  name="recipientKpp"
                  value={formData.recipientKpp}
                  onChange={handleChange}
                  placeholder="771301001"
                  maxLength={9}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Наименование банка получателя</label>
              <input
                type="text"
                name="recipientBank"
                value={formData.recipientBank}
                onChange={handleChange}
                placeholder="ПАО Сбербанк"
                disabled={loading}
              />
            </div>
          </div>

          {/* Payment details — core fields only */}
          <div className="form-section">
            <div className="form-section-title">Детали платежа</div>

            <div className="form-group">
              <label>Сумма *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                disabled={loading}
              />
              {commissionHint && (
                <div className="field-hint">Комиссия: {commissionHint}</div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Назначение платежа *</label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                placeholder="Оплата по договору № ... от ... за ..."
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          {/* Advanced (progressive disclosure — ported from T) */}
          <button
            type="button"
            className="disclosure-toggle"
            onClick={() => setShowAdvanced(v => !v)}
            aria-expanded={showAdvanced}
          >
            <span>Дополнительные параметры</span>
            <span className={`disclosure-caret${showAdvanced ? ' open' : ''}`}>▾</span>
          </button>

          {showAdvanced && (
            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
                  <label>Валюта</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} disabled={loading}>
                    <option value="RUB">RUB — Российский рубль</option>
                    <option value="USD">USD — Доллар США</option>
                    <option value="EUR">EUR — Евро</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Дата платежа</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} disabled={loading} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Приоритет</label>
                  <select name="priority" value={formData.priority} onChange={handleChange} disabled={loading}>
                    <option value="normal">Обычный</option>
                    <option value="urgent">Срочный</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Оплата комиссии</label>
                  <select name="commissionPayment" value={formData.commissionPayment} onChange={handleChange} disabled={loading}>
                    <option value="payer">Плательщик</option>
                    <option value="recipient">Получатель</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Save as template */}
          <div style={{ marginTop: '0.75rem' }}>
            <button type="button" className="btn btn-ghost" onClick={saveAsTemplate} disabled={loading}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
              </svg>
              Сохранить как шаблон
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <span className="spinner" /> : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {loading ? 'Создание...' : 'Создать платёж'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/payments')}
              className="btn btn-secondary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
