import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaymentsStore } from '../store/payments'
import { useAccountsStore } from '../store/accounts'
import { useAuthStore } from '../store/auth'
import { useContractorsStore } from '../store/contractors'
import '../styles/pages.css'

export function CreatePaymentPage() {
  const navigate = useNavigate()
  const { createPayment, error, clearError } = usePaymentsStore()
  const { accounts, fetchAccounts } = useAccountsStore()
  const { contractors } = useContractorsStore()
  const user = useAuthStore(s => s.user)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const [formData, setFormData] = useState({
    payerAccount:      '',
    amount:            '',
    currency:          'RUB',
    date:              new Date().toISOString().split('T')[0],
    recipientName:     '',
    recipientAccount:  '',
    recipientBank:     '',
    recipientBic:      '',
    purpose:           '',
    priority:          'normal' as const,
    commissionPayment: 'payer' as const,
  })

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

    setLoading(true)
    try {
      const selectedAccount = accounts.find(a => a.number === formData.payerAccount)
      await createPayment({
        status: 'draft',
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        date: new Date(formData.date),
        recipient: {
          name:    formData.recipientName,
          account: formData.recipientAccount.replace(/\s/g, ''),
          bank:    formData.recipientBank,
          bic:     formData.recipientBic.replace(/\D/g, ''),
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
      navigate('/payments')
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
        {displayError && (
          <div className="alert alert-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
                  <option key={acc.number} value={acc.number}>
                    {acc.number} — {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: acc.currency === 'RUR' ? 'RUB' : acc.currency }).format(acc.balance)}
                  </option>
                ))}
              </select>
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

          {/* Payment details */}
          <div className="form-section">
            <div className="form-section-title">Детали платежа</div>

            <div className="form-row">
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
              </div>

              <div className="form-group">
                <label>Валюта</label>
                <select name="currency" value={formData.currency} onChange={handleChange} disabled={loading}>
                  <option value="RUB">RUB — Российский рубль</option>
                  <option value="USD">USD — Доллар США</option>
                  <option value="EUR">EUR — Евро</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Дата платежа</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Приоритет</label>
                <select name="priority" value={formData.priority} onChange={handleChange} disabled={loading}>
                  <option value="normal">Обычный</option>
                  <option value="urgent">Срочный</option>
                </select>
              </div>
            </div>

            <div className="form-group">
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

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Оплата комиссии</label>
              <select name="commissionPayment" value={formData.commissionPayment} onChange={handleChange} disabled={loading}>
                <option value="payer">Плательщик</option>
                <option value="recipient">Получатель</option>
              </select>
            </div>
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
