import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { HomePage } from './components/HomePage'
import { AuthPages } from './components/AuthPages'
import { AddServerPage } from './components/AddServerPage'
import { LeaderboardPage } from './components/LeaderboardPage'
import { AboutPage } from './components/AboutPage'
import { ServerDetailPage } from './components/ServerDetailPage'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthPages type="login" />} />
            <Route path="/register" element={<AuthPages type="register" />} />
            <Route path="/add-server" element={<AddServerPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/server/:id" element={<ServerDetailPage />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App
