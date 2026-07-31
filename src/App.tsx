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
import { SettingsPage } from './pages/SettingsPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ConfirmModal } from './components/ConfirmModal'

export function App() {
  const { isAuthenticated, isSessionConsistent, logout } = useAuthStore()
  const { isDark } = useThemeStore()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  // Демо-личность поверх настоящих данных банка — признак прерванного входа.
  // На экране это выглядело как «Демо-компания ООО» с живыми счетами:
  // сбрасываем сессию, чтобы человек вошёл заново и видел, кто он.
  useEffect(() => {
    if (isAuthenticated && !isSessionConsistent()) logout()
  }, [isAuthenticated, isSessionConsistent, logout])

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
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ConfirmModal />
    </Router>
  )
}
