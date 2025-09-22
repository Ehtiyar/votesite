import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminTest from './pages/AdminTest'
import AdminDebug from './pages/AdminDebug'
import ErrorBoundary from './components/ErrorBoundary'

const AdminApp: React.FC = () => {
  console.log('AdminApp component loaded')
  console.log('Current path:', window.location.pathname)
  
  return (
    <ErrorBoundary>
      <div className="admin-app">
        <Routes>
          <Route path="/debug" element={<AdminDebug />} />
          <Route path="/test" element={<AdminTest />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/" element={<Navigate to="/admin/debug" replace />} />
          <Route path="*" element={<Navigate to="/admin/debug" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default AdminApp
