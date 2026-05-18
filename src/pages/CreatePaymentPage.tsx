import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePaymentsStore } from '../store/payments'

export function CreatePaymentPage() {
  const navigate = useNavigate()
  const { createPayment, error, clearError } = usePaymentsStore()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'RUB',
    date: new Date().toISOString().split('T')[0],
    recipientName: '',
    recipientAccount: '',
    recipientBank: '',
    recipientBic: '',
    purpose: '',
    priority: 'normal' as const,
    commissionPayment: 'payer' as const
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    clearError()

    try {
      await createPayment({
        status: 'draft',
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        date: new Date(formData.date),
        recipient: {
          name: formData.recipientName,
          account: formData.recipientAccount,
          bank: formData.recipientBank,
          bic: formData.recipientBic
        },
        payer: {
          name: 'ООО Наша Компания',
          account: '40702810500000000000'
        },
        purpose: formData.purpose,
        priority: formData.priority,
        commissionPayment: formData.commissionPayment,
        details: {}
      })

      navigate('/payments')
    } catch (err) {
      console.error('Failed to create payment:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Создать платеж</h1>
        <p className="text-gray">Оформление новой платежной операции</p>
      </div>

      <div style={{ maxWidth: '600px' }}>
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Сумма платежа *</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Валюта</label>
            <select name="currency" value={formData.currency} onChange={handleChange} disabled={loading}>
              <option value="RUB">RUB - Русский рубль</option>
              <option value="USD">USD - Доллар США</option>
              <option value="EUR">EUR - Евро</option>
            </select>
          </div>

          <div className="form-group">
            <label>Дата платежа</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Имя получателя *</label>
            <input
              type="text"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              placeholder="ООО Реципиент"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Расчетный счет получателя *</label>
            <input
              type="text"
              name="recipientAccount"
              value={formData.recipientAccount}
              onChange={handleChange}
              placeholder="40702810500000000000"
              required
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
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Назначение платежа *</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Описание назначения платежа"
              rows={3}
              required
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

          <div className="form-group">
            <label>Оплата комиссии</label>
            <select name="commissionPayment" value={formData.commissionPayment} onChange={handleChange} disabled={loading}>
              <option value="payer">Плательщик</option>
              <option value="recipient">Получатель</option>
            </select>
          </div>

          <div className="flex" style={{ gap: '1rem' }}>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
              {loading ? <span className="spinner"></span> : null}
              Создать платеж
            </button>
            <button
              type="button"
              onClick={() => navigate('/payments')}
              className="btn btn-secondary flex-1"
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
