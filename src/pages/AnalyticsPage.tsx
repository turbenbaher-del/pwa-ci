import { usePaymentsStore } from '../store/payments'

export function AnalyticsPage() {
  const { payments } = usePaymentsStore()

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const avgAmount = payments.length > 0 ? totalAmount / payments.length : 0
  const executed = payments.filter(p => p.status === 'executed').length
  const pending = payments.filter(p => p.status === 'created' || p.status === 'signed').length

  return (
    <div className="page-container">
      <h1>Аналитика</h1>
      <p className="text-gray">Статистика и анализ платежей</p>

      <div className="grid grid-3">
        <div className="card">
          <div className="card-header">
            <h3>Общая сумма</h3>
            <span className="icon">💰</span>
          </div>
          <div className="card-value">
            {new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              notation: 'compact'
            }).format(totalAmount)}
          </div>
          <div className="card-footer">Всего переведено</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Средний платеж</h3>
            <span className="icon">📊</span>
          </div>
          <div className="card-value">
            {new Intl.NumberFormat('ru-RU', {
              style: 'currency',
              currency: 'RUB',
              notation: 'compact'
            }).format(avgAmount)}
          </div>
          <div className="card-footer">Средняя сумма</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Исполнено</h3>
            <span className="icon">✅</span>
          </div>
          <div className="card-value text-success">{executed}</div>
          <div className="card-footer">Успешные платежи</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3>Статус платежей</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Исполнено</span>
              <strong>{executed}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>На подпись</span>
              <strong className="text-warning">{pending}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Всего</span>
              <strong>{payments.length}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Последняя активность</h3>
          {payments.length > 0 ? (
            <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <div className="text-gray">Последний платеж</div>
                <strong>{payments[0].recipient.name}</strong>
              </div>
              <div>
                <div className="text-gray">Сумма</div>
                <strong>
                  {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB'
                  }).format(payments[0].amount)}
                </strong>
              </div>
            </div>
          ) : (
            <p className="text-gray" style={{ marginBottom: 0 }}>Нет данных</p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem', background: 'var(--gray-50)' }}>
        <h3 style={{ margin: '0 0 0.75rem 0' }}>📈 Рекомендации</h3>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Регулярно проверяйте статус платежей</li>
          <li>Используйте шаблоны для часто повторяющихся платежей</li>
          <li>Скачивайте выписки для учета и аудита</li>
          <li>Управляйте доверенными устройствами для безопасности</li>
        </ul>
      </div>
    </div>
  )
}
