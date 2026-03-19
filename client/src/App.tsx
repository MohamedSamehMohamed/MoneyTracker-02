import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { PageWrapper } from './components/layout/PageWrapper';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { NewTransactionPage } from './pages/NewTransactionPage';
import { AccountsPage } from './pages/AccountsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - no sidebar */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Layout routes - with sidebar */}
        <Route
          path="/*"
          element={
            <>
              <Sidebar />
              <PageWrapper>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                  <Route path="/new-transaction" element={<NewTransactionPage />} />
                  <Route path="/accounts" element={<AccountsPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  {/* Default redirect */}
                  <Route path="/" element={<DashboardPage />} />
                </Routes>
              </PageWrapper>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
