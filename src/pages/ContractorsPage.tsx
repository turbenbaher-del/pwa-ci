import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Contractor {
  id: string
  name: string
  account: string
  bank: string
  bic: string
  email?: string
}

export function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([
    { id: '1', name: 'ООО Поставщик', account: '40702810500000000001', bank: 'Сбербанк', bic: '044525999', email: 'info@supplier.ru' },
    { id: '2', name: 'ИП Клиент', account: '40702810500000000002', bank: 'Альфа-банк', bic: '044585100', email: 'client@example.ru' }
  ])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', account: '', bank: '', bic: '', email: '' })

  const handleAdd = () => {
    if (!formData.name || !formData.account) return
    setContractors([...contractors, { id: Date.now().toString(), ...formData }])
    setFormData({ name: '', account: '', bank: '', bic: '', email: '' })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    setContractors(contractors.filter(c => c.id !== id))
  }

  return (
    <div className="page-container">
      <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1>Контрагенты</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          ➕ Новый контрагент
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Добавить контрагента</h3>
          <div className="form-group">
            <label>Название *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="ООО Компания"
            />
          </div>

          <div className="form-group">
            <label>Счет *</label>
            <input
              type="text"
              value={formData.account}
              onChange={(e) => setFormData({ ...formData, account: e.target.value })}
              placeholder="40702810500000000000"
            />
          </div>

          <div className="form-group">
            <label>БИК</label>
            <input
              type="text"
              value={formData.bic}
              onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
              placeholder="044525999"
            />
          </div>

          <div className="form-group">
            <label>Банк</label>
            <input
              type="text"
              value={formData.bank}
              onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
              placeholder="Сбербанк"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="info@example.ru"
            />
          </div>

          <div className="flex" style={{ gap: '0.75rem' }}>
            <button onClick={handleAdd} className="btn btn-success flex-1">
              Добавить
            </button>
            <button onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">
              Отмена
            </button>
          </div>
        </div>
      )}

      {contractors.length > 0 ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {contractors.map((contractor) => (
            <div key={contractor.id} className="card">
              <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>{contractor.name}</h4>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <div>📋 Счет: {contractor.account}</div>
                    {contractor.bic && <div>🏦 БИК: {contractor.bic}</div>}
                    {contractor.bank && <div>🏢 Банк: {contractor.bank}</div>}
                    {contractor.email && <div>📧 Email: {contractor.email}</div>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(contractor.id)}
                  className="btn btn-danger btn-sm"
                  style={{ marginLeft: '1rem' }}
                >
                  ✕ Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="text-gray">Контрагентов не найдено</p>
        </div>
      )}
    </div>
  )
}
