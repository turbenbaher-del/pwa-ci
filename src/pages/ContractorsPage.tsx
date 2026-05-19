import { useState } from 'react'
import '../styles/pages.css'

interface Contractor {
  id: string
  name: string
  account: string
  bank: string
  bic: string
  inn?: string
  email?: string
}

const SAMPLE: Contractor[] = [
  { id: '1', name: 'ООО Поставщик', account: '40702810500000000001', bank: 'Сбербанк', bic: '044525999', inn: '7743013419', email: 'info@supplier.ru' },
  { id: '2', name: 'ИП Клиентов А.В.', account: '40802810500000000002', bank: 'Альфа-Банк', bic: '044585100', inn: '616500000000', email: 'client@example.ru' },
]

export function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>(SAMPLE)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', account: '', bank: '', bic: '', inn: '', email: '' })

  const filtered = contractors.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.account.includes(search) || (c.inn || '').includes(search)
  )

  const handleAdd = () => {
    if (!form.name.trim() || !form.account.trim()) return
    setContractors(prev => [...prev, { id: Date.now().toString(), ...form }])
    setForm({ name: '', account: '', bank: '', bic: '', inn: '', email: '' })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    setContractors(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Контрагенты</h1>
          <p className="page-subtitle">Реквизиты получателей платежей</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Добавить
        </button>
      </div>

      {/* Search */}
      <div className="search-wrapper" style={{ marginBottom: '1.5rem' }}>
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input className="search-input" placeholder="Поиск по названию, счёту, ИНН..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Add form */}
      {showForm && (
        <div className="form-section" style={{ marginBottom: '1.5rem' }}>
          <div className="form-section-title">Новый контрагент</div>
          <div className="form-row">
            <div className="form-group">
              <label>Название *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ООО Компания" />
            </div>
            <div className="form-group">
              <label>ИНН</label>
              <input type="text" value={form.inn} onChange={e => setForm({ ...form, inn: e.target.value })} placeholder="7700000000" />
            </div>
          </div>
          <div className="form-group">
            <label>Расчётный счёт *</label>
            <input type="text" value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} placeholder="40702810500000000000" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>БИК</label>
              <input type="text" value={form.bic} onChange={e => setForm({ ...form, bic: e.target.value })} placeholder="044525999" />
            </div>
            <div className="form-group">
              <label>Банк</label>
              <input type="text" value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} placeholder="Сбербанк" />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="info@example.ru" />
          </div>
          <div className="flex" style={{ gap: '0.75rem' }}>
            <button onClick={handleAdd} className="btn btn-primary flex-1">Добавить</button>
            <button onClick={() => setShowForm(false)} className="btn btn-secondary flex-1">Отмена</button>
          </div>
        </div>
      )}

      {/* List */}
      {filtered.length > 0 ? (
        <div className="accounts-list">
          {filtered.map((c) => (
            <div key={c.id} className="account-card" style={{ cursor: 'default' }}>
              <div className="account-card-icon" style={{ fontSize: 'var(--text-lg)' }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="account-card-info">
                <div className="account-card-number" style={{ fontFamily: 'var(--font-primary)', fontSize: 'var(--text-sm)', letterSpacing: 'normal' }}>
                  {c.name}
                </div>
                <div className="account-card-meta">
                  {c.account.replace(/(\d{5})(\d{3})(\d)(\d{11})/, '$1.$2.$3.$4')}
                  {c.inn && ` · ИНН ${c.inn}`}
                  {c.bic && ` · БИК ${c.bic}`}
                </div>
                {c.bank && <div className="account-card-meta" style={{ marginTop: 2 }}>{c.bank}</div>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--color-error)', borderColor: 'transparent' }}
                  title="Удалить"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <div className="empty-state-title">
            {search ? 'Не найдено' : 'Контрагентов нет'}
          </div>
          <p className="empty-state-text">
            {search ? 'Попробуйте изменить запрос' : 'Добавьте контрагента для быстрого создания платежей'}
          </p>
          {!search && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
              Добавить контрагента
            </button>
          )}
        </div>
      )}
    </div>
  )
}
