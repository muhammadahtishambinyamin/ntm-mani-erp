import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import MasterForm from './pages/MasterForm'
import CustomerForm from './pages/CustomerForm'
import CreditLimitForm from './pages/CreditLimitForm'
import CommissionForm from './pages/CommissionForm'
import CreditLimitPrintPage from './pages/CreditLimitPrintPage'
import CommissionPrintPage from './pages/CommissionPrintPage'
import GLReport from './pages/GLReport'
import GrossReport from './pages/GrossReport'
import PaymentReport from './pages/PaymentReport'
import GLReportPrint from './pages/GLReportPrint'
import GrossReportPrint from './pages/GrossReportPrint'
import PaymentReportPrint from './pages/PaymentReportPrint'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is already logged in (session)
    const sessionUser = sessionStorage.getItem('user')
    if (sessionUser) {
      setUser(JSON.parse(sessionUser))
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    sessionStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
    sessionStorage.removeItem('user')
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/setup/banks"
          element={
            isAuthenticated ? <MasterForm type="banks" user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/setup/departments"
          element={
            isAuthenticated ? <MasterForm type="departments" user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/setup/companies"
          element={
            isAuthenticated ? <MasterForm type="companies" user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/setup/currencies"
          element={
            isAuthenticated ? <MasterForm type="currencies" user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/setup/customers"
          element={
            isAuthenticated ? <CustomerForm user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/data-entry/credit-limit"
          element={
            isAuthenticated ? <CreditLimitForm user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/data-entry/commission"
          element={
            isAuthenticated ? <CommissionForm user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />

        {/* Reports */}
        <Route
          path="/reports/gl-report"
          element={
            isAuthenticated ? <GLReport user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        {/* Reports */}
        <Route
          path="/reports/gross-report"
          element={
            isAuthenticated ? <GrossReport user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/reports/payment-report"
          element={
            isAuthenticated ? <PaymentReport user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />

        {/* Print Pages - No authentication required */}
        <Route path="/print/credit-limit" element={<CreditLimitPrintPage />} />
        <Route path="/print/commission" element={<CommissionPrintPage />} />
        <Route path="/reports/gl-report/print" element={<GLReportPrint />} />
        <Route path="/reports/gross-report/print" element={<GrossReportPrint />} />
        <Route path="/reports/payment-report/print" element={<PaymentReportPrint />} />
      </Routes>
    </Router>
  )
}

export default App
