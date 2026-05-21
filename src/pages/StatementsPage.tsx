import { useState } from 'react'
import { useAccountsStore } from '../store/accounts'
import { PROXY_URL } from '../utils/api'
import '../styles/pages.css'

export function StatementsPage() {
  const { accounts } = useAccountsStore()
  const [account, setAccount] = useState('')
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [fmt, setFmt] = useState('pdf')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleExport = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ dateFrom, dateTo, format: fmt })
      if (account) params.set('account', account)
      const res = await fetch(`${PROXY_URL}/api/statement?${params}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `Ошибка ${res.status}`)
      }
      const blob = await res.blob()
      const ext = fmt === '1c' ? 'txt' : fmt
      const disposition = res.headers.get('Content-Disposition') || ''
      const nameMatch = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i)
      const filename = nameMatch
        ? decodeURIComponent(nameMatch[1].replace(/"/g, ''))
        : `выписка_${dateFrom}_${dateTo}.${ext}`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка при скачивании выписки')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Выписки</h1>
          <p className="page-subtitle">Скачать выписку по счёту за указанный период</p>
        </div>
      </div>

      <div style={{ maxWidth: 560 }}>
        <div className="form-section">
          <div className="form-section-title">Параметры выписки</div>

          {accounts.length > 0 && (
            <div className="form-group">
              <label>Счёт</label>
              <select value={account} onChange={e => setAccount(e.target.value)}>
                <option value="">Все счета</option>
                {accounts.map(a => (
                  <option key={a.number} value={a.number}>
                    {a.number.replace(/(\d{5})(\d{3})(\d)(\d{11})/, '$1.$2.$3.$4')} — {a.currency}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>С даты</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label>По дату</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Формат выписки</label>
            <select value={fmt} onChange={e => setFmt(e.target.value)}>
              <option value="pdf">PDF — Портативный документ</option>
              <option value="xlsx">XLSX — Microsoft Excel</option>
              <option value="csv">CSV — Текстовый формат</option>
              <option value="1c">1С — Формат 1С бухгалтерии</option>
            </select>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button onClick={handleExport} disabled={loading} className="btn btn-primary btn-block">
            {loading ? <span className="spinner" /> : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            {loading ? 'Формирование...' : 'Скачать выписку'}
          </button>
          {loading && (
            <p style={{ marginTop: '0.75rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              Прокси заходит в банк и скачивает файл — это может занять до 30 секунд
            </p>
          )}
        </div>

        <div className="section" style={{ marginTop: '1rem' }}>
          <div className="section-header">
            <h2 className="section-title">Информация</h2>
          </div>
          <div className="section-body" style={{ padding: '1rem 1.5rem' }}>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Выписка содержит все операции по счёту за указанный период.
              Форматы PDF и Excel подходят для печати и хранения, CSV — для импорта в учётные системы,
              формат 1С — для прямой загрузки в 1С Бухгалтерия.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
