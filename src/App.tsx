import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/auth'
import { useThemeStore } from './store/theme'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AccountsPage } from './pages/AccountsPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { CreatePaymentPage } from './pages/CreatePaymentPage'
import { TransferPage } from './pages/TransferPage'
import { ProductsPage } from './pages/ProductsPage'
import { SectionPage } from './pages/SectionPage'
import { PaymentDetailsPage } from './pages/PaymentDetailsPage'
import { ContractorsPage } from './pages/ContractorsPage'
import { StatementsPage } from './pages/StatementsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { TariffsPage } from './pages/TariffsPage'
import { MailPage } from './pages/MailPage'
import { AuditPage } from './pages/AuditPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ConfirmModal } from './components/ConfirmModal'

export function App() {
  const { isAuthenticated, isSessionConsistent, logout, clearSession } = useAuthStore()
  const { isDark, fontSize } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    // Тема влияет и на системные элементы: строку статуса в установленном
    // приложении и цвет адресной строки браузера.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', isDark ? '#0E1211' : '#50B848')
  }, [isDark])

  // Размер шрифта хранился в настройках, но ни на что не влиял —
  // масштабируем всю типографическую шкалу классом на <html>.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('font-small', fontSize === 'small')
    root.classList.toggle('font-large', fontSize === 'large')
  }, [fontSize])

  // Демо-личность поверх настоящих данных банка — признак прерванного входа.
  // На экране это выглядело как «Демо-компания ООО» с живыми счетами:
  // сбрасываем сессию, чтобы человек вошёл заново и видел, кто он.
  useEffect(() => {
    if (isAuthenticated && !isSessionConsistent()) logout()
  }, [isAuthenticated, isSessionConsistent, logout])

  // Сервер сообщил, что сессия в банке завершилась (пароль там не хранится
  // и стирается после простоя). Возвращаем человека на вход, вместо того
  // чтобы показывать ошибку на каждом экране.
  useEffect(() => {
    const onExpired = () => clearSession()
    window.addEventListener('session-expired', onExpired)
    return () => window.removeEventListener('session-expired', onExpired)
  }, [clearSession])

  return (
    // basename берём из base сборки, чтобы приложение жило и в подпапке, и в корне домена
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/payments/create" element={<CreatePaymentPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/payments/:id" element={<PaymentDetailsPage />} />
          <Route path="/contractors" element={<ContractorsPage />} />
          <Route path="/statements" element={<StatementsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/tariffs" element={<TariffsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/sections/:key" element={<SectionPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/mail" element={<MailPage />} />
          <Route path="/audit" element={<AuditPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ConfirmModal />
    </Router>
  )
}
