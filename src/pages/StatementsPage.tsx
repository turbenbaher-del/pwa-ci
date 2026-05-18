import { useState } from 'react'

export function StatementsPage() {
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [format, setFormat] = useState('pdf')
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      // Имитация экспорта
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert(`Выписка выгружена в формате ${format.toUpperCase()}`)
    } catch (error) {
      alert('Ошибка при экспорте')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <h1>Выписки</h1>
      <p className="text-gray">Скачать выписку по счету за указанный период</p>

      <div style={{ maxWidth: '500px' }}>
        <div className="card">
          <div className="form-group">
            <label>Период</label>
            <div className="flex" style={{ gap: '0.75rem' }}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span style={{ alignSelf: 'center' }}>—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Формат выписки</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="pdf">PDF - Портативный документ</option>
              <option value="xlsx">XLSX - Microsoft Excel</option>
              <option value="csv">CSV - Текстовый формат</option>
              <option value="1c">1C - Формат 1С бухгалтерии</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={loading}
            className="btn btn-primary btn-block"
          >
            {loading ? <span className="spinner"></span> : null}
            📥 Скачать выписку
          </button>
        </div>

        <div className="card" style={{ background: 'var(--gray-50)', marginTop: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0' }}>ℹ️ Информация</h4>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Выписка содержит все операции по счету за указанный период.
            Доступны форматы: PDF, Excel, CSV и 1С. Файл будет загружен автоматически.
          </p>
        </div>
      </div>
    </div>
  )
}
